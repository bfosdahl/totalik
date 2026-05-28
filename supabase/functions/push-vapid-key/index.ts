import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!publicKey) {
      console.error("VAPID_PUBLIC_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Returning VAPID public key");
    
    return new Response(
      JSON.stringify({ publicKey }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in push-vapid-key:", error);
    return new Response(
      JSON.stringify({ error: 'En uventet feil oppstod' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
