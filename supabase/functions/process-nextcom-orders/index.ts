import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SERVICE_TEMPLATES,
  detectServiceTemplates,
  type ServiceTemplateKey,
} from "../_shared/service-email-templates/index.ts";
import {
  cleanText,
  loadPriceBook,
  normalizeProductName,
  parseOrderLines,
  statusFacts,
  syncOrderLines,
} from "../_shared/nextcom-order-lines.ts";




const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEXTCOM_BASE_URL = "https://hmsproffen.nextcom.no/rest-api/public/v2.0";

// Product name → TotalIK module mapping
const PRODUCT_TO_MODULE: Record<string, string> = {
  'ik/hms': 'IK_HMS',
  'internkontroll hms': 'IK_HMS',
  'hms system': 'IK_HMS',
  'total-ik': 'IK_HMS',
  'ik/mat': 'IK_MAT',
  'mattrygghet': 'IK_MAT',
  'internkontroll mat': 'IK_MAT',
  'ks bygg': 'IK_BYGG',
  'ik bygg': 'IK_BYGG',
  'internkontroll bygg': 'IK_BYGG',
  'ik alkohol': 'IK_ALKOHOL',
  'internkontroll alkohol': 'IK_ALKOHOL',
  'gdpr': 'GDPR',
  'personalhåndbok': 'PERSONALHANDBOK',
  'personalhandbok': 'PERSONALHANDBOK',
  'åpenhetsloven': 'APENHETSLOVEN',
  'apenhetsloven': 'APENHETSLOVEN',
  'ik/fdv': 'IK_FDV',
  'fdv': 'IK_FDV',
  'ks': 'KS',
  'kvalitetssystem': 'KS',
  'hr': 'HR',
  'timeregistrering': 'TIMEREGISTRERING',
  'avdelinger': 'AVDELINGER',
};

// Bundle/pakke products that activate multiple modules at once
const PRODUCT_BUNDLES: Record<string, string[]> = {
  'byggepakke': ['IK_HMS', 'IK_BYGG'],
  'byggepakken': ['IK_HMS', 'IK_BYGG'],
  // Velkomstpakker for nyregistrerte bedrifter (6 mnd gratis)
  'velkomstpakke bygg': ['IK_HMS', 'IK_BYGG', 'PERSONALHANDBOK'],
  'velkomstpakke renhold': ['IK_HMS', 'PERSONALHANDBOK'],
  'velkomstpakke frisør': ['IK_HMS', 'PERSONALHANDBOK'],
  'velkomstpakke frisor': ['IK_HMS', 'PERSONALHANDBOK'],
  'velkomstpakke servering': ['IK_HMS', 'IK_MAT', 'PERSONALHANDBOK'],
  'velkomstpakke': ['IK_HMS', 'PERSONALHANDBOK'],
};

/** Kjenner igjen velkomstpakke-ordre og hvilken bransje den gjelder. */
function detectWelcomePackage(productNames: string[]): { isWelcome: boolean; type: string | null } {
  for (const product of productNames) {
    const lower = product.toLowerCase().trim();
    if (!lower.includes('velkomstpakke')) continue;
    if (lower.includes('bygg')) return { isWelcome: true, type: 'bygg' };
    if (lower.includes('renhold')) return { isWelcome: true, type: 'renhold' };
    if (lower.includes('frisør') || lower.includes('frisor')) return { isWelcome: true, type: 'frisor' };
    if (lower.includes('servering') || lower.includes('mat')) return { isWelcome: true, type: 'servering' };
    return { isWelcome: true, type: 'generell' };
  }
  return { isWelcome: false, type: null };
}

// Course-related keywords that should NOT be processed by TotalIK
const COURSE_KEYWORDS = [
  'kurs', 'course', 'opplæring', 'sertifisering', 'varme arbeider',
  'arbeid i høyden', 'truck', 'stillas', 'fallsikring', 'førstehjelpskurs',
  'brannvern', 'hms-kort', 'adr', 'maskinførerbevis',
];

interface NextcomOrder {
  id: string;
  statusId: number;
  customerCompany: string;
  customerEmail: string;
  customerOrgNoOrSsn?: string;
  allProducts: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhoneNumber?: string;
  customerAddress?: string;
  customerPostalCode?: string;
  customerCity?: string;
  sellerName?: string;
  // Ekstra felter fra CRM-ordren (samme API-kall, ingen ekstra henting)
  comments?: string | null;
  insertedDate?: string | null;
  sendDate?: string | null;
  sumValue?: number | null;
  userId?: number | string | null;
  customerCellPhone?: string | null;
  customerPhone?: string | null;
  customerZipCode?: string | null;
  customerPostalArea?: string | null;
  customerHouseNumber?: string | null;
  orderRef?: string | null;
  statusMessage?: string | null;
  statusDate?: string | null;
}

/** Prisbok for ordrelinjer – lastes én gang per kjøring. */
let priceBook = new Map<string, number>();

/** Felter fra NextCom-ordren som alltid lagres, uansett utfall. */
function orderFacts(order: NextcomOrder) {
  const orgNumber = (order.customerOrgNoOrSsn || "").replace(/\D/g, "");
  return {
    order_comments: cleanText(order.comments),
    org_number: orgNumber.length === 9 ? orgNumber : null,
    company_name: cleanText(order.customerCompany),
    customer_email: cleanText(order.customerEmail)?.toLowerCase() ?? null,
    products: cleanText(order.allProducts),
    order_date: order.insertedDate || order.sendDate || null,
    order_sum: typeof order.sumValue === "number" ? order.sumValue : null,
    seller_user_id: order.userId != null ? String(order.userId) : null,
    ...statusFacts(order),
  };
}





Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const nextcomAuth = Deno.env.get("NEXTCOM_BASIC_AUTH");

    if (!nextcomAuth) {
      console.error("[TotalIK NextCom Sync] NEXTCOM_BASIC_AUTH not configured");
      return new Response(JSON.stringify({ error: "NextCom auth not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If only password provided (no colon), prepend default username
    const authString = nextcomAuth.includes(":") 
      ? nextcomAuth 
      : `kimiclaw:${nextcomAuth}`;
    const basicAuthEncoded = btoa(authString);

    console.log(`[TotalIK NextCom Sync] Auth: has colon=${nextcomAuth.includes(":")}, final length=${authString.length}`);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check mode
    let dryRun = false;
    let markHistorical = false;
    let backfillLines = false;
    let backfillPages = 10;
    let reprocessOrderIds: string[] = [];
    try {
      const body = await req.json();
      dryRun = body?.dry_run === true;
      markHistorical = body?.mark_historical === true;
      backfillLines = body?.backfill_lines === true;
      if (Number.isFinite(Number(body?.pages))) backfillPages = Math.min(30, Math.max(1, Number(body.pages)));
      if (Array.isArray(body?.reprocess_order_ids)) {
        reprocessOrderIds = body.reprocess_order_ids.map(String);
      }
    } catch {
      // Normal cron invocation - no body
    }

    priceBook = await loadPriceBook(supabase);

    // Backfill-modus: fyller ordrelinjer/status for eksisterende ordre uten å
    // opprette bedrifter eller sende e-post. Alt skrives i bulk for å holde
    // kjøringen innenfor ressursgrensene.
    if (backfillLines) {
      const all = await fetchNextcomOrders(basicAuthEncoded, null, true, backfillPages, false);

      // Runde 1: lær priser fra enlinjeordre (ordresum = linjepris).
      // Vi teller hvor ofte hver pris forekommer og bruker den vanligste –
      // enkeltrabatterte ordre skal ikke ødelegge prisboken.
      type Learned = { product_name: string; is_bht: boolean; order_id: string; counts: Map<number, number> };
      const learned = new Map<string, Learned>();
      for (const order of all) {
        const lines = parseOrderLines(order.allProducts, order.sumValue, priceBook);
        for (const l of lines) {
          if ((l.price_source === "single" || l.price_source === "name") && l.unit_price !== null && l.unit_price > 0) {
            const key = normalizeProductName(l.product_name);
            const entry = learned.get(key) ??
              { product_name: l.product_name, is_bht: l.is_bht, order_id: String(order.id), counts: new Map<number, number>() };
            entry.counts.set(l.unit_price, (entry.counts.get(l.unit_price) ?? 0) + 1);
            entry.order_id = String(order.id);
            learned.set(key, entry);
          }
        }
      }
      const priceRows = Array.from(learned.entries()).map(([key, v]) => {
        const [price, samples] = Array.from(v.counts.entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
        priceBook.set(key, price);
        return {
          normalized_name: key,
          product_name: v.product_name,
          unit_price: price,
          sample_count: samples,
          is_bht: v.is_bht,
          last_seen_order_id: v.order_id,
          last_seen_at: new Date().toISOString(),
        };
      });

      for (let i = 0; i < priceRows.length; i += 200) {
        const { error } = await supabase
          .from("nextcom_product_prices")
          .upsert(priceRows.slice(i, i + 200), { onConflict: "normalized_name" });
        if (error) console.error("[backfill] prisbok:", error.message);
      }

      // Runde 2: løs alle ordre med oppdatert prisbok
      const lineRows: Record<string, unknown>[] = [];
      for (const order of all) {
        const lines = parseOrderLines(order.allProducts, order.sumValue, priceBook);
        for (const l of lines) lineRows.push({ order_id: String(order.id), ...l });
      }
      for (let i = 0; i < lineRows.length; i += 500) {
        const { error } = await supabase
          .from("nextcom_order_lines")
          .upsert(lineRows.slice(i, i + 500), { onConflict: "order_id,line_no" });
        if (error) console.error("[backfill] linjer:", error.message);
      }

      // Ordrerader: behold eksisterende behandlingsstatus, legg til nye som
      // "not_processed" slik at roboten finner kommentar/status/linjer.
      const ids = all.map((o) => String(o.id));
      const existing = new Map<string, string>();
      for (let i = 0; i < ids.length; i += 300) {
        const { data } = await supabase
          .from("nextcom_processed_orders")
          .select("order_id, status")
          .in("order_id", ids.slice(i, i + 300));
        for (const r of data || []) existing.set(String(r.order_id), r.status);
      }
      const orderRows = all.map((o) => ({
        order_id: String(o.id),
        status: existing.get(String(o.id)) ?? "not_processed",
        ...orderFacts(o),
      }));
      for (let i = 0; i < orderRows.length; i += 300) {
        const { error } = await supabase
          .from("nextcom_processed_orders")
          .upsert(orderRows.slice(i, i + 300), { onConflict: "order_id" });
        if (error) console.error("[backfill] ordre:", error.message);
      }

      return respond({
        success: true,
        mode: "backfill_lines",
        orders: all.length,
        lines: lineRows.length,
        prices_learned: priceRows.length,
        needs_review: lineRows.filter((l) => l.needs_review).length,
      });
    }



    console.log(`[TotalIK NextCom Sync] Starting${dryRun ? ' (DRY RUN)' : ''}${reprocessOrderIds.length ? ` (REPROCESS ${reprocessOrderIds.length})` : ''}...`);


    // Step 1: Get the latest processed order timestamp to only fetch recent orders
    const { data: latestProcessed } = await supabase
      .from("nextcom_processed_orders")
      .select("processed_at")
      .order("processed_at", { ascending: false })
      .limit(1);

    const lastProcessedAt = latestProcessed?.[0]?.processed_at || null;

    // Step 2: Fetch confirmed orders from NextCom
    const orders = await fetchNextcomOrders(basicAuthEncoded, lastProcessedAt, reprocessOrderIds.length > 0);
    console.log(`[TotalIK NextCom Sync] Found ${orders.length} confirmed orders (since: ${lastProcessedAt || 'all time'})`);

    if (orders.length === 0) {
      return respond({ success: true, message: "No pending orders found", orders_found: 0 });
    }

    // Step 2: Check which orders we've already processed (skipped in reprocess mode)
    let processedSet = new Set<string>();
    if (reprocessOrderIds.length === 0) {
      const orderIds = orders.map(o => String(o.id));
      const { data: processedOrders } = await supabase
        .from("nextcom_processed_orders")
        .select("order_id")
        .in("order_id", orderIds);
      processedSet = new Set((processedOrders || []).map(p => String(p.order_id)));
    }

    const newOrders = reprocessOrderIds.length > 0
      ? orders.filter(o => reprocessOrderIds.includes(String(o.id)))
      : orders.filter(o => !processedSet.has(String(o.id)));

    console.log(`[TotalIK NextCom Sync] ${newOrders.length} orders to process (${processedSet.size} already processed)`);


    // Mark historical mode
    if (markHistorical && newOrders.length > 0) {
      let marked = 0;
      for (const order of newOrders) {
        await markOrderProcessed(supabase, order, "historical_skip");
        marked++;
      }
      return respond({ success: true, message: `Marked ${marked} orders as historical`, marked_historical: marked });
    }

    if (newOrders.length === 0) {
      return respond({ success: true, message: "All orders already processed", orders_found: orders.length, already_processed: processedSet.size });
    }

    // Step 3: Process new orders in concurrent chunks (3 at a time)
    type OrderResult = { order_id: string; company: string; status: string; modules?: string[]; details?: unknown; error?: string };
    const results: OrderResult[] = [];

    const processOrder = async (order: NextcomOrder): Promise<OrderResult> => {
      try {
        // Parse products and determine which are IK-system modules
        const productNames = order.allProducts
          ? order.allProducts.split(",").map(p => p.trim()).filter(Boolean)
          : [];

        const modules = detectModules(productNames);
        const welcomePackage = detectWelcomePackage(productNames);
        const isCourseOnly = modules.length === 0 && productNames.some(p =>
          COURSE_KEYWORDS.some(kw => p.toLowerCase().includes(kw))
        );
        // Detect renewal orders by product name (e.g. "Fornyelse av lisens")
        const isRenewal = productNames.some(p => p.toLowerCase().includes('fornyelse'));

        // Employee count from Brreg — også brukt til å velge riktig renholdsmal
        const employeeCount = await fetchBrregEmployeeCount(order.customerOrgNoOrSsn);
        const serviceTemplates = detectServiceTemplates(productNames, employeeCount);

        if (dryRun) {
          return {
            order_id: order.id,
            company: order.customerCompany || "Unknown",
            status: "dry_run",
            modules,
            details: {
              products: order.allProducts,
              email: order.customerEmail,
              is_course_only: isCourseOnly,
              service_templates: serviceTemplates,
              nextcom_order: orderFacts(order),
            },
          };
        }

        // Tjenestee-poster (HMS-kort, kompetansebevis, renholdsgodkjenning) sendes
        // uavhengig av om ordren også inneholder IK-moduler.
        if (serviceTemplates.length > 0 && order.customerEmail) {
          await sendServiceEmails(supabase, order, serviceTemplates);
        }

        // Skip course-only orders (handled by kurskontoret). Renewals are always processed.
        if (!isRenewal && (isCourseOnly || modules.length === 0)) {
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Skipping - ${isCourseOnly ? 'course product' : 'no IK modules detected'} (${order.allProducts})`);
          await markOrderProcessed(supabase, order, "skipped_not_ik", { products: order.allProducts, service_emails: serviceTemplates });
          return { order_id: order.id, company: order.customerCompany || "Unknown", status: serviceTemplates.length > 0 ? "service_email_sent" : "skipped", modules: serviceTemplates, error: serviceTemplates.length > 0 ? undefined : (isCourseOnly ? "Course product (handled by kurskontoret)" : "No IK modules detected") };
        }

        // Skip orders without email
        if (!order.customerEmail) {
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Skipping - no email`);
          await markOrderProcessed(supabase, order, "skipped_no_email");
          return { order_id: order.id, company: order.customerCompany || "Unknown", status: "skipped", error: "No email" };
        }

        // Call create-company-from-crm
        const crmPayload = {
          company_name: order.customerCompany || `Bedrift ${order.customerOrgNoOrSsn || order.customerEmail}`,
          org_number: order.customerOrgNoOrSsn || "",
          email: order.customerEmail,
          first_name: order.customerFirstName || "",
          last_name: order.customerLastName || "",
          phone: order.customerPhoneNumber || "",
          address: order.customerAddress || "",
          postal_code: order.customerPostalCode || "",
          city: order.customerCity || "",
          employee_count: employeeCount,
          modules,
          seller_name: order.sellerName || "NextCom Import",
          is_renewal: isRenewal,
          welcome_package: welcomePackage.isWelcome,
          welcome_package_type: welcomePackage.type,
        };

        console.log(`[TotalIK NextCom Sync] Order ${order.id}: ${isRenewal ? 'RENEWAL' : 'NEW'} - ${crmPayload.company_name} with modules [${modules.join(', ')}]`);

        const syncApiKey = Deno.env.get("SYNC_API_KEY")!;
        const crmResponse = await fetch(`${supabaseUrl}/functions/v1/create-company-from-crm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-api-key": syncApiKey,
          },
          body: JSON.stringify(crmPayload),
        });

        const crmResult = await crmResponse.json();

        if (crmResponse.ok) {
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Success -`, JSON.stringify(crmResult));
          await markOrderProcessed(supabase, order, "success", crmResult);
          return { order_id: order.id, company: order.customerCompany || "Unknown", status: "success", modules, details: crmResult };
        } else if (crmResponse.status === 409) {
          // Company already exists - not an error
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Company already exists`);
          await markOrderProcessed(supabase, order, "already_exists", crmResult);
          return { order_id: order.id, company: order.customerCompany || "Unknown", status: "already_exists", modules };
        } else {
          console.error(`[TotalIK NextCom Sync] Order ${order.id}: CRM failed -`, crmResult);
          await markOrderProcessed(supabase, order, "error", null, crmResult.error || JSON.stringify(crmResult));
          return { order_id: order.id, company: order.customerCompany || "Unknown", status: "error", error: crmResult.error };
        }
      } catch (err) {
        console.error(`[TotalIK NextCom Sync] Order ${order.id}: Exception -`, err);
        await markOrderProcessed(supabase, order, "error", null, String(err));
        return { order_id: order.id, company: order.customerCompany || "Unknown", status: "error", error: String(err) };
      }
    };

    const CONCURRENCY = 3;
    for (let i = 0; i < newOrders.length; i += CONCURRENCY) {
      const chunk = newOrders.slice(i, i + CONCURRENCY);
      results.push(...await Promise.all(chunk.map(processOrder)));
    }


    const summary = {
      success: true,
      total_found: orders.length,
      already_processed: processedSet.size,
      new_processed: newOrders.length,
      results,
      dry_run: dryRun,
    };

    console.log(`[TotalIK NextCom Sync] Complete:`, JSON.stringify(summary));
    return respond(summary);

  } catch (error) {
    // Midlertidig nedetid hos NextCom skal ikke velte jobben (unngår 502 + alarm).
    if (error instanceof NextcomUpstreamError) {
      console.warn(`[TotalIK NextCom Sync] Upstream unavailable (${error.status}): ${error.message}`);
      return respond({
        success: false,
        skipped: true,
        reason: "nextcom_upstream_unavailable",
        upstream_status: error.status,
        message: "NextCom API utilgjengelig – ingen ordre behandlet. Neste kjøring prøver på nytt.",
      });
    }
    console.error("[TotalIK NextCom Sync] Fatal error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

});

function respond(body: object) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Tjenestee-poster (Athena HMS) ──

const SERVICE_FROM = "Athena HMS <noreply@totalik.no>";
const SERVICE_REPLY_TO = "joe@athenahms.no";

async function sendServiceEmails(
  supabase: ReturnType<typeof createClient>,
  order: NextcomOrder,
  templates: ServiceTemplateKey[],
) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[Service Email] RESEND_API_KEY mangler");
    return;
  }

  const recipient = (order.customerEmail || "").trim().toLowerCase();
  if (!recipient) return;

  for (const key of templates) {
    // Idempotens: hopp over hvis allerede sendt for denne ordren
    const { data: existing } = await supabase
      .from("nextcom_service_emails")
      .select("id")
      .eq("order_id", String(order.id))
      .eq("template_key", key)
      .maybeSingle();

    if (existing) {
      console.log(`[Service Email] Order ${order.id}: ${key} allerede sendt`);
      continue;
    }

    const tpl = SERVICE_TEMPLATES[key];
    let status = "sent";
    let errorMessage: string | null = null;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: SERVICE_FROM,
          to: [recipient],
          cc: [SERVICE_REPLY_TO],
          reply_to: SERVICE_REPLY_TO,
          subject: tpl.subject,
          html: tpl.html,
        }),
      });

      if (!res.ok) {
        status = "error";
        errorMessage = (await res.text()).slice(0, 500);
        console.error(`[Service Email] Order ${order.id}: ${key} feilet -`, errorMessage);
      } else {
        console.log(`[Service Email] Order ${order.id}: ${key} sendt til ${recipient}`);
      }
    } catch (err) {
      status = "error";
      errorMessage = String(err).slice(0, 500);
      console.error(`[Service Email] Order ${order.id}: ${key} exception -`, err);
    }

    await supabase.from("nextcom_service_emails").upsert({
      order_id: String(order.id),
      template_key: key,
      recipient_email: recipient,
      company_name: order.customerCompany || null,
      product_names: order.allProducts || null,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    }, { onConflict: "order_id,template_key" });
  }
}

// ── Detect IK modules from product names ──

function detectModules(productNames: string[]): string[] {
  const modules = new Set<string>();
  for (const product of productNames) {
    const lower = product.toLowerCase().trim();
    // Check bundles first (e.g. "Byggepakken" → IK_HMS + IK_BYGG)
    for (const [bundleKeyword, bundleModules] of Object.entries(PRODUCT_BUNDLES)) {
      if (lower.includes(bundleKeyword)) {
        for (const m of bundleModules) modules.add(m);
      }
    }
    // Then individual product mappings
    for (const [keyword, module] of Object.entries(PRODUCT_TO_MODULE)) {
      if (lower.includes(keyword)) {
        modules.add(module);
      }
    }
  }
  return Array.from(modules);
}

async function fetchBrregEmployeeCount(orgNumber?: string): Promise<number | null> {
  const normalizedOrgNumber = (orgNumber || "").replace(/\D/g, "");
  if (normalizedOrgNumber.length !== 9) return null;

  try {
    const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${normalizedOrgNumber}`, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.warn(`[Brreg] Could not fetch employee count for ${normalizedOrgNumber}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const employeeCount = Number(data?.antallAnsatte);
    return Number.isFinite(employeeCount) ? employeeCount : null;
  } catch (error) {
    console.warn(`[Brreg] Employee count lookup failed for ${normalizedOrgNumber}:`, error);
    return null;
  }
}

// ── NextCom API ──

class NextcomUpstreamError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "NextcomUpstreamError";
    this.status = status;
  }
}

/** Henter fra NextCom med retry/backoff på 5xx og 429. */
async function nextcomFetch(url: string, basicAuth: string, attempts = 3): Promise<Response> {
  let last: { status: number; text: string } | null = null;

  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    try {
      const res = await fetch(url, {
        headers: { "Authorization": `Basic ${basicAuth}`, "Accept": "application/json" },
      });
      if (res.ok) return res;
      const text = (await res.text()).slice(0, 500);
      last = { status: res.status, text };
      if (res.status < 500 && res.status !== 429) break;
      console.warn(`[NextCom] ${res.status} på forsøk ${i + 1}/${attempts}`);
    } catch (e) {
      last = { status: 0, text: String(e) };
      console.warn(`[NextCom] Nettverksfeil på forsøk ${i + 1}/${attempts}: ${e}`);
    }
  }

  throw new NextcomUpstreamError(last?.status ?? 0, `NextCom API error ${last?.status ?? 0}: ${last?.text ?? "unknown"}`);
}

async function fetchNextcomOrders(
  basicAuth: string,
  lastProcessedAt: string | null,
  deepFetch = false,
  pages?: number,
  onlyConfirmed = true,
): Promise<NextcomOrder[]> {
  const allOrders: NextcomOrder[] = [];
  const limit = 100;
  // Normal: last 2 pages (200 orders). Deep fetch (reprocess): last 5 pages (500 orders).
  const maxPages = pages ?? (deepFetch ? 5 : 2);


  // Get total count with a single lightweight call
  const countUrl = `${NEXTCOM_BASE_URL}/crm-system/orders?offset=0&limit=1&locale=eng`;
  const countResponse = await nextcomFetch(countUrl, basicAuth);

  const countData = await countResponse.json();
  const totalCount = countData.totalCount || countData.total || countData.count || 0;
  console.log(`[NextCom] Total orders: ${totalCount}`);

  // Only fetch the newest pages (last 200 orders max = 2 API calls)
  for (let page = 0; page < maxPages; page++) {
    const offset = Math.max(0, totalCount - ((page + 1) * limit));
    const url = `${NEXTCOM_BASE_URL}/crm-system/orders?offset=${offset}&limit=${limit}&locale=eng`;
    console.log(`[NextCom] Fetching offset=${offset} (${page + 1}/${maxPages})...`);

    const response = await nextcomFetch(url, basicAuth);


    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) break;

    // Accept statusId 2, 10, 29 as "confirmed" (backfill henter alle)
    const confirmedOrders = onlyConfirmed
      ? items.filter((o: NextcomOrder) => o.statusId === 2 || o.statusId === 10 || o.statusId === 29)
      : items;
    allOrders.push(...confirmedOrders);


    if (offset === 0) break;
  }

  // Deduplicate
  const seen = new Set<string>();
  return allOrders.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

// ── Track processed orders ──

async function markOrderProcessed(
  supabase: ReturnType<typeof createClient>,
  order: NextcomOrder,
  status: string,
  result?: unknown,
  errorMessage?: string | null,
) {
  const orderId = String(order.id);
  const facts = orderFacts(order);

  const { error } = await supabase.from("nextcom_processed_orders").upsert({
    order_id: orderId,
    status,
    // Beholder tidligere sammendrag, men legger alltid ved ordrefakta fra CRM
    result: { ...(result && typeof result === "object" ? result as Record<string, unknown> : { summary: result ?? null }), nextcom_order: facts },
    error_message: errorMessage || null,
    processed_at: new Date().toISOString(),
    ...facts,
  }, { onConflict: "order_id" });

  if (error) {
    console.error(`Failed to mark order ${orderId}:`, error);
  }

  // Ordrelinjer med pris per produkt (faktureringsroboten leser disse)
  await syncOrderLines(supabase, order, priceBook);



  // Speil kundekommentaren på bedriften slik at den er lett synlig for admin
  if (facts.order_comments && facts.org_number) {
    const { error: compError } = await supabase
      .from("companies")
      .update({
        crm_order_comment: facts.order_comments,
        crm_order_comment_at: new Date().toISOString(),
        crm_last_order_id: orderId,
      })
      .eq("org_number", facts.org_number);
    if (compError) console.error(`Failed to store CRM comment for order ${orderId}:`, compError);
  }
}
