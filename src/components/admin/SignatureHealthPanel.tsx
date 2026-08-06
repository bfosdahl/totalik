import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PenLine, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SignatureEvent {
  id: string;
  entity_type: string;
  entity_id: string | null;
  signer_role: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  employment_contract: "Arbeidskontrakt",
  hms_sja: "SJA (HMS)",
  ks_module2_sja: "SJA (KS Bygg)",
  ks_module2_checklist: "Sjekkliste",
  ks_module2_vernerunde: "Vernerunde",
  verneombud_agreement: "Verneombudsavtale",
  verneombud_exemption: "Verneombud-fritak",
  ik_alkohol_training: "Opplæring IK Alkohol",
  hms_self_declaration: "Egenerklæring HMS",
  forsvarlighetsvurdering: "Forsvarlighetsvurdering",
  other: "Annet",
};

export function SignatureHealthPanel() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["signature-events"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("signature_events")
        .select("id, entity_type, entity_id, signer_role, status, error_message, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as SignatureEvent[];
    },
    refetchInterval: 60_000,
  });

  const failures = events.filter((e) => e.status === "error");
  const successes = events.length - failures.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold">Signaturer (siste 7 dager)</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Vellykkede</p>
              <p className="text-xl font-semibold text-success">{successes}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Feilede</p>
              <p className="text-xl font-semibold text-destructive">{failures.length}</p>
            </div>
          </div>

          {failures.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Ingen signeringsfeil registrert
            </div>
          ) : (
            <div className="space-y-2">
              {failures.slice(0, 15).map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-lg border border-border"
                >
                  <div className="min-w-0 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {typeLabels[f.entity_type] ?? f.entity_type}
                        {f.signer_role ? ` · ${f.signer_role}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        {f.error_message ?? "Ukjent feil"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(f.created_at).toLocaleString("nb-NO")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
