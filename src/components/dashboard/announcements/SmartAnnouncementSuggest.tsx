import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { jevAssist } from "@/lib/jevAssist";

interface Result {
  importance: "normal" | "important" | "critical";
  importanceConfidence: number | null;
  project: { id: string; name: string; confidence: number | null } | null;
}
const LABEL = { normal: "Vanlig", important: "Viktig", critical: "Kritisk" };

export function SmartAnnouncementSuggest({
  title, body, onPin, onCritical, onProject,
}: {
  title: string;
  body: string;
  onPin: () => void;
  onCritical: () => void;
  onProject: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<Result | null>(null);
  const canRun = (title.trim() + body.trim()).length >= 8;

  const run = async () => {
    setLoading(true);
    const d = await jevAssist<Result>({ mode: "announcement", title, body });
    if (d) setR(d);
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Smart forslag
        </div>
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={!canRun || loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {r ? "Sjekk på nytt" : "Hvor viktig er meldingen?"}
        </Button>
      </div>
      {!r && <p className="text-xs text-muted-foreground">Systemet foreslår viktighet og prosjekt. Du bestemmer selv.</p>}
      {r && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={r.importance === "critical" ? "destructive" : "secondary"}>Viktighet: {LABEL[r.importance]}</Badge>
            {r.project && <Badge variant="secondary">Prosjekt: {r.project.name}</Badge>}
            {r.importanceConfidence !== null && r.importanceConfidence < 0.5 && (
              <Badge variant="outline">Bør vurderes manuelt</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {r.importance !== "normal" && (
              <Button type="button" size="sm" onClick={onPin}>Fest øverst</Button>
            )}
            {r.importance === "critical" && (
              <Button type="button" size="sm" variant="destructive" onClick={onCritical}>Merk som kritisk</Button>
            )}
            {r.project && (
              <Button type="button" size="sm" variant="outline" onClick={() => onProject(r.project!.id)}>
                Velg prosjektet
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
