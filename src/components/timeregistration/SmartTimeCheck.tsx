import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jevAssist } from "@/lib/jevAssist";

/** Sjekker innsendte timer før godkjenning: vage beskrivelser og mulige tastefeil. */
export function SmartTimeCheck({
  entryIds, onResult,
}: {
  entryIds: string[];
  onResult: (map: Record<string, string[]>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  if (!entryIds.length) return null;

  const run = async () => {
    setLoading(true);
    const d = await jevAssist<{ results: { id: string; warnings: string[] }[] }>({
      mode: "time_check", entryIds: entryIds.slice(0, 40),
    });
    if (d) {
      const map: Record<string, string[]> = {};
      d.results.forEach((r) => { if (r.warnings.length) map[r.id] = r.warnings; });
      onResult(map);
      const n = Object.keys(map).length;
      setSummary(n ? `${n} av ${d.results.length} timer bør sees på (merket gult)` : `Ingen funn i ${d.results.length} timer`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 mb-3">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">Smart timesjekk</span>
      <Button type="button" size="sm" variant="outline" onClick={run} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
        Sjekk {Math.min(entryIds.length, 40)} innsendte timer
      </Button>
      <span className="text-xs text-muted-foreground">
        {summary || "Finner vage beskrivelser og mulige tastefeil før du godkjenner."}
      </span>
    </div>
  );
}
