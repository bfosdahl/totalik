import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type YesNoNa = "yes" | "no" | "na" | "";

interface ChecklistRow {
  id: string;
  label: string;
}

interface ChecklistAnswers {
  [key: string]: {
    answer: YesNoNa;
    comment: string;
  };
}

interface ActionRow {
  id: string;
  action: string;
  responsible: string;
  deadline: string;
}

interface FormData {
  companyName: string;
  revisionDate: string;
  revisionYear: string;
  participants: string;
  auditor: string;
  goalsSection: ChecklistAnswers;
  organizationSection: ChecklistAnswers;
  riskSection: ChecklistAnswers;
  routinesSection: ChecklistAnswers;
  trainingSection: ChecklistAnswers;
  deviationsSection: ChecklistAnswers;
  inspectionsSection: ChecklistAnswers;
  workEnvSection: ChecklistAnswers;
  strengths: string;
  improvements: string;
  actions: ActionRow[];
  auditorSignature: string;
  managerSignature: string;
}

const goalsItems: ChecklistRow[] = [
  { id: "goals_known", label: "Er mål for HMS-arbeidet definert og kjent for alle ansatte?" },
  { id: "action_plan", label: "Er det laget handlingsplan og er denne fulgt opp?" },
  { id: "measures_effective", label: "Er det gjennomført evaluering av om tiltakene har hatt ønsket effekt?" }
];

const organizationItems: ChecklistRow[] = [
  { id: "roles_defined", label: "Er roller og ansvar tydelig definert og dokumentert?" },
  { id: "safety_rep", label: "Er verneombud/vernetjeneste valgt dersom påkrevd?" },
  { id: "communication", label: "Fungerer intern kommunikasjon og informasjon om HMS godt nok?" }
];

const riskItems: ChecklistRow[] = [
  { id: "risk_all_tasks", label: "Er det gjennomført risikovurderinger for alle arbeidsoppgaver?" },
  { id: "risk_updated", label: "Er risikovurderinger oppdatert etter endringer i drift?" },
  { id: "risk_followup", label: "Blir tiltak fra risikovurderinger fulgt opp og dokumentert?" }
];

const routinesItems: ChecklistRow[] = [
  { id: "written_routines", label: "Finnes nødvendige skriftlige rutiner?" },
  { id: "routines_known", label: "Er rutinene kjent hos de ansatte og praktisert i arbeidshverdagen?" },
  { id: "routines_updated", label: "Er rutiner oppdatert i forhold til krav og drift?" }
];

const trainingItems: ChecklistRow[] = [
  { id: "training_done", label: "Er nødvendig opplæring gjennomført og dokumentert?" },
  { id: "training_info", label: "Har ansatte fått informasjon om relevante HMS-rutiner?" },
  { id: "needs_more_training", label: "Er det behov for ytterligere opplæring?" }
];

const deviationsItems: ChecklistRow[] = [
  { id: "deviation_system_works", label: "Fungerer avvikssystemet etter hensikten?" },
  { id: "deviations_followed", label: "Blir avvik analysert og fulgt opp med tiltak?" },
  { id: "learning_measures", label: "Er det gjort læringstiltak for å unngå gjentakelser?" }
];

const inspectionsItems: ChecklistRow[] = [
  { id: "inspections_done", label: "Er det gjennomført vernerunder i perioden?" },
  { id: "inspections_followup", label: "Er funn fulgt opp i henhold til frister?" }
];

const workEnvItems: ChecklistRow[] = [
  { id: "sick_leave_followup", label: "Er sykefravær fulgt opp og analysert?" },
  { id: "hse_meetings", label: "Er det gjennomført verne-/AMU-møter der det er påkrevd?" },
  { id: "good_work_env", label: "Opplever ansatte et trygt og godt arbeidsmiljø?" }
];

const initializeChecklistAnswers = (items: ChecklistRow[]): ChecklistAnswers => {
  const answers: ChecklistAnswers = {};
  items.forEach(item => {
    answers[item.id] = { answer: "", comment: "" };
  });
  return answers;
};

const AnnualHmsRevisionForm: React.FC = () => {
  const { company } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    companyName: company?.name || "",
    revisionDate: new Date().toISOString().split('T')[0],
    revisionYear: new Date().getFullYear().toString(),
    participants: "",
    auditor: "",
    goalsSection: initializeChecklistAnswers(goalsItems),
    organizationSection: initializeChecklistAnswers(organizationItems),
    riskSection: initializeChecklistAnswers(riskItems),
    routinesSection: initializeChecklistAnswers(routinesItems),
    trainingSection: initializeChecklistAnswers(trainingItems),
    deviationsSection: initializeChecklistAnswers(deviationsItems),
    inspectionsSection: initializeChecklistAnswers(inspectionsItems),
    workEnvSection: initializeChecklistAnswers(workEnvItems),
    strengths: "",
    improvements: "",
    actions: [{ id: "1", action: "", responsible: "", deadline: "" }],
    auditorSignature: "",
    managerSignature: ""
  });

  const updateChecklistAnswer = (
    section: keyof Pick<FormData, 'goalsSection' | 'organizationSection' | 'riskSection' | 'routinesSection' | 'trainingSection' | 'deviationsSection' | 'inspectionsSection' | 'workEnvSection'>,
    itemId: string,
    field: 'answer' | 'comment',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [itemId]: {
          ...prev[section][itemId],
          [field]: value
        }
      }
    }));
  };

  const addActionRow = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { id: Date.now().toString(), action: "", responsible: "", deadline: "" }]
    }));
  };

  const removeActionRow = (id: string) => {
    if (formData.actions.length > 1) {
      setFormData(prev => ({
        ...prev,
        actions: prev.actions.filter(a => a.id !== id)
      }));
    }
  };

  const updateAction = (id: string, field: keyof Omit<ActionRow, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    toast.success("Årlig HMS-revisjon lagret");
  };

  const renderChecklistSection = (
    sectionKey: keyof Pick<FormData, 'goalsSection' | 'organizationSection' | 'riskSection' | 'routinesSection' | 'trainingSection' | 'deviationsSection' | 'inspectionsSection' | 'workEnvSection'>,
    title: string,
    items: ChecklistRow[]
  ) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground">Kontrollpunkt</th>
                <th className="text-center py-2 px-1 sm:px-2 text-sm font-medium text-muted-foreground w-14">Ja</th>
                <th className="text-center py-2 px-1 sm:px-2 text-sm font-medium text-muted-foreground w-14">Nei</th>
                <th className="text-center py-2 px-1 sm:px-2 text-sm font-medium text-muted-foreground w-14">N/A</th>
                <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground w-48">Kommentar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 px-2 sm:px-3 text-sm">{item.label}</td>
                  <td className="text-center py-3 px-1 sm:px-2">
                    <input
                      type="radio"
                      name={`${sectionKey}-${item.id}`}
                      checked={formData[sectionKey][item.id]?.answer === "yes"}
                      onChange={() => updateChecklistAnswer(sectionKey, item.id, 'answer', 'yes')}
                      className="w-4 h-4 text-primary border-border focus:ring-primary"
                    />
                  </td>
                  <td className="text-center py-3 px-1 sm:px-2">
                    <input
                      type="radio"
                      name={`${sectionKey}-${item.id}`}
                      checked={formData[sectionKey][item.id]?.answer === "no"}
                      onChange={() => updateChecklistAnswer(sectionKey, item.id, 'answer', 'no')}
                      className="w-4 h-4 text-primary border-border focus:ring-primary"
                    />
                  </td>
                  <td className="text-center py-3 px-1 sm:px-2">
                    <input
                      type="radio"
                      name={`${sectionKey}-${item.id}`}
                      checked={formData[sectionKey][item.id]?.answer === "na"}
                      onChange={() => updateChecklistAnswer(sectionKey, item.id, 'answer', 'na')}
                      className="w-4 h-4 text-primary border-border focus:ring-primary"
                    />
                  </td>
                  <td className="py-3 px-2 sm:px-3">
                    <Input
                      value={formData[sectionKey][item.id]?.comment || ""}
                      onChange={(e) => updateChecklistAnswer(sectionKey, item.id, 'comment', e.target.value)}
                      placeholder="Kommentar..."
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Grunninformasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Virksomhet</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revisionDate">Dato for revisjon</Label>
            <Input
              id="revisionDate"
              type="date"
              value={formData.revisionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, revisionDate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revisionYear">Revisjonsperiode (år)</Label>
            <Input
              id="revisionYear"
              value={formData.revisionYear}
              onChange={(e) => setFormData(prev => ({ ...prev, revisionYear: e.target.value }))}
              placeholder="2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditor">Revisor (navn + rolle)</Label>
            <Input
              id="auditor"
              value={formData.auditor}
              onChange={(e) => setFormData(prev => ({ ...prev, auditor: e.target.value }))}
              placeholder="f.eks. Ola Nordmann, daglig leder"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="participants">Deltakere i revisjon</Label>
            <Textarea
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
              placeholder="Navn, roller..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist sections */}
      {renderChecklistSection("goalsSection", "1. Mål og planer for HMS-arbeidet", goalsItems)}
      {renderChecklistSection("organizationSection", "2. Organisering og ansvar", organizationItems)}
      {renderChecklistSection("riskSection", "3. Risikovurdering", riskItems)}
      {renderChecklistSection("routinesSection", "4. Rutiner og prosedyrer", routinesItems)}
      {renderChecklistSection("trainingSection", "5. Opplæring og kompetanse", trainingItems)}
      {renderChecklistSection("deviationsSection", "6. Avviksbehandling og hendelser", deviationsItems)}
      {renderChecklistSection("inspectionsSection", "7. Vernerunder / inspeksjoner", inspectionsItems)}
      {renderChecklistSection("workEnvSection", "8. Arbeidsmiljø og trivsel", workEnvItems)}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Oppsummering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strengths">Styrker i HMS-arbeidet</Label>
            <Textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="improvements">Forbedringsområder</Label>
            <Textarea
              id="improvements"
              value={formData.improvements}
              onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nye tiltak og ansvarsfordeling</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addActionRow} className="gap-1">
            <Plus className="w-4 h-4" />
            Legg til
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground">Tiltak</th>
                  <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground w-36">Ansvarlig</th>
                  <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground w-36">Frist</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {formData.actions.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-2 sm:px-3">
                      <Input
                        value={row.action}
                        onChange={(e) => updateAction(row.id, 'action', e.target.value)}
                        placeholder="Beskriv tiltak..."
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-2 sm:px-3">
                      <Input
                        value={row.responsible}
                        onChange={(e) => updateAction(row.id, 'responsible', e.target.value)}
                        placeholder="Ansvarlig"
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-2 sm:px-3">
                      <Input
                        type="date"
                        value={row.deadline}
                        onChange={(e) => updateAction(row.id, 'deadline', e.target.value)}
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeActionRow(row.id)}
                        disabled={formData.actions.length === 1}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signaturer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auditorSignature">Signatur revisor</Label>
            <Input
              id="auditorSignature"
              value={formData.auditorSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, auditorSignature: e.target.value }))}
              placeholder="Navn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerSignature">Signatur leder</Label>
            <Input
              id="managerSignature"
              value={formData.managerSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, managerSignature: e.target.value }))}
              placeholder="Navn"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          Lagre årlig HMS-revisjon
        </Button>
      </div>
    </form>
  );
};

export default AnnualHmsRevisionForm;
