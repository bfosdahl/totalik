// Shared bounce/complaint suppression for every Resend send.
// Works with any Lovable Cloud client (normally the service-role client the
// function already has). Addresses are compared case-insensitively.
import { createClient } from "npm:@supabase/supabase-js@2";

const CHUNK = 200;

// deno-lint-ignore no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Returns the lowercased addresses that have bounced or complained. */
export async function suppressedEmails(
  client: AnyClient,
  emails: string[],
): Promise<Set<string>> {
  const out = new Set<string>();
  const list = [...new Set(
    (emails || [])
      .filter((e) => typeof e === "string" && e.trim())
      .map((e) => e.trim().toLowerCase()),
  )];
  if (list.length === 0) return out;
  const db = client ?? serviceClient();

  // recipient_email may be stored with mixed case, so match both the
  // lowercased address and the original spellings that were passed in.
  const originals = [...new Set((emails || []).filter((e) => typeof e === "string" && e.trim()).map((e) => e.trim()))];
  const candidates = [...new Set([...list, ...originals])];

  for (let i = 0; i < candidates.length; i += CHUNK) {
    const chunk = candidates.slice(i, i + CHUNK);
    let from = 0;
    while (true) {
      const { data, error } = await db
        .from("email_logs")
        .select("id, recipient_email")
        .in("recipient_email", chunk)
        .in("status", ["bounced", "complained"])
        .order("id")
        .range(from, from + CHUNK - 1);
      if (error) {
        // Fail open: a lookup error must not block legitimate mail.
        console.error("[emailSuppression] lookup failed:", error.message);
        break;
      }
      for (const r of data ?? []) {
        if (r?.recipient_email) out.add(String(r.recipient_email).trim().toLowerCase());
      }
      if (!data || data.length < CHUNK) break;
      from += CHUNK;
    }
  }
  return out;
}

/** Splits items into kept (not suppressed) and skipped (suppressed addresses). */
export async function filterSuppressed<T>(
  client: AnyClient,
  items: T[],
  getEmail: (t: T) => string | null | undefined,
): Promise<{ kept: T[]; skipped: string[] }> {
  const emails = (items || []).map(getEmail).filter((e): e is string => !!e);
  const bad = await suppressedEmails(client, emails);
  const kept: T[] = [];
  const skipped: string[] = [];
  for (const it of items || []) {
    const e = getEmail(it);
    if (e && bad.has(e.trim().toLowerCase())) skipped.push(e.trim().toLowerCase());
    else kept.push(it);
  }
  return { kept, skipped };
}

// ---- Send guards (thin wrappers so call sites keep their existing flow) ----

type Recip = string | string[] | undefined | null;

async function cleanField(client: AnyClient, fn: string, v: Recip, bad?: Set<string>) {
  if (!v) return { value: v, bad: bad ?? new Set<string>() };
  const arr = Array.isArray(v) ? v : [v];
  const set = bad ?? (await suppressedEmails(client, arr));
  const kept = arr.filter((e) => !set.has(String(e).trim().toLowerCase()));
  for (const e of arr) {
    if (set.has(String(e).trim().toLowerCase())) {
      console.warn(`[${fn}] skipped suppressed recipient: ${e}`);
    }
  }
  return { value: Array.isArray(v) ? kept : (kept[0] ?? null), bad: set };
}

// deno-lint-ignore no-explicit-any
async function cleanPayload(client: AnyClient, fn: string, p: any): Promise<any | null> {
  const all = [p.to, p.cc, p.bcc].flatMap((v) => (v ? (Array.isArray(v) ? v : [v]) : []));
  const bad = await suppressedEmails(client, all);
  const to = await cleanField(client, fn, p.to, bad);
  const empty = !to.value || (Array.isArray(to.value) && to.value.length === 0);
  if (empty) return null;
  const out = { ...p, to: to.value };
  if (p.cc) out.cc = (await cleanField(client, fn, p.cc, bad)).value;
  if (p.bcc) out.bcc = (await cleanField(client, fn, p.bcc, bad)).value;
  return out;
}

/** resend.emails.send with suppression. Skips the send when every `to` is suppressed. */
// deno-lint-ignore no-explicit-any
export async function guardedResendSend(client: AnyClient, fn: string, resend: any, payload: any): Promise<any> {
  const p = await cleanPayload(client, fn, payload);
  if (!p) return { data: null, error: null, skipped: true };
  return resend.emails.send(p);
}

/** resend.batch.send with suppression (filters the whole list once). */
// deno-lint-ignore no-explicit-any
export async function guardedResendBatch(client: AnyClient, fn: string, resend: any, payload: any[]): Promise<any> {
  const { kept, skipped } = await filterSuppressed(
    client,
    payload || [],
    (p) => (Array.isArray(p?.to) ? p.to[0] : p?.to),
  );
  for (const e of skipped) console.warn(`[${fn}] skipped suppressed recipient: ${e}`);
  if (kept.length === 0) return { data: { data: [] }, error: null, skipped: skipped.length };
  return resend.batch.send(kept);
}

/** fetch("https://api.resend.com/emails", init) with suppression. */
export async function guardedResendFetch(client: AnyClient, fn: string, init: RequestInit): Promise<Response> {
  let body: unknown = null;
  try { body = typeof init.body === "string" ? JSON.parse(init.body) : null; } catch { body = null; }
  if (body && typeof body === "object") {
    const p = await cleanPayload(client, fn, body);
    if (!p) {
      return new Response(JSON.stringify({ id: null, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    init = { ...init, body: JSON.stringify(p) };
  }
  return fetch("https://api.resend.com/emails", init);
}
