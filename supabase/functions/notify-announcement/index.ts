import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims, error: cErr } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    const callerId = claims?.claims?.sub as string | undefined;
    if (cErr || !callerId) return json({ error: "Unauthorized" }, 401);

    const { announcement_id, kind } = await req.json();
    if (typeof announcement_id !== "string") return json({ error: "Bad request" }, 400);

    // RLS-scoped read: caller must be allowed to see the announcement
    const { data: ann } = await userClient
      .from("company_announcements")
      .select("id, company_id, title, audience, is_critical, created_by_user_id, project_id")
      .eq("id", announcement_id)
      .maybeSingle();
    if (!ann) return json({ error: "Forbidden" }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let ids: string[] = [];
    if (ann.audience === "selected") {
      const { data } = await admin.from("company_announcement_recipients").select("user_id").eq("announcement_id", ann.id);
      ids = (data || []).map((r: any) => r.user_id);
    } else {
      const { data } = await admin
        .from("profiles")
        .select("user_id")
        .eq("company_id", ann.company_id)
        .is("deleted_at", null)
        .neq("is_active", false);
      ids = (data || []).map((r: any) => r.user_id);
    }
    if (ann.created_by_user_id) ids.push(ann.created_by_user_id);
    ids = Array.from(new Set(ids.filter((i) => i && i !== callerId)));

    const { data: caller } = await admin.from("profiles").select("first_name, last_name").eq("user_id", callerId).maybeSingle();
    const who = `${caller?.first_name || ""} ${caller?.last_name || ""}`.trim() || "En kollega";
    const title = kind === "reply" ? `Nytt svar: ${ann.title}` : `${ann.is_critical ? "Kritisk: " : ""}${ann.title}`;
    const body = kind === "reply" ? `${who} svarte i tråden` : `Ny melding fra ${who}`;
    const link = `/?announcement=${ann.id}`;

    if (ids.length) {
      await admin.from("notification_log").insert(
        ids.map((user_id) => ({
          user_id, company_id: ann.company_id, project_id: ann.project_id,
          notification_type: "assignment", title, body, link,
        })),
      );
    }

    let sent = 0;
    const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
    if (pub && priv && ids.length) {
      webpush.setVapidDetails("mailto:noreply@totalik.no", pub, priv);
      const { data: off } = await admin.from("user_notification_settings").select("user_id").in("user_id", ids).eq("push_enabled", false);
      const skip = new Set((off || []).map((r: any) => r.user_id));
      const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", ids.filter((i) => !skip.has(i)));
      const payload = JSON.stringify({ title, body, link, tag: `ann-${ann.id}` });
      const stale: string[] = [];
      await Promise.all((subs || []).map(async (s: any) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
          sent++;
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) stale.push(s.endpoint);
        }
      }));
      if (stale.length) await admin.from("push_subscriptions").delete().in("endpoint", stale);
    }
    return json({ recipients: ids.length, sent });
  } catch (e) {
    console.error(e);
    return json({ error: "Unexpected error" }, 500);
  }
});
