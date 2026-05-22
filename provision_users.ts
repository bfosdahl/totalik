import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function run() {
  console.log("Fetching companies without users...");
  
  // Custom query to find companies without users and with non-existent emails
  const { data: companies, error: queryError } = await supabaseAdmin
    .from('companies')
    .select(`
      id,
      name,
      email
    `)
    .not('email', 'is', null)
    .neq('email', '');

  if (queryError || !companies) {
    console.error("Failed to fetch companies:", queryError);
    return;
  }

  // Also fetch all current emails in auth.users
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 10000 });
  if (usersError) {
     console.error("Failed to fetch auth users:", usersError);
     return;
  }
  
  const existingEmails = new Set(users.map(u => u.email?.toLowerCase()));
  
  // Filter companies that don't have a profile
  const { data: profiles } = await supabaseAdmin.from('profiles').select('company_id');
  const companiesWithProfiles = new Set(profiles?.map(p => p.company_id) || []);
  
  const targetCompanies = companies.filter(c => 
    !companiesWithProfiles.has(c.id) && 
    c.email && 
    !existingEmails.has(c.email.toLowerCase())
  );
  
  console.log(`Found ${targetCompanies.length} companies to provision.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const company of targetCompanies) {
    console.log(`Processing: ${company.name} (${company.email})`);
    try {
      const email = company.email.toLowerCase().trim();
      const tempPassword = crypto.randomUUID() + "Aa1!";
      
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: company.name, // Fallback to company name as name
          last_name: ""
        },
      });

      if (createError) {
        console.error(`Failed to create user ${email}:`, createError);
        failCount++;
        continue;
      }

      const userId = authData.user.id;

      // Ensure profile was created by trigger, then update company_id
      await new Promise(r => setTimeout(r, 500));
      
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ company_id: company.id })
        .eq("user_id", userId);

      if (profileError) {
        console.error(`Error updating profile for ${email}:`, profileError);
      }

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "company_admin" });

      if (roleError) {
        console.error(`Error adding role for ${email}:`, roleError);
      }

      let emailSent = false;
      if (resend) {
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: "https://totalik.no/auth",
          },
        });

        if (!resetError && resetData?.properties?.action_link) {
          const resetLink = resetData.properties.action_link;
          const displayName = company.name;
          
          try {
            await resend.emails.send({
              from: "Total-IK <noreply@totalik.no>",
              to: [email],
              subject: "Velkommen til Total-IK - Sett ditt passord",
              html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Total-IK</h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Velkommen til ditt HMS-system</p>
                  </div>
                  
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hei ${displayName}!</h2>
                    
                    <p>Din brukerkonto hos <strong>${company.name}</strong> er nå opprettet i Total-IK.</p>
                    
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #374151;">Din påloggingsinformasjon:</h3>
                      <p style="margin: 5px 0;"><strong>E-post:</strong> ${email}</p>
                      <p style="margin: 5px 0;">Klikk på knappen nedenfor for å sette ditt passord.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" 
                         style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                                color: white; 
                                padding: 14px 30px; 
                                text-decoration: none; 
                                border-radius: 8px; 
                                font-weight: bold;
                                display: inline-block;">
                        Sett passord og logg inn
                      </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren din:</p>
                    <p style="color: #6366f1; font-size: 12px; word-break: break-all;">${resetLink}</p>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                      Har du spørsmål? Svar på denne e-posten.
                    </p>
                  </div>
                </body>
                </html>
              `,
            });
            emailSent = true;
          } catch (e) {
            console.error("Resend error:", e);
          }
        } else {
           console.error("Link generation error:", resetError);
        }
      }
      
      // Log to provisioning log
      await supabaseAdmin.from("user_provisioning_log").insert({
        email: email,
        company_id: company.id,
        role: "company_admin",
        auth_created: true,
        profile_updated: !profileError,
        role_assigned: !roleError,
        email_sent: emailSent,
        reset_link_generated: emailSent,
        all_verified: (!profileError && !roleError && emailSent),
        source: "script-missing-users",
      });

      console.log(`Success: ${email}, Email sent: ${emailSent}`);
      successCount++;
    } catch (e) {
      console.error(`Exception processing ${company.name}:`, e);
      failCount++;
    }
  }
  
  console.log(`Done. Success: ${successCount}, Failed: ${failCount}`);
}

run();