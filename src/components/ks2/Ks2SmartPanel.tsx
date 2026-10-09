import { getChecklistItemText } from "@/lib/checklistItemText";
import { safeFormatDate } from "@/utils/safeFormatDate";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, Calendar, ClipboardCheck, ChevronRight } from "lucide-react";
import { jevAssist } from "@/lib/jevAssist";
import { parseISO } from "date-fns";
import { calendarDaysFromToday } from "@/lib/dateUtils";

interface ChecklistLike {
  id: string;
  title: string;
  status: string;
  deadline_date?: string | null;
  checklist_items?: any[];
  responsible_user_name?: string | null;
}
interface AvvikLike {
  id: string;
  title: string;
  status: string;
  severity?: string | null;
}

type PriorityItem = { id: string; type: string; title: string; detail: string };
type TriageResult = { id: string; critical: number | null; assignee: { id: string; name: string } | null };
type ReviewResult = { id: string; noul: number | null; severity: string | null };

const SEV_LABEL: Record<string, string> = { low: "Lav", medium: "Middels", high: "Høy", critical: "Kritisk" };

/** Smart-panel på prosjekt-dashbordet: dagens prioriteringer, forfalt-triage og sjekk av fullførte kontroller. */
export function Ks2SmartPanel({
  projectId,
  projectName,
  checklists,
  avvik,
}: {
  projectId: string;
  projectName: string;
  checklists: ChecklistLike[];
  avvik: AvvikLike[];
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"prio" | "triage" | "review" | null>(null);
  const [priorities, setPriorities] = useState<{ item: PriorityItem; noul: number | null }[] | null>(null);
  const [triage, setTriage] = useState<{ item: ChecklistLike; critical: number | null; assignee: { id: string; name: string } | null }[] | null>(null);
  const [review, setReview] = useState<{ item: ChecklistLike; noul: number | null; severity: string | null }[] | null>(null);

  const [crewCount, setCrewCount] = useState<number | null>(null);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    supabase
      .from("ks_module2_project_crew")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("is_active", true)
      .then(({ count, error }) => {
        if (!cancelled && !error) setCrewCount(count ?? 0);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  const overdue = useMemo(
    () => checklists.filter((c) => c.status !== "completed" && c.deadline_date && -(calendarDaysFromToday(c.deadline_date) ?? 0) > 0),
    [checklists]
  );
  const upcoming = useMemo(
    () => checklists.filter((c) => {
      if (c.status === "completed" || !c.deadline_date) return false;
      const d = (calendarDaysFromToday(c.deadline_date) ?? 0);
      return d >= 0 && d <= 7;
    }),
    [checklists]
  );
  const openAvvik = useMemo(() => avvik.filter((a) => a.status === "open" || a.status === "in_progress"), [avvik]);
  const recentCompleted = useMemo(
    () => checklists.filter((c) => c.status === "completed" && (c.checklist_items || []).some((i: any) => i.value != null)).slice(0, 5),
    [checklists]
  );

  const runPriorities = async () => {
    const items: PriorityItem[] = [
      ...overdue.map((c) => ({ id: c.id, type: "forfalt kontroll", title: c.title, detail: `Forfalt for ${-(calendarDaysFromToday(c.deadline_date!) ?? 0)} dager siden` })),
      ...upcoming.map((c) => ({ id: c.id, type: "frist", title: c.title, detail: `Frist ${safeFormatDate(c.deadline_date, "dd.MM.yyyy")}` })),
      ...openAvvik.map((a) => ({ id: a.id, type: "åpent avvik", title: a.title, detail: `Alvorlighet: ${SEV_LABEL[a.severity || ""] || a.severity || "ukjent"}` })),
    ].slice(0, 25);
    if (!items.length) return;
    setLoading("prio");
    const d = await jevAssist<{ results: { id: string; noul: number | null }[] }>({ mode: "project_priorities", projectName, items });
    if (d) {
      const byId = new Map(items.map((i) => [i.id, i]));
      setPriorities(d.results.map((r) => ({ item: byId.get(r.id)!, noul: r.noul })).filter((x) => x.item));
    }
    setLoading(null);
  };

  const runTriage = async () => {
    if (!overdue.length) return;
    setLoading("triage");
    const d = await jevAssist<{ results: TriageResult[] }>({
      mode: "overdue_triage",
      projectId,
      projectName,
      items: overdue.slice(0, 15).map((c) => ({ id: c.id, title: c.title, daysOverdue: -(calendarDaysFromToday(c.deadline_date!) ?? 0) })),
    });
    if (d) {
      const byId = new Map(overdue.map((c) => [c.id, c]));
      setTriage(d.results.map((r) => ({ item: byId.get(r.id)!, critical: r.critical, assignee: r.assignee })).filter((x) => x.item));
    }
    setLoading(null);
  };

  const runReview = async () => {
    if (!recentCompleted.length) return;
    setLoading("review");
    const d = await jevAssist<{ results: ReviewResult[] }>({
      mode: "checklist_review",
      projectName,
      checklists: recentCompleted.map((c) => ({
        id: c.id,
        title: c.title,
        items: (c.checklist_items || []).slice(0, 30).map((i: any) => ({
          label: getChecklistItemText(i, "Punkt"),
          value: i.value == null ? "" : String(i.value),
          comment: String(i.comment || ""),
        })),
      })),
    });
    if (d) {
      const byId = new Map(recentCompleted.map((c) => [c.id, c]));
      setReview(d.results.map((r) => ({ item: byId.get(r.id)!, noul: r.noul, severity: r.severity })).filter((x) => x.item));
    }
    setLoading(null);
  };

  const goChecklist = (id: string) => navigate(`/ks/project/${projectId}/egenkontroller?checklistId=${encodeURIComponent(id)}`);
  const goCrew = () => navigate(`/ks/project/${projectId}/mannskap`);
  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  };
  const rowFocus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";
  const goAvvik = () => navigate(`/ks/project/${projectId}/avvik`);

  if (!overdue.length && !upcoming.length && !openAvvik.length && !recentCompleted.length) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart prosjekthjelp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={runPriorities} disabled={loading !== null || (!overdue.length && !upcoming.length && !openAvvik.length)}>
            {loading === "prio" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Hva bør gjøres i dag?
          </Button>
          <Button size="sm" variant="outline" onClick={runTriage} disabled={loading !== null || !overdue.length}>
            {loading === "triage" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
            Sjekk forfalte kontroller ({overdue.length})
          </Button>
          <Button size="sm" variant="outline" onClick={runReview} disabled={loading !== null || !recentCompleted.length}>
            {loading === "review" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ClipboardCheck className="h-4 w-4 mr-1" />}
            Sjekk fullførte kontroller
          </Button>
        </div>

        {priorities && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Viktigst først:</p>
            {priorities.filter((p) => (p.noul ?? 0) >= 0.5).length === 0 && (
              <p className="text-xs text-muted-foreground">Ingenting som haster spesielt i dag.</p>
            )}
            {priorities.filter((p) => (p.noul ?? 0) >= 0.5).slice(0, 6).map((p) => (
              <div
                key={p.item.id}
                role="button"
                tabIndex={0}
                onClick={() => (p.item.type === "åpent avvik" ? goAvvik() : goChecklist(p.item.id))}
                onKeyDown={onKey(() => (p.item.type === "åpent avvik" ? goAvvik() : goChecklist(p.item.id)))}
                className={`flex items-center gap-2 rounded-lg border border-border bg-background p-2 cursor-pointer hover:bg-muted ${rowFocus}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.item.title}</p>
                  <p className="text-xs text-muted-foreground">{p.item.detail}</p>
                </div>
                <Badge variant={p.item.type === "åpent avvik" ? "destructive" : "secondary"} className="shrink-0">{p.item.type}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}

        {triage && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Forfalte kontroller:</p>
            {triage.map((tr) => (
              <div
                key={tr.item.id}
                role="button"
                tabIndex={0}
                onClick={() => goChecklist(tr.item.id)}
                onKeyDown={onKey(() => goChecklist(tr.item.id))}
                className={`flex items-center gap-2 rounded-lg border border-border bg-background p-2 cursor-pointer hover:bg-muted ${rowFocus}`}
              >
                <div className="min-w-0 flex-1 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 max-w-full">
                  <p className="text-sm font-medium truncate">{tr.item.title}</p>
                  <p className="text-xs text-muted-foreground break-words">
                    {tr.item.responsible_user_name ? (
                      `Ansvarlig: ${tr.item.responsible_user_name}`
                    ) : tr.assignee ? (
                      `Forslag: ${tr.assignee.name} bør få oppgaven`
                    ) : crewCount === 0 ? (
                      <>
                        Ingen mannskap registrert på prosjektet{" "}
                        <button
                          type="button"
                          className="text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          onClick={(e) => { e.stopPropagation(); goCrew(); }}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          Legg til mannskap
                        </button>
                      </>
                    ) : (
                      "Velg ansvarlig selv"
                    )}
                  </p>
                </div>
                {tr.critical != null && tr.critical >= 0.5 ? (
                  <Badge variant="destructive" className="shrink-0">Kritisk – bør gjøres før arbeid fortsetter</Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">Kan tas senere</Badge>
                )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}

        {review && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Fullførte kontroller:</p>
            {review.filter((r) => (r.noul ?? 0) >= 0.5).length === 0 && (
              <p className="text-xs text-muted-foreground">Alle svarene ser fine ut – ingenting som bør bli avvik.</p>
            )}
            {review.filter((r) => (r.noul ?? 0) >= 0.5).map((r) => (
              <div key={r.item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-background p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Svarene bør trolig følges opp som avvik{r.severity ? ` – foreslått alvorlighet: ${SEV_LABEL[r.severity] || r.severity}` : ""}
                  </p>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={goAvvik}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Registrer avvik
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
