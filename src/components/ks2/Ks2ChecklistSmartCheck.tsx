import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SEV: Record<string, string> = { low: "Lav", medium: "Middels", high: "Høy", critical: "Kritisk" };

interface Props {
  title: string;
  projectName?: string;
  items: any[];
  onRegisterDeviation?: () => void;
}

export function Ks2ChecklistSmartCheck({ title, projectName, items, onRegisterDeviation }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ noul: number | null; severity: string | null } | null>(null);
  const [error, setError] = useState("");

  const answered = items.filter((i) => (i.value !== null && i.value !== undefined && i.value !== "") || i.comment);

  const run = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const payload = answered.map((i) => ({
        label: String(i.label || i.title || i.name || ""),
        value: i.value === true ? "ja" : i.value === false ? "nei" : i.value === "na" ? "ikke aktuelt" : String(i.value ?? ""),
        comment: String(i.comment || ""),
      }));
      const { data, error } = await supabase.functions.invoke("jev-assist", {
        body: { mode: "checklist_review", projectName, checklists: [{ id: "current", title: title || "Egenkontroll", items: payload }] },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (!r) throw new Error("Ingen vurdering");
      setResult({ noul: r.noul, severity: r.severity });
    } catch {
      setError("Kunne ikke sjekke nå. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const flagged = result && typeof result.noul === "number" && result.noul >= 0.5;

  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
      <Button variant="outline" size="sm" onClick={run} disabled={loading || answered.length === 0} className="w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Bør noe bli avvik?
      </Button>
      {answered.length === 0 && <p className="text-xs text-muted-foreground">Svar på noen punkter først.</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && flagged && (
        <div className="space-y-2">
          <p className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Noen svar bør trolig følges opp som avvik
            {result.severity && <Badge variant="destructive">{SEV[result.severity]}</Badge>}
          </p>
          {onRegisterDeviation && (
            <Button size="sm" variant="destructive" onClick={onRegisterDeviation}>Registrer avvik</Button>
          )}
        </div>
      )}
      {result && !flagged && (
        <p className="text-sm flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" /> Svarene ser ut til å være i orden.
        </p>
      )}
    </div>
  );
}
