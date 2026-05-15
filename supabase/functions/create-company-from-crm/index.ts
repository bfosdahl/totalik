import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-api-key',
};

interface CrmRequest {
  company_name: string;
  org_number: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  employee_count?: number | null;
  modules: string[];  // e.g. ["IK_HMS", "IK_MAT"]
  seller_name?: string;
  password?: string;
  is_renewal?: boolean;
}

const VALID_MODULES = ["IK_HMS", "IK_MAT", "IK_BYGG", "IK_ALKOHOL", "IK_FDV", "PERSONALHANDBOK", "GDPR", "APENHETSLOVEN", "AVDELINGER", "KS", "HR", "TIMEREGISTRERING"];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // --- Auth via API key ---
    const apiKey = req.headers.get('x-sync-api-key');
    const expectedKey = Deno.env.get('SYNC_API_KEY');
    if (!apiKey || apiKey !== expectedKey) {
      return respond({ error: 'Unauthorized - Invalid API key' }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const body: CrmRequest = await req.json();

    // --- Validation ---
    if (!body.company_name || body.company_name.trim().length < 2) {
      return respond({ error: 'company_name er påkrevd (min 2 tegn)' }, 400);
    }
    if (!body.org_number || !/^\d{9}$/.test(body.org_number.trim())) {
      return respond({ error: 'org_number må være 9 siffer' }, 400);
    }
    if (!body.email || !body.email.includes('@')) {
      return respond({ error: 'Gyldig email er påkrevd' }, 400);
    }
    if (!body.modules || !Array.isArray(body.modules)) {
      return respond({ error: 'modules må være en array' }, 400);
    }
    // Renewals are allowed to have empty modules (just send the thank-you email)
    if (!body.is_renewal && body.modules.length === 0) {
      return respond({ error: 'modules er påkrevd (array med minst én modul)' }, 400);
    }
    const invalidModules = body.modules.filter(m => !VALID_MODULES.includes(m));
    if (invalidModules.length > 0) {
      return respond({ error: `Ugyldige moduler: ${invalidModules.join(', ')}. Gyldige: ${VALID_MODULES.join(', ')}` }, 400);
    }

    const orgNumber = body.org_number.trim();
    const email = body.email.toLowerCase().trim();
    const companyName = body.company_name.trim();
    const employeeCount = typeof body.employee_count === 'number' && Number.isFinite(body.employee_count)
      ? Math.max(0, Math.floor(body.employee_count))
      : null;

    // --- Check duplicates ---
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('org_number', orgNumber)
      .maybeSingle();

    if (existingCompany) {
      // Company exists — handle as renewal or skip
      if (body.is_renewal) {
        console.log(`Renewal for existing company: ${existingCompany.name}`);
        // Activate any new modules
        const moduleResults = await activateModules(supabaseAdmin, existingCompany.id, body.modules);
        // Send renewal email
        await sendRenewalEmail(supabaseAdmin, email, body.first_name || '', existingCompany.name);
        return respond({
          success: true,
          action: 'renewal',
          company_id: existingCompany.id,
          company_name: existingCompany.name,
          modules: moduleResults,
        });
      }
      return respond({ error: `Bedrift med org.nr ${orgNumber} finnes allerede: ${existingCompany.name}` }, 409);
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return respond({ error: `E-postadressen ${email} er allerede registrert` }, 409);
    }

    // --- 1. Create company ---
    console.log(`Creating company: ${companyName} (${orgNumber})`);

    // Fetch official employee count from Brreg (best-effort)
    let brregEmployeeCount: number | null = null;
    try {
      const cleanOrg = (orgNumber || '').replace(/\s/g, '');
      if (/^\d{9}$/.test(cleanOrg)) {
        const r = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${cleanOrg}`);
        if (r.ok) {
          const d = await r.json();
          if (typeof d.antallAnsatte === 'number') brregEmployeeCount = d.antallAnsatte;
        }
      }
    } catch (e) {
      console.warn('Brreg lookup failed (non-fatal):', e);
    }

    const { data: newCompany, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        org_number: orgNumber,
        address: body.address || null,
        postal_code: body.postal_code || null,
        city: body.city || null,
        email: email,
        phone: body.phone || null,
        employee_count: employeeCount,
        brreg_employee_count: brregEmployeeCount,
        brreg_synced_at: brregEmployeeCount !== null ? new Date().toISOString() : null,
      })
      .select('id, name')
      .single();

    if (companyError || !newCompany) {
      console.error('Company create error:', companyError);
      return respond({ error: 'Kunne ikke opprette bedrift', details: companyError?.message }, 500);
    }

    // --- 2. Activate modules ---
    const moduleResults = await activateModules(supabaseAdmin, newCompany.id, body.modules);

    // --- 3. Create auth user ---
    const tempPassword = body.password || (crypto.randomUUID() + "Aa1!");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name || '',
        last_name: body.last_name || '',
      },
    });

    if (authError || !authData.user) {
      console.error('Auth create error:', authError);
      // Rollback company
      await supabaseAdmin.from('companies').delete().eq('id', newCompany.id);
      return respond({ error: 'Kunne ikke opprette bruker', details: authError?.message }, 500);
    }

    const userId = authData.user.id;

    // --- 4. Wait for profile trigger + update ---
    let profileReady = false;
    for (let i = 0; i < 5; i++) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.id) { profileReady = true; break; }
      await new Promise(r => setTimeout(r, 400));
    }

    if (!profileReady) {
      console.error('Profile never created — rolling back');
      await supabaseAdmin.from('companies').delete().eq('id', newCompany.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return respond({ error: 'Profil ble ikke opprettet i tide' }, 500);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        company_id: newCompany.id,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        phone: body.phone || null,
        status: 'active',
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      await supabaseAdmin.from('companies').delete().eq('id', newCompany.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return respond({ error: 'Kunne ikke knytte profil til bedrift' }, 500);
    }

    if (employeeCount !== null) {
      await supabaseAdmin
        .from('companies')
        .update({ employee_count: employeeCount })
        .eq('id', newCompany.id);
    }

    // --- 5. Assign company_admin role ---
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'company_admin' });

    if (roleError && !roleError.message?.includes('duplicate')) {
      console.error('Role assignment error:', roleError);
    }

    // --- 6. Link seller if provided ---
    if (body.seller_name) {
      const { data: seller } = await supabaseAdmin
        .from('sellers')
        .select('id')
        .ilike('name', `%${body.seller_name}%`)
        .maybeSingle();

      if (seller) {
        await supabaseAdmin
          .from('companies')
          .update({ seller_id: seller.id })
          .eq('id', newCompany.id);
        console.log(`Linked seller: ${body.seller_name}`);
      }
    }

    // --- 7. Send welcome email (best-effort) ---
    try {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const welcomeClient = createClient(Deno.env.get('SUPABASE_URL')!, anonKey);
      await welcomeClient.functions.invoke('send-welcome-email', {
        body: { userId, email, firstName: body.first_name || '', source: 'crm' },
      });
    } catch (e) {
      console.error('Welcome email error:', e);
    }

    // --- 8. Notify admin (best-effort) ---
    try {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const notifyClient = createClient(Deno.env.get('SUPABASE_URL')!, anonKey);
      await notifyClient.functions.invoke('notify-new-company', {
        body: {
          companyName,
          contactPerson: `${body.first_name || ''} ${body.last_name || ''}`.trim(),
          contactEmail: email,
        },
      });
    } catch (e) {
      console.error('Admin notification error:', e);
    }

    // --- 9. Log provisioning ---
    await supabaseAdmin.from('user_provisioning_log').insert({
      email,
      company_id: newCompany.id,
      role: 'company_admin',
      auth_created: true,
      profile_updated: true,
      role_assigned: !roleError,
      email_sent: true,
      reset_link_generated: false,
      all_verified: !roleError,
      source: 'create-company-from-crm',
    });

    console.log(`✅ Company created: ${companyName} | Modules: ${body.modules.join(', ')} | Admin: ${email}`);

    return respond({
      success: true,
      action: 'created',
      company_id: newCompany.id,
      company_name: newCompany.name,
      user_id: userId,
      email,
      modules: moduleResults,
    });

  } catch (error) {
    console.error('CRM sync error:', error);
    return respond({ error: 'Internal server error', details: String(error) }, 500);
  }
});

// --- Helper: Activate modules ---
async function activateModules(
  supabaseAdmin: ReturnType<typeof createClient>,
  companyId: string,
  modules: string[],
) {
  const results: { module: string; status: string }[] = [];

  for (const mod of modules) {
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('company_modules')
      .select('id, is_active')
      .eq('company_id', companyId)
      .eq('module_type', mod)
      .maybeSingle();

    if (existing) {
      if (!existing.is_active) {
        await supabaseAdmin
          .from('company_modules')
          .update({ is_active: true, is_deleted: false })
          .eq('id', existing.id);
        results.push({ module: mod, status: 'reactivated' });
      } else {
        results.push({ module: mod, status: 'already_active' });
      }
    } else {
      const { error } = await supabaseAdmin
        .from('company_modules')
        .insert({
          company_id: companyId,
          module_type: mod,
          is_active: true,
          settings: {},
        });

      results.push({ module: mod, status: error ? `error: ${error.message}` : 'created' });
    }
  }

  return results;
}

// --- Helper: Send renewal email ---
async function sendRenewalEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  firstName: string,
  companyName: string,
) {
  try {
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(Deno.env.get('SUPABASE_URL')!, anonKey);
    await client.functions.invoke('send-renewal-email', {
      body: { email, firstName, companyName },
    });
  } catch (e) {
    console.error('Renewal email error:', e);
  }
}
