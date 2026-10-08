import { createClient } from "npm:@supabase/supabase-js@2";
import { callAiGateway, AI_CHAT_MODEL } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Ikke innlogget" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return json({ error: "Sesjonen er utløpt" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", uid);
    if (!roles?.some((r) => r.role === "company_admin" || r.role === "system_admin")) return json({ error: "Kun administrator" }, 403);

    const body = await req.json().catch(() => null);
    const base64 = typeof body?.base64 === "string" ? body.base64 : "";
    if (!base64 || base64.length > 14_000_000) return json({ error: "Mangler fil eller filen er for stor (maks 10 MB)" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI er ikke satt opp" }, 500);
    // Primary: gemini-3.8-flash (low reasoning), automatic fallback to AI_CHAT_MODEL (2.5-flash) via the shared gateway.
    const res = await callAiGateway(key, {
      model: AI_CHAT_MODEL,
      messages: [
        { role: "system", content: 'Hent ut alle ansatte fra dokumentet. Returner KUN JSON: {"employees":[{"firstName":"","lastName":"","email":"","admin":false}]}. admin=true kun for daglig leder, eier/innehaver eller administrerende direktør. Systemadministrator, IT-administrator og andre IT-roller er IKKE admin (admin=false). Ikke finn på e-poster; la feltet være tomt hvis det mangler.' },
        { role: "user", content: [
          { type: "text", text: "Ansattliste:" },
          { type: "file", file: { filename: "ansatte.pdf", file_data: `data:application/pdf;base64,${base64}` } },
        ] },
      ],
      response_format: { type: "json_object" },
    }, null, { totalTimeoutMs: 45_000 });
    if (!res.ok) {
      const t = await res.text();
      console.error("AI error", res.status, t);
      return json({ error: res.status === 429 ? "For mange forespørsler, prøv igjen snart" : res.status === 402 ? "AI-kreditt er brukt opp" : "Kunne ikke lese PDF" }, res.status);
    }
    const data = await res.json();
    let parsed: any = {};
    try { parsed = JSON.parse(String(data?.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "")); } catch { parsed = {}; }
    const employees = (Array.isArray(parsed?.employees) ? parsed.employees : []).slice(0, 500).map((e: any) => ({
      firstName: String(e?.firstName || "").trim(),
      lastName: String(e?.lastName || "").trim(),
      email: String(e?.email || "").trim().toLowerCase(),
      admin: e?.admin === true,
    }));
    return json({ employees });
  } catch (e) {
    console.error("parse-employee-file error", e);
    return json({ error: "Uventet feil" }, 500);
  }
});
