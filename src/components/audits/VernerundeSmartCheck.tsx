import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, FilePlus2 } from "lucide-react";
import { jevAssist } from "@/lib/jevAssist";
import { useDeviations } from "@/hooks/useDeviations";
import type { VernerundeCheckpoint } from "@/hooks/useHmsVernerundeTemplates";

interface RowFinding {
  id: string;
  category: string;
  question: string;
  answer: string;
  comment: string;
}

interface Props {
  templateName: string;
  checkpoints: VernerundeCheckpoint[];
  checklist: Record<string, boolean>;
  comments: Record<string, string>;
  avvik: string;
  tiltak: string;
  ansvarlig: string;
  frist: string;
}

/** Smart vernerunde-sjekk: peker på hvilket sjekkpunkt som bør følges opp, og kan lage ekte avvik. */
export function VernerundeSmartCheck({ templateName, checkpoints, checklist, comments, avvik, tiltak, ansvarlig, frist }: Props) {
  const { createDeviation, isSaving } = useDeviations();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ ok: boolean; text: string }[] | null>(null);
  const [rows, setRows] = useState<RowFinding[] | null>(null);
  const [created, setCreated] = useState<Record<string, boolean>>({});

  const rowsWithComment = checkpoints.filter((cp) => (comments[cp.id] || "").trim());
  const unchecked = checkpoints.filter((cp) => !checklist[cp.id] && !(comments[cp.id] || "").trim());
  const candidates = [...rowsWithComment, ...unchecked].slice(0, 15);

  const canRun = candidates.length > 0 || avvik.trim().length > 0 || tiltak.trim().length > 0;

  const run = async () => {
    setLoading(true);
    const res = await jevAssist<{ summary: { ok: boolean; text: string }[]; rowFindings: RowFinding[] }>({
      mode: "vernerunde_check",
      rows: candidates.map((cp) => ({
        id: cp.id,
        category: cp.category,
        question: cp.checkpoint,
        answer: checklist[cp.id] ? "ja" : "nei",
        comment: comments[cp.id] || "",
      })),
      avvik,
      tiltak,
      ansvarlig,
      frist,
    });
    if (res) {
      setSummary(res.summary || []);
      setRows(res.rowFindings || []);
    }
    setLoading(false);
  };

  const handleCreate = async (r: RowFinding) => {
    const today = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const due = frist.trim() || fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14));
    const ok = await createDeviation({
      title: r.question.slice(0, 200),
      description: `Fra vernerunde «${templateName || "Vernerunde"}». Svar: ${r.answer === "ja" ? "Ja" : "Nei"}${r.comment ? `. Kommentar: ${r.comment}` : ""}`,
      category: "safety",
      priority: "medium",
      severity: "medium",
      assignee_name: ansvarlig || null,
      due_date: due,
      incident_date: fmt(today),
    });
    if (ok) setCreated((p) => ({ ...p, [r.id]: true }));
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={run} disabled={!canRun || loading} className="w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Sjekk avvik og tiltak
      </Button>
      {!canRun && <p className="text-xs text-muted-foreground">Fyll ut avvik eller tiltak først.</p>}
      {summary && summary.length > 0 && (
        <div className="space-y-1">
          {summary.map((f, i) => (
            <p key={i} className="text-sm flex items-start gap-2">
              {f.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />}
              {f.text}
            </p>
          ))}
        </div>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Disse sjekkpunktene bør trolig følges opp
          </p>
          {rows.map((r) => (
            <div key={r.id} className="rounded-md border bg-background p-2 space-y-1">
              <p className="text-sm font-medium">{r.question}</p>
              <p className="text-xs text-muted-foreground">
                {r.category ? `${r.category} – ` : ""}{r.answer === "ja" ? "Svar: Ja" : "Ikke huket av"}{r.comment ? ` – ${r.comment}` : ""}
              </p>
              {created[r.id] ? (
                <p className="text-xs flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Avvik opprettet</p>
              ) : (
                <Button type="button" size="sm" variant="destructive" disabled={isSaving} onClick={() => handleCreate(r)}>
                  <FilePlus2 className="h-3 w-3 mr-1" /> Lag avvik
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Avviket lagres under Avvik. Du blir i vernerunden og mister ingenting.</p>
        </div>
      )}
      {rows && rows.length === 0 && summary && (
        <p className="text-sm flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" /> Sjekkpunktene ser ut til å være i orden.
        </p>
      )}
      <p className="text-xs text-muted-foreground">Råd, ikke vurdering. Lagrer ingenting automatisk.</p>
    </div>
  );
}
