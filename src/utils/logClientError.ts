import { supabase } from "@/integrations/supabase/client";

interface ClientErrorPayload {
  error_message: string;
  error_stack?: string | null;
  component_stack?: string | null;
  url: string;
  user_agent: string;
  source: "error_boundary" | "unhandled_rejection" | "window_error";
  metadata?: Record<string, unknown> | null;
}

let lastLoggedAt = 0;
const THROTTLE_MS = 2000;

export async function logClientError(payload: ClientErrorPayload): Promise<void> {
  // Throttle to prevent flood
  const now = Date.now();
  if (now - lastLoggedAt < THROTTLE_MS) return;
  lastLoggedAt = now;

  try {
    await supabase.functions.invoke("log-client-error", {
      body: payload,
    });
  } catch {
    // Silent fail — we don't want error logging to cause more errors
  }
}
