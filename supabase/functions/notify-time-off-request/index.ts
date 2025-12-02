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
    const { requestId, employeeName, startDate, endDate, type } = await req.json();
    
    console.log("Sending time off request notification:", { requestId, employeeName, startDate, endDate, type });

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get company admins to notify
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', requestId)
      .single();

    if (!profile?.company_id) {
      throw new Error('Could not find company for employee');
    }

    const { data: admins } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .or('role.eq.company_admin,role.eq.system_admin');

    console.log(`Found ${admins?.length || 0} admins to notify`);

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we just log the notification
    const typeName = type === 'ferie' ? 'Ferie' : type === 'sykdom' ? 'Sykdom' : type === 'permisjon' ? 'Permisjon' : 'Annet';
    
    for (const admin of admins || []) {
      console.log(`Would send email to ${admin.email}:`, {
        subject: `Ny ferieforespørsel fra ${employeeName}`,
        message: `${employeeName} har søkt om ${typeName.toLowerCase()} fra ${startDate} til ${endDate}.`,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notify-time-off-request:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
