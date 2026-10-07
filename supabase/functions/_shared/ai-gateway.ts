// Shared Lovable AI Gateway call helper (chat/completions only).
// Thin wrapper: no body reading, no throwing, no retries, no logging.

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function callAiGateway(apiKey: string, body: unknown): Promise<Response> {
  return fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function gatewayErrorKind(status: number): "rate_limited" | "payment_required" | "other" {
  if (status === 429) return "rate_limited";
  if (status === 402) return "payment_required";
  return "other";
}
