import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-api-key',
};

interface EmployeeData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  position?: string;
  birth_date?: string;
  hms_card_number?: string;
  hms_card_expiry?: string;
}

interface SyncRequest {
  company_id: string;
  employees: EmployeeData[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('x-sync-api-key');
    const expectedKey = Deno.env.get('SYNC_API_KEY');
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { company_id, employees }: SyncRequest = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'Missing company_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!employees || !Array.isArray(employees)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid employees array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      console.error('Company not found:', company_id);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing ${employees.length} employees for company: ${company.name}`);

    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as { email: string; error: string }[],
    };

    for (const emp of employees) {
      try {
        if (!emp.email) {
          results.errors.push({ email: 'unknown', error: 'Missing email' });
          continue;
        }

        // Check if employee already exists by email in this company
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, email')
          .eq('email', emp.email.toLowerCase())
          .eq('company_id', company_id)
          .maybeSingle();

        if (existingProfile) {
          // Update existing employee
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              first_name: emp.first_name,
              last_name: emp.last_name,
              phone: emp.phone,
              position: emp.position,
              birth_date: emp.birth_date,
              hms_card_number: emp.hms_card_number,
              hms_card_expiry: emp.hms_card_expiry,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error(`Error updating ${emp.email}:`, updateError);
            results.errors.push({ email: emp.email, error: updateError.message });
          } else {
            results.updated.push(emp.email);
            console.log(`Updated employee: ${emp.email}`);
          }
        } else {
          // Random unguessable password — user must use recovery link to set their own
          const tempPassword = crypto.randomUUID() + "Aa1!";
          
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: emp.email.toLowerCase(),
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: emp.first_name,
              last_name: emp.last_name,
            },
          });

          if (authError) {
            // User might exist in auth but not in this company
            console.error(`Error creating auth user ${emp.email}:`, authError);
            results.errors.push({ email: emp.email, error: authError.message });
            continue;
          }

          // Update profile with company and additional data
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              company_id: company_id,
              first_name: emp.first_name,
              last_name: emp.last_name,
              phone: emp.phone,
              position: emp.position,
              birth_date: emp.birth_date,
              hms_card_number: emp.hms_card_number,
              hms_card_expiry: emp.hms_card_expiry,
              is_active: true,
            })
            .eq('user_id', authUser.user.id);

          if (profileError) {
            console.error(`Error updating profile for ${emp.email}:`, profileError);
            results.errors.push({ email: emp.email, error: profileError.message });
          } else {
            // Add employee role
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .insert({
                user_id: authUser.user.id,
                role: 'employee',
              });

            // Log provisioning
            await supabaseAdmin.from("user_provisioning_log").insert({
              email: emp.email,
              company_id: company_id,
              role: "employee",
              auth_created: true,
              profile_updated: true,
              role_assigned: !roleError,
              email_sent: false,
              reset_link_generated: false,
              all_verified: !roleError,
              error_message: roleError ? roleError.message : null,
              source: "sync-employees",
            });

            results.created.push(emp.email);
            console.log(`Created employee: ${emp.email}`);
          }
        }
      } catch (err) {
        console.error(`Error processing ${emp.email}:`, err);
        results.errors.push({ email: emp.email, error: String(err) });
      }
    }

    console.log(`Sync complete. Created: ${results.created.length}, Updated: ${results.updated.length}, Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        company: company.name,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
