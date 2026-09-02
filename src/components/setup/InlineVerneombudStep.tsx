import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, CheckCircle2, User, ArrowRight, Info, FileText, FileUp } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { VerneombudExternalDocUpload } from "./VerneombudExternalDocUpload";
import { useSignatureCanvasResize } from "@/lib/useSignatureCanvasResize";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/i18n/t";

const VERNEOMBUD_REQUIRED_EMPLOYEE_COUNT = 5;

interface InlineVerneombudStepProps {
  companyId: string;
  companyName: string;
  companyAddress?: string;
  orgNumber?: string;
  employeeCount: number;
  onComplete: (verneombudName: string, hasExemption: boolean) => void;
  onSkip: () => void;
}

export function InlineVerneombudStep({
  companyId,
  companyName,
  companyAddress,
  orgNumber,
  employeeCount,
  onComplete,
  onSkip,
}: InlineVerneombudStepProps) {
  const { profile } = useAuth();
  const { users, isLoading: isLoadingUsers, getUserDisplayName } = useCompanyUsers();
  const needsVerneombud = employeeCount >= VERNEOMBUD_REQUIRED_EMPLOYEE_COUNT;
  
  const [mode, setMode] = useState<"choose" | "assign" | "exempt" | "sign_exempt" | "sign_agreement" | "done">("choose");
  const [verneombudName, setVerneombudName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyHasAgreement, setAlreadyHasAgreement] = useState(false);
  const [alreadyHasExemption, setAlreadyHasExemption] = useState(false);
  const [signedExternally, setSignedExternally] = useState(false);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [externalSignedDate, setExternalSignedDate] = useState(new Date().toISOString().split("T")[0]);
  const sigRef = useRef<SignatureCanvas | null>(null);
  useSignatureCanvasResize(sigRef as any, [mode]);

  useEffect(() => {
    // Check existing agreements
    Promise.all([
      supabase.from("verneombud_agreements").select("id, verneombud_name").eq("company_id", companyId).eq("status", "active").maybeSingle(),
      supabase.from("verneombud_exemption_agreements").select("id").eq("company_id", companyId).maybeSingle(),
    ]).then(([{ data: agreement }, { data: exemption }]) => {
      if (agreement) {
        setAlreadyHasAgreement(true);
        setVerneombudName(agreement.verneombud_name || "");
      }
      if (exemption) setAlreadyHasExemption(true);
    });

    if (profile?.id) {
      supabase.rpc("get_profile_sensitive_full", { p_profile_id: profile.id })
        .then(({ data }) => {
          const s = Array.isArray(data) ? data[0] : data;
          if (s?.signature_data) setSavedSignature(s.signature_data);
        });
    }
  }, [companyId, profile?.id]);

  useEffect(() => {
    if (selectedUserId && selectedUserId !== "custom") {
      const user = users.find(u => u.id === selectedUserId);
      if (user) setVerneombudName(getUserDisplayName(user));
    }
  }, [selectedUserId, users, getUserDisplayName]);

  const hasValidExistingExemption = alreadyHasExemption && !needsVerneombud;

  // Already handled
  if (alreadyHasAgreement || hasValidExistingExemption) {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">
              {alreadyHasAgreement 
                ? `Verneombud registrert: ${verneombudName} ✅`
                : "Avtale om fritak fra verneombud allerede signert ✅"
              }
            </p>
          </div>
          <Button size="sm" onClick={() => onComplete(verneombudName, hasValidExistingExemption)} className="shrink-0">
            {t("auto.neste")} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    );
  }

  const handleSaveExemption = async () => {
    if (needsVerneombud) {
      toast.error(t("auto.virksomheter_med_5_eller_flere_ansatte_m"));
      return;
    }

    let sig = "";
    if (!signedExternally) {
      sig = usingSavedSignature ? savedSignature || "" : sigRef.current?.toDataURL() || "";
      if (!sig || (sigRef.current?.isEmpty() && !usingSavedSignature)) {
        toast.error(t("auto.vennligst_signer"));
        return;
      }
    } else if (!externalFile) {
      toast.error("Last opp dokumentasjon på den signerte avtalen");
      return;
    }

    setIsSaving(true);
    try {
      let externalPath: string | null = null;
      if (signedExternally && externalFile) {
        const safeName = externalFile.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[æÆ]/g, "ae")
          .replace(/[øØ]/g, "o")
          .replace(/[åÅ]/g, "a")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        externalPath = `${companyId}/fritaksavtale-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("verneombud-documents")
          .upload(externalPath, externalFile, { upsert: false });
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase.from("verneombud_exemption_agreements").insert([{
        company_id: companyId,
        total_employees: employeeCount,
        employer_name: verneombudName || "Daglig leder",
        employer_signature: signedExternally ? null : sig,
        employer_signed_at: signedExternally
          ? (externalSignedDate ? new Date(externalSignedDate).toISOString() : new Date().toISOString())
          : new Date().toISOString(),
        employee_signatures: [],
        status: "active",
        agreement_date: signedExternally && externalSignedDate
          ? externalSignedDate
          : new Date().toISOString().split("T")[0],
        signed_externally: signedExternally,
        external_document_path: externalPath,
        external_document_name: signedExternally ? externalFile?.name ?? null : null,
        external_signed_date: signedExternally ? externalSignedDate || null : null,
      }]);
      if (error) throw error;
      toast.success(t("auto.avtale_om_fritak_signert"));
      setMode("done");
      onComplete("", true);
    } catch (error) {
      console.error(error);
      toast.error(t("auto.kunne_ikke_lagre_avtalen"));
    } finally {
      setIsSaving(false);
    }
  };


  const handleSaveVerneombud = async () => {
    if (!verneombudName.trim()) {
      toast.error(t("auto.vennligst_skriv_inn_navn_paa_verneombud"));
      return;
    }
    // Save without signature requirement - can sign later
    setIsSaving(true);
    try {
      const { error } = await supabase.from("verneombud_agreements").insert({
        company_id: companyId,
        verneombud_name: verneombudName,
        election_date: new Date().toISOString().split("T")[0],
        election_method: "appointment",
        employer_name: "",
        employer_signature: "",
        employer_signed_at: null,
        status: "active",
      });
      if (error) throw error;
      toast.success(t("auto.verneombud_registrert"));
      setMode("done");
      onComplete(verneombudName, false);
    } catch (error) {
      console.error(error);
      toast.error(t("auto.kunne_ikke_lagre_2"));
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "done") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm font-medium text-success">{t("auto.verneombud_steget_fullfoert")}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">{t("auto.verneombud")}</h3>
      </div>

      {mode === "choose" && (
        <>
          <div className="bg-primary/5 rounded-lg p-3 text-xs sm:text-sm border border-primary/10">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                {needsVerneombud ? (
                  <p>{t("auto.bedriften_har")} <strong>{employeeCount} ansatte</strong> {t("auto.og_er")} <strong>{t("auto.paalagt_aa_ha_verneombud")}</strong> {t("auto.iht_arbeidsmiljoeloven_6_1")}</p>
                ) : (
                  <p>{t("auto.bedriften_har")} <strong>{t("auto.faerre_enn_5_ansatte")}</strong>{t("auto.dere_kan_velge_aa_ha_verneombud_eller_sk")}</p>
                )}
              </div>
            </div>
          </div>

          {needsVerneombud ? (
            <div className="space-y-3">
              <p className="text-sm">{t("auto.hvem_er_verneombud_i_bedriften")}</p>
              <div>
                <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); if (v === "custom") setVerneombudName(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_fra_ansatte")} />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingUsers && users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{getUserDisplayName(user)}</SelectItem>
                    ))}
                    <SelectItem value="custom">{t("auto.skriv_inn_manuelt_2")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(selectedUserId === "custom" || !selectedUserId) && (
                <Input value={verneombudName} onChange={(e) => setVerneombudName(e.target.value)} placeholder={t("auto.skriv_inn_navnet_paa_verneombudet")} />
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={onSkip}>{t("auto.fullfoer_senere")}</Button>
                <Button size="sm" onClick={handleSaveVerneombud} disabled={!verneombudName.trim() || isSaving}>
                  {isSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Registrer verneombud
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode("assign")} className="justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Vi har valgt et verneombud
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode("sign_exempt")} className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Signer avtale om fritak
              </Button>
              <Button variant="ghost" size="sm" onClick={onSkip} className="justify-start text-muted-foreground">
                {t("auto.avklar_dette_senere")}
              </Button>
            </div>
          )}
        </>
      )}

      {mode === "assign" && (
        <div className="space-y-3">
          <p className="text-sm">{t("auto.hvem_er_verneombud")}</p>
          <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); if (v === "custom") setVerneombudName(""); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("auto.velg_fra_ansatte")} />
            </SelectTrigger>
            <SelectContent>
              {!isLoadingUsers && users.map((user) => (
                <SelectItem key={user.id} value={user.id}>{getUserDisplayName(user)}</SelectItem>
              ))}
              <SelectItem value="custom">{t("auto.skriv_inn_manuelt_2")}</SelectItem>
            </SelectContent>
          </Select>
          {(selectedUserId === "custom" || !selectedUserId) && (
            <Input value={verneombudName} onChange={(e) => setVerneombudName(e.target.value)} placeholder={t("auto.fullt_navn")} />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setMode("choose")}>{t("auto.tilbake")}</Button>
            <Button size="sm" onClick={handleSaveVerneombud} disabled={!verneombudName.trim() || isSaving}>
              {isSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Registrer
            </Button>
          </div>
        </div>
      )}

      {mode === "sign_exempt" && (
        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-3 text-xs sm:text-sm border">
            <p className="mb-2 font-medium">{t("auto.avtale_om_fritak_fra_verneombud")}</p>
            <p className="text-muted-foreground">
              I henhold til arbeidsmiljøloven §6-1 avtales det at virksomheten ({companyName}, {employeeCount} ansatte) 
              er fritatt fra kravet om verneombud. Arbeidsgiver forplikter seg til å ivareta HMS forsvarlig.
            </p>
          </div>

          <div className="space-y-2">
            <Input value={verneombudName} onChange={(e) => setVerneombudName(e.target.value)} placeholder="Navn (arbeidsgiver)" />

            {!signedExternally ? (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t("auto.signatur")}</Label>
                  {savedSignature && !usingSavedSignature && (
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      sigRef.current?.fromDataURL(savedSignature);
                      setUsingSavedSignature(true);
                    }} className="text-xs h-7 gap-1">
                      <User className="h-3 w-3" /> Bruk min signatur
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg bg-white relative">
                  <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-24 touch-none" }} backgroundColor="white" />
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { sigRef.current?.clear(); setUsingSavedSignature(false); }}>
                  {t("auto.toem_signatur")}
                </Button>
              </>
            ) : (
              <VerneombudExternalDocUpload
                file={externalFile}
                onFileChange={setExternalFile}
                signedDate={externalSignedDate}
                onSignedDateChange={setExternalSignedDate}
                disabled={isSaving}
              />
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground text-xs"
              onClick={() => {
                setSignedExternally((prev) => !prev);
                sigRef.current?.clear();
                setUsingSavedSignature(false);
                if (signedExternally) setExternalFile(null);
              }}
            >
              <FileUp className="w-4 h-4 mr-2" />
              {signedExternally ? "Signer digitalt i stedet" : "Avtalen er signert på annen måte – last opp vedlegg"}
            </Button>
          </div>


          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setMode("choose")}>{t("auto.tilbake")}</Button>
            <Button size="sm" onClick={handleSaveExemption} disabled={isSaving}>
              {isSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Signer avtale
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
