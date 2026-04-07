import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    try {
      const body = await req.json();
      dryRun = body?.dry_run === true;
      markHistorical = body?.mark_historical === true;
    } catch {
      // Normal cron invocation - no body
    }

    console.log(`[TotalIK NextCom Sync] Starting${dryRun ? ' (DRY RUN)' : ''}...`);

    // Step 1: Fetch confirmed orders from NextCom
    const orders = await fetchNextcomOrders(basicAuthEncoded);
    console.log(`[TotalIK NextCom Sync] Found ${orders.length} confirmed orders`);

    if (orders.length === 0) {
      return respond({ success: true, message: "No pending orders found", orders_found: 0 });
    }

    // Step 2: Check which orders we've already processed
    const orderIds = orders.map(o => String(o.id));
    const { data: processedOrders } = await supabase
      .from("nextcom_processed_orders")
      .select("order_id")
      .in("order_id", orderIds);

    const processedSet = new Set((processedOrders || []).map(p => String(p.order_id)));
    const newOrders = orders.filter(o => !processedSet.has(String(o.id)));

    console.log(`[TotalIK NextCom Sync] ${newOrders.length} new orders (${processedSet.size} already processed)`);

    // Mark historical mode
    if (markHistorical && newOrders.length > 0) {
      let marked = 0;
      for (const order of newOrders) {
        await markOrderProcessed(supabase, String(order.id), "historical_skip");
        marked++;
      }
      return respond({ success: true, message: `Marked ${marked} orders as historical`, marked_historical: marked });
    }

    if (newOrders.length === 0) {
      return respond({ success: true, message: "All orders already processed", orders_found: orders.length, already_processed: processedSet.size });
    }

    // Step 3: Process each new order
    const results: Array<{ order_id: string; company: string; status: string; modules?: string[]; details?: unknown; error?: string }> = [];

    for (let i = 0; i < newOrders.length; i++) {
      const order = newOrders[i];

      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      try {
        // Parse products and determine which are IK-system modules
        const productNames = order.allProducts
          ? order.allProducts.split(",").map(p => p.trim()).filter(Boolean)
          : [];

        const modules = detectModules(productNames);
        const isCourseOnly = modules.length === 0 && productNames.some(p =>
          COURSE_KEYWORDS.some(kw => p.toLowerCase().includes(kw))
        );

        if (dryRun) {
          results.push({
            order_id: order.id,
            company: order.customerCompany || "Unknown",
            status: "dry_run",
            modules,
            details: { products: order.allProducts, email: order.customerEmail, is_course_only: isCourseOnly },
          });
          continue;
        }

        // Skip course-only orders (handled by kurskontoret)
        if (isCourseOnly || modules.length === 0) {
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Skipping - ${isCourseOnly ? 'course product' : 'no IK modules detected'} (${order.allProducts})`);
          await markOrderProcessed(supabase, order.id, "skipped_not_ik", { products: order.allProducts });
          results.push({ order_id: order.id, company: order.customerCompany || "Unknown", status: "skipped", error: isCourseOnly ? "Course product (handled by kurskontoret)" : "No IK modules detected" });
          continue;
        }

        // Skip orders without email
        if (!order.customerEmail) {
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Skipping - no email`);
          await markOrderProcessed(supabase, order.id, "skipped_no_email");
          results.push({ order_id: order.id, company: order.customerCompany || "Unknown", status: "skipped", error: "No email" });
          continue;
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
          modules,
          seller_name: "NextCom Import",
        };

        console.log(`[TotalIK NextCom Sync] Order ${order.id}: Creating company ${crmPayload.company_name} with modules [${modules.join(', ')}]`);

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
          await markOrderProcessed(supabase, order.id, "success", crmResult);
          results.push({ order_id: order.id, company: order.customerCompany || "Unknown", status: "success", modules, details: crmResult });
        } else if (crmResponse.status === 409) {
          // Company already exists - not an error
          console.log(`[TotalIK NextCom Sync] Order ${order.id}: Company already exists`);
          await markOrderProcessed(supabase, order.id, "already_exists", crmResult);
          results.push({ order_id: order.id, company: order.customerCompany || "Unknown", status: "already_exists", modules });
        } else {
          console.error(`[TotalIK NextCom Sync] Order ${order.id}: CRM failed -`, crmResult);
          await markOrderProcessed(supabase, order.id, "error", null, crmResult.error || JSON.stringify(crmResult));
          results.push({ order_id: order.id, company: order.customerCompany || "Unknown", status: "error", error: crmResult.error });
        }
      } catch (err) {
        console.error(`[TotalIK NextCom Sync] Order ${order.id}: Exception -`, err);
        await markOrderProcessed(supabase, order.id, "error", null, String(err));
        results.push({ order_id: order.id, company: order.customerCompany || "Unknown", status: "error", error: String(err) });
      }
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
    console.error("[TotalIK NextCom Sync] Fatal error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function respond(body: object) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Detect IK modules from product names ──

function detectModules(productNames: string[]): string[] {
  const modules = new Set<string>();
  for (const product of productNames) {
    const lower = product.toLowerCase().trim();
    for (const [keyword, module] of Object.entries(PRODUCT_TO_MODULE)) {
      if (lower.includes(keyword)) {
        modules.add(module);
      }
    }
  }
  return Array.from(modules);
}

// ── NextCom API ──

async function fetchNextcomOrders(basicAuth: string): Promise<NextcomOrder[]> {
  const allOrders: NextcomOrder[] = [];
  const limit = 100;
  const maxPages = 5;

  // Get total count
  const countUrl = `${NEXTCOM_BASE_URL}/crm-system/orders?offset=0&limit=1&locale=eng`;
  const countResponse = await fetch(countUrl, {
    headers: { "Authorization": `Basic ${basicAuth}`, "Accept": "application/json" },
  });

  if (!countResponse.ok) {
    const text = await countResponse.text();
    throw new Error(`NextCom API error ${countResponse.status}: ${text}`);
  }

  const countData = await countResponse.json();
  const totalCount = countData.totalCount || countData.total || countData.count || 0;
  console.log(`[NextCom] Total orders: ${totalCount}`);

  // Fetch newest pages
  const offsets: number[] = [];
  offsets.push(totalCount);
  for (let page = 0; page < maxPages; page++) {
    const off = Math.max(0, totalCount - ((page + 1) * limit));
    if (!offsets.includes(off)) offsets.push(off);
  }

  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i];
    const url = `${NEXTCOM_BASE_URL}/crm-system/orders?offset=${offset}&limit=${limit}&locale=eng`;
    console.log(`[NextCom] Fetching offset=${offset} (${i + 1}/${offsets.length})...`);

    const response = await fetch(url, {
      headers: { "Authorization": `Basic ${basicAuth}`, "Accept": "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`NextCom API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) continue;

    // Accept statusId 2, 10, 29 as "confirmed"
    const confirmedOrders = items.filter((o: NextcomOrder) => o.statusId === 2 || o.statusId === 10 || o.statusId === 29);
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
  orderId: string,
  status: string,
  result?: unknown,
  errorMessage?: string | null,
) {
  const { error } = await supabase.from("nextcom_processed_orders").upsert({
    order_id: orderId,
    status,
    result: result || null,
    error_message: errorMessage || null,
    processed_at: new Date().toISOString(),
  }, { onConflict: "order_id" });

  if (error) {
    console.error(`Failed to mark order ${orderId}:`, error);
  }
}
