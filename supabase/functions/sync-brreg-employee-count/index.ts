import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const { company_id, all } = body;

    let companies: { id: string; org_number: string | null }[] = [];

    if (all === true) {
      const { data, error } = await supabase
        .from("companies")
        .select("id, org_number")
        .not("org_number", "is", null);
      if (error) throw error;
      companies = data || [];
    } else if (company_id) {
      const { data, error } = await supabase
        .from("companies")
        .select("id, org_number")
        .eq("id", company_id)
        .maybeSingle();
      if (error) throw error;
      if (data) companies = [data];
    } else {
      return new Response(
        JSON.stringify({ error: "Provide company_id or all=true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0, skipped = 0, failed = 0;

    // Process with light concurrency
    const CONC = 10;
    let i = 0;
    async function worker() {
      while (i < companies.length) {
        const c = companies[i++];
        const cleanOrg = (c.org_number || "").replace(/\s/g, "");
        if (!/^\d{9}$/.test(cleanOrg)) { skipped++; continue; }
        try {
          const r = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${cleanOrg}`);
          if (!r.ok) { skipped++; continue; }
          const d = await r.json();
          const count = typeof d.antallAnsatte === "number" ? d.antallAnsatte : null;
          await supabase
            .from("companies")
            .update({ brreg_employee_count: count, brreg_synced_at: new Date().toISOString() })
            .eq("id", c.id);
          updated++;
        } catch (e) {
          console.error(`Failed for ${c.id}:`, e);
          failed++;
        }
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));

    return new Response(
      JSON.stringify({ success: true, total: companies.length, updated, skipped, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("sync-brreg-employee-count error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
