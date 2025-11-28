import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, FileText, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuditFormResponses, type AuditFormResponse } from "@/hooks/useAuditFormResponses";
import type { Json } from "@/integrations/supabase/types";
import ResponsiveChecklist, { type ChecklistRow } from "./ResponsiveChecklist";
import ResponsiveActionTable from "./ResponsiveActionTable";
import SavedFormsList from "./SavedFormsList";

type YesNoNa = "yes" | "no" | "na" | "";

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

interface SectionItems {
  [sectionKey: string]: ChecklistRow[];
}

interface FormData {
  companyName: string;
  revisionDate: string;
  revisionYear: string;
  participants: string;
  auditor: string;
  sectionItems: SectionItems;
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

const defaultGoalsItems: ChecklistRow[] = [
  { id: "goals_known", label: "Er mål for HMS-arbeidet definert og kjent for alle ansatte?" },
  { id: "action_plan", label: "Er det laget handlingsplan og er denne fulgt opp?" },
  { id: "measures_effective", label: "Er det gjennomført evaluering av om tiltakene har hatt ønsket effekt?" }
];

const defaultOrganizationItems: ChecklistRow[] = [
  { id: "roles_defined", label: "Er roller og ansvar tydelig definert og dokumentert?" },
  { id: "safety_rep", label: "Er verneombud/vernetjeneste valgt dersom påkrevd?" },
  { id: "communication", label: "Fungerer intern kommunikasjon og informasjon om HMS godt nok?" }
];

const defaultRiskItems: ChecklistRow[] = [
  { id: "risk_all_tasks", label: "Er det gjennomført risikovurderinger for alle arbeidsoppgaver?" },
  { id: "risk_updated", label: "Er risikovurderinger oppdatert etter endringer i drift?" },
  { id: "risk_followup", label: "Blir tiltak fra risikovurderinger fulgt opp og dokumentert?" }
];

const defaultRoutinesItems: ChecklistRow[] = [
  { id: "written_routines", label: "Finnes nødvendige skriftlige rutiner?" },
  { id: "routines_known", label: "Er rutinene kjent hos de ansatte og praktisert i arbeidshverdagen?" },
  { id: "routines_updated", label: "Er rutiner oppdatert i forhold til krav og drift?" }
];

const defaultTrainingItems: ChecklistRow[] = [
  { id: "training_done", label: "Er nødvendig opplæring gjennomført og dokumentert?" },
  { id: "training_info", label: "Har ansatte fått informasjon om relevante HMS-rutiner?" },
  { id: "needs_more_training", label: "Er det behov for ytterligere opplæring?" }
];

const defaultDeviationsItems: ChecklistRow[] = [
  { id: "deviation_system_works", label: "Fungerer avvikssystemet etter hensikten?" },
  { id: "deviations_followed", label: "Blir avvik analysert og fulgt opp med tiltak?" },
  { id: "learning_measures", label: "Er det gjort læringstiltak for å unngå gjentakelser?" }
];

const defaultInspectionsItems: ChecklistRow[] = [
  { id: "inspections_done", label: "Er det gjennomført vernerunder i perioden?" },
  { id: "inspections_followup", label: "Er funn fulgt opp i henhold til frister?" }
];

const defaultWorkEnvItems: ChecklistRow[] = [
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
  const { responses, saveFormResponse, deleteFormResponse, isSaving } = useAuditFormResponses();
  const [existingId, setExistingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  
  const getInitialFormData = (): FormData => ({
    companyName: company?.name || "",
    revisionDate: new Date().toISOString().split('T')[0],
    revisionYear: new Date().getFullYear().toString(),
    participants: "",
    auditor: "",
    sectionItems: {
      goalsSection: [...defaultGoalsItems],
      organizationSection: [...defaultOrganizationItems],
      riskSection: [...defaultRiskItems],
      routinesSection: [...defaultRoutinesItems],
      trainingSection: [...defaultTrainingItems],
      deviationsSection: [...defaultDeviationsItems],
      inspectionsSection: [...defaultInspectionsItems],
      workEnvSection: [...defaultWorkEnvItems],
    },
    goalsSection: initializeChecklistAnswers(defaultGoalsItems),
    organizationSection: initializeChecklistAnswers(defaultOrganizationItems),
    riskSection: initializeChecklistAnswers(defaultRiskItems),
    routinesSection: initializeChecklistAnswers(defaultRoutinesItems),
    trainingSection: initializeChecklistAnswers(defaultTrainingItems),
    deviationsSection: initializeChecklistAnswers(defaultDeviationsItems),
    inspectionsSection: initializeChecklistAnswers(defaultInspectionsItems),
    workEnvSection: initializeChecklistAnswers(defaultWorkEnvItems),
    strengths: "",
    improvements: "",
    actions: [{ id: "1", action: "", responsible: "", deadline: "" }],
    auditorSignature: "",
    managerSignature: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  const formTypeResponses = responses.filter(r => r.form_type === "annual_hms");

  const handleCreateNew = () => {
    setFormData(getInitialFormData());
    setExistingId(undefined);
    setShowForm(true);
  };

  const handleSelectResponse = (response: AuditFormResponse) => {
    if (response.form_data) {
      const savedData = response.form_data as unknown as FormData;
      setFormData({
        ...getInitialFormData(),
        ...savedData,
        companyName: savedData.companyName || company?.name || "",
      });
    }
    setExistingId(response.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFormResponse(id);
    if (existingId === id) {
      setExistingId(undefined);
      setShowForm(false);
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
  };

  type SectionKey = 'goalsSection' | 'organizationSection' | 'riskSection' | 'routinesSection' | 'trainingSection' | 'deviationsSection' | 'inspectionsSection' | 'workEnvSection';

  const updateChecklistAnswer = (
    section: SectionKey,
    itemId: string,
    field: 'answer' | 'comment',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [itemId]: {
          ...(prev[section][itemId] || { answer: '', comment: '' }),
          [field]: value
        }
      }
    }));
  };

  const handleAddItem = (section: SectionKey, label: string) => {
    const newId = `custom_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      sectionItems: {
        ...prev.sectionItems,
        [section]: [
          ...prev.sectionItems[section],
          { id: newId, label }
        ]
      },
      [section]: {
        ...prev[section],
        [newId]: { answer: '', comment: '' }
      }
    }));
  };

  const handleEditItem = (section: SectionKey, itemId: string, newLabel: string) => {
    setFormData(prev => ({
      ...prev,
      sectionItems: {
        ...prev.sectionItems,
        [section]: prev.sectionItems[section].map(item =>
          item.id === itemId ? { ...item, label: newLabel } : item
        )
      }
    }));
  };

  const handleDeleteItem = (section: SectionKey, itemId: string) => {
    setFormData(prev => {
      const { [itemId]: removed, ...remainingAnswers } = prev[section];
      return {
        ...prev,
        sectionItems: {
          ...prev.sectionItems,
          [section]: prev.sectionItems[section].filter(item => item.id !== itemId)
        },
        [section]: remainingAnswers
      };
    });
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

  const handleSaveDraft = async () => {
    await saveFormResponse(
      "annual_hms",
      formData as unknown as Json,
      {
        revision_date: formData.revisionDate,
        participants: formData.participants,
        auditor_name: formData.auditor,
        manager_name: formData.managerSignature,
      },
      "draft",
      existingId
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveFormResponse(
      "annual_hms",
      formData as unknown as Json,
      {
        revision_date: formData.revisionDate,
        participants: formData.participants,
        auditor_name: formData.auditor,
        manager_name: formData.managerSignature,
      },
      "completed",
      existingId
    );
    if (result) {
      setExistingId(result.id);
    }
  };

  const handleChecklistAnswerChange = (section: SectionKey, itemId: string, value: string) => {
    updateChecklistAnswer(section, itemId, 'answer', value);
  };

  const handleChecklistCommentChange = (section: SectionKey, itemId: string, value: string) => {
    updateChecklistAnswer(section, itemId, 'comment', value);
  };

  if (!showForm) {
    return (
      <SavedFormsList
        responses={formTypeResponses}
        onDelete={handleDelete}
        onSelect={handleSelectResponse}
        onCreateNew={handleCreateNew}
        isDeleting={isSaving}
        title="Årlig HMS-revisjon"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBackToList} className="gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Tilbake til oversikt
      </Button>

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
      <ResponsiveChecklist
        title="1. Mål og planer for HMS-arbeidet"
        items={formData.sectionItems.goalsSection}
        answers={formData.goalsSection}
        sectionKey="goalsSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("goalsSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("goalsSection", id, val)}
        onAddItem={(label) => handleAddItem("goalsSection", label)}
        onEditItem={(id, label) => handleEditItem("goalsSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("goalsSection", id)}
      />
      <ResponsiveChecklist
        title="2. Organisering og ansvar"
        items={formData.sectionItems.organizationSection}
        answers={formData.organizationSection}
        sectionKey="organizationSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("organizationSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("organizationSection", id, val)}
        onAddItem={(label) => handleAddItem("organizationSection", label)}
        onEditItem={(id, label) => handleEditItem("organizationSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("organizationSection", id)}
      />
      <ResponsiveChecklist
        title="3. Risikovurdering"
        items={formData.sectionItems.riskSection}
        answers={formData.riskSection}
        sectionKey="riskSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("riskSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("riskSection", id, val)}
        onAddItem={(label) => handleAddItem("riskSection", label)}
        onEditItem={(id, label) => handleEditItem("riskSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("riskSection", id)}
      />
      <ResponsiveChecklist
        title="4. Rutiner og prosedyrer"
        items={formData.sectionItems.routinesSection}
        answers={formData.routinesSection}
        sectionKey="routinesSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("routinesSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("routinesSection", id, val)}
        onAddItem={(label) => handleAddItem("routinesSection", label)}
        onEditItem={(id, label) => handleEditItem("routinesSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("routinesSection", id)}
      />
      <ResponsiveChecklist
        title="5. Opplæring og kompetanse"
        items={formData.sectionItems.trainingSection}
        answers={formData.trainingSection}
        sectionKey="trainingSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("trainingSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("trainingSection", id, val)}
        onAddItem={(label) => handleAddItem("trainingSection", label)}
        onEditItem={(id, label) => handleEditItem("trainingSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("trainingSection", id)}
      />
      <ResponsiveChecklist
        title="6. Avviksbehandling og hendelser"
        items={formData.sectionItems.deviationsSection}
        answers={formData.deviationsSection}
        sectionKey="deviationsSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("deviationsSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("deviationsSection", id, val)}
        onAddItem={(label) => handleAddItem("deviationsSection", label)}
        onEditItem={(id, label) => handleEditItem("deviationsSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("deviationsSection", id)}
      />
      <ResponsiveChecklist
        title="7. Vernerunder / inspeksjoner"
        items={formData.sectionItems.inspectionsSection}
        answers={formData.inspectionsSection}
        sectionKey="inspectionsSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("inspectionsSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("inspectionsSection", id, val)}
        onAddItem={(label) => handleAddItem("inspectionsSection", label)}
        onEditItem={(id, label) => handleEditItem("inspectionsSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("inspectionsSection", id)}
      />
      <ResponsiveChecklist
        title="8. Arbeidsmiljø og trivsel"
        items={formData.sectionItems.workEnvSection}
        answers={formData.workEnvSection}
        sectionKey="workEnvSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("workEnvSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("workEnvSection", id, val)}
        onAddItem={(label) => handleAddItem("workEnvSection", label)}
        onEditItem={(id, label) => handleEditItem("workEnvSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("workEnvSection", id)}
      />

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
      <ResponsiveActionTable
        title="Nye tiltak og ansvarsfordeling"
        actions={formData.actions}
        onAdd={addActionRow}
        onRemove={removeActionRow}
        onUpdate={updateAction}
      />

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
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" size="lg" className="gap-2" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lagre utkast
          </Button>
          <Button type="submit" size="lg" className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Fullfør og lagre i handbok
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AnnualHmsRevisionForm;
