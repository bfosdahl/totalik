import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle2, Loader2, PenLine, X, ArrowLeft, ArrowRight, Shield, User, FileUp } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { VerneombudExternalDocUpload } from "./VerneombudExternalDocUpload";
import { t } from "@/i18n/t";

interface VerneombudAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  onComplete?: () => void;
}

type Step = "info" | "verneombud" | "employer" | "complete";

const SESSION_STORAGE_KEY = "verneombud_agreement_state";

interface PersistedState {
  step: Step;
  verneombudName: string;
  verneombudEmail: string;
  verneombudPhone: string;
  electionMethod: string;
  termStart: string;
  termEnd: string;
  trainingCompleted: boolean;
  trainingDate: string;
  notes: string;
  verneombudSignature: string;
  employerName: string;
  employerSignature: string;
  selectedVerneombudUserId: string;
  selectedEmployerUserId: string;
  companyId: string;
}

export function VerneombudAgreementDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  onComplete,
}: VerneombudAgreementDialogProps) {
  const { profile } = useAuth();
  const { users, isLoading: isLoadingUsers, getUserDisplayName } = useCompanyUsers();
  
  const getInitialState = useCallback((): Partial<PersistedState> => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedState;
        if (parsed.companyId === companyId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved state:", e);
    }
    return {};
  }, [companyId]);

  const initialState = getInitialState();
  
  const [step, setStep] = useState<Step>(initialState.step || "info");
  const [verneombudName, setVerneombudName] = useState(initialState.verneombudName || "");
  const [verneombudEmail, setVerneombudEmail] = useState(initialState.verneombudEmail || "");
  const [verneombudPhone, setVerneombudPhone] = useState(initialState.verneombudPhone || "");
  const [electionMethod, setElectionMethod] = useState(initialState.electionMethod || "");
  const [termStart, setTermStart] = useState(initialState.termStart || format(new Date(), "yyyy-MM-dd"));
  const [termEnd, setTermEnd] = useState(initialState.termEnd || "");
  const [trainingCompleted, setTrainingCompleted] = useState(initialState.trainingCompleted || false);
  const [trainingDate, setTrainingDate] = useState(initialState.trainingDate || "");
  const [notes, setNotes] = useState(initialState.notes || "");
  const [verneombudSignature, setVerneombudSignature] = useState(initialState.verneombudSignature || "");
  const [employerName, setEmployerName] = useState(initialState.employerName || "");
  const [employerSignature, setEmployerSignature] = useState(initialState.employerSignature || "");
  const [selectedVerneombudUserId, setSelectedVerneombudUserId] = useState(initialState.selectedVerneombudUserId || "");
  const [selectedEmployerUserId, setSelectedEmployerUserId] = useState(initialState.selectedEmployerUserId || "");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedVerneombudSig, setUsingSavedVerneombudSig] = useState(false);
  const [usingSavedEmployerSig, setUsingSavedEmployerSig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signedExternally, setSignedExternally] = useState(false);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [externalSignedDate, setExternalSignedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  
  const verneombudSigRef = useRef<SignatureCanvas>(null);
  const employerSigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (profile?.id) {
      supabase
        .rpc("get_profile_sensitive_full", { p_profile_id: profile.id })
        .then(({ data }) => {
          const s = Array.isArray(data) ? data[0] : data;
          if (s?.signature_data) setSavedSignature(s.signature_data);
        });
    }
  }, [profile?.id]);

  // Auto-populate verneombud name when user is selected
  useEffect(() => {
    if (selectedVerneombudUserId && selectedVerneombudUserId !== "custom") {
      const user = users.find(u => u.id === selectedVerneombudUserId);
      if (user) {
        setVerneombudName(getUserDisplayName(user));
        setVerneombudEmail(user.email || "");
      }
    }
  }, [selectedVerneombudUserId, users, getUserDisplayName]);

  // Auto-populate employer name when user is selected
  useEffect(() => {
    if (selectedEmployerUserId && selectedEmployerUserId !== "custom") {
      const user = users.find(u => u.id === selectedEmployerUserId);
      if (user) {
        setEmployerName(getUserDisplayName(user));
      }
    }
  }, [selectedEmployerUserId, users, getUserDisplayName]);

  // Persist state
  useEffect(() => {
    if (step === "complete") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    const state: PersistedState = {
      step,
      verneombudName,
      verneombudEmail,
      verneombudPhone,
      electionMethod,
      termStart,
      termEnd,
      trainingCompleted,
      trainingDate,
      notes,
      verneombudSignature,
      employerName,
      employerSignature,
      selectedVerneombudUserId,
      selectedEmployerUserId,
      companyId,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  }, [step, verneombudName, verneombudEmail, verneombudPhone, electionMethod, termStart, termEnd, trainingCompleted, trainingDate, notes, verneombudSignature, employerName, employerSignature, selectedVerneombudUserId, selectedEmployerUserId, companyId]);

  const handleClearVerneombudSig = () => {
    verneombudSigRef.current?.clear();
    setVerneombudSignature("");
    setUsingSavedVerneombudSig(false);
  };

  const handleClearEmployerSig = () => {
    employerSigRef.current?.clear();
    setEmployerSignature("");
    setUsingSavedEmployerSig(false);
  };

  const useSavedVerneombudSignature = () => {
    if (savedSignature && verneombudSigRef.current) {
      verneombudSigRef.current.fromDataURL(savedSignature);
      setUsingSavedVerneombudSig(true);
      setVerneombudSignature(savedSignature);
    }
  };

  const useSavedEmployerSignature = () => {
    if (savedSignature && employerSigRef.current) {
      employerSigRef.current.fromDataURL(savedSignature);
      setUsingSavedEmployerSig(true);
      setEmployerSignature(savedSignature);
    }
  };

  const handleSubmit = async () => {
    if (!verneombudName) {
      toast.error(t("auto.vennligst_fyll_ut_alle_paakrevde_felt"));
      return;
    }
    if (signedExternally && !externalFile) {
      toast.error("Last opp dokumentasjon på den signerte avtalen");
      return;
    }
    if (!signedExternally && !employerSignature) {
      toast.error(t("auto.vennligst_fyll_ut_alle_paakrevde_felt"));
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
        externalPath = `${companyId}/verneombudsavtale-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("verneombud-documents")
          .upload(externalPath, externalFile, { upsert: false });
        if (uploadError) throw uploadError;
      }

      // Check if there's an existing agreement
      const { data: existing } = await supabase
        .from("verneombud_agreements")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();

      const agreementData = {
        company_id: companyId,
        verneombud_name: verneombudName,
        verneombud_email: verneombudEmail || null,
        verneombud_phone: verneombudPhone || null,
        election_date: new Date().toISOString().split("T")[0],
        election_method: electionMethod || null,
        term_start: termStart || null,
        term_end: termEnd || null,
        verneombud_signature: signedExternally ? null : verneombudSignature || null,
        verneombud_signed_at: !signedExternally && verneombudSignature ? new Date().toISOString() : null,
        employer_name: employerName || null,
        employer_signature: signedExternally ? null : employerSignature,
        employer_signed_at: signedExternally
          ? (externalSignedDate ? new Date(externalSignedDate).toISOString() : new Date().toISOString())
          : new Date().toISOString(),
        training_completed: trainingCompleted,
        training_date: trainingDate || null,
        notes: notes || null,
        status: "active",
        signed_externally: signedExternally,
        external_document_path: externalPath,
        external_document_name: signedExternally ? externalFile?.name ?? null : null,
        external_signed_date: signedExternally ? externalSignedDate || null : null,
      };


      if (existing) {
        const { error } = await supabase
          .from("verneombud_agreements")
          .update(agreementData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("verneombud_agreements")
          .insert(agreementData);

        if (error) throw error;
      }

      toast.success(t("auto.verneombudsavtale_lagret"));
      setStep("complete");
    } catch (error) {
      console.error("Error saving verneombud agreement:", error);
      toast.error(t("auto.kunne_ikke_lagre_avtalen"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (clearState = false) => {
    if (clearState) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    onOpenChange(false);
    if (step === "complete") {
      onComplete?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Valg av verneombud
          </DialogTitle>
          <DialogDescription>
            Dokumenter valg av verneombud for {companyName}
          </DialogDescription>
        </DialogHeader>

        {step === "info" && (
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">{t("auto.om_verneombud")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("auto.alle_virksomheter_med_5_eller_flere_ansa")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verneombudSelect">{t("auto.velg_verneombud")}</Label>
                <Select 
                  value={selectedVerneombudUserId} 
                  onValueChange={(value) => {
                    setSelectedVerneombudUserId(value);
                    if (value === "custom") {
                      setVerneombudName("");
                      setVerneombudEmail("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_fra_ansatte_eller_skriv_inn_manuelt")} />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingUsers && users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t("auto.skriv_inn_manuelt_2")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verneombudName">{t("auto.verneombudets_navn")}</Label>
                  <Input
                    id="verneombudName"
                    value={verneombudName}
                    onChange={(e) => setVerneombudName(e.target.value)}
                    placeholder={t("auto.fullt_navn")}
                    disabled={selectedVerneombudUserId !== "" && selectedVerneombudUserId !== "custom"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electionMethod">{t("auto.valgmetode_2")}</Label>
                  <Select value={electionMethod} onValueChange={setElectionMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_metode")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="election">{t("auto.valg_blant_ansatte")}</SelectItem>
                      <SelectItem value="appointment">{t("auto.utpekt_av_arbeidsgiver")}</SelectItem>
                      <SelectItem value="volunteer">{t("auto.frivillig")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verneombudEmail">{t("auto.e_post_2")}</Label>
                  <Input
                    id="verneombudEmail"
                    type="email"
                    value={verneombudEmail}
                    onChange={(e) => setVerneombudEmail(e.target.value)}
                    placeholder="epost@eksempel.no"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verneombudPhone">{t("auto.telefon")}</Label>
                  <Input
                    id="verneombudPhone"
                    type="tel"
                    value={verneombudPhone}
                    onChange={(e) => setVerneombudPhone(e.target.value)}
                    placeholder="+47 123 45 678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="termStart">{t("auto.funksjonsperiode_fra")}</Label>
                  <Input
                    id="termStart"
                    type="date"
                    value={termStart}
                    onChange={(e) => setTermStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termEnd">{t("auto.funksjonsperiode_til_2")}</Label>
                  <Input
                    id="termEnd"
                    type="date"
                    value={termEnd}
                    onChange={(e) => setTermEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trainingCompleted"
                  checked={trainingCompleted}
                  onCheckedChange={(checked) => setTrainingCompleted(checked === true)}
                />
                <Label htmlFor="trainingCompleted" className="text-sm">
                  {t("auto.verneombudet_har_gjennomfoert_opplaering")}
                </Label>
              </div>

              {trainingCompleted && (
                <div className="space-y-2">
                  <Label htmlFor="trainingDate">{t("auto.dato_for_opplaering")}</Label>
                  <Input
                    id="trainingDate"
                    type="date"
                    value={trainingDate}
                    onChange={(e) => setTrainingDate(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">{t("auto.notater")}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("auto.eventuelle_merknader")}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {step === "verneombud" && (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>{verneombudName}</strong> bekrefter herved å påta seg rollen som verneombud 
                for {companyName}.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("auto.verneombudets_signatur_2")}</Label>
                <div className="flex items-center gap-2">
                  {savedSignature && !usingSavedVerneombudSig && !verneombudSignature && (
                    <Button variant="outline" size="sm" onClick={useSavedVerneombudSignature} className="text-primary">
                      <User className="w-4 h-4 mr-1" />
                      Bruk min signatur
                    </Button>
                  )}
                  {verneombudSignature && (
                    <Button variant="ghost" size="sm" onClick={handleClearVerneombudSig}>
                      <X className="w-4 h-4 mr-1" />
                      {t("auto.slett")}
                    </Button>
                  )}
                </div>
              </div>
              <div className="border rounded-lg bg-white relative">
                <SignatureCanvas
                  ref={verneombudSigRef}
                  canvasProps={{
                    className: "w-full h-40 rounded-lg",
                    style: { width: "100%", height: "160px" },
                  }}
                  onEnd={() => {
                    const data = verneombudSigRef.current?.toDataURL("image/png");
                    if (data) setVerneombudSignature(data);
                  }}
                />
                {!verneombudSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground text-sm">
                      {savedSignature ? "Tegn eller bruk lagret signatur" : "Tegn signaturen din her"}
                    </p>
                  </div>
                )}
              </div>
              {usingSavedVerneombudSig && (
                <span className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Bruker lagret signatur
                </span>
              )}
            </div>
          </div>
        )}

        {step === "employer" && (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                {t("auto.arbeidsgiver_bekrefter_at")} <strong>{verneombudName}</strong> er valgt som verneombud 
                for {companyName}.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employerSelect">{t("auto.velg_arbeidsgiver")}</Label>
              <Select 
                value={selectedEmployerUserId} 
                onValueChange={(value) => {
                  setSelectedEmployerUserId(value);
                  if (value === "custom") {
                    setEmployerName("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg_fra_ansatte_eller_skriv_inn_manuelt")} />
                </SelectTrigger>
                <SelectContent>
                  {!isLoadingUsers && users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t("auto.skriv_inn_manuelt_2")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedEmployerUserId === "custom" || !selectedEmployerUserId) && (
              <div className="space-y-2">
                <Label htmlFor="employerName">{t("auto.arbeidsgivers_navn")}</Label>
                <Input
                  id="employerName"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  placeholder={t("auto.fullt_navn")}
                />
              </div>
            )}

            {selectedEmployerUserId && selectedEmployerUserId !== "custom" && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm"><strong>{t("auto.valgt_person")}</strong> {employerName}</p>
              </div>
            )}

            {!signedExternally && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("auto.arbeidsgivers_signatur")}</Label>
                <div className="flex items-center gap-2">
                  {savedSignature && !usingSavedEmployerSig && !employerSignature && (
                    <Button variant="outline" size="sm" onClick={useSavedEmployerSignature} className="text-primary">
                      <User className="w-4 h-4 mr-1" />
                      Bruk min signatur
                    </Button>
                  )}
                  {employerSignature && (
                    <Button variant="ghost" size="sm" onClick={handleClearEmployerSig}>
                      <X className="w-4 h-4 mr-1" />
                      {t("auto.slett")}
                    </Button>
                  )}
                </div>
              </div>
              <div className="border rounded-lg bg-white relative">
                <SignatureCanvas
                  ref={employerSigRef}
                  canvasProps={{
                    className: "w-full h-40 rounded-lg",
                    style: { width: "100%", height: "160px" },
                  }}
                  onEnd={() => {
                    const data = employerSigRef.current?.toDataURL("image/png");
                    if (data) setEmployerSignature(data);
                  }}
                />
                {!employerSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground text-sm">
                      {savedSignature ? "Tegn eller bruk lagret signatur" : "Tegn signaturen din her"}
                    </p>
                  </div>
                )}
              </div>
              {usingSavedEmployerSig && (
                <span className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Bruker lagret signatur
                </span>
              )}
            </div>
            )}

            {signedExternally && (
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
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                setSignedExternally((prev) => !prev);
                if (!signedExternally) {
                  handleClearEmployerSig();
                } else {
                  setExternalFile(null);
                }
              }}
            >
              <FileUp className="w-4 h-4 mr-2" />
              {signedExternally
                ? "Signer digitalt i stedet"
                : "Avtalen er signert på annen måte – last opp vedlegg"}
            </Button>
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("auto.verneombudsavtale_signert")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("auto.avtalen_om_valg_av_verneombud_er_naa_lag")}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "info" && (
            <>
              <Button variant="outline" onClick={() => handleClose(true)}>
                {t("auto.avbryt")}
              </Button>
              <Button 
                onClick={() => setStep("verneombud")}
                disabled={!verneombudName}
              >
                {t("auto.neste")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === "verneombud" && (
            <>
              <Button variant="outline" onClick={() => setStep("info")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("auto.tilbake")}
              </Button>
              <Button onClick={() => setStep("employer")}>
                {t("auto.neste")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === "employer" && (
            <>
              <Button variant="outline" onClick={() => setStep("verneombud")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("auto.tilbake")}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || !employerName || !employerSignature}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  <>
                    <PenLine className="w-4 h-4 mr-2" />
                    {t("auto.lagre_avtale")}
                  </>
                )}
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={() => handleClose(true)}>
              {t("auto.lukk")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
