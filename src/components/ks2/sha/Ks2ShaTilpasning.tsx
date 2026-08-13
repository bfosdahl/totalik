import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Trash2,
  Link,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  FileSignature
} from "lucide-react";
import { useKsModule2ShaPlan, AdditionalMeasure } from "@/hooks/useKsModule2ShaPlan";
import { t } from "@/i18n/t";

interface Props {
  projectId: string;
}

export function Ks2ShaTilpasning({ projectId }: Props) {
  const { shaPlan, tilpasning, createTilpasning, updateTilpasning, isLoading, isSaving } = useKsModule2ShaPlan(projectId);
  const [implementationDescription, setImplementationDescription] = useState(tilpasning?.implementation_description || "");
  const [additionalMeasures, setAdditionalMeasures] = useState<AdditionalMeasure[]>(
    tilpasning?.additional_measures || []
  );
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shaPlan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("auto.ingen_sha_plan_funnet")}</h3>
          <p className="text-muted-foreground text-center">
            {t("auto.du_maa_foerst_opprette_eller_laste_opp_e")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!tilpasning) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("auto.opprett_tilpasning")}</h3>
          <p className="text-muted-foreground text-center mb-4">
            {t("auto.dokumenter_hvordan_dere_ivaretar_kravene")}
          </p>
          <Button onClick={() => createTilpasning()} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Opprett tilpasning
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleAddMeasure = () => {
    const newMeasure: AdditionalMeasure = {
      id: `measure-${Date.now()}`,
      description: "",
      responsible: "",
      deadline: "",
    };
    setAdditionalMeasures([...additionalMeasures, newMeasure]);
    setHasChanges(true);
  };

  const handleUpdateMeasure = (index: number, field: keyof AdditionalMeasure, value: string) => {
    const updated = additionalMeasures.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    );
    setAdditionalMeasures(updated);
    setHasChanges(true);
  };

  const handleRemoveMeasure = (index: number) => {
    setAdditionalMeasures(additionalMeasures.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateTilpasning({
      implementation_description: implementationDescription,
      additional_measures: additionalMeasures,
    } as any);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card className={tilpasning.status === "signed" ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tilpasning.status === "signed" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className={`font-medium ${tilpasning.status === "signed" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                  {tilpasning.status === "signed" ? "Tilpasning signert" : "Tilpasning under arbeid"}
                </p>
                {tilpasning.status === "signed" && (
                  <p className="text-sm text-muted-foreground">
                    Signert av {tilpasning.project_leader_signed_by} den {tilpasning.project_leader_signed_at ? new Date(tilpasning.project_leader_signed_at).toLocaleDateString("nb-NO") : ""}
                  </p>
                )}
              </div>
            </div>
            {tilpasning.status !== "signed" && (
              <Button variant="outline" size="sm">
                <FileSignature className="h-4 w-4 mr-2" />
                Signer tilpasning
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t("auto.hvordan_vi_ivaretar_byggherrens_krav")}</CardTitle>
          <CardDescription>
            {t("auto.beskriv_hvordan_dere_implementerer_krave")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            rows={6}
            value={implementationDescription}
            onChange={(e) => { setImplementationDescription(e.target.value); setHasChanges(true); }}
            placeholder={t("auto.beskriv_hvordan_dere_ivaretar_kravene_fr")}
          />
        </CardContent>
      </Card>

      {/* Additional Measures */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("auto.tilleggstiltak_fra_oss")}</CardTitle>
              <CardDescription>
                {t("auto.eventuelle_ekstra_tiltak_utover_det_som_")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddMeasure}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til tiltak
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {additionalMeasures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("auto.ingen_tilleggstiltak_lagt_til")}
            </p>
          ) : (
            <div className="space-y-4">
              {additionalMeasures.map((measure, index) => (
                <div key={measure.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">Tiltak {index + 1}</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveMeasure(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.beskrivelse")}</Label>
                    <Textarea 
                      value={measure.description}
                      onChange={(e) => handleUpdateMeasure(index, "description", e.target.value)}
                      placeholder={t("auto.beskriv_tiltaket")}
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("auto.ansvarlig_2")}</Label>
                      <Input 
                        value={measure.responsible}
                        onChange={(e) => handleUpdateMeasure(index, "responsible", e.target.value)}
                        placeholder={t("auto.hvem_er_ansvarlig")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("auto.frist_2")}</Label>
                      <Input 
                        type="date"
                        value={measure.deadline}
                        onChange={(e) => handleUpdateMeasure(index, "deadline", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Koblinger
          </CardTitle>
          <CardDescription>
            {t("auto.koble_til_sja_vernerunder_og_avvik_relat")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("auto.sja_er")}</p>
              <p className="text-2xl font-bold mt-1">{tilpasning.linked_sja_ids?.length || 0}</p>
              <Button variant="link" size="sm" className="mt-2">
                {t("auto.administrer")}
              </Button>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("auto.vernerunder")}</p>
              <p className="text-2xl font-bold mt-1">{tilpasning.linked_vernerunde_ids?.length || 0}</p>
              <Button variant="link" size="sm" className="mt-2">
                {t("auto.administrer")}
              </Button>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("auto.avvik")}</p>
              <p className="text-2xl font-bold mt-1">{tilpasning.linked_avvik_ids?.length || 0}</p>
              <Button variant="link" size="sm" className="mt-2">
                {t("auto.administrer")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lagre endringer
          </Button>
        </div>
      )}
    </div>
  );
}
