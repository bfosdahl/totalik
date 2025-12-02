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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      .select('email, first_name, last_name')
      .eq('id', request.employee_id)
      .single();

    if (!employee?.email) {
      throw new Error('Could not find employee email');
    }

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we just log the notification
    const statusText = status === 'approved' ? 'godkjent' : 'avslått';
    
    console.log(`Would send email to ${employee.email}:`, {
      subject: `Ferieforespørsel ${statusText}`,
      message: `Din ferieforespørsel fra ${startDate} til ${endDate} har blitt ${statusText}.`,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notify-time-off-approval:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
