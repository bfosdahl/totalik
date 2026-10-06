import { useState } from "react";
import { Sparkles, Loader2, Plus, FilePlus2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { jevAssist } from "@/lib/jevAssist";

interface Suggestion {
  text: string;
  source?: string;
  noul?: number;
}

/** Finner setninger i dagrapporten som trolig bør registreres som avvik – som ekte avvik i prosjektet. */
export function SmartDailyReportDeviations({
  texts, onAdd, projectId,
}: {
  texts: { arbeid: string; fremdrift: string; hms: string; merknader: string; avvik: string };
  onAdd: (text: string) => void;
  projectId?: string | null;
}) {
  const { profile } = useAuth();
  const { createAvvikAsync } = useKsModule2Avvik(projectId || null);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Suggestion[] | null>(null);
  const [created, setCreated] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState<string | null>(null);
  const canRun = (texts.arbeid + texts.fremdrift + texts.hms + texts.merknader).trim().length >= 12;

  const run = async () => {
    setLoading(true);
    const d = await jevAssist<{ suggestions: Suggestion[] }>({ mode: "daily_report", texts });
    if (d) setList(d.suggestions);
    setLoading(false);
  };

  const handleCreate = async (s: Suggestion) => {
    if (!projectId) return;
    setCreating(s.text);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await createAvvikAsync({
        project_id: projectId,
        title: s.text.slice(0, 200),
        description: `Fra dagsrapport (${today}).`,
        category: s.source === "hms" ? "hms" : "kvalitet",
        severity: (typeof s.noul === "number" && s.noul >= 0.85) ? "high" : "medium",
        status: "open",
        location: null,
        discovered_date: today,
        deadline: null,
        responsible_name: null,
        responsible_user_id: null,
        reported_by_name: profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : profile?.email || "Ukjent",
        root_cause: null,
        corrective_action: null,
        preventive_action: null,
        photo_paths: null,
      } as any);
      setCreated((p) => ({ ...p, [s.text]: true }));
    } catch { /* toast vises av hook */ } finally {
      setCreating(null);
    }
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
        <div key={s.text} className="rounded border border-border bg-background p-2 space-y-1">
          <span className="text-sm">{s.text}</span>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {projectId && (
              created[s.text] ? (
                <span className="text-xs flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Avvik opprettet</span>
              ) : (
                <Button type="button" size="sm" variant="destructive" disabled={creating === s.text} onClick={() => handleCreate(s)}>
                  {creating === s.text ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FilePlus2 className="h-3 w-3 mr-1" />}
                  Lag avvik
                </Button>
              )
            )}
            <Button type="button" size="sm" variant="secondary" onClick={() => { onAdd(s.text); setList((l) => (l || []).filter((x) => x.text !== s.text)); }}>
              <Plus className="h-4 w-4 mr-1" /> Sett inn i rapporten
            </Button>
          </div>
        </div>
      ))}
      {list && list.some((s) => created[s.text]) && (
        <p className="text-xs text-muted-foreground">Avviket lagres i prosjektet. Du blir i dagsrapporten og mister ingenting.</p>
      )}
    </div>
  );
}
