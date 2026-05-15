import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface Person {
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  isVerneombud?: boolean;
  courses?: Array<{
    course_name: string;
    completed_date: string;
    expiry_date?: string | null;
    notes?: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = req.headers.get("x-cron-secret");
    const expected = Deno.env.get("CRON_SECRET");
    if (!secret || secret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { people }: { people: Person[] } = await req.json();
    const results: any[] = [];

    for (const p of people) {
      try {
        // Find or create profile
        let { data: profile } = await supabase
          .from("profiles")
          .select("id, user_id")
          .eq("email", p.email.toLowerCase())
          .eq("company_id", p.companyId)
          .maybeSingle();

        if (!profile) {
          const { data: created, error: authErr } = await supabase.auth.admin.createUser({
            email: p.email.toLowerCase(),
            password: crypto.randomUUID() + "Aa1!",
            email_confirm: true,
            user_metadata: { first_name: p.firstName, last_name: p.lastName },
          });
          if (authErr || !created.user) {
            results.push({ email: p.email, error: authErr?.message || "auth fail" });
            continue;
          }
          // Update profile with company etc
          const { data: updated, error: upErr } = await supabase
            .from("profiles")
            .update({
              company_id: p.companyId,
              first_name: p.firstName,
              last_name: p.lastName,
              is_active: true,
              status: "active",
              is_verneombud: !!p.isVerneombud,
            })
            .eq("user_id", created.user.id)
            .select("id, user_id")
            .single();
          if (upErr) { results.push({ email: p.email, error: upErr.message }); continue; }
          profile = updated;

          await supabase.from("user_roles").insert({ user_id: created.user.id, role: "user" });
        } else if (p.isVerneombud) {
          await supabase.from("profiles").update({ is_verneombud: true }).eq("id", profile.id);
        }

        // Insert courses
        if (p.courses?.length) {
          for (const c of p.courses) {
            await supabase.from("employee_courses").insert({
              company_id: p.companyId,
              employee_id: profile.id,
              course_name: c.course_name,
              completed_date: c.completed_date,
              expiry_date: c.expiry_date ?? null,
              notes: c.notes ?? null,
              status: "active",
            });
          }
        }

        results.push({ email: p.email, ok: true, profile_id: profile.id });
      } catch (e) {
        results.push({ email: p.email, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
