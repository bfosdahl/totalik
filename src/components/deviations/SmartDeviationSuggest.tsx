import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high" | "critical";
interface Suggestion {
  category: string;
  categoryConfidence: number | null;
  priority: Priority;
  priorityConfidence: number | null;
  notifyVerneombud: number | null;
  responsible: { id: string; name: string; confidence: number | null } | null;
}

const CAT: Record<string, string> = {
  safety: "HMS/sikkerhet", quality: "Kvalitet", environment: "Miljø", process: "Prosess",
  equipment: "Utstyr", personnel: "Personell", documentation: "Dokumentasjon", other: "Annet",
};
const PRI: Record<Priority, string> = { low: "Lav", medium: "Middels", high: "Høy", critical: "Kritisk" };
const unsure = (c: number | null) => c !== null && c < 0.5;

export function SmartDeviationSuggest({
  title, description, location, onApply,
}: {
  title: string;
  description: string;
  location: string;
  onApply: (s: { category?: string; priority?: Priority; responsibleId?: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [s, setS] = useState<Suggestion | null>(null);
  const canRun = (title.trim() + description.trim()).length >= 8;

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("jev-assist", {
        body: { mode: "deviation", title, description, location },
      });
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
        toast.error(msg || "Kunne ikke lage forslag nå");
        return;
      }
      setS(data as Suggestion);
    } finally {
      setLoading(false);
    }
  };

  const applyAll = () => {
    if (!s) return;
    onApply({
      category: s.category,
      // Kritisk settes aldri automatisk – må bekreftes separat
      priority: s.priority === "critical" ? "high" : s.priority,
      responsibleId: s.responsible?.id,
    });
    toast.success(s.priority === "critical" ? "Forslag brukt. Kritisk må bekreftes selv." : "Forslag brukt – sjekk før du lagrer");
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Smart avvik
        </div>
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={!canRun || loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {s ? "Foreslå på nytt" : "Foreslå kategori og prioritet"}
        </Button>
      </div>
      {!s && (
        <p className="text-xs text-muted-foreground">
          Skriv navn og beskrivelse, så foreslår systemet kategori, prioritet og ansvarlig. Du bestemmer selv.
        </p>
      )}
      {s && (
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Kategori: {CAT[s.category] || s.category}</Badge>
            <Badge variant={s.priority === "critical" || s.priority === "high" ? "destructive" : "secondary"}>
              Prioritet: {PRI[s.priority]}
            </Badge>
            {s.responsible && <Badge variant="secondary">Ansvarlig: {s.responsible.name}</Badge>}
          </div>
          {s.notifyVerneombud !== null && s.notifyVerneombud >= 0.6 && (
            <p className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Bør meldes til verneombud
            </p>
          )}
          {(unsure(s.categoryConfidence) || unsure(s.priorityConfidence)) && (
            <p className="text-xs text-muted-foreground">Bør vurderes manuelt – forslaget er usikkert.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyAll}>Bruk forslag</Button>
            {s.priority === "critical" && (
              <Button type="button" size="sm" variant="destructive" onClick={() => onApply({ priority: "critical" })}>
                Sett som kritisk
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
