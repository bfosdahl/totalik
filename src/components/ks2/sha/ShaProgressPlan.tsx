import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useKsModule2Milestones } from "@/hooks/useKsModule2Milestones";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  projectId: string;
  riskNote: string | null;
  onSaveRiskNote: (value: string | null) => Promise<boolean | void>;
  isSaving?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planlagt",
  in_progress: "Pågår",
  completed: "Fullført",
  delayed: "Forsinket",
};

function fmt(date?: string | null) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("nb-NO");
  } catch {
    return "-";
  }
}

export function ShaProgressPlan({ projectId, riskNote, onSaveRiskNote, isSaving }: Props) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { milestones, isLoading, createMilestone, deleteMilestone } = useKsModule2Milestones(projectId);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState(riskNote || "");

  useEffect(() => {
    setNote(riskNote || "");
  }, [riskNote]);

  const handleAdd = () => {
    if (!title.trim() || !startDate || !profile?.company_id) return;
    createMilestone.mutate(
      {
        project_id: projectId,
        company_id: profile.company_id,
        title: title.trim(),
        description: null,
        start_date: startDate,
        end_date: endDate || startDate,
        status: "planned",
        progress: 0,
        responsible_name: null,
        responsible_id: null,
        color: "#3b82f6",
        sort_order: milestones.length,
        parent_id: null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setStartDate("");
          setEndDate("");
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Viser samme milepæler som Fremdriftsplan under Prosjektstyring — endringer her oppdateres
          begge steder.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/ks/project/${projectId}/fremdriftsplan`)}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Åpne fremdriftsplan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ingen milepæler ennå. Legg inn byggestart, viktige delmål, når de ulike entreprisene skal
          arbeide og ferdigstillelse/overtakelse.
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: m.color || "#3b82f6" }}
              />
              <div className="flex-1 min-w-[160px]">
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {fmt(m.start_date)} – {fmt(m.end_date)}
                </p>
              </div>
              <Badge variant="secondary">{STATUS_LABELS[m.status] || m.status}</Badge>
              <Badge variant="outline">{m.progress ?? 0}%</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="Slett milepæl"
                onClick={() => deleteMilestone.mutate(m.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4 items-end rounded-lg border p-3">
        <div className="sm:col-span-2">
          <Label className="text-sm">Ny milepæl</Label>
          <Input
            className="mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks. Byggestart, Tett bygg, Overtakelse"
          />
        </div>
        <div>
          <Label className="text-sm">Fra</Label>
          <Input className="mt-1" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-sm">Til</Label>
            <Input className="mt-1" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button
            className="mt-6"
            onClick={handleAdd}
            disabled={!title.trim() || !startDate || createMilestone.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">SHA-vurdering ved endret fremdrift</Label>
        <p className="text-sm text-muted-foreground">
          Vurder om tidspress, endret rekkefølge eller flere samtidige arbeidsoperasjoner skaper ny
          risiko, og hvilke tiltak som iverksettes.
        </p>
        <Textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="F.eks. Komprimert fremdrift i uke 34–36 gir flere samtidige operasjoner i samme sone. Tiltak: egen SJA og daglig koordineringsmøte."
        />
        {note !== (riskNote || "") && (
          <div className="flex gap-2">
            <Button size="sm" disabled={isSaving} onClick={() => onSaveRiskNote(note.trim() || null)}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lagre vurdering
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNote(riskNote || "")}>
              Avbryt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShaProgressPlan;
