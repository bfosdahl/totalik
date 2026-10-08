// Shared Lovable AI Gateway call helper (chat/completions only).
// Thin wrapper: no body reading, no throwing, no retries, no logging.
// TEMPORARY exception: MODEL_TEST_KEYS (test company) may be routed to
// AI_CHAT_MODEL_CANDIDATE for a model migration test. Remove after the global switch.

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const AI_CHAT_MODEL = "google/gemini-2.5-flash";

// TEMPORARY – model migration test. Remove after the global switch.
export const AI_CHAT_MODEL_CANDIDATE = "google/gemini-3.8-flash";
const MODEL_TEST_KEYS = new Set<string>([
  "efac813d-4038-4a81-8c4a-ffeca0094069", // company: TEST Grok AS (slett meg)
  "02f52ccc-d821-4c55-be0a-ff386917ce75", "4c5e047e-4df7-436a-8af2-a39c763fe1da", "37e6bfd4-36eb-4590-93c0-46cf41b12ec8",
  "4c9f2da2-458a-4c02-b8d5-0c0611cce5d5", "8b746c7a-9cbb-4330-ae4e-04955fb80aff", "bfb728e5-5ec8-4d71-ae1e-8621406ddd07", // users of that company
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

export async function callAiGateway(apiKey: string, body: unknown, overrideKey?: string | null): Promise<Response> {
  const b = body as { model?: string } | null;
  if (overrideKey && MODEL_TEST_KEYS.has(overrideKey) && b?.model === AI_CHAT_MODEL) {
    const res = await callGateway(apiKey, { ...b, model: AI_CHAT_MODEL_CANDIDATE });
    console.log(`[ai-gateway] TEMPORARY model test: ${AI_CHAT_MODEL_CANDIDATE} status=${res.status}`);
    if (res.ok) return res;
    try {
      await res.body?.cancel();
    } catch (_) {
      // ignore
    }
    console.warn(`[ai-gateway] TEMPORARY model test failed (status=${res.status}), falling back to ${AI_CHAT_MODEL}`);
  }
  return callGateway(apiKey, body);
}

export function gatewayErrorKind(status: number): "rate_limited" | "payment_required" | "other" {
  if (status === 429) return "rate_limited";
  if (status === 402) return "payment_required";
  return "other";
}
