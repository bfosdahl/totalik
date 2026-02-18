import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeName, employeeEmail, scheduleDate, startTime, endTime, companyName } = await req.json();
    
    console.log("Sending work schedule notification:", { employeeName, employeeEmail, scheduleDate, startTime, endTime });

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;

    if (resendApiKey && employeeEmail) {
      const formattedDate = new Date(scheduleDate).toLocaleDateString('nb-NO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Total-IK <noreply@totalik.no>`,
          to: [employeeEmail],
          subject: `Ny arbeidsplan - ${formattedDate}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">📅 Ny arbeidsplan</h1>
              </div>
              <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p>Hei ${employeeName || ''},</p>
                <p>Du har fått en ny arbeidsplan:</p>
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Dato:</strong> ${formattedDate}</p>
                  <p style="margin: 4px 0;"><strong>Tid:</strong> ${startTime} - ${endTime}</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Automatisk varsel fra ${companyName || 'din bedrift'} via Total-IK.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) {
        emailSent = true;
        console.log(`Work schedule email sent to ${employeeEmail}`);
      } else {
        const err = await res.json();
        console.error('Resend error:', err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent', emailSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in notify-work-schedule:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
