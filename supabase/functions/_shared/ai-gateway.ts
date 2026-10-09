// Shared Lovable AI Gateway call helper (chat/completions only).
// Every AI chat/completions call in the edge functions goes through callAiGateway.
// To change model for ALL functions, edit AI_PRIMARY_MODEL (and AI_FALLBACK_MODEL) below.
// The caller's body.model is ignored: the primary model is always tried first (low
// reasoning effort, with a timeout), and AI_FALLBACK_MODEL is used once on error or timeout.

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Primary chat model for every function (low reasoning effort by default).
export const AI_PRIMARY_MODEL = "google/gemini-3.8-flash";
// Automatic fallback when the primary model errors or times out.
export const AI_FALLBACK_MODEL = "google/gemini-2.5-flash";

// Compatibility aliases for existing imports. Callers still write `model: AI_CHAT_MODEL`
// in the request body; the value is ignored by callAiGateway.
export const AI_CHAT_MODEL = AI_FALLBACK_MODEL;
export const AI_CHAT_MODEL_CANDIDATE = AI_PRIMARY_MODEL;

// Default timeouts for the primary model, so a stalled call falls back.
const PRIMARY_FIRST_CHUNK_TIMEOUT_MS = 20_000; // stream: headers + first body chunk
const PRIMARY_TOTAL_TIMEOUT_MS = 45_000; // non-stream: full body
const PRIMARY_REASONING_EFFORT = "low";

// Optional per-call settings. Leaving any field out keeps the defaults above.
export interface AiGatewayOptions {
  reasoningEffort?: "minimal" | "low" | "medium" | "high"; // default "low"
  firstChunkTimeoutMs?: number; // stream only, default 20 s
  totalTimeoutMs?: number; // non-stream only, default 45 s
  disableFallback?: boolean; // default false: on error/timeout retry once on AI_FALLBACK_MODEL
}

function callFallback(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, model: AI_FALLBACK_MODEL }),
  });
}

async function callPrimaryWithTimeout(
  apiKey: string,
  body: Record<string, unknown>,
  options: AiGatewayOptions = {},
): Promise<Response | null> {
  const isStream = body.stream === true;
  const timeoutMs = isStream
    ? options.firstChunkTimeoutMs ?? PRIMARY_FIRST_CHUNK_TIMEOUT_MS
    : options.totalTimeoutMs ?? PRIMARY_TOTAL_TIMEOUT_MS;
  const reasoningEffort = options.reasoningEffort ?? PRIMARY_REASONING_EFFORT;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model: AI_PRIMARY_MODEL, reasoning_effort: reasoningEffort }),
      signal: ctrl.signal,
    });
    console.log(`[ai-gateway] primary model ${AI_PRIMARY_MODEL} status=${res.status}`);
    const contentType = res.headers.get("content-type") ?? (isStream ? "text/event-stream" : "application/json");
    if (!res.ok) {
      clearTimeout(timer);
      if (options.disableFallback) {
        // No fallback wanted: hand the primary model's own error back to the caller.
        const text = await res.text().catch(() => "");
        return new Response(text, { status: res.status, headers: { "Content-Type": contentType } });
      }
      try { await res.body?.cancel(); } catch (_) { /* ignore */ }
      return null;
    }
    if (!isStream || !res.body) {
      const text = await res.text();
      clearTimeout(timer);
      return new Response(text, { status: res.status, headers: { "Content-Type": contentType } });
    }
    const reader = res.body.getReader();
    const first = await reader.read();
    clearTimeout(timer);
    if (first.done || !first.value) return null;
    const firstChunk = first.value;
    const stream = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(firstChunk); },
      async pull(c) {
        try {
          const { done, value } = await reader.read();
          if (done) c.close(); else c.enqueue(value);
        } catch (e) { c.error(e); }
      },
      cancel(reason) { return reader.cancel(reason); },
    });
    return new Response(stream, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (e) {
    clearTimeout(timer);
    console.warn(`[ai-gateway] primary model ${AI_PRIMARY_MODEL} aborted/failed (${e instanceof Error ? e.name : "error"})`);
    if (options.disableFallback) {
      return new Response(JSON.stringify({ error: "AI primary model timed out or failed" }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null;
  }
}

// Always tries AI_PRIMARY_MODEL first, whatever body.model says, then AI_FALLBACK_MODEL once.
export async function callAiGateway(
  apiKey: string,
  body: unknown,
  options?: AiGatewayOptions,
): Promise<Response> {
  const b = { ...((body ?? {}) as Record<string, unknown>) };
  const res = await callPrimaryWithTimeout(apiKey, b, options);
  if (res) return res;
  console.warn(`[ai-gateway] primary model failed or timed out, falling back to ${AI_FALLBACK_MODEL}`);
  return callFallback(apiKey, b);
}

export function gatewayErrorKind(status: number): "rate_limited" | "payment_required" | "other" {
  if (status === 429) return "rate_limited";
  if (status === 402) return "payment_required";
  return "other";
}
