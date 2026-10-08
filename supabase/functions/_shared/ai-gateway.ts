// Shared Lovable AI Gateway call helper (chat/completions only).
// Thin wrapper: no body reading, no throwing, no retries, no logging.
// Primary chat model: AI_CHAT_MODEL_CANDIDATE with low reasoning effort for everyone.
// AI_CHAT_MODEL is the automatic fallback on error or timeout.

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const AI_CHAT_MODEL = "google/gemini-2.5-flash";

// Primary chat model (low reasoning effort). Falls back to AI_CHAT_MODEL on error or timeout.
export const AI_CHAT_MODEL_CANDIDATE = "google/gemini-3.8-flash";

function callGateway(apiKey: string, body: unknown): Promise<Response> {
  return fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Timeout for the primary model so a stalled call falls back to AI_CHAT_MODEL.
const CANDIDATE_FIRST_CHUNK_TIMEOUT_MS = 20_000; // stream: headers + first body chunk
const CANDIDATE_TOTAL_TIMEOUT_MS = 45_000; // non-stream: full body
const CANDIDATE_REASONING_EFFORT = "low"; // lower thinking on the primary model

async function callCandidateWithTimeout(apiKey: string, body: Record<string, unknown>): Promise<Response | null> {
  const isStream = body.stream === true;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), isStream ? CANDIDATE_FIRST_CHUNK_TIMEOUT_MS : CANDIDATE_TOTAL_TIMEOUT_MS);
  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model: AI_CHAT_MODEL_CANDIDATE, reasoning_effort: CANDIDATE_REASONING_EFFORT }),
      signal: ctrl.signal,
    });
    console.log(`[ai-gateway] primary model ${AI_CHAT_MODEL_CANDIDATE} status=${res.status}`);
    const contentType = res.headers.get("content-type") ?? (isStream ? "text/event-stream" : "application/json");
    if (!res.ok) {
      clearTimeout(timer);
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
    console.warn(`[ai-gateway] primary model ${AI_CHAT_MODEL_CANDIDATE} aborted/failed (${e instanceof Error ? e.name : "error"})`);
    return null;
  }
}

export async function callAiGateway(apiKey: string, body: unknown, overrideKey?: string | null): Promise<Response> {
  const b = body as { model?: string } | null;
  if (b?.model === AI_CHAT_MODEL) {
    const res = await callCandidateWithTimeout(apiKey, b as Record<string, unknown>);
    if (res) return res;
    console.warn(`[ai-gateway] primary model failed or timed out, falling back to ${AI_CHAT_MODEL}`);
  }
  return callGateway(apiKey, body);
}

export function gatewayErrorKind(status: number): "rate_limited" | "payment_required" | "other" {
  if (status === 429) return "rate_limited";
  if (status === 402) return "payment_required";
  return "other";
}
