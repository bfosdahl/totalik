import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jevAssist } from "@/lib/jevAssist";

export type SjaHazard = {
  id: string;
  risk: string;
  consequence: string;
  probability: string;
  measures: string[];
};

/** Foreslår relevante farer og tiltak for SJA ut fra arbeidsbeskrivelsen. */
export function SmartSjaSuggest({
  workDescription, existingRisks, onAdd, disabled,
}: {
  workDescription: string;
  existingRisks: string[];
  onAdd: (hazard: SjaHazard) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<SjaHazard[] | null>(null);
  const canRun = workDescription.trim().length >= 10 && !disabled;

  const run = async () => {
    setLoading(true);
    const d = await jevAssist<{ suggestions: SjaHazard[] }>({
      mode: "sja", workDescription, existingRisks,
    });
    if (d) setList(d.suggestions);
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Smart faresjekk
        </div>
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={!canRun || loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {list ? "Sjekk på nytt" : "Foreslå farer og tiltak"}
        </Button>
      </div>
      {!list && <p className="text-xs text-muted-foreground">Systemet leser arbeidsbeskrivelsen og foreslår farer som bør være med, med typiske tiltak.</p>}
      {list && list.length === 0 && <p className="text-xs text-muted-foreground">Fant ingen flere åpenbare farer – legg til manuelt om du ser noe.</p>}
      {list && list.map((h) => (
        <div key={h.id} className="flex items-start justify-between gap-2 rounded border border-border bg-background p-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">{h.risk}</p>
            <p className="text-xs text-muted-foreground">{h.probability} · {h.consequence} · {h.measures.length} tiltak</p>
          </div>
          <Button type="button" size="sm" variant="secondary" className="shrink-0"
            onClick={() => { onAdd(h); setList((l) => (l || []).filter((x) => x.id !== h.id)); }}>
            <Plus className="h-4 w-4 mr-1" /> Legg til
          </Button>
        </div>
      ))}
    </div>
  );
}
