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
const SETTINGS_KEY = "nextcom_termination_status_ids";
const DEFAULT_STATUS_NAMES = ["avsluttet kundeforhold"];

/** Henter statusnavn fra ordren uansett hvilket felt NextCom bruker. */
function statusNameOf(o: Record<string, unknown>): string {
  const candidates = [o.statusName, o.status, o.statusText, o.statusTitle, o.orderStatus, o.orderStatusName];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (c && typeof c === "object") {
      const n = (c as Record<string, unknown>).name ?? (c as Record<string, unknown>).title;
      if (typeof n === "string" && n.trim()) return n.trim();
    }
  }
  return "";
}

function matchesTermination(
  o: Record<string, unknown>,
  statusIds: number[],
  statusNames: string[],
): boolean {
  if (statusIds.includes(Number(o.statusId))) return true;
  const name = statusNameOf(o).toLowerCase();
  if (!name) return false;
  return statusNames.some((n) => n && name.includes(n));
}


// Produkter vi bryr oss om (IK-systemer). Kurs o.l. ignoreres.
const SYSTEM_KEYWORDS = [
  "hms", "ik/mat", "ik mat", "mattrygghet", "ik/hms", "internkontroll",
  "bygg", "alkohol", "gdpr", "personalhåndbok", "personalhandbok",
  "åpenhetsloven", "apenhetsloven", "fdv", "total-ik", "totalik", "byggepakke", "velkomstpakke",
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
  const result = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, base.getUTCDate()));
  if (result.getUTCDate() !== base.getUTCDate()) result.setUTCDate(0);
  const yy = result.getUTCFullYear();
  const mm = String(result.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(result.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Leser lisenslengde i måneder fra produktnavn ("12 mnd", "24 måneder", "3 år"). */
function detectLicenseMonths(products: string): number | null {
  const lower = (products || "").toLowerCase();
  const mnd = lower.match(/(\d{1,2})\s*(mnd|måned|maned|month)/);
  if (mnd) {
    const n = Number(mnd[1]);
    if ([1, 3, 6, 12, 24, 36, 48, 60].includes(n)) return n;
  }
  const years = lower.match(/(\d)\s*(år|ar|year)\b/);
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
    throw new Error(`NextCom ${path} -> ${res.status}: ${text.slice(0, 200)}`);
  }
  return await res.json();
}

/** Cron-secret ELLER innlogget system_admin. */
async function isAuthorized(req: Request): Promise<boolean> {
  const cronSecret = req.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  if (cronSecret && expected && cronSecret === expected) return true;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return false;
    const { data: isAdmin } = await client.rpc("is_system_admin", { _user_id: data.user.id });
    return isAdmin === true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!(await isAuthorized(req))) return json({ error: "Unauthorized" }, 401);

  const startedAt = Date.now();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* cron uten body */ }

  const mode = String(body?.mode || "sync");
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

    const limit = 100;
    const countData = await nextcomFetch("/crm-system/orders?offset=0&limit=1&locale=nor", auth);
    const totalCount = Number(countData.totalCount || countData.total || countData.count || 0);
    const maxPages = Number(body?.pages ?? 10);

    // ── Modus: kartlegg hvilke statuser som finnes (navn + kode)
    if (mode === "scan_statuses") {
      const seen = new Map<string, { statusId: number; statusName: string; count: number; examples: string[] }>();
      let sampleKeys: string[] = [];
      for (let page = 0; page < maxPages; page++) {
        const offset = Math.max(0, totalCount - (page + 1) * limit);
        const d = await nextcomFetch(`/crm-system/orders?offset=${offset}&limit=${limit}&locale=nor`, auth);
        for (const o of (d.items || [])) {
          if (!sampleKeys.length) sampleKeys = Object.keys(o);
          const sid = Number(o.statusId);
          const sname = statusNameOf(o);
          const key = `${sid}|${sname}`;
          const cur = seen.get(key) || { statusId: sid, statusName: sname, count: 0, examples: [] };
          cur.count++;
          if (cur.examples.length < 5 && o.customerCompany) {
            cur.examples.push(`${o.customerCompany} (#${o.id}, ${toDateOnly(o.insertedDate)})`);
          }
          seen.set(key, cur);
        }
        if (offset === 0) break;
      }
      return json({
        success: true,
        sample_fields: sampleKeys,
        statuses: Array.from(seen.values()).sort((a, b) => b.count - a.count),
      });
    }

    // ── Modus: slå opp én konkret ordre (for å lese av status etter statusbytte)
    if (mode === "lookup_order") {
      const needle = String(body?.query || "").toLowerCase().trim();
      const matches: unknown[] = [];
      for (let page = 0; page < maxPages; page++) {
        const offset = Math.max(0, totalCount - (page + 1) * limit);
        const d = await nextcomFetch(`/crm-system/orders?offset=${offset}&limit=${limit}&locale=nor`, auth);
        for (const o of (d.items || [])) {
          const hay = `${o.id} ${o.customerCompany ?? ""} ${o.customerEmail ?? ""} ${o.customerOrgNoOrSsn ?? ""}`.toLowerCase();
          if (needle && hay.includes(needle)) {
            matches.push({
              id: o.id,
              statusId: o.statusId,
              statusName: statusNameOf(o),
              company: o.customerCompany,
              email: o.customerEmail,
              orgNumber: o.customerOrgNoOrSsn,
              products: o.allProducts,
              insertedDate: toDateOnly(o.insertedDate),
              statusDate: toDateOnly(o.statusDate),
            });
          }
        }
        if (offset === 0) break;
      }
      return json({ success: true, matches: matches.slice(0, 25) });
    }

    // ── Normal synk: match på statuskode ELLER statusnavn
    let statusIds: number[] = Array.isArray(body?.status_ids)
      ? (body.status_ids as unknown[]).map(Number)
      : [];
    let statusNames: string[] = Array.isArray(body?.status_names)
      ? (body.status_names as unknown[]).map((n) => String(n).toLowerCase().trim()).filter(Boolean)
      : [];

    if (statusIds.length === 0 && statusNames.length === 0) {
      const { data: setting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      const value = setting?.value as { status_ids?: unknown[]; status_names?: unknown[] } | null;
      statusIds = (value?.status_ids || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
      statusNames = (value?.status_names || []).map((n) => String(n).toLowerCase().trim()).filter(Boolean);
    }

    // Ingen konfigurasjon? Bruk standardnavnet «avsluttet kundeforhold».
    if (statusIds.length === 0 && statusNames.length === 0) statusNames = [...DEFAULT_STATUS_NAMES];

    // Sikkerhetsfilter: kun ordre som fikk avslutningsstatus etter denne datoen.
    // Hindrer at gamle historiske ordre med samme statuskode stenger aktive kunder.
    const minStatusDate = String(body?.min_status_date || "2026-08-01");

    const terminatedOrders: Record<string, unknown>[] = [];
    let skippedOldStatus = 0;
    for (let page = 0; page < maxPages; page++) {
      const offset = Math.max(0, totalCount - (page + 1) * limit);
      const d = await nextcomFetch(`/crm-system/orders?offset=${offset}&limit=${limit}&locale=nor`, auth);
      const items: Record<string, unknown>[] = d.items || [];
      if (!items.length) break;
      for (const o of items) {
        if (!matchesTermination(o, statusIds, statusNames)) continue;
        const sd = toDateOnly(o.statusDate);
        if (!sd || sd < minStatusDate) { skippedOldStatus++; continue; }
        terminatedOrders.push(o);
      }
      if (offset === 0) break;
    }



    console.log(`[license-sync] ${terminatedOrders.length} ordre med avsluttet kundeforhold`);

    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, org_number, email, license_months, license_months_manual, scheduled_termination_date, terminated_at");

    type Row = NonNullable<typeof companies>[number];
    const byOrg = new Map<string, Row>();
    const byEmail = new Map<string, Row>();
    for (const c of companies || []) {
      const org = normalizeOrg(c.org_number);
      if (org.length === 9) byOrg.set(org, c);
      if (c.email) byEmail.set(String(c.email).toLowerCase().trim(), c);
    }

    const results: Array<Record<string, unknown>> = [];
    let scheduled = 0;

    // Hvis en bedrift har flere avsluttede ordre, bruker vi den seneste sluttdatoen.
    const best = new Map<string, { end: string; months: number; start: string; orderId: string; company: Row }>();

    for (const order of terminatedOrders) {
      const products = String(order.allProducts || "");
      if (!isSystemOrder(products)) continue;

      const org = normalizeOrg(order.customerOrgNoOrSsn);
      const email = String(order.customerEmail || "").toLowerCase().trim();
      const company = (org.length === 9 ? byOrg.get(org) : undefined) || byEmail.get(email);

      if (!company) {
        results.push({ order_id: order.id, company: order.customerCompany, status: "no_match" });
        continue;
      }

      const startDate = toDateOnly(order.insertedDate) || toDateOnly(order.sendDate);
      if (!startDate) {
        results.push({ order_id: order.id, company: company.name, status: "no_start_date" });
        continue;
      }

      const months = company.license_months_manual
        ? (company.license_months ?? 12)
        : (detectLicenseMonths(products) ?? company.license_months ?? 12);

      const endDate = addMonths(startDate, months);
      const current = best.get(company.id);
      if (!current || endDate > current.end) {
        best.set(company.id, { end: endDate, months, start: startDate, orderId: String(order.id), company });
      }
    }

    const today = toDateOnly(new Date())!;
    for (const [companyId, info] of best) {
      // Sluttdato i fortiden = datagrunnlaget er trolig feil. Krever manuell vurdering.
      if (info.end <= today) {
        results.push({ company: info.company.name, status: "needs_review_past_date", end_date: info.end });
        continue;
      }
      if (info.company.scheduled_termination_date === info.end) {
        results.push({ company: info.company.name, status: "unchanged", end_date: info.end });
        continue;
      }

      if (dryRun) {
        results.push({ company: info.company.name, status: "dry_run", start: info.start, months: info.months, end_date: info.end });
        continue;
      }

      const { error } = await supabase
        .from("companies")
        .update({
          license_start_date: info.start,
          license_months: info.months,
          scheduled_termination_date: info.end,
          termination_requested_at: new Date().toISOString(),
          termination_source: "nextcom",
          termination_order_id: info.orderId,
        })
        .eq("id", companyId);

      if (error) {
        results.push({ company: info.company.name, status: "error", error: error.message });
      } else {
        scheduled++;
        results.push({ company: info.company.name, status: "scheduled", start: info.start, months: info.months, end_date: info.end });
      }
    }

    await recordJobRun("nextcom-license-sync", "success", startedAt, {
      itemsProcessed: terminatedOrders.length,
      details: { scheduled, status_ids: statusIds, status_names: statusNames, skipped_old_status: skippedOldStatus, min_status_date: minStatusDate },
    });

    return json({
      success: true,
      terminated_orders: terminatedOrders.length,
      skipped_old_status: skippedOldStatus,
      min_status_date: minStatusDate,
      scheduled,
      results,
      dry_run: dryRun,
    });

  } catch (error) {
    console.error("[license-sync] Fatal:", error);
    await recordJobRun("nextcom-license-sync", "error", startedAt, { errorMessage: String(error) });
    return json({ error: String(error) }, 500);
  }
});
