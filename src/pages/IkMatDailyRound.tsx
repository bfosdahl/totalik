import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Thermometer,
  ClipboardCheck,
  SprayCan,
  CheckCircle2,
  SkipForward,
  PartyPopper,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIkMatDailyRounds, type RoundStation, type RoundStationResult } from "@/hooks/useIkMatDailyRounds";
import { useIkMatTemperature } from "@/hooks/useIkMatTemperature";
import { useCustomChecklists } from "@/hooks/useCustomChecklists";
import { useCustomCleaningTasks } from "@/hooks/useCustomCleaningTasks";
import { useIkMatCleaningPlan } from "@/hooks/useIkMatCleaningPlan";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EQUIPMENT_TYPE_DEFAULTS } from "@/lib/temperatureGuidelines";

const TYPE_META = {
  temperature: { icon: Thermometer, label: "Temperatur", color: "text-blue-600" },
  checklist: { icon: ClipboardCheck, label: "Sjekkliste", color: "text-emerald-600" },
  cleaning: { icon: SprayCan, label: "Renhold", color: "text-purple-600" },
} as const;

export default function IkMatDailyRound() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { company, profile } = useAuth();
  const { rounds, logCompletion } = useIkMatDailyRounds();
  const { equipment, logTemperature } = useIkMatTemperature();
  const { checklists } = useCustomChecklists();
  const { tasks: cleaningTasks } = useCustomCleaningTasks();
  const { createResponse } = useIkMatCleaningPlan();

  const round = useMemo(() => rounds.find((r) => r.id === roundId), [rounds, roundId]);
  const stations: RoundStation[] = round?.stations || [];

  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState<Record<string, RoundStationResult>>({});
  const [tempInput, setTempInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});
  const [cleaningDone, setCleaningDone] = useState(false);
  const [startedAt] = useState(new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  // Reset per-step inputs when navigating
  useEffect(() => {
    setTempInput("");
    setNoteInput("");
    setCheckedPoints({});
    setCleaningDone(false);
  }, [stepIdx]);

  if (!company) return null;

  if (rounds.length > 0 && !round) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Runde ikke funnet</CardTitle>
            <CardDescription>
              Denne runden finnes ikke eller er slettet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/ik-mat/kontroll?tab=runder")}>
              Til Kontroll
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalSteps = stations.length;
  const currentStation = stations[stepIdx];

  const resolveLabel = (st: RoundStation): string => {
    if (st.label) return st.label;
    if (st.type === "temperature") {
      return equipment.find((e) => e.id === st.ref_id)?.name || "Utstyr";
    }
    if (st.type === "checklist") {
      return checklists?.find((c) => c.id === st.ref_id)?.checklist_name || "Sjekkliste";
    }
    return cleaningTasks?.find((t) => t.id === st.ref_id)?.area || "Renhold";
  };

  const resolveEquipment = (id: string) =>
    equipment.find((e) => e.id === id);
  const resolveChecklist = (id: string) =>
    checklists?.find((c) => c.id === id);
  const resolveCleaning = (id: string) =>
    cleaningTasks?.find((t) => t.id === id);

  const handleNext = async (action: "done" | "skipped") => {
    if (!currentStation) return;
    const label = resolveLabel(currentStation);

    // For temperature: persist a temperature log immediately
    if (action === "done" && currentStation.type === "temperature") {
      const value = parseFloat(tempInput.replace(",", "."));
      if (isNaN(value)) {
        toast.error("Skriv inn en gyldig temperatur");
        return;
      }
      try {
        await logTemperature.mutateAsync({
          equipment_id: currentStation.ref_id,
          temperature: value,
          notes: noteInput || undefined,
        });
      } catch {
        return;
      }
      setResults((prev) => ({
        ...prev,
        [`${stepIdx}`]: {
          type: "temperature",
          ref_id: currentStation.ref_id,
          label,
          status: "done",
          value,
          notes: noteInput || null,
        },
      }));
    } else if (action === "done" && currentStation.type === "checklist") {
      // Persist checklist response
      const checklist = resolveChecklist(currentStation.ref_id);
      if (checklist) {
        const responses = (checklist.checkpoints || []).map((cp, i) => ({
          checkpoint: cp,
          checked: !!checkedPoints[i],
        }));
        try {
          await supabase.from("ik_mat_checklist_responses" as any).insert({
            company_id: company.id,
            checklist_id: currentStation.ref_id,
            checklist_name: checklist.checklist_name,
            checklist_type: checklist.checklist_type,
            completed_by_id: profile?.id || null,
            completed_by_name:
              `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
              profile?.email ||
              "Ukjent",
            responses: responses as any,
            notes: noteInput || null,
            status: "completed",
            completed_at: new Date().toISOString(),
          });
        } catch (e: any) {
          console.error(e);
        }
      }
      setResults((prev) => ({
        ...prev,
        [`${stepIdx}`]: {
          type: "checklist",
          ref_id: currentStation.ref_id,
          label,
          status: "done",
          notes: noteInput || null,
        },
      }));
    } else if (action === "done" && currentStation.type === "cleaning") {
      const task = resolveCleaning(currentStation.ref_id);
      if (task) {
        try {
          await createResponse.mutateAsync({
            cleaning_records: [
              {
                area: task.area,
                completed: cleaningDone,
                notes: noteInput || undefined,
                completedAt: new Date().toISOString(),
              },
            ],
            status: "completed",
            frequency_type: task.frequency,
            notes: noteInput || undefined,
          });
        } catch {
          /* toasted in hook */
        }
      }
      setResults((prev) => ({
        ...prev,
        [`${stepIdx}`]: {
          type: "cleaning",
          ref_id: currentStation.ref_id,
          label,
          status: "done",
          notes: noteInput || null,
        },
      }));
    } else {
      // skipped
      setResults((prev) => ({
        ...prev,
        [`${stepIdx}`]: {
          type: currentStation.type,
          ref_id: currentStation.ref_id,
          label,
          status: "skipped",
          notes: noteInput || null,
        },
      }));
    }

    if (stepIdx < totalSteps - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      // finalize
      await finalize({
        ...results,
        [`${stepIdx}`]: {
          type: currentStation.type,
          ref_id: currentStation.ref_id,
          label,
          status: action,
          notes: noteInput || null,
        },
      });
    }
  };

  const finalize = async (allResults: Record<string, RoundStationResult>) => {
    setSubmitting(true);
    const arr = stations.map((_, i) => allResults[`${i}`]).filter(Boolean);
    const anySkipped = arr.some((r) => r.status === "skipped");
    try {
      await logCompletion.mutateAsync({
        round_id: round.id,
        station_results: arr,
        started_at: startedAt,
        status: anySkipped ? "partial" : "completed",
      });
      setFinished(true);
    } catch (e: any) {
      toast.error("Kunne ikke lagre runde: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (totalSteps === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Ingen stasjoner i denne runden</CardTitle>
            <CardDescription>
              Legg til stasjoner i runden for å bruke wizarden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/ik-mat/kontroll?tab=runder")}>
              Til Kontroll
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Runde fullført!</CardTitle>
            <CardDescription>
              {round.name} – {Object.values(results).filter((r) => r.status === "done").length} av {totalSteps} stasjoner gjennomført.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate("/ik-mat/kontroll?tab=runder")}>
              Til oversikten
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStepIdx(0);
                setResults({});
                setFinished(false);
              }}
            >
              Start ny runde
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Meta = TYPE_META[currentStation.type];
  const Icon = Meta.icon;
  const progress = ((stepIdx + 1) / totalSteps) * 100;
  const equip = currentStation.type === "temperature" ? resolveEquipment(currentStation.ref_id) : null;
  const checklist = currentStation.type === "checklist" ? resolveChecklist(currentStation.ref_id) : null;
  const cleaning = currentStation.type === "cleaning" ? resolveCleaning(currentStation.ref_id) : null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{round.name}</span>
            <span>
              Stasjon {stepIdx + 1} av {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg bg-muted flex items-center justify-center ${Meta.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="mb-1">{Meta.label}</Badge>
                <CardTitle className="text-xl truncate">{resolveLabel(currentStation)}</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentStation.type === "temperature" && equip && (
              <>
                {(equip.location || equip.equipment_type) && (
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {equip.location && <span>📍 {equip.location}</span>}
                    <span>
                      {EQUIPMENT_TYPE_DEFAULTS[equip.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || equip.equipment_type}
                    </span>
                  </div>
                )}
                {(equip.min_temp !== null || equip.max_temp !== null) && (
                  <div className="text-sm bg-muted rounded-md p-3">
                    <span className="font-medium">Krav: </span>
                    {equip.min_temp !== null && <>min {equip.min_temp}°C</>}
                    {equip.min_temp !== null && equip.max_temp !== null && " / "}
                    {equip.max_temp !== null && <>maks {equip.max_temp}°C</>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="temp">Temperatur (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    autoFocus
                    placeholder="f.eks. 4"
                    value={tempInput}
                    onChange={(e) => setTempInput(e.target.value)}
                    className="text-2xl h-14 text-center"
                  />
                </div>
              </>
            )}

            {currentStation.type === "checklist" && checklist && (
              <div className="space-y-2">
                {checklist.description && (
                  <p className="text-sm text-muted-foreground">{checklist.description}</p>
                )}
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(checklist.checkpoints || []).map((cp, i) => (
                    <label
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={!!checkedPoints[i]}
                        onCheckedChange={(v) =>
                          setCheckedPoints((prev) => ({ ...prev, [i]: !!v }))
                        }
                        className="mt-0.5"
                      />
                      <span className="text-sm">{cp}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentStation.type === "cleaning" && cleaning && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><span className="font-medium">Frekvens:</span> {cleaning.frequency}</div>
                  <div><span className="font-medium">Metode:</span> {cleaning.method}</div>
                  <div><span className="font-medium">Ansvarlig:</span> {cleaning.responsible}</div>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted cursor-pointer">
                  <Checkbox
                    checked={cleaningDone}
                    onCheckedChange={(v) => setCleaningDone(!!v)}
                  />
                  <span className="text-sm font-medium">Renhold utført</span>
                </label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">Notat (valgfritt)</Label>
              <Textarea
                id="note"
                placeholder="Kommentar..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nav */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
            disabled={stepIdx === 0 || submitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Tilbake
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNext("skipped")}
            disabled={submitting}
          >
            <SkipForward className="h-4 w-4 mr-1" /> Hopp over
          </Button>
          <Button onClick={() => handleNext("done")} disabled={submitting}>
            {stepIdx === totalSteps - 1 ? (
              <>
                Fullfør <CheckCircle2 className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Neste <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
