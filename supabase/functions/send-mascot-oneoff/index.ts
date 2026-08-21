import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_URL =
  "https://sffkcqclfiffnpxorodd.supabase.co/storage/v1/object/public/company-logos/brand%2Fhms-proffen-mascot.png";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    const res = await fetch(IMAGE_URL);
    if (!res.ok) throw new Error(`Kunne ikke hente bilde: ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    const base64 = btoa(binary);

    const sent = await resend.emails.send({
      from: "Total IK <noreply@totalik.no>",
      to: ["viktor@athenahms.no"],
      subject: "HMS Proffen - maskot (PNG)",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937">
          <p>Hei Viktor,</p>
          <p>Her er HMS Proffen-figuren som brukes i chatten i Total IK. Bildet ligger vedlagt som PNG,
          og kan ogs&#229; lastes ned her:</p>
          <p><a href="${IMAGE_URL}">${IMAGE_URL}</a></p>
          <p>Med vennlig hilsen<br/>Total IK</p>
        </div>
      `,
      attachments: [
        { filename: "hms-proffen.png", content: base64 },
      ],
    });

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-mascot-oneoff error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
