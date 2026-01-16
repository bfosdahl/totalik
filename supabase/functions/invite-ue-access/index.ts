import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
  company_name?: string;
  project_id: string;
  access_level: 'guest' | 'full_ue';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify the requesting user is authenticated and authorized
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: requestingUser }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !requestingUser) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Request from authenticated user:", requestingUser.id);

    // Create admin client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user has permission (is company admin or system admin)
    const { data: hasPermission } = await supabase.rpc('is_company_admin', { _user_id: requestingUser.id });
    const { data: isSystemAdmin } = await supabase.rpc('is_system_admin', { _user_id: requestingUser.id });

    if (!hasPermission && !isSystemAdmin) {
      console.error("User lacks permission to invite:", requestingUser.id);
      return new Response(
        JSON.stringify({ error: "You do not have permission to invite users" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, name, company_name, project_id, access_level }: InviteRequest = await req.json();

    console.log("Creating/checking user for:", email);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;
    let recoveryLink: string | null = null;

    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      userId = existingUser.id;
      
      // Generate a password reset link for existing user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });
      
      if (linkError) {
        console.error("Error generating recovery link:", linkError);
      } else {
        recoveryLink = linkData.properties?.action_link || null;
      }
    } else {
      // Create new user and generate invite link (no temp password)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          first_name: name.split(' ')[0] || name,
          last_name: name.split(' ').slice(1).join(' ') || '',
          is_guest_user: true,
          company_name: company_name,
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(`Could not create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId);

      // Generate a recovery/set password link for the new user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });
      
      if (linkError) {
        console.error("Error generating recovery link:", linkError);
      } else {
        recoveryLink = linkData.properties?.action_link || null;
      }

      // Create a minimal profile for the guest user
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          first_name: name.split(' ')[0] || name,
          last_name: name.split(' ').slice(1).join(' ') || '',
          email: email,
          is_active: true,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Update the access record with the user_id
    const { error: accessUpdateError } = await supabase
      .from("ks_module2_project_access")
      .update({ user_id: userId })
      .eq("email", email)
      .eq("project_id", project_id);

    if (accessUpdateError) {
      console.error("Error updating access record:", accessUpdateError);
    }

    // Get project details
    const { data: project } = await supabase
      .from("ks_module2_projects")
      .select("project_number, project_name, address")
      .eq("id", project_id)
      .single();

    const projectInfo = project 
      ? `${project.project_number} - ${project.project_name}${project.address ? ` (${project.address})` : ''}`
      : 'Prosjekt';

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || '';
    const loginUrl = `${baseUrl}/auth?redirect=/ks2/project/${project_id}`;
    
    const accessLevelText = access_level === 'full_ue' 
      ? 'full tilgang til prosjektet' 
      : 'gjeste-tilgang (lese, fylle ut sjekklister og registrere avvik)';

    // Build email content - use recovery link if available, otherwise just login link
    const actionButtonHtml = recoveryLink
      ? `<div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background: linear-gradient(135deg, #5B6BFF 0%, #8B5CF6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sett passord og logg inn</a>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">Klikk på knappen over for å sette ditt passord og logge inn.</p>`
      : `<div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: linear-gradient(135deg, #5B6BFF 0%, #8B5CF6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Logg inn nå</a>
        </div>`;

    const emailResponse = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      subject: `Du er invitert til prosjekt: ${projectInfo}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #5B6BFF 0%, #8B5CF6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Velkommen til KS-systemet</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hei <strong>${name}</strong>${company_name ? ` (${company_name})` : ''},</p>
            
            <p>Du har blitt invitert som underleverandør til prosjektet:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #5B6BFF; margin: 20px 0;">
              <strong style="font-size: 18px;">${projectInfo}</strong>
              <p style="color: #666; margin: 10px 0 0 0;">Du har ${accessLevelText}</p>
            </div>
            
            <p><strong>E-post for innlogging:</strong> ${email}</p>
            
            ${actionButtonHtml}
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Ved å logge inn godtar du våre 
              <a href="https://emagasin.no/katalog/mimir/mobile/" style="color: #5B6BFF;">avtalevilkår</a>.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Denne e-posten ble sendt automatisk fra KS-systemet.<br>
              Hvis du ikke forventet denne invitasjonen, kan du se bort fra denne e-posten.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Invitation email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in invite-ue-access function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
