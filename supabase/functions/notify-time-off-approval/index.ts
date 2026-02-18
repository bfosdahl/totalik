import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, employeeName, status, startDate, endDate } = await req.json();
    
    console.log("Sending time off approval notification:", { requestId, employeeName, status, startDate, endDate });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the employee's email
    const { data: request } = await supabase
      .from('time_off_requests')
      .select('employee_id')
      .eq('id', requestId)
      .single();

    if (!request?.employee_id) {
      throw new Error('Could not find time off request');
    }

    const { data: employee } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, company_id')
      .eq('id', request.employee_id)
      .single();

    if (!employee?.email) {
      throw new Error('Could not find employee email');
    }

    // Get company name
    let companyName = 'Din bedrift';
    if (employee.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', employee.company_id)
        .single();
      if (company?.name) companyName = company.name;
    }

    const statusText = status === 'approved' ? 'godkjent' : 'avslått';
    const statusEmoji = status === 'approved' ? '✅' : '❌';
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
    const formattedStart = new Date(startDate).toLocaleDateString('nb-NO');
    const formattedEnd = new Date(endDate).toLocaleDateString('nb-NO');

    let emailSent = false;

    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Total-IK <noreply@totalik.no>`,
          to: [employee.email],
          subject: `${statusEmoji} Fraværsforespørsel ${statusText}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${status === 'approved' ? '#059669' : '#dc2626'} 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">${statusEmoji} Forespørsel ${statusText}</h1>
              </div>
              <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p>Hei ${employee.first_name || ''},</p>
                <p>Din fraværsforespørsel har blitt <strong>${statusText}</strong>.</p>
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Fra:</strong> ${formattedStart}</p>
                  <p style="margin: 4px 0;"><strong>Til:</strong> ${formattedEnd}</p>
                  <p style="margin: 4px 0;"><strong>Status:</strong> ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</p>
                </div>
                ${status !== 'approved' ? '<p>Kontakt din leder for mer informasjon.</p>' : ''}
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Automatisk varsel fra ${companyName} via Total-IK.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) {
        emailSent = true;
        console.log(`Approval email sent to ${employee.email}`);
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
    console.error("Error in notify-time-off-approval:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
