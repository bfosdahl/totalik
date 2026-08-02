import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-run-token",
};

// One-off job token (function is deleted right after the run)
const RUN_TOKEN = "aug26-renewal-9f2c41d7b6e84a1c";

const NEW_COMPANIES = [
  {
    company_name: "Leiknes Tømrerservice",
    org_number: "932970643",
    email: "leiknestomrerservice@hotmail.com",
    first_name: "Truls Andreas",
    last_name: "Sørlie Leiknes",
    phone: "93252797",
    address: "Dampsaga Allé 24",
    postal_code: "2053",
    city: "Jessheim",
    modules: ["IK_BYGG"],
  },
  {
    company_name: "Akershus Tungbilservice AS",
    org_number: "919976446",
    email: "tommy@akershustungbil.no",
    first_name: "Tommy",
    last_name: "Andresen",
    phone: "90019638",
    address: "Landskaugveien 27",
    postal_code: "1914",
    city: "Ytre Enebakk",
    modules: ["IK_HMS"],
  },
  {
    company_name: "Myhre Takst & Bygg AS",
    org_number: "933801667",
    email: "katrine@myhretakst.com",
    first_name: "Katrine",
    last_name: "Bakke Myhre",
    phone: "41100907",
    address: "Nonåsen 24",
    postal_code: "4436",
    city: "Gyland",
    modules: ["IK_BYGG"],
  },
];

const RECIPIENTS: { email: string; firstName: string; companyName: string }[] = [
  { email: "leiknestomrerservice@hotmail.com", firstName: "Truls Andreas", companyName: "Leiknes Tømrerservice" },
  { email: "tommy@akershustungbil.no", firstName: "Tommy", companyName: "Akershus Tungbilservice AS" },
  { email: "katrine@myhretakst.com", firstName: "Katrine", companyName: "Myhre Takst & Bygg AS" },
  { email: "fredrik@stamlandbetong.no", firstName: "Fredrik", companyName: "Stamland Betongentreprenør AS" },
  { email: "kjetil.furusund@gmail.com", firstName: "Kjetil", companyName: "KFT Service AS" },
  { email: "kaihegre1@gmail.com", firstName: "Kai", companyName: "KRH Kai Hegre" },
  { email: "vidar@cirkelbygg.no", firstName: "Vidar", companyName: "Cirkelbygg AS" },
  { email: "vikenbose@gmail.com", firstName: "", companyName: "Viken Bolig Service AS" },
  { email: "nicolas@kuro.no", firstName: "Nicolas", companyName: "Kuro Oslo AS" },
  { email: "frenchtacos.bergen@gmail.com", firstName: "", companyName: "French Tacos And Burgers Avenue AS" },
  { email: "vr-bygg@hotmail.com", firstName: "", companyName: "VR Bygg og Eiendom AS" },
  { email: "marius@baltmax.no", firstName: "Marius", companyName: "Baltmax AS" },
  { email: "ronyrevolut2006@gmail.com", firstName: "", companyName: "Tiron Service" },
  { email: "am.murogbetong@gmail.com", firstName: "", companyName: "AM Mur og Betong AS" },
  { email: "toarild.johansen@gmail.com", firstName: "Tor Arild", companyName: "Tomsbyggservice AS" },
  { email: "cmt.bygg@gmail.com", firstName: "", companyName: "CMT Bygg AS" },
  { email: "ken.robin.mkk@gmail.com", firstName: "Ken Robin", companyName: "MKK Transport Horten AS" },
  { email: "jan.tore.dale@hotmail.no", firstName: "Jan Tore", companyName: "Byggmester JT Dale AS" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.headers.get("x-run-token") !== RUN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const syncKey = Deno.env.get("SYNC_API_KEY") ?? "";
  const client = createClient(supabaseUrl, anonKey);

  const created: unknown[] = [];
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const c of NEW_COMPANIES) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-company-from-crm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-api-key": syncKey,
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ ...c, password: "Abc_1234", is_renewal: false }),
      });
      created.push({ company: c.company_name, status: res.status, body: await res.text() });
    } catch (e) {
      created.push({ company: c.company_name, error: String(e) });
    }
  }

  const seen = new Set<string>();
  for (const r of RECIPIENTS) {
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const { error } = await client.functions.invoke("send-renewal-email", {
        headers: { "x-cron-secret": cronSecret },
        body: { email: r.email, firstName: r.firstName, companyName: r.companyName },
      });
      if (error) failed.push({ email: r.email, error: error.message });
      else sent.push(r.email);
    } catch (e) {
      failed.push({ email: r.email, error: String(e) });
    }
    await new Promise((res) => setTimeout(res, 600));
  }

  return new Response(JSON.stringify({ created, sent, failed }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
