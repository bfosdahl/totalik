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
    const { employeeName, scheduleDate, startTime, endTime } = await req.json();
    
    console.log("Sending work schedule notification:", { employeeName, scheduleDate, startTime, endTime });

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we just log the notification
    
    console.log(`Would send email notification:`, {
      subject: `Ny arbeidsplan for ${employeeName}`,
      message: `En ny arbeidsplan er opprettet for ${scheduleDate}: ${startTime} - ${endTime}.`,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notify-work-schedule:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
