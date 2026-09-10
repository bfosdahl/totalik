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
import { toast } from "sonner";
import { createAuditDeviations } from "@/utils/createAuditDeviations";
import { getLocalDateString } from "@/lib/dateUtils";
import ResponsiveChecklist, { type ChecklistRow } from "./ResponsiveChecklist";
import ResponsiveActionTable from "./ResponsiveActionTable";
import SavedFormsList from "./SavedFormsList";
import UserSelect from "./UserSelect";
import { t } from "@/i18n/t";

type YesNoNa = "yes" | "no" | "na" | "";

interface ChecklistAnswers {
  [key: string]: {
    answer: YesNoNa;
    comment: string;
    /** "true" naar punktet er manuelt merket som avvik */
    deviation?: string;
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
  { id: "goals_known", label: t("auto.er_maal_for_hms_arbeidet_definert_og_kje") },
  { id: "action_plan", label: t("auto.er_det_laget_handlingsplan_og_er_denne_f") },
  { id: "measures_effective", label: t("auto.er_det_gjennomfoert_evaluering_av_om_til") }
];

const defaultOrganizationItems: ChecklistRow[] = [
  { id: "roles_defined", label: t("auto.er_roller_og_ansvar_tydelig_definert_og_") },
  { id: "safety_rep", label: t("auto.er_verneombud_vernetjeneste_valgt_dersom") },
  { id: "communication", label: t("auto.fungerer_intern_kommunikasjon_og_informa") }
];

const defaultRiskItems: ChecklistRow[] = [
  { id: "risk_all_tasks", label: t("auto.er_det_gjennomfoert_risikovurderinger_fo") },
  { id: "risk_updated", label: t("auto.er_risikovurderinger_oppdatert_etter_end") },
  { id: "risk_followup", label: t("auto.blir_tiltak_fra_risikovurderinger_fulgt_") }
];

const defaultRoutinesItems: ChecklistRow[] = [
  { id: "written_routines", label: t("auto.finnes_noedvendige_skriftlige_rutiner") },
  { id: "routines_known", label: t("auto.er_rutinene_kjent_hos_de_ansatte_og_prak") },
  { id: "routines_updated", label: t("auto.er_rutiner_oppdatert_i_forhold_til_krav_") }
];

const defaultTrainingItems: ChecklistRow[] = [
  { id: "training_done", label: t("auto.er_noedvendig_opplaering_gjennomfoert_og") },
  { id: "training_info", label: t("auto.har_ansatte_faatt_informasjon_om_relevan") },
  { id: "needs_more_training", label: t("auto.er_det_behov_for_ytterligere_opplaering") }
];

const defaultDeviationsItems: ChecklistRow[] = [
  { id: "deviation_system_works", label: t("auto.fungerer_avvikssystemet_etter_hensikten") },
  { id: "deviations_followed", label: t("auto.blir_avvik_analysert_og_fulgt_opp_med_ti") },
  { id: "learning_measures", label: t("auto.er_det_gjort_laeringstiltak_for_aa_unnga") }
];

const defaultInspectionsItems: ChecklistRow[] = [
  { id: "inspections_done", label: t("auto.er_det_gjennomfoert_vernerunder_i_period") },
  { id: "inspections_followup", label: t("auto.er_funn_fulgt_opp_i_henhold_til_frister") }
];

const defaultWorkEnvItems: ChecklistRow[] = [
  { id: "sick_leave_followup", label: t("auto.er_sykefravaer_fulgt_opp_og_analysert") },
  { id: "hse_meetings", label: t("auto.er_det_gjennomfoert_verne_amu_moeter_der") },
  { id: "good_work_env", label: t("auto.opplever_ansatte_et_trygt_og_godt_arbeid") }
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
    revisionDate: getLocalDateString(),
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
    field: 'answer' | 'comment' | 'deviation',
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

  const sectionTitles: Record<SectionKey, string> = {
    goalsSection: t("auto.1_maal_og_planer_for_hms_arbeidet"),
    organizationSection: t("auto.2_organisering_og_ansvar"),
    riskSection: t("auto.3_risikovurdering"),
    routinesSection: t("auto.4_rutiner_og_prosedyrer"),
    trainingSection: t("auto.5_opplaering_og_kompetanse"),
    deviationsSection: t("auto.6_avviksbehandling_og_hendelser"),
    inspectionsSection: t("auto.7_vernerunder_inspeksjoner"),
    workEnvSection: t("auto.8_arbeidsmiljoe_og_trivsel"),
  };

  const registerDeviations = async () => {
    const items = (Object.keys(sectionTitles) as SectionKey[]).flatMap((key) =>
      (formData.sectionItems[key] || [])
        .filter((item) => formData[key][item.id]?.deviation === "true")
        .map((item) => ({
          label: item.label,
          comment: formData[key][item.id]?.comment || "",
          sectionTitle: sectionTitles[key],
        }))
    );
    if (items.length === 0) return;
    try {
      const created = await createAuditDeviations({
        companyId: company?.id || "",
        formLabel: "Årlig HMS-revisjon",
        items,
        reporterName: formData.auditor || null,
        date: formData.revisionDate,
      });
      if (created > 0) toast.success(`${created} avvik registrert i avviksmodulen`);
    } catch (error) {
      console.error("[AnnualHmsRevisionForm] deviation error:", error);
      toast.error("Kunne ikke registrere avvik i avviksmodulen");
    }
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
    await registerDeviations();
  };

  const handleChecklistAnswerChange = (section: SectionKey, itemId: string, value: string) => {
    updateChecklistAnswer(section, itemId, 'answer', value);
  };

  const handleChecklistCommentChange = (section: SectionKey, itemId: string, value: string) => {
    updateChecklistAnswer(section, itemId, 'comment', value);
  };

  const handleChecklistDeviationChange = (section: SectionKey, itemId: string, value: boolean) => {
    updateChecklistAnswer(section, itemId, 'deviation', value ? 'true' : '');
  };

  if (!showForm) {
    return (
      <SavedFormsList
        responses={formTypeResponses}
        onDelete={handleDelete}
        onSelect={handleSelectResponse}
        onCreateNew={handleCreateNew}
        isDeleting={isSaving}
        title={t("auto.aarlig_hms_revisjon")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBackToList} className="gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" />
        {t("auto.tilbake_til_oversikt")}
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
            <Label htmlFor="companyName">{t("auto.virksomhet")}</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revisionDate">{t("auto.dato_for_revisjon")}</Label>
            <Input
              id="revisionDate"
              type="date"
              value={formData.revisionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, revisionDate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revisionYear">{t("auto.revisjonsperiode_aar")}</Label>
            <Input
              id="revisionYear"
              value={formData.revisionYear}
              onChange={(e) => setFormData(prev => ({ ...prev, revisionYear: e.target.value }))}
              placeholder="2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditor">{t("auto.revisor")}</Label>
            <UserSelect
              value={formData.auditor}
              onValueChange={(value) => setFormData(prev => ({ ...prev, auditor: value }))}
              placeholder={t("auto.velg_revisor")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="participants">{t("auto.deltakere_i_revisjon")}</Label>
            <Textarea
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
              placeholder={t("auto.navn_roller")}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist sections */}
      <ResponsiveChecklist
        title={t("auto.1_maal_og_planer_for_hms_arbeidet")}
        items={formData.sectionItems.goalsSection}
        answers={formData.goalsSection}
        sectionKey="goalsSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("goalsSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("goalsSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("goalsSection", id, val)}
        onAddItem={(label) => handleAddItem("goalsSection", label)}
        onEditItem={(id, label) => handleEditItem("goalsSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("goalsSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.2_organisering_og_ansvar")}
        items={formData.sectionItems.organizationSection}
        answers={formData.organizationSection}
        sectionKey="organizationSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("organizationSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("organizationSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("organizationSection", id, val)}
        onAddItem={(label) => handleAddItem("organizationSection", label)}
        onEditItem={(id, label) => handleEditItem("organizationSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("organizationSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.3_risikovurdering")}
        items={formData.sectionItems.riskSection}
        answers={formData.riskSection}
        sectionKey="riskSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("riskSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("riskSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("riskSection", id, val)}
        onAddItem={(label) => handleAddItem("riskSection", label)}
        onEditItem={(id, label) => handleEditItem("riskSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("riskSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.4_rutiner_og_prosedyrer")}
        items={formData.sectionItems.routinesSection}
        answers={formData.routinesSection}
        sectionKey="routinesSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("routinesSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("routinesSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("routinesSection", id, val)}
        onAddItem={(label) => handleAddItem("routinesSection", label)}
        onEditItem={(id, label) => handleEditItem("routinesSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("routinesSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.5_opplaering_og_kompetanse")}
        items={formData.sectionItems.trainingSection}
        answers={formData.trainingSection}
        sectionKey="trainingSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("trainingSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("trainingSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("trainingSection", id, val)}
        onAddItem={(label) => handleAddItem("trainingSection", label)}
        onEditItem={(id, label) => handleEditItem("trainingSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("trainingSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.6_avviksbehandling_og_hendelser")}
        items={formData.sectionItems.deviationsSection}
        answers={formData.deviationsSection}
        sectionKey="deviationsSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("deviationsSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("deviationsSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("deviationsSection", id, val)}
        onAddItem={(label) => handleAddItem("deviationsSection", label)}
        onEditItem={(id, label) => handleEditItem("deviationsSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("deviationsSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.7_vernerunder_inspeksjoner")}
        items={formData.sectionItems.inspectionsSection}
        answers={formData.inspectionsSection}
        sectionKey="inspectionsSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("inspectionsSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("inspectionsSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("inspectionsSection", id, val)}
        onAddItem={(label) => handleAddItem("inspectionsSection", label)}
        onEditItem={(id, label) => handleEditItem("inspectionsSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("inspectionsSection", id)}
      />
      <ResponsiveChecklist
        title={t("auto.8_arbeidsmiljoe_og_trivsel")}
        items={formData.sectionItems.workEnvSection}
        answers={formData.workEnvSection}
        sectionKey="workEnvSection"
        onAnswerChange={(id, val) => handleChecklistAnswerChange("workEnvSection", id, val)}
        onCommentChange={(id, val) => handleChecklistCommentChange("workEnvSection", id, val)}
        onDeviationChange={(id, val) => handleChecklistDeviationChange("workEnvSection", id, val)}
        onAddItem={(label) => handleAddItem("workEnvSection", label)}
        onEditItem={(id, label) => handleEditItem("workEnvSection", id, label)}
        onDeleteItem={(id) => handleDeleteItem("workEnvSection", id)}
      />

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t("auto.oppsummering")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strengths">{t("auto.styrker_i_hms_arbeidet")}</Label>
            <Textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="improvements">{t("auto.forbedringsomraader")}</Label>
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
        title={t("auto.nye_tiltak_og_ansvarsfordeling")}
        actions={formData.actions}
        onAdd={addActionRow}
        onRemove={removeActionRow}
        onUpdate={updateAction}
      />

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>{t("auto.signaturer")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auditorSignature">{t("auto.signatur_revisor")}</Label>
            <Input
              id="auditorSignature"
              value={formData.auditorSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, auditorSignature: e.target.value }))}
              placeholder={t("auto.navn_2")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerSignature">{t("auto.signatur_leder")}</Label>
            <Input
              id="managerSignature"
              value={formData.managerSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, managerSignature: e.target.value }))}
              placeholder={t("auto.navn_2")}
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
