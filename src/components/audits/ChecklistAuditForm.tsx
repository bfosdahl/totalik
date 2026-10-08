import { useCallback } from 'react';
import { createAuditDeviations } from '@/utils/createAuditDeviations';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuditFormBase } from '@/hooks/useAuditFormBase';
import { DraftRestoreBanner } from '@/components/shared/DraftRestoreBanner';
import {
  useChecklistSectionsState,
  initChecklistState,
  type SectionQuestions,
  type ChecklistAnswers,
} from '@/hooks/useChecklistSectionsState';
import type { FormType } from '@/hooks/useAuditFormResponses';
import { getLocalDateString } from '@/lib/dateUtils';
import SavedFormsList from './SavedFormsList';
import EditableChecklistSection from './EditableChecklistSection';
import UserSelect from './UserSelect';
import { t } from "@/i18n/t";

import {
  Save,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

export interface ChecklistAuditSection {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  questions: { id: string; question: string }[];
}

export interface ChecklistAuditFormConfig {
  formType: string;          // 'daglig_drift' | 'fysiske_forhold'
  formLabel: string;
  logName: string;
  sections: ChecklistAuditSection[];
  listTitle: string;
  cardTitle: string;
  cardDescription: string;
}

interface FormData {
  companyName: string;
  date: string;
  participants: string;
  auditor: string;
  sectionQuestions: SectionQuestions;
  checklistAnswers: ChecklistAnswers;
  otherComments: string;
  auditorSignature: string;
  managerSignature: string;
}

export function ChecklistAuditForm({ config }: { config: ChecklistAuditFormConfig }) {
  const { company, profile } = useAuth();

  const getInitialFormData = useCallback((): FormData => {
    const { sectionQuestions, checklistAnswers } = initChecklistState(config.sections);
    return {
      companyName: company?.name || '',
      date: getLocalDateString(),
      participants: '',
      auditor: '',
      sectionQuestions,
      checklistAnswers,
      otherComments: '',
      auditorSignature: '',
      managerSignature: '',
    };
  }, [company?.name, config.sections]);

  const {
    formData,
    setFormData,
    isSaving,
    showForm,
    formTypeResponses,
    localDraft,
    restoreLocalDraft,
    clearLocalDraft,
    handleCreateNew,
    handleSelectResponse,
    handleDelete,
    handleBackToList,
    handleSaveDraft,
    handleSaveCompleted,
  } = useAuditFormBase<FormData>({
    // formType is a plain string in the config; the union is enforced at each wrapper.
    formType: config.formType as FormType,
    getInitialData: getInitialFormData,
    buildMetadata: (data) => ({
      revision_date: data.date,
      participants: data.participants,
      auditor_name: data.auditor,
      manager_name: data.managerSignature,
    }),
    hydrate: (initial, saved) => ({
      ...initial,
      ...saved,
      companyName: saved.companyName || company?.name || '',
    }),
  });

  const { updateAnswer, addQuestion, editQuestion, deleteQuestion } =
    useChecklistSectionsState<FormData>(setFormData);

  const registerDeviations = async () => {
    const items = Object.entries(formData.sectionQuestions).flatMap(([sectionId, questions]) =>
      (questions || [])
        .filter((q) => formData.checklistAnswers[sectionId]?.[q.id]?.deviation === 'true')
        .map((q) => ({
          label: q.question,
          comment: formData.checklistAnswers[sectionId]?.[q.id]?.comment || '',
          sectionTitle: config.sections.find((s) => s.id === sectionId)?.title,
        }))
    );
    if (items.length === 0) return;
    try {
      const created = await createAuditDeviations({
        companyId: company?.id || '',
        formLabel: config.formLabel,
        items,
        reporterId: profile?.id || null,
        reporterName: formData.auditor || null,
        date: formData.date,
      });
      if (created > 0) toast.success(`${created} avvik registrert i avvikssystemet`);
    } catch (error) {
      console.error(`[${config.logName}] deviation error:`, error);
      toast.error('Kunne ikke registrere avvik i avviksmodulen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveCompleted();
    await registerDeviations();
  };

  if (!showForm) {
    return (
      <div className="space-y-4">
        {localDraft && (
          <DraftRestoreBanner savedAt={localDraft.savedAt} onRestore={restoreLocalDraft} onDiscard={clearLocalDraft} />
        )}
        <SavedFormsList
          responses={formTypeResponses}
          onDelete={handleDelete}
          onSelect={handleSelectResponse}
          onCreateNew={handleCreateNew}
          isDeleting={isSaving}
          title={config.listTitle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBackToList} className="gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" />
        {t("auto.tilbake_til_oversikt")}
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{config.cardTitle}</CardTitle>
            <CardDescription>
              {config.cardDescription}
            </CardDescription>
          </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t("auto.bedriftsnavn")}</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">{t("auto.dato")}</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">{t("auto.deltakere")}</Label>
            <Input
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditor">{t("auto.utfoert_av")}</Label>
            <UserSelect
              value={formData.auditor}
              onValueChange={(value) => setFormData(prev => ({ ...prev, auditor: value }))}
              placeholder={t("auto.velg_ansvarlig")}
            />
          </div>
        </CardContent>
      </Card>

      {/* All Checklist Sections */}
      {config.sections.map(section => {
        // Skip the "annet" section as it has special handling with textarea
        if (section.id === 'annet') {
          return (
            <Card key={section.id} className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    {section.subtitle && (
                      <CardDescription>{section.subtitle}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={t("auto.skriv_inn_andre_ting_som_boer_kartlegges")}
                  value={formData.otherComments}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherComments: e.target.value }))}
                  rows={4}
                />
              </CardContent>
            </Card>
          );
        }
        
        return (
          <EditableChecklistSection
            key={section.id}
            sectionId={section.id}
            title={section.title}
            subtitle={section.subtitle}
            icon={section.icon}
            questions={formData.sectionQuestions[section.id] || []}
            answers={formData.checklistAnswers[section.id] || {}}
            onAnswerChange={(questionId, field, value) =>
              updateAnswer(section.id, questionId, field, value)
            }
            onAddQuestion={(question) => addQuestion(section.id, question)}
            onEditQuestion={(questionId, newQuestion) =>
              editQuestion(section.id, questionId, newQuestion)
            }
            onDeleteQuestion={(questionId) => deleteQuestion(section.id, questionId)}

          />
        );
      })}

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>{t("auto.signaturer")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auditorSignature">{t("auto.kartleggers_signatur")}</Label>
            <Input
              id="auditorSignature"
              value={formData.auditorSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, auditorSignature: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerSignature">{t("auto.daglig_leders_signatur")}</Label>
            <Input
              id="managerSignature"
              value={formData.managerSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, managerSignature: e.target.value }))}
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
}
