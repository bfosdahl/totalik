import { toast } from "sonner";
import { logClientError } from "@/utils/logClientError";

/**
 * Surfaces silent database write failures (RLS-blocks, wrong onConflict target,
 * constraint violations) instead of letting them disappear.
 *
 * Root cause of the "AI-oppsett lagret ingenting"-bug: upsert-kall ble awaitet
 * uten at { error } ble sjekket. Bruk denne på ALLE skriv i oppsettsflyter.
 */
export async function assertSaved<T extends { error: { message: string; code?: string } | null }>(
  label: string,
  result: T,
): Promise<T> {
  if (result.error) {
    const msg = `Kunne ikke lagre ${label}: ${result.error.message}`;
    console.error("[assertSaved]", label, result.error);
    try {
      logClientError(new Error(msg), { source: "assertSaved", label });
    } catch {
      /* logging must never break the flow */
    }
    toast.error(msg);
    throw new Error(msg);
  }
  return result;
}
