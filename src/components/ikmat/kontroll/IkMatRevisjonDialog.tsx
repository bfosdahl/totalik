import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight, ClipboardCheck, FileSearch, Users, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * Dialog som dekker hele rutinen for "Gjennomgang av internkontrollen (intern revisjon)"
 * for IK MAT. Lagrer som en revisjon i `audits`-tabellen med area = 'IK_MAT' og
 * lagrer detaljert sjekkliste/notater i `description` som strukturert JSON.
 */

export interface IkMatRevisjonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  existingAuditId?: string | null;
}

interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
}

const FORBEREDELSER: ChecklistItem[] = [
  { key: "avvik_gransket", label: "Avviksregistreringer er gransket — alle lukket og ingen som gjentar seg" },
  { key: "forslag_gjennomgaatt", label: "Innkomne forslag fra medarbeidere om endringer i rutiner er gjennomgått" },
  { key: "regelverk_sjekket", label: "Sjekket om det har kommet regelverksendringer som krever oppdatering av rutiner" },
  { key: "tidsplan_satt", label: "Tidsplan for revisjonen er satt opp og tid avsatt" },
  { key: "omfang_valgt", label: "Plukket ut hvilke deler av internkontrollen som skal granskes" },
  { key: "varslet", label: "De som blir berørt er varslet om revisjonen" },
  { key: "spoersmaal_klar", label: "Spørsmål til de ansatte som skal bruke aktuelle rutiner er forberedt" },
];

const GJENNOMFOERING: ChecklistItem[] = [
  { key: "rutiner_datert", label: "Alle rutiner er riktig datert og signert — ingen utgåtte rutiner i omløp" },
  { key: "befaring", label: "Befaring på kjøkkenet er gjennomført og spørsmål stilt til de ansatte" },
  { key: "feil_som_avvik", label: "Eventuelle feil som ble oppdaget er behandlet som avvik" },
  { key: "rapportert_ledelsen", label: "Funn er rapportert til ledelsen" },
  { key: "oppfoelging_avtalt", label: "Det er avtalt hvordan eventuelle avvik skal følges opp" },
  { key: "forbedringer_foreslaatt", label: "Forbedringsforslag er notert" },
];

const STEPS = [
  { id: 0, title: "Generelt", icon: FileText },
  { id: 1, title: "Forberedelser", icon: FileSearch },
  { id: 2, title: "Gjennomføring", icon: ClipboardCheck },
  { id: 3, title: "Funn & oppfølging", icon: AlertTriangle },
  { id: 4, title: "Oppsummering", icon: Users },
];

interface RevisjonState {
  title: string;
  scheduled_date: string;
  responsible_id: string;
  participants: string;
  scope: string;
  checks: Record<string, boolean>;
  notes: Record<string, string>;
  findings: string;
  improvements: string;
  reported_to_management: boolean;
  conclusion: string;
}

const emptyState = (): RevisjonState => ({
  title: `Intern revisjon IK MAT ${new Date().getFullYear()}`,
  scheduled_date: new Date().toISOString().slice(0, 10),
  responsible_id: "",
  participants: "",
  scope: "Hele IK MAT-systemet (rutiner, sjekklister, temperaturlogg, renhold, sporbarhet, avvik)",
  checks: {},
  notes: {},
  findings: "",
  improvements: "",
  reported_to_management: false,
  conclusion: "",
});

export function IkMatRevisjonDialog({ open, onOpenChange, onSaved, existingAuditId }: IkMatRevisjonDialogProps) {
  const { profile } = useAuth();
  const { users } = useCompanyUsers();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<RevisjonState>(emptyState());

  useEffect(() => {
    if (!open) {
      setStep(0);
      setState(emptyState());
    }
  }, [open]);

  // Last inn eksisterende revisjon hvis vi redigerer
  useEffect(() => {
    if (!open || !existingAuditId) return;
    (async () => {
      const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("id", existingAuditId)
        .maybeSingle();
      if (error || !data) return;
      let parsed: any = {};
      try {
        parsed = data.description ? JSON.parse(data.description) : {};
      } catch {
        parsed = { findings: data.description };
      }
      setState({
        title: data.title || "",
        scheduled_date: data.scheduled_date || new Date().toISOString().slice(0, 10),
        responsible_id: data.responsible_id || "",
        participants: parsed.participants || "",
        scope: parsed.scope || "",
        checks: parsed.checks || {},
        notes: parsed.notes || {},
        findings: parsed.findings || "",
        improvements: parsed.improvements || "",
        reported_to_management: parsed.reported_to_management || false,
        conclusion: parsed.conclusion || "",
      });
    })();
  }, [open, existingAuditId]);

  const totalChecks = FORBEREDELSER.length + GJENNOMFOERING.length;
  const completedChecks = Object.values(state.checks).filter(Boolean).length;
  const allDone = completedChecks === totalChecks;

  const toggleCheck = (key: string) => {
    setState((s) => ({ ...s, checks: { ...s.checks, [key]: !s.checks[key] } }));
  };

  const handleSave = async (markCompleted: boolean) => {
    if (!profile?.company_id) {
      toast.error("Mangler bedrift");
      return;
    }
    if (!state.title || !state.scheduled_date) {
      toast.error("Tittel og dato er påkrevd");
      return;
    }
    setSaving(true);
    try {
      const selectedUser = users.find((u) => u.id === state.responsible_id);
      const responsibleName = selectedUser
        ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
        : null;

      const descriptionPayload = JSON.stringify({
        participants: state.participants,
        scope: state.scope,
        checks: state.checks,
        notes: state.notes,
        findings: state.findings,
        improvements: state.improvements,
        reported_to_management: state.reported_to_management,
        conclusion: state.conclusion,
      });

      const status = markCompleted ? "completed" : "in-progress";

      if (existingAuditId) {
        const { error } = await supabase
          .from("audits")
          .update({
            title: state.title,
            scheduled_date: state.scheduled_date,
            responsible_id: state.responsible_id || null,
            responsible_name: responsibleName,
            description: descriptionPayload,
            checklist_total: totalChecks,
            checklist_completed: completedChecks,
            status,
          })
          .eq("id", existingAuditId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("audits").insert({
          company_id: profile.company_id,
          department_id: profile.primary_department_id || null,
          audit_number: "",
          title: state.title,
          type: "internal",
          area: "IK_MAT",
          scheduled_date: state.scheduled_date,
          responsible_id: state.responsible_id || null,
          responsible_name: responsibleName,
          description: descriptionPayload,
          checklist_total: totalChecks,
          checklist_completed: completedChecks,
          status,
        });
        if (error) throw error;
      }

      toast.success(markCompleted ? "Revisjon fullført og lagret" : "Revisjon lagret");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Kunne ikke lagre revisjon");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Hensikten med intern revisjon er å avdekke om rutinene i IK MAT blir brukt slik de er ment, og at internkontrollen oppfyller kravene i regelverket. Daglig leder er ansvarlig for at revisjonen gjennomføres etter planen — minimum én gang per år (anbefalt januar).
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                value={state.title}
                onChange={(e) => setState({ ...state, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Dato *</Label>
                <Input
                  id="date"
                  type="date"
                  value={state.scheduled_date}
                  onChange={(e) => setState({ ...state, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible">Ansvarlig</Label>
                <Select
                  value={state.responsible_id}
                  onValueChange={(v) => setState({ ...state, responsible_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansvarlig" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Deltakere</Label>
              <Input
                id="participants"
                value={state.participants}
                onChange={(e) => setState({ ...state, participants: e.target.value })}
                placeholder="F.eks. Daglig leder, kjøkkensjef, hygienekontakt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Omfang av revisjonen</Label>
              <Textarea
                id="scope"
                value={state.scope}
                onChange={(e) => setState({ ...state, scope: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gå gjennom forberedelsene før selve revisjonen utføres. Huk av når hvert punkt er gjort.
            </p>
            {FORBEREDELSER.map((item) => (
              <ChecklistRow
                key={item.key}
                item={item}
                checked={!!state.checks[item.key]}
                note={state.notes[item.key] || ""}
                onToggle={() => toggleCheck(item.key)}
                onNoteChange={(v) =>
                  setState((s) => ({ ...s, notes: { ...s.notes, [item.key]: v } }))
                }
              />
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gjennomfør møte/befaring som planlagt, og kvitter ut hvert punkt.
            </p>
            {GJENNOMFOERING.map((item) => (
              <ChecklistRow
                key={item.key}
                item={item}
                checked={!!state.checks[item.key]}
                note={state.notes[item.key] || ""}
                onToggle={() => toggleCheck(item.key)}
                onNoteChange={(v) =>
                  setState((s) => ({ ...s, notes: { ...s.notes, [item.key]: v } }))
                }
              />
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="findings">Funn / observasjoner</Label>
              <Textarea
                id="findings"
                value={state.findings}
                onChange={(e) => setState({ ...state, findings: e.target.value })}
                rows={5}
                placeholder="Beskriv det som ble avdekket. Husk: feil skal også registreres som avvik i avvikssystemet."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvements">Forbedringsforslag</Label>
              <Textarea
                id="improvements"
                value={state.improvements}
                onChange={(e) => setState({ ...state, improvements: e.target.value })}
                rows={4}
                placeholder="Foreslåtte forbedringer i rutiner, opplæring eller utstyr."
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="reported"
                checked={state.reported_to_management}
                onCheckedChange={(v) => setState({ ...state, reported_to_management: !!v })}
              />
              <div className="space-y-1">
                <Label htmlFor="reported" className="cursor-pointer">
                  Funn er rapportert til ledelsen
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bekreft at ledelsen er informert og at oppfølgingen er avtalt.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tittel</span>
                  <span className="font-medium">{state.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dato</span>
                  <span className="font-medium">{state.scheduled_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sjekkpunkter fullført</span>
                  <Badge variant={allDone ? "default" : "secondary"}>
                    {completedChecks} / {totalChecks}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rapportert til ledelsen</span>
                  <Badge variant={state.reported_to_management ? "default" : "outline"}>
                    {state.reported_to_management ? "Ja" : "Nei"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="conclusion">Konklusjon</Label>
              <Textarea
                id="conclusion"
                value={state.conclusion}
                onChange={(e) => setState({ ...state, conclusion: e.target.value })}
                rows={4}
                placeholder="Samlet vurdering: fungerer internkontrollen som den skal? Hva er hovedkonklusjonen?"
              />
            </div>

            {!allDone && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ikke alle sjekkpunkter er huket av. Du kan fortsatt lagre som pågående revisjon og fullføre senere.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Intern revisjon — IK MAT</DialogTitle>
          <DialogDescription>
            Gjennomgang av internkontrollen i fire steg, basert på rutinen for intern revisjon.
          </DialogDescription>
        </DialogHeader>

        {/* Stegindikator */}
        <div className="flex items-center justify-between gap-1 py-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md p-2 text-xs transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : done
                    ? "text-success"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        <div className="py-2">{renderStep()}</div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Forrige
            </Button>
            {step < STEPS.length - 1 && (
              <Button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={saving}
              >
                Neste <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lagre utkast
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Fullfør revisjon
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChecklistRow({
  item,
  checked,
  note,
  onToggle,
  onNoteChange,
}: {
  item: ChecklistItem;
  checked: boolean;
  note: string;
  onToggle: () => void;
  onNoteChange: (v: string) => void;
}) {
  const [showNote, setShowNote] = useState(!!note);
  return (
    <div className={`rounded-lg border p-3 transition-colors ${checked ? "bg-success/5 border-success/30" : ""}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-snug">{item.label}</p>
          {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
          {!showNote ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setShowNote(true)}
            >
              + Legg til notat
            </button>
          ) : (
            <Textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Notat / observasjon"
              rows={2}
              className="mt-1 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
