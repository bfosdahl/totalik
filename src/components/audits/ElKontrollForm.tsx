import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Zap, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import SavedFormsList from "./SavedFormsList";
import { useAuditFormResponses, type AuditFormResponse } from "@/hooks/useAuditFormResponses";
import type { Json } from "@/integrations/supabase/types";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface FormData {
  companyName: string;
  controlDate: string;
  location: string;
  controlledBy: string;
  // Sikringsskap
  sikringsskabChecks: ChecklistItem[];
  // Fast installasjon
  fastInstallasjonChecks: ChecklistItem[];
  // Elektrisk utstyr
  elektriskUtstyrChecks: ChecklistItem[];
  // Dokumentasjon
  dokumentasjonChecks: ChecklistItem[];
  // Avvik og tiltak
  avvikKommentarer: string;
  tiltakOgFrist: string;
  signaturKontrollor: string;
  signaturAnsvarlig: string;
}

const createChecklist = (items: string[]): ChecklistItem[] => 
  items.map((label, index) => ({ id: `${index}`, label, checked: false }));

const sikringsskabItems = [
  "Kursfortegnelse er til stede og korrekt merket / oppdatert",
  "Sikringer / vern er riktig dimensjonert",
  "Sikringsskap er ryddig og tilgjengelig",
  "Sikringsskapets dør kan lukkes og låses",
  "Ingen tegn til varmegang",
  "Jordfeilbrytere testet og fungerer",
  "Overspenningsvern kontrollert",
];

const fastInstallasjonItems = [
  "Kabler og ledninger uten synlige skader",
  "Deksler og koblingsbokser intakte",
  "Ingen kabler løst, over varme eller fukt uten vern",
  "Fast installert utstyr er i normal stand",
  "Sikkerhetsbrytere/nødstopp tilgjengelige og testet",
];

const elektriskUtstyrItems = [
  "Høy belastning er ikke koblet via skjøteledninger",
  "Skjøteledninger og kabler uten varme eller skader",
  "Korrekt jord eller jordvern i fuktige områder",
  "Alt utstyr fungerer normalt etter test",
  "Dokumentasjon finnes for fast installasjon",
];

const dokumentasjonItems = [
  "Alt arbeid utført av registrert elektroinstallatør",
  "Samsvarserklæring og dokumentasjon finnes",
  "Rutiner for internkontroll foreligger",
  "Ansvarlig for elsikkerhet er definert",
];

const ElKontrollForm: React.FC = () => {
  const { company, profile } = useAuth();
  const { responses, saveFormResponse, deleteFormResponse, isSaving } = useAuditFormResponses();
  const [existingId, setExistingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const getInitialFormData = (): FormData => ({
    companyName: company?.name || "",
    controlDate: new Date().toISOString().split("T")[0],
    location: "",
    controlledBy: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "",
    sikringsskabChecks: createChecklist(sikringsskabItems),
    fastInstallasjonChecks: createChecklist(fastInstallasjonItems),
    elektriskUtstyrChecks: createChecklist(elektriskUtstyrItems),
    dokumentasjonChecks: createChecklist(dokumentasjonItems),
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

  const updateChecklistItem = (
    checklistField: 'sikringsskabChecks' | 'fastInstallasjonChecks' | 'elektriskUtstyrChecks' | 'dokumentasjonChecks',
    itemId: string,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [checklistField]: prev[checklistField].map((item) =>
        item.id === itemId ? { ...item, checked } : item
      ),
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
  };

  const renderChecklist = (
    title: string,
    items: ChecklistItem[],
    checklistField: 'sikringsskabChecks' | 'fastInstallasjonChecks' | 'elektriskUtstyrChecks' | 'dokumentasjonChecks'
  ) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-base">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <Checkbox
              id={`${checklistField}-${item.id}`}
              checked={item.checked}
              onCheckedChange={(checked) => 
                updateChecklistItem(checklistField, item.id, checked === true)
              }
              className="mt-0.5"
            />
            <Label 
              htmlFor={`${checklistField}-${item.id}`}
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  if (!showForm) {
    return (
      <SavedFormsList
        responses={formTypeResponses}
        onDelete={handleDelete}
        onSelect={handleSelectResponse}
        onCreateNew={handleCreateNew}
        isDeleting={isSaving}
        title="El-Kontroll"
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
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              EL-kontroll – Sjekkliste
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Virksomhet</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controlDate">Kontrolldato</Label>
              <Input
                id="controlDate"
                type="date"
                value={formData.controlDate}
                onChange={(e) => updateField("controlDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Sted / lokasjon</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="f.eks. Hovedkontor, Lager A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controlledBy">Kontrollert av</Label>
              <Input
                id="controlledBy"
                value={formData.controlledBy}
                onChange={(e) => updateField("controlledBy", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklists */}
        <Card>
          <CardHeader>
            <CardTitle>Kontrollpunkter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {renderChecklist(
              "1. Sikringsskap / Fordelingstavle",
              formData.sikringsskabChecks,
              "sikringsskabChecks"
            )}

            {renderChecklist(
              "2. Fast installasjon / kabler",
              formData.fastInstallasjonChecks,
              "fastInstallasjonChecks"
            )}

            {renderChecklist(
              "3. Elektrisk utstyr / stikk / skjøteledninger",
              formData.elektriskUtstyrChecks,
              "elektriskUtstyrChecks"
            )}

            {renderChecklist(
              "4. Dokumentasjon og ansvar",
              formData.dokumentasjonChecks,
              "dokumentasjonChecks"
            )}
          </CardContent>
        </Card>

        {/* Avvik og tiltak */}
        <Card>
          <CardHeader>
            <CardTitle>5. Avvik og tiltak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avvikKommentarer">Avvik / kommentarer</Label>
              <Textarea
                id="avvikKommentarer"
                value={formData.avvikKommentarer}
                onChange={(e) => updateField("avvikKommentarer", e.target.value)}
                placeholder="Beskriv eventuelle avvik som ble funnet..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiltakOgFrist">Tiltak og frist</Label>
              <Textarea
                id="tiltakOgFrist"
                value={formData.tiltakOgFrist}
                onChange={(e) => updateField("tiltakOgFrist", e.target.value)}
                placeholder="Beskriv tiltak som skal gjennomføres og frist..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signaturer */}
        <Card>
          <CardHeader>
            <CardTitle>Signaturer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signaturKontrollor">Signatur kontrollør</Label>
              <Input
                id="signaturKontrollor"
                value={formData.signaturKontrollor}
                onChange={(e) => updateField("signaturKontrollor", e.target.value)}
                placeholder="Navn på kontrollør"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signaturAnsvarlig">Signatur ansvarlig (bedrift)</Label>
              <Input
                id="signaturAnsvarlig"
                value={formData.signaturAnsvarlig}
                onChange={(e) => updateField("signaturAnsvarlig", e.target.value)}
                placeholder="Navn på ansvarlig"
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
