import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Zap, Loader2, CheckCircle2, ArrowLeft, Shield, Cable, Plug, FileText } from "lucide-react";
import SavedFormsList from "./SavedFormsList";
import EditableChecklistSection, { ChecklistQuestion, ChecklistAnswer } from "./EditableChecklistSection";
import { useAuditFormResponses, type AuditFormResponse } from "@/hooks/useAuditFormResponses";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { createAuditDeviations } from "@/utils/createAuditDeviations";
import { getLocalDateString } from "@/lib/dateUtils";
import { t } from "@/i18n/t";

interface SectionData {
  title: string;
  questions: ChecklistQuestion[];
  answers: { [questionId: string]: ChecklistAnswer };
}

interface FormData {
  companyName: string;
  controlDate: string;
  location: string;
  controlledBy: string;
  sections: {
    sikringsskap: SectionData;
    fastInstallasjon: SectionData;
    elektriskUtstyr: SectionData;
    dokumentasjon: SectionData;
  };
  avvikKommentarer: string;
  tiltakOgFrist: string;
  signaturKontrollor: string;
  signaturAnsvarlig: string;
}

const createQuestions = (items: string[]): ChecklistQuestion[] =>
  items.map((question, index) => ({ id: `q${index}`, question }));

const sikringsskabItems = [
  t("auto.kursfortegnelse_er_til_stede_og_korrekt_"),
  t("auto.sikringer_vern_er_riktig_dimensjonert"),
  t("auto.sikringsskap_er_ryddig_og_tilgjengelig"),
  t("auto.sikringsskapets_doer_kan_lukkes_og_laase"),
  "Ingen tegn til varmegang",
  t("auto.jordfeilbrytere_testet_og_fungerer"),
  "Overspenningsvern kontrollert",
];

const fastInstallasjonItems = [
  t("auto.kabler_og_ledninger_uten_synlige_skader"),
  t("auto.deksler_og_koblingsbokser_intakte"),
  t("auto.ingen_kabler_loest_over_varme_eller_fukt"),
  t("auto.fast_installert_utstyr_er_i_normal_stand"),
  t("auto.sikkerhetsbrytere_noedstopp_tilgjengelig"),
];

const elektriskUtstyrItems = [
  t("auto.hoey_belastning_er_ikke_koblet_via_skjoe"),
  t("auto.skjoeteledninger_og_kabler_uten_varme_el"),
  t("auto.korrekt_jord_eller_jordvern_i_fuktige_om"),
  "Alt utstyr fungerer normalt etter test",
  t("auto.dokumentasjon_finnes_for_fast_installasj"),
];

const dokumentasjonItems = [
  t("auto.alt_arbeid_utfoert_av_registrert_elektro"),
  t("auto.samsvarserklaering_og_dokumentasjon_finn"),
  t("auto.rutiner_for_internkontroll_foreligger"),
  t("auto.ansvarlig_for_elsikkerhet_er_definert"),
];

const ElKontrollForm: React.FC = () => {
  const { company, profile } = useAuth();
  const { responses, saveFormResponse, deleteFormResponse, isSaving } = useAuditFormResponses();
  const [existingId, setExistingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const getInitialFormData = (): FormData => ({
    companyName: company?.name || "",
    controlDate: getLocalDateString(),
    location: "",
    controlledBy: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "",
    sections: {
      sikringsskap: {
        title: t("auto.sikringsskap_fordelingstavle"),
        questions: createQuestions(sikringsskabItems),
        answers: {},
      },
      fastInstallasjon: {
        title: t("auto.fast_installasjon_kabler"),
        questions: createQuestions(fastInstallasjonItems),
        answers: {},
      },
      elektriskUtstyr: {
        title: t("auto.elektrisk_utstyr_stikk_skjoeteledninger"),
        questions: createQuestions(elektriskUtstyrItems),
        answers: {},
      },
      dokumentasjon: {
        title: t("auto.dokumentasjon_og_ansvar"),
        questions: createQuestions(dokumentasjonItems),
        answers: {},
      },
    },
    avvikKommentarer: "",
    tiltakOgFrist: "",
    signaturKontrollor: "",
    signaturAnsvarlig: "",
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const formTypeResponses = responses.filter(r => r.form_type === "elkontroll");

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

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Section handlers
  const handleAnswerChange = (
    sectionKey: keyof FormData["sections"],
    questionId: string,
    field: "answer" | "comment" | "deviation",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          answers: {
            ...prev.sections[sectionKey].answers,
            [questionId]: {
              ...prev.sections[sectionKey].answers[questionId],
              [field]: value,
            },
          },
        },
      },
    }));
  };

  const handleAddQuestion = (sectionKey: keyof FormData["sections"], question: string) => {
    const newId = `q${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          questions: [...prev.sections[sectionKey].questions, { id: newId, question }],
        },
      },
    }));
  };

  const handleEditQuestion = (
    sectionKey: keyof FormData["sections"],
    questionId: string,
    newQuestion: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          questions: prev.sections[sectionKey].questions.map((q) =>
            q.id === questionId ? { ...q, question: newQuestion } : q
          ),
        },
      },
    }));
  };

  const handleDeleteQuestion = (sectionKey: keyof FormData["sections"], questionId: string) => {
    setFormData((prev) => {
      const newAnswers = { ...prev.sections[sectionKey].answers };
      delete newAnswers[questionId];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: {
            ...prev.sections[sectionKey],
            questions: prev.sections[sectionKey].questions.filter((q) => q.id !== questionId),
            answers: newAnswers,
          },
        },
      };
    });
  };

  const handleTitleChange = (sectionKey: keyof FormData["sections"], newTitle: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          title: newTitle,
        },
      },
    }));
  };

  const handleSaveDraft = async () => {
    await saveFormResponse(
      "elkontroll",
      formData as unknown as Json,
      {
        revision_date: formData.controlDate,
        auditor_name: formData.controlledBy,
      },
      "draft",
      existingId
    );
  };

  const registerDeviations = async () => {
    const items = Object.values(formData.sections).flatMap((section) =>
      section.questions
        .filter((q) => section.answers[q.id]?.deviation === "true")
        .map((q) => ({
          label: q.question,
          comment: section.answers[q.id]?.comment || "",
          sectionTitle: section.title,
        }))
    );
    if (items.length === 0) return;
    try {
      const created = await createAuditDeviations({
        companyId: company?.id || "",
        formLabel: "El-kontroll",
        items,
        reporterId: profile?.id || null,
        reporterName: formData.controlledBy || null,
        date: formData.controlDate,
      });
      if (created > 0) toast.success(`${created} avvik registrert i avviksmodulen`);
    } catch (error) {
      console.error("[ElKontrollForm] deviation error:", error);
      toast.error(`Kunne ikke registrere avvik: ${error instanceof Error ? error.message : "ukjent feil"}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveFormResponse(
      "elkontroll",
      formData as unknown as Json,
      {
        revision_date: formData.controlDate,
        auditor_name: formData.controlledBy,
      },
      "completed",
      existingId
    );
    if (result) {
      setExistingId(result.id);
    }
    await registerDeviations();
  };

  const sectionIcons = {
    sikringsskap: Shield,
    fastInstallasjon: Cable,
    elektriskUtstyr: Plug,
    dokumentasjon: FileText,
  };

  if (!showForm) {
    return (
      <SavedFormsList
        responses={formTypeResponses}
        onDelete={handleDelete}
        onSelect={handleSelectResponse}
        onCreateNew={handleCreateNew}
        isDeleting={isSaving}
        title={t("auto.el_kontroll")}
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
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t("auto.el_kontroll_sjekkliste")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("auto.virksomhet")}</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controlDate">{t("auto.kontrolldato")}</Label>
              <Input
                id="controlDate"
                type="date"
                value={formData.controlDate}
                onChange={(e) => updateField("controlDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t("auto.sted_lokasjon")}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder={t("auto.f_eks_hovedkontor_lager_a")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controlledBy">{t("auto.kontrollert_av")}</Label>
              <Input
                id="controlledBy"
                value={formData.controlledBy}
                onChange={(e) => updateField("controlledBy", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Editable Checklists */}
        {(Object.keys(formData.sections) as Array<keyof FormData["sections"]>).map((sectionKey, index) => (
          <EditableChecklistSection
            key={sectionKey}
            sectionId={sectionKey}
            title={`${index + 1}. ${formData.sections[sectionKey].title}`}
            icon={sectionIcons[sectionKey]}
            questions={formData.sections[sectionKey].questions}
            answers={formData.sections[sectionKey].answers}
            onAnswerChange={(questionId, field, value) =>
              handleAnswerChange(sectionKey, questionId, field, value)
            }
            onAddQuestion={(question) => handleAddQuestion(sectionKey, question)}
            onEditQuestion={(questionId, newQuestion) =>
              handleEditQuestion(sectionKey, questionId, newQuestion)
            }
            onDeleteQuestion={(questionId) => handleDeleteQuestion(sectionKey, questionId)}
            onTitleChange={(newTitle) => handleTitleChange(sectionKey, newTitle.replace(/^\d+\.\s*/, ""))}
          />
        ))}

        {/* Avvik og tiltak */}
        <Card>
          <CardHeader>
            <CardTitle>{t("auto.5_avvik_og_tiltak")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avvikKommentarer">{t("auto.avvik_kommentarer")}</Label>
              <Textarea
                id="avvikKommentarer"
                value={formData.avvikKommentarer}
                onChange={(e) => updateField("avvikKommentarer", e.target.value)}
                placeholder={t("auto.beskriv_eventuelle_avvik_som_ble_funnet")}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiltakOgFrist">{t("auto.tiltak_og_frist")}</Label>
              <Textarea
                id="tiltakOgFrist"
                value={formData.tiltakOgFrist}
                onChange={(e) => updateField("tiltakOgFrist", e.target.value)}
                placeholder={t("auto.beskriv_tiltak_som_skal_gjennomfoeres_og")}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signaturer */}
        <Card>
          <CardHeader>
            <CardTitle>{t("auto.signaturer")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signaturKontrollor">{t("auto.signatur_kontrolloer")}</Label>
              <Input
                id="signaturKontrollor"
                value={formData.signaturKontrollor}
                onChange={(e) => updateField("signaturKontrollor", e.target.value)}
                placeholder={t("auto.navn_paa_kontrolloer")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signaturAnsvarlig">Signatur ansvarlig (bedrift)</Label>
              <Input
                id="signaturAnsvarlig"
                value={formData.signaturAnsvarlig}
                onChange={(e) => updateField("signaturAnsvarlig", e.target.value)}
                placeholder={t("auto.navn_paa_ansvarlig")}
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
            Lagre kontroll
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ElKontrollForm;
