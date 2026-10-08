import { getChecklistItemText } from "@/lib/checklistItemText";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";

const SEV: Record<string, string> = { low: "Lav", medium: "Middels", high: "Høy", critical: "Kritisk" };

interface Props {
  title: string;
  projectName?: string;
  projectId?: string;
  items: any[];
  onRegisterDeviation?: () => void;
}

export function Ks2ChecklistSmartCheck({ title, projectName, projectId, items }: Props) {
  const { profile } = useAuth();
  const { createAvvikAsync } = useKsModule2Avvik(projectId || null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ noul: number | null; severity: string | null } | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const [created, setCreated] = useState<Record<string, boolean>>({});

  const answered = items.filter((i) => (i.value !== null && i.value !== undefined && i.value !== "") || i.comment);

  const candidates = items
    .map((i, n) => ({
      key: String(i.id ?? n),
      label: getChecklistItemText(i, `Punkt ${n + 1}`),
      answer: i.value === false || i.value === "nei" ? "Nei" : i.value === true ? "Ja" : String(i.value ?? ""),
      comment: String(i.comment || ""),
      isNo: i.value === false || i.value === "nei" || i.value === "no",
    }))
    .filter((c) => c.isNo);

  const createDeviation = async (c: { key: string; label: string; answer: string; comment: string }) => {
    if (!projectId) return;
    setCreating(c.key);
    try {
      const sev = result?.severity && ["low", "medium", "high", "critical"].includes(result.severity) ? result.severity : "medium";
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await createAvvikAsync({
        project_id: projectId,
        title: c.label.slice(0, 200),
        description: `Fra sjekkliste «${title || "Egenkontroll"}». Svar: ${c.answer}${c.comment ? `. Kommentar: ${c.comment}` : ""}`,
        category: "kvalitet",
        severity: sev,
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
      setCreated((p) => ({ ...p, [c.key]: true }));
    } catch { /* toast vises av hook */ } finally {
      setCreating(null);
    }
  };

  const run = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const payload = answered.map((i) => ({
        label: getChecklistItemText(i),
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

  const t = (title || "").toLowerCase();
  const ansvarKind = /ansvarlig\s+søk/.test(t) ? "ansvar_soker"
    : /ansvarlig\s+prosjekter/.test(t) ? "ansvar_prosjekterende"
    : /ansvarlig\s+kontroller/.test(t) ? "ansvar_kontrollerende" : null;
  const [advice, setAdvice] = useState<{ ok: boolean; text: string }[] | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const runAdvice = async () => {
    setAdviceLoading(true); setError(""); setAdvice(null);
    try {
      const fields: Record<string, string> = { prosjekt: projectName || "" };
      items.slice(0, 29).forEach((i, n) => {
        const v = i.value === true ? "ja" : i.value === false ? "nei" : i.value === "na" ? "ikke aktuelt" : String(i.value ?? "ubesvart");
        fields[`p${n + 1}`] = `${getChecklistItemText(i)}: ${v || "ubesvart"}${i.comment ? ` – ${i.comment}` : ""}`;
      });
      const { data, error } = await supabase.functions.invoke("jev-assist", { body: { mode: "form_check", kind: ansvarKind, fields } });
      if (error) throw error;
      setAdvice(data?.findings || []);
    } catch {
      setError("Kunne ikke sjekke nå. Prøv igjen.");
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
      {ansvarKind && (
        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={runAdvice} disabled={adviceLoading || answered.length === 0} className="w-full sm:w-auto">
            {adviceLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Sjekk ansvarsoppgavene
          </Button>
          {advice?.map((f, i) => (
            <p key={i} className={`text-sm flex items-start gap-2 ${f.ok ? "text-muted-foreground" : ""}`}>
              {f.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />}
              {f.text}
            </p>
          ))}
          {advice && <p className="text-xs text-muted-foreground">Råd, ikke juridisk vurdering. Lagrer ingenting.</p>}
        </div>
      )}
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
            Disse punktene bør trolig bli avvik
            {result.severity && <Badge variant="destructive">{SEV[result.severity]}</Badge>}
          </p>
          {candidates.length === 0 && (
            <p className="text-xs text-muted-foreground">Ingen «Nei»-svar funnet – se over kommentarene dine.</p>
          )}
          {candidates.map((c) => (
            <div key={c.key} className="rounded-md border bg-background p-2 space-y-1">
              <p className="text-sm font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">
                Svar: {c.answer}{c.comment ? ` – ${c.comment}` : ""}
              </p>
              {projectId && (
                created[c.key] ? (
                  <p className="text-xs flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Avvik opprettet</p>
                ) : (
                  <Button size="sm" variant="destructive" disabled={creating === c.key} onClick={() => createDeviation(c)}>
                    {creating === c.key && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Lag avvik
                  </Button>
                )
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Avviket lagres i prosjektet. Du blir i sjekklisten og mister ingenting.</p>
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
