 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface RenewalEmailRequest {
   email: string;
   firstName?: string;
   companyName: string;
   resetLink?: string;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const resendApiKey = Deno.env.get("RESEND_API_KEY");
     if (!resendApiKey) {
       console.error("RESEND_API_KEY not configured");
       return new Response(
         JSON.stringify({ error: "Email service not configured" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { email, firstName, companyName, resetLink }: RenewalEmailRequest = await req.json();
 
     if (!email || !companyName) {
       return new Response(
         JSON.stringify({ error: "Missing required fields" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log("Sending renewal email to:", email, "for company:", companyName);
 
     const resend = new Resend(resendApiKey);
     const userName = firstName || "kunde";
 
    const emailResponse = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      subject: `Takk for fornyelsen - ${companyName}`,
       html: `
         <!DOCTYPE html>
         <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
           <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
             <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Takk for fornyelsen!</h1>
           </div>
           
           <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
             <p style="font-size: 16px;">Hei ${userName},</p>
             
             <p>Tusen takk for at <strong>${companyName}</strong> fortsetter å bruke våre tjenester!</p>
             
            <p>Vi setter stor pris på tilliten dere viser oss!</p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">🚀 Nyhet: Helt nytt IK-system i 2025!</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #78350f;">
                I år får alle våre kunder tilgang til et helt nytt og forbedret IK-system. Systemet er designet slik at de fleste skal klare å bruke det på egen hånd.
              </p>
              <p style="margin: 0; font-size: 14px; color: #78350f;">
                Trenger dere hjelp med å komme i gang? Send oss gjerne en e-post, så hjelper vi dere!
              </p>
            </div>
             
             <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
               <p style="margin: 0; font-weight: 600; color: #166534;">Hva er inkludert i fornyelsen:</p>
               <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #15803d;">
                 <li>Fortsatt tilgang til alle aktiverte moduler</li>
                 <li>Teknisk support via e-post</li>
                 <li>Automatiske oppdateringer og forbedringer</li>
                 <li>Sikker lagring av all data</li>
               </ul>
             </div>
             
             ${resetLink ? `
             <div style="text-align: center; margin: 30px 0;">
               <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Logg inn på Total-IK</a>
             </div>
             ` : ''}
             
             <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
               <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">📋 Avtalevilkår</p>
               <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
                 For fullstendige avtalevilkår, se: 
                 <a href="https://emagasin.no/katalog/mimir/mobile/" style="color: #2563eb; text-decoration: underline;">
                   https://emagasin.no/katalog/mimir/mobile/
                 </a>
               </p>
             </div>
             
             <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
             
             <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
               <p style="margin: 0 0 10px 0; font-weight: 600; color: #374151;">Kontakt oss</p>
               <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;">
                 📧 Kundeservice: <a href="mailto:post@athenahms.no" style="color: #667eea;">post@athenahms.no</a>
               </p>
               <p style="margin: 0; font-size: 14px; color: #4b5563;">
                 👤 Salgsjef Gard Fosdahl: <a href="mailto:gard@athenahms.no" style="color: #667eea;">gard@athenahms.no</a>
               </p>
             </div>
             
             <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
               Med vennlig hilsen,<br>
               <strong>Athena Kurs og Internkontroll AS</strong>
             </p>
           </div>
         </body>
         </html>
       `,
     });
 
     console.log("Renewal email sent successfully:", emailResponse);
 
     return new Response(
       JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error in send-renewal-email function:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });