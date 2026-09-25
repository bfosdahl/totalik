import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Kaller jev-assist. Viser feilmelding og returnerer null ved feil. */
export async function jevAssist<T = any>(body: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await supabase.functions.invoke("jev-assist", { body });
  if (error || data?.error) {
    let msg = data?.error;
    try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
    toast.error(msg || "Kunne ikke lage forslag nå");
    return null;
  }
  return data as T;
}
