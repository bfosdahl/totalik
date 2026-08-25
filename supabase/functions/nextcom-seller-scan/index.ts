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

// Eierskapsregel: Viktor og Martin eier kun sine egne. Alle andre selgere
// (tidligere/andre ansatte) faller til Gard, som overtar porteføljen.
const OWN_PORTFOLIO: Record<string, string> = {
  "61": "Viktor Ørnelund",
  "169": "Martin Hovland",
};
const FALLBACK_SELLER = "Gard Fosdahl";

function ownerOf(o: Record<string, unknown>): string {
  return OWN_PORTFOLIO[String(o.userId ?? "")] ?? FALLBACK_SELLER;
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
        const s = mode === "assign" ? ownerOf(o) : (sellerOf(o, users) || "(ukjent)");
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

    if (mode === "examples") {
      const out = summary.slice(0, 8).map(({ seller }) => ({
        seller,
        examples: Array.from(sellers.get(seller)!.customers.values())
          .sort((a, b) => b.last.localeCompare(a.last))
          .slice(0, 6)
          .map((c) => `${c.name} (${c.last})`),
      }));
      return json({ success: true, cutoff: cutoffStr, sellers: out });
    }

    if (mode === "assign") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sres = await fetch(`${supabaseUrl}/rest/v1/sellers?select=id,name`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      const sellerRows: { id: string; name: string }[] = await sres.json();
      const sellerId = new Map(sellerRows.map((r) => [r.name, r.id]));

      const dryRun = body.dry_run !== false;
      const result: Record<string, { matched: number; updated: number; missing: number }> = {};

      for (const [name, v] of sellers.entries()) {
        const id = sellerId.get(name);
        const stat = { matched: 0, updated: 0, missing: 0 };
        result[name] = stat;
        if (!id) continue;
        const orgs = Array.from(v.customers.values()).map((c) => c.org).filter((o) => o.length === 9);
        for (let i = 0; i < orgs.length; i += 100) {
          const chunk = orgs.slice(i, i + 100);
          const inList = chunk.join(",");
          const q = `${supabaseUrl}/rest/v1/companies?select=id,org_number&org_number=in.(${inList})`;
          const cres = await fetch(q, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
          const found: { id: string; org_number: string }[] = await cres.json();
          stat.matched += found.length;
          stat.missing += chunk.length - found.length;
          if (dryRun || !found.length) continue;
          const ids = found.map((f) => f.id).join(",");
          const ures = await fetch(`${supabaseUrl}/rest/v1/companies?id=in.(${ids})`, {
            method: "PATCH",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ seller_id: id }),
          });
          if (ures.ok) stat.updated += found.length;
        }
      }

      return json({ success: true, dry_run: dryRun, cutoff: cutoffStr, scanned, in_window: inWindow, result });
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
