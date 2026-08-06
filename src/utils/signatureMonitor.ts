import { supabase } from "@/integrations/supabase/client";

/**
 * Sentral logging av alle signeringer i systemet.
 * Brukes av overvåkningen (Admin > Overvåkning) og av
 * bakgrunnsjobben `check-signature-health` som varsler på e-post
 * dersom signeringer feiler eller dokumenter blir liggende usignert.
 */
export type SignatureEntityType =
  | "employment_contract"
  | "hms_sja"
  | "ks_module2_sja"
  | "ks_module2_checklist"
  | "ks_module2_vernerunde"
  | "verneombud_agreement"
  | "verneombud_exemption"
  | "ik_alkohol_training"
  | "hms_self_declaration"
  | "forsvarlighetsvurdering"
  | "other";

interface LogArgs {
  entityType: SignatureEntityType;
  entityId?: string | null;
  signerRole?: string | null;
  status: "success" | "error";
  errorMessage?: string | null;
  context?: Record<string, unknown>;
}

export async function logSignatureEvent({
  entityType,
  entityId,
  signerRole,
  status,
  errorMessage,
  context,
}: LogArgs): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return; // RLS krever egen bruker-id

    let companyId: string | null = null;
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();
    companyId = (prof as { company_id?: string } | null)?.company_id ?? null;

    await supabase.from("signature_events").insert({
      user_id: userId,
      company_id: companyId,
      entity_type: entityType,
      entity_id: entityId ?? null,
      signer_role: signerRole ?? null,
      status,
      error_message: errorMessage ? String(errorMessage).slice(0, 1000) : null,
      context: (context ?? {}) as never,
    } as never);
  } catch (e) {
    // Logging skal aldri velte selve signeringen
    console.warn("[signatureMonitor] kunne ikke logge signaturhendelse", e);
  }
}

/**
 * Kjører en signeringsoperasjon og logger resultatet (ok/feil).
 * Kaster videre slik at eksisterende feilhåndtering fungerer som før.
 */
export async function trackSignature<T>(
  meta: Omit<LogArgs, "status" | "errorMessage">,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn();
    void logSignatureEvent({ ...meta, status: "success" });
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message || String(error);
    void logSignatureEvent({ ...meta, status: "error", errorMessage: message });
    throw error;
  }
}
