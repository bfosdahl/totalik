// Poller NextCom for ordre med status "avsluttet kundeforhold" og planlegger
// automatisk stenging av bedriftens system ved lisensens utløp
// (ordrens opprettelsesdato + lisenslengde 12/24/36 mnd).
import { createClient } from "npm:@supabase/supabase-js@2";
import { recordJobRun } from "../_shared/jobRun.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const NEXTCOM_BASE_URL = "https://hmsproffen.nextcom.no/rest-api/public/v2.0";

// Statusnavn (lowercase-match) som betyr at kundeforholdet er avsluttet
const TERMINATION_STATUS_KEYWORDS = ["avsluttet kundeforhold", "terminated customer"];

// Produkter vi bryr oss om (IK-systemer). Kurs o.l. ignoreres.
const SYSTEM_KEYWORDS = [
  "hms", "ik/mat", "ik mat", "mattrygghet", "ik/hms", "internkontroll",
  "bygg", "alkohol", "gdpr", "personalhåndbok", "personalhandbok",
  "åpenhetsloven", "apenhetsloven", "fdv", "total-ik", "totalik", "byggepakke",
];
const COURSE_KEYWORDS = ["kurs", "course", "hms-kort", "bht", "sertifisering"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toDateOnly(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const targetMonth = base.getUTCMonth() + months;
  const result = new Date(Date.UTC(base.getUTCFullYear(), targetMonth, base.getUTCDate()));
  // Håndter 31. i måneder med færre dager (f.eks. 31.01 + 1 mnd)
  if (result.getUTCDate() !== base.getUTCDate()) result.setUTCDate(0);
  const yy = result.getUTCFullYear();
  const mm = String(result.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(result.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Leser lisenslengde i måneder fra produktnavn ("12 mnd", "24 måneder", "3 år"). */
export function detectLicenseMonths(products: string): number | null {
  const lower = (products || "").toLowerCase();
  const mnd = lower.match(/(\d{1,2})\s*(mnd|måned|maned|month)/);
  if (mnd) {
    const n = Number(mnd[1]);
    if ([1, 3, 6, 12, 24, 36, 48, 60].includes(n)) return n;
  }
  const years = lower.match(/(\d)\s*(år|ar|year)/);
  if (years) return Number(years[1]) * 12;
  return null;
}

function isSystemOrder(products: string): boolean {
  const lower = (products || "").toLowerCase();
  const parts = lower.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.some(
    (p) => SYSTEM_KEYWORDS.some((k) => p.includes(k)) && !COURSE_KEYWORDS.some((k) => p.includes(k)),
  );
}

function normalizeOrg(v: unknown): string {
  return String(v || "").replace(/\D/g, "");
}

async function nextcomFetch(path: string, auth: string) {
  const res = await fetch(`${NEXTCOM_BASE_URL}${path}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NextCom ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const startedAt = Date.now();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* cron uten body */ }

  const debug = body?.debug === true;
  const dryRun = body?.dry_run === true;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const rawAuth = Deno.env.get("NEXTCOM_BASIC_AUTH");
    if (!rawAuth) return json({ error: "NEXTCOM_BASIC_AUTH not configured" }, 500);
    const auth = btoa(rawAuth.includes(":") ? rawAuth : `kimiclaw:${rawAuth}`);

    // 1) Finn statusId for "avsluttet kundeforhold"
    let statuses: Array<{ id: number; name?: string; title?: string; description?: string }> = [];
    for (const path of ["/crm-system/order-statuses", "/crm-system/orders/statuses", "/crm-system/statuses"]) {
      try {
        const data = await nextcomFetch(`${path}?locale=nor`, auth);
        statuses = data.items || data.statuses || (Array.isArray(data) ? data : []);
        if (statuses.length) break;
      } catch (e) {
        console.log(`[license-sync] status endpoint ${path} feilet: ${e}`);
      }
    }

    const terminationStatusIds = statuses
      .filter((s) => {
        const label = `${s.name ?? ""} ${s.title ?? ""} ${s.description ?? ""}`.toLowerCase();
        return TERMINATION_STATUS_KEYWORDS.some((k) => label.includes(k));
      })
      .map((s) => Number(s.id));

    // Manuell overstyring via body ved behov
    if (Array.isArray(body?.status_ids)) {
      for (const id of body.status_ids as unknown[]) terminationStatusIds.push(Number(id));
    }

    if (debug) {
      const probes: Record<string, unknown> = {};
      const candidates = [
        "/crm-system/order-statuses", "/crm-system/orderstatuses", "/crm-system/orders/statuses",
        "/crm-system/statuses", "/crm-system/status", "/crm-system/order-status",
        "/crm-system/lists", "/crm-system/settings/order-statuses",
      ];
      for (const path of candidates) {
        try {
          const d = await nextcomFetch(`${path}?locale=nor`, auth);
          probes[path] = Array.isArray(d) ? d.slice(0, 40) : (d.items ? d.items.slice(0, 40) : d);
        } catch (e) {
          probes[path] = String(e).slice(0, 120);
        }
      }

      // Distinkte statusId-er i de nyeste ordrene
      const seen = new Map<number, { count: number; example: string }>();
      const cd = await nextcomFetch("/crm-system/orders?offset=0&limit=1&locale=nor", auth);
      const total = Number(cd.totalCount || cd.total || cd.count || 0);
      for (let page = 0; page < 6; page++) {
        const offset = Math.max(0, total - (page + 1) * 100);
        const d = await nextcomFetch(`/crm-system/orders?offset=${offset}&limit=100&locale=nor`, auth);
        for (const o of (d.items || [])) {
          const sid = Number(o.statusId);
          const cur = seen.get(sid) || { count: 0, example: String(o.customerCompany || "") };
          cur.count++;
          seen.set(sid, cur);
        }
        if (offset === 0) break;
      }

      return json({
        probes,
        status_id_counts: Array.from(seen.entries()).map(([id, v]) => ({ statusId: id, ...v })),
        termination_status_ids: terminationStatusIds,
      });
    }

    if (terminationStatusIds.length === 0) {
      await recordJobRun("nextcom-license-sync", "error", startedAt, {
        errorMessage: "Fant ingen statusId for 'avsluttet kundeforhold' i NextCom",
      });
      return json({ error: "Fant ingen statusId for 'avsluttet kundeforhold'", statuses }, 500);
    }

    // 2) Hent ordre (nyeste sider) og filtrer på avsluttet-status
    const limit = 100;
    const countData = await nextcomFetch("/crm-system/orders?offset=0&limit=1&locale=nor", auth);
    const totalCount = Number(countData.totalCount || countData.total || countData.count || 0);
    const maxPages = Number(body?.pages ?? 8);

    const terminated: Record<string, unknown>[] = [];
    for (let page = 0; page < maxPages; page++) {
      const offset = Math.max(0, totalCount - (page + 1) * limit);
      const data = await nextcomFetch(`/crm-system/orders?offset=${offset}&limit=${limit}&locale=nor`, auth);
      const items: Record<string, unknown>[] = data.items || [];
      if (!items.length) break;
      for (const o of items) {
        if (terminationStatusIds.includes(Number(o.statusId))) terminated.push(o);
      }
      if (offset === 0) break;
    }

    console.log(`[license-sync] ${terminated.length} ordre med avsluttet kundeforhold`);

    // 3) Match mot bedrifter og planlegg stenging
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, org_number, email, license_months, license_months_manual, scheduled_termination_date, status");

    const byOrg = new Map<string, typeof companies[number]>();
    const byEmail = new Map<string, typeof companies[number]>();
    for (const c of companies || []) {
      const org = normalizeOrg(c.org_number);
      if (org.length === 9) byOrg.set(org, c);
      if (c.email) byEmail.set(String(c.email).toLowerCase().trim(), c);
    }

    const results: Array<Record<string, unknown>> = [];
    let scheduled = 0;

    for (const order of terminated) {
      const products = String(order.allProducts || "");
      if (!isSystemOrder(products)) continue;

      const org = normalizeOrg(order.customerOrgNoOrSsn);
      const email = String(order.customerEmail || "").toLowerCase().trim();
      const company = (org.length === 9 ? byOrg.get(org) : undefined) || byEmail.get(email);

      if (!company) {
        results.push({ order_id: order.id, company: order.customerCompany, status: "no_match" });
        continue;
      }

      const startDate =
        toDateOnly(order.createdDate) ||
        toDateOnly(order.created) ||
        toDateOnly(order.orderDate) ||
        toDateOnly(order.createdAt) ||
        toDateOnly(order.registeredDate);

      if (!startDate) {
        results.push({ order_id: order.id, company: company.name, status: "no_start_date" });
        continue;
      }

      const months = company.license_months_manual
        ? (company.license_months ?? 12)
        : (detectLicenseMonths(products) ?? company.license_months ?? 12);

      const endDate = addMonths(startDate, months);

      if (company.scheduled_termination_date === endDate) {
        results.push({ order_id: order.id, company: company.name, status: "unchanged", end_date: endDate });
        continue;
      }

      if (dryRun) {
        results.push({ order_id: order.id, company: company.name, status: "dry_run", start: startDate, months, end_date: endDate });
        continue;
      }

      const { error } = await supabase
        .from("companies")
        .update({
          license_start_date: startDate,
          license_months: months,
          scheduled_termination_date: endDate,
          termination_requested_at: new Date().toISOString(),
          termination_source: "nextcom",
          termination_order_id: String(order.id),
        })
        .eq("id", company.id);

      if (error) {
        results.push({ order_id: order.id, company: company.name, status: "error", error: error.message });
      } else {
        scheduled++;
        results.push({ order_id: order.id, company: company.name, status: "scheduled", start: startDate, months, end_date: endDate });
      }
    }

    await recordJobRun("nextcom-license-sync", "success", startedAt, {
      itemsProcessed: terminated.length,
      details: { scheduled, termination_status_ids: terminationStatusIds },
    });

    return json({ success: true, terminated_orders: terminated.length, scheduled, results, dry_run: dryRun });
  } catch (error) {
    console.error("[license-sync] Fatal:", error);
    await recordJobRun("nextcom-license-sync", "error", startedAt, { errorMessage: String(error) });
    return json({ error: String(error) }, 500);
  }
});
