// Midlertidig verktøy: kartlegger selger-felt på NextCom-ordre og grupperer
// kunder per selger for de siste N månedene.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scan-secret",
};

const BASE = "https://hmsproffen.nextcom.no/rest-api/public/v2.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function nc(path: string, auth: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

function dateOnly(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sellerOf(o: Record<string, unknown>, users: Map<string, string>): string {
  const uid = String(o.userId ?? "");
  return users.get(uid) || (uid ? `userId ${uid}` : "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.headers.get("x-scan-secret") !== Deno.env.get("NEXTCOM_SCAN_SECRET")) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const months = Number(body.months ?? 24);
    const maxPages = Number(body.pages ?? 40);
    const mode = String(body.mode ?? "sellers");

    const raw = Deno.env.get("NEXTCOM_BASIC_AUTH");
    if (!raw) return json({ error: "NEXTCOM_BASIC_AUTH missing" }, 500);
    const auth = btoa(raw.includes(":") ? raw : `kimiclaw:${raw}`);

    const users = new Map<string, string>();
    let userProbe: unknown = null;
    for (const path of ["/crm-system/users?offset=0&limit=200", "/admin/users?offset=0&limit=200", "/crm-system/user?offset=0&limit=200"]) {
      try {
        const u = await nc(`${path}&locale=nor`, auth);
        const items = u.items || u.users || [];
        if (Array.isArray(items) && items.length) {
          userProbe = items[0];
          for (const it of items) {
            const name = [it.firstName, it.lastName].filter(Boolean).join(" ").trim() || it.name || it.username || it.email;
            if (it.id != null && name) users.set(String(it.id), String(name));
          }
          break;
        }
      } catch (_) { /* prøv neste */ }
    }

    const head = await nc("/crm-system/orders?offset=0&limit=1&locale=nor", auth);
    const total = Number(head.totalCount || head.total || head.count || 0);

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = dateOnly(cutoff)!;

    const limit = 100;
    const sellers = new Map<string, { count: number; customers: Map<string, { name: string; org: string; email: string; last: string }> }>();
    let sampleFields: string[] = [];
    let scanned = 0;
    let inWindow = 0;

    for (let page = 0; page < maxPages; page++) {
      const offset = Math.max(0, total - (page + 1) * limit);
      const d = await nc(`/crm-system/orders?offset=${offset}&limit=${limit}&locale=nor`, auth);
      const items: Record<string, unknown>[] = d.items || [];
      if (!items.length) break;
      for (const o of items) {
        scanned++;
        if (!sampleFields.length) sampleFields = Object.keys(o);
        const created = dateOnly(o.insertedDate) || dateOnly(o.sendDate);
        if (!created || created < cutoffStr) continue;
        inWindow++;
        const s = sellerOf(o, users) || "(ukjent)";
        const entry = sellers.get(s) || { count: 0, customers: new Map() };
        entry.count++;
        const org = String(o.customerOrgNoOrSsn || "").replace(/\D/g, "");
        const key = org || String(o.customerEmail || o.customerCompany || o.id);
        const prev = entry.customers.get(key);
        if (!prev || created > prev.last) {
          entry.customers.set(key, {
            name: String(o.customerCompany || ""),
            org,
            email: String(o.customerEmail || ""),
            last: created,
          });
        }
        sellers.set(s, entry);
      }
      if (offset === 0) break;
    }

    const summary = Array.from(sellers.entries())
      .map(([seller, v]) => ({ seller, orders: v.count, customers: v.customers.size }))
      .sort((a, b) => b.orders - a.orders);

    if (mode === "fields") {
      return json({ success: true, total_orders: total, scanned, sample_fields: sampleFields, users: Array.from(users.entries()), user_probe: userProbe });
    }

    if (mode === "detail") {
      const want = String(body.seller || "");
      const v = sellers.get(want);
      return json({
        success: true,
        seller: want,
        customers: v ? Array.from(v.customers.values()).sort((a, b) => a.name.localeCompare(b.name)) : [],
      });
    }

    return json({ success: true, months, cutoff: cutoffStr, total_orders: total, scanned, in_window: inWindow, sellers: summary, sample_fields: sampleFields });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
