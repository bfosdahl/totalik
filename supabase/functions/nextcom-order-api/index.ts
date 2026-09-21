// API for faktureringsroboten: les NextCom-ordre med linjer, Kommentar, Notat
// og status – uten å logge inn i NextCom i nettleser.
//
// Autentisering (én av to):
//   - header `x-sync-api-key: <SYNC_API_KEY>`  (maskin-til-maskin)
//   - Authorization: Bearer <JWT> for en system_admin
//
// GET  ?order_id=35899            → én ordre med linjer
// GET  ?invoice_state=pending&status_id=2&limit=50 → ordre som skal faktureres
// POST { order_id, notat?, invoice_state?, invoiced_at? } → oppdater vår side
//
// Merk: å sette ordren grønn INNE i NextCom er ikke mulig med dagens API-nøkkel
// (NextCom krever nettlesersesjon for skriving). Derfor holder vi vår egen
// invoice_state her.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const INVOICE_STATES = ["pending", "skip", "invoiced", "hold"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

async function isAuthorized(req: Request): Promise<boolean> {
  const apiKey = req.headers.get("x-sync-api-key");
  const expected = Deno.env.get("SYNC_API_KEY");
  if (apiKey && expected && apiKey === expected) return true;

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

const ORDER_FIELDS =
  "order_id, status, company_name, org_number, customer_email, products, order_date, order_sum, " +
  "order_comments, order_notat, nextcom_status_id, nextcom_status_label, nextcom_status_date, " +
  "invoice_state, invoiced_at, lines_synced_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!(await isAuthorized(req))) return json({ error: "Unauthorized" }, 401);

  const supabase = admin();

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const orderId = url.searchParams.get("order_id");

      if (orderId) {
        const { data: order, error } = await supabase
          .from("nextcom_processed_orders")
          .select(ORDER_FIELDS)
          .eq("order_id", orderId)
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        if (!order) return json({ error: "Order not found" }, 404);

        const { data: lines, error: lineError } = await supabase
          .from("nextcom_order_lines")
          .select("line_no, product_name, quantity, unit_price, line_total, price_source, is_bht, is_course, is_ik_module, needs_review")
          .eq("order_id", orderId)
          .order("line_no");
        if (lineError) return json({ error: lineError.message }, 500);

        const billable = (lines || []).filter((l) => !l.is_bht);
        return json({
          order,
          lines: lines || [],
          billable_total: billable.every((l) => l.line_total !== null)
            ? billable.reduce((a, l) => a + Number(l.line_total), 0)
            : null,
          needs_review: (lines || []).some((l) => l.needs_review),
        });
      }

      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));
      let query = supabase
        .from("nextcom_processed_orders")
        .select(ORDER_FIELDS)
        .order("order_date", { ascending: false })
        .limit(limit);

      const invoiceState = url.searchParams.get("invoice_state");
      if (invoiceState) query = query.eq("invoice_state", invoiceState);
      const statusId = url.searchParams.get("status_id");
      if (statusId) query = query.eq("nextcom_status_id", Number(statusId));

      const { data: orders, error } = await query;
      if (error) return json({ error: error.message }, 500);

      const ids = (orders || []).map((o) => o.order_id);
      const { data: lines } = ids.length
        ? await supabase
          .from("nextcom_order_lines")
          .select("order_id, line_no, product_name, quantity, unit_price, line_total, price_source, is_bht, is_course, is_ik_module, needs_review")
          .in("order_id", ids)
          .order("line_no")
        : { data: [] as Record<string, unknown>[] };

      const byOrder = new Map<string, unknown[]>();
      for (const l of lines || []) {
        const key = String((l as { order_id: string }).order_id);
        if (!byOrder.has(key)) byOrder.set(key, []);
        byOrder.get(key)!.push(l);
      }

      return json({
        count: orders?.length ?? 0,
        orders: (orders || []).map((o) => ({ ...o, lines: byOrder.get(o.order_id) || [] })),
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      const orderId = body?.order_id != null ? String(body.order_id) : "";
      if (!orderId) return json({ error: "order_id is required" }, 400);

      const update: Record<string, unknown> = {};
      if (typeof body.notat === "string") update.order_notat = body.notat.trim() || null;
      if (body.invoice_state !== undefined) {
        if (!INVOICE_STATES.includes(String(body.invoice_state))) {
          return json({ error: `invoice_state must be one of ${INVOICE_STATES.join(", ")}` }, 400);
        }
        update.invoice_state = String(body.invoice_state);
        update.invoiced_at = body.invoice_state === "invoiced"
          ? (typeof body.invoiced_at === "string" ? body.invoiced_at : new Date().toISOString())
          : null;
      }
      if (Object.keys(update).length === 0) return json({ error: "Nothing to update" }, 400);

      const { data, error } = await supabase
        .from("nextcom_processed_orders")
        .update(update)
        .eq("order_id", orderId)
        .select(ORDER_FIELDS)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Order not found" }, 404);

      return json({ success: true, order: data });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("[nextcom-order-api]", e);
    return json({ error: "Internal server error" }, 500);
  }
});
