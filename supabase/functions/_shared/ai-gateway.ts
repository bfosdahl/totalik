// Shared Lovable AI Gateway call helper (chat/completions only).
// Thin wrapper: no body reading, no throwing, no retries, no logging.
// TEMPORARY exception: MODEL_TEST_KEYS (test company) may be routed to
// AI_CHAT_MODEL_CANDIDATE for a model migration test. Remove after the global switch.

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const AI_CHAT_MODEL = "google/gemini-2.5-flash";

// TEMPORARY – model migration test. Remove after the global switch.
export const AI_CHAT_MODEL_CANDIDATE = "google/gemini-3.8-flash";
// Testbedriftens id + testbrukernes profile-id (profiles.id) og auth user-id.
const MODEL_TEST_KEYS = new Set<string>([
  "efac813d-4038-4a81-8c4a-ffeca0094069", // company: TEST Grok AS (slett meg)
  "02f52ccc-d821-4c55-be0a-ff386917ce75", "4c5e047e-4df7-436a-8af2-a39c763fe1da", "37e6bfd4-36eb-4590-93c0-46cf41b12ec8",
  "4c9f2da2-458a-4c02-b8d5-0c0611cce5d5", "8b746c7a-9cbb-4330-ae4e-04955fb80aff", "bfb728e5-5ec8-4d71-ae1e-8621406ddd07", // users of that company
  "ced408a7-bd4a-4cae-bd5c-a5431c200383", "b4a65346-9c9e-46e1-be24-e46c6995c6e2", "c5b74377-3542-4b31-830b-8fe8b95f7b64", "6456d3da-07b3-4638-8399-6004b9a80331", "f60f612c-cf7a-47ea-94e7-cb5e5161d805", "6279d77c-47b5-4128-978b-697473d435d9", // auth user ids of the same test users (bfosdahl+testadmin, +test1..5)
]);

export function isModelTestKey(key?: string | null): boolean {
  return !!key && MODEL_TEST_KEYS.has(key);
}

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

// TEMPORARY – model migration test. Candidate-only timeout so a stalled candidate call falls back to AI_CHAT_MODEL.
const CANDIDATE_FIRST_CHUNK_TIMEOUT_MS = 45_000; // stream: headers + first body chunk
const CANDIDATE_TOTAL_TIMEOUT_MS = 90_000; // non-stream: full body

async function callCandidateWithTimeout(apiKey: string, body: Record<string, unknown>): Promise<Response | null> {
  const isStream = body.stream === true;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), isStream ? CANDIDATE_FIRST_CHUNK_TIMEOUT_MS : CANDIDATE_TOTAL_TIMEOUT_MS);
  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model: AI_CHAT_MODEL_CANDIDATE }),
      signal: ctrl.signal,
    });
    console.log(`[ai-gateway] TEMPORARY model test: ${AI_CHAT_MODEL_CANDIDATE} status=${res.status}`);
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
    console.warn(`[ai-gateway] TEMPORARY model test: ${AI_CHAT_MODEL_CANDIDATE} aborted/failed (${e instanceof Error ? e.name : "error"})`);
    return null;
  }
}

export async function callAiGateway(apiKey: string, body: unknown, overrideKey?: string | null): Promise<Response> {
  const b = body as { model?: string } | null;
  if (overrideKey && MODEL_TEST_KEYS.has(overrideKey) && b?.model === AI_CHAT_MODEL) {
    const res = await callCandidateWithTimeout(apiKey, b as Record<string, unknown>);
    if (res) return res;
    console.warn(`[ai-gateway] TEMPORARY model test failed or timed out, falling back to ${AI_CHAT_MODEL}`);
  }
  return callGateway(apiKey, body);
}

export function gatewayErrorKind(status: number): "rate_limited" | "payment_required" | "other" {
  if (status === 429) return "rate_limited";
  if (status === 402) return "payment_required";
  return "other";
}
