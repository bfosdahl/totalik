import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jevAssist } from "@/lib/jevAssist";

/** Finner setninger i dagrapporten som trolig bør registreres som avvik. */
export function SmartDailyReportDeviations({
  texts, onAdd,
}: {
  texts: { arbeid: string; fremdrift: string; hms: string; merknader: string; avvik: string };
  onAdd: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<{ text: string }[] | null>(null);
  const canRun = (texts.arbeid + texts.fremdrift + texts.hms + texts.merknader).trim().length >= 12;

  const run = async () => {
    setLoading(true);
    const d = await jevAssist<{ suggestions: { text: string }[] }>({ mode: "daily_report", texts });
    if (d) setList(d.suggestions);
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Smart avvikssjekk
        </div>
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={!canRun || loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {list ? "Sjekk på nytt" : "Bør noe bli avvik?"}
        </Button>
      </div>
      {!list && <p className="text-xs text-muted-foreground">Systemet leser rapporten og foreslår hendelser som bør registreres som avvik.</p>}
      {list && list.length === 0 && <p className="text-xs text-muted-foreground">Fant ingenting som ser ut som et avvik.</p>}
      {list && list.map((s) => (
        <div key={s.text} className="flex items-start justify-between gap-2 rounded border border-border bg-background p-2">
          <span className="text-sm">{s.text}</span>
          <Button type="button" size="sm" variant="secondary" className="shrink-0"
            onClick={() => { onAdd(s.text); setList((l) => (l || []).filter((x) => x.text !== s.text)); }}>
            <Plus className="h-4 w-4 mr-1" /> Legg til avvik
          </Button>
        </div>
      ))}
    </div>
  );
}
