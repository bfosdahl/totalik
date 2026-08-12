import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, CheckCircle2, User, UserPlus, Trash2, Download } from "lucide-react";
import { generateVerneombudExemptionPdf } from "@/utils/generateVerneombudExemptionPdf";
import SignatureCanvas from "react-signature-canvas";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/i18n/t";

interface VerneombudExemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  companyAddress?: string;
  orgNumber?: string;
  totalEmployees: number;
  onComplete: (wasSkipped?: boolean) => void;
}

interface EmployeeSignatureEntry {
  name: string;
  signature: string;
  signed_at: string;
  [key: string]: string; // Index signature for Json compatibility
}

type Step = "info" | "employer" | "employees" | "complete";

const SESSION_STORAGE_KEY = "verneombud_exemption_state";
const VERNEOMBUD_EXEMPTION_EMPLOYEE_LIMIT = 5;

interface PersistedState {
  step: Step;
  employerName: string;
  employerSignature: string;
  selectedUserId: string;
  employeeSignatures: EmployeeSignatureEntry[];
  companyId: string;
}

export function VerneombudExemptionDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  companyAddress,
  orgNumber,
  totalEmployees,
  onComplete,
}: VerneombudExemptionDialogProps) {
  const { profile } = useAuth();
  const { users, isLoading: isLoadingUsers, getUserDisplayName } = useCompanyUsers();
  const isExemptionAllowed = totalEmployees < VERNEOMBUD_EXEMPTION_EMPLOYEE_LIMIT;
  
  const getInitialState = useCallback((): PersistedState | null => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedState;
        if (parsed.companyId === companyId) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading persisted state:", e);
    }
    return null;
  }, [companyId]);

  const initialState = getInitialState();

  const [step, setStep] = useState<Step>(initialState?.step || "info");
  const [employerName, setEmployerName] = useState(initialState?.employerName || "");
  const [employerSignature, setEmployerSignature] = useState(initialState?.employerSignature || "");
  const [selectedUserId, setSelectedUserId] = useState(initialState?.selectedUserId || "");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Employee signing state
  const [employeeSignatures, setEmployeeSignatures] = useState<EmployeeSignatureEntry[]>(
    initialState?.employeeSignatures || []
  );
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState("");
  const employeeSigRef = useRef<SignatureCanvas | null>(null);
  const [employeeSigEmpty, setEmployeeSigEmpty] = useState(true);
  
  const employerSigRef = useRef<SignatureCanvas | null>(null);

  // Get employees that haven't signed yet (exclude employer)
  const unsignedEmployees = users.filter(u => {
    const displayName = getUserDisplayName(u);
    // Exclude the employer
    if (displayName === employerName) return false;
    // Exclude already signed
    return !employeeSignatures.some(es => es.name === displayName);
  });

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

  // Auto-populate employer name when user is selected
  useEffect(() => {
    if (selectedUserId && selectedUserId !== "custom") {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setEmployerName(getUserDisplayName(user));
      }
    }
  }, [selectedUserId, users, getUserDisplayName]);

  // Auto-populate employee name when selected
  useEffect(() => {
    if (selectedEmployeeUserId && selectedEmployeeUserId !== "custom") {
      const user = users.find(u => u.id === selectedEmployeeUserId);
      if (user) {
        setCurrentEmployeeName(getUserDisplayName(user));
      }
    }
  }, [selectedEmployeeUserId, users, getUserDisplayName]);

  // Persist state to sessionStorage
  useEffect(() => {
    if (step === "complete") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    
    const stateToSave: PersistedState = {
      step,
      employerName,
      employerSignature,
      selectedUserId,
      employeeSignatures,
      companyId,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [step, employerName, employerSignature, selectedUserId, employeeSignatures, companyId]);

  const handleClearEmployerSig = () => {
    employerSigRef.current?.clear();
    setEmployerSignature("");
    setUsingSavedSignature(false);
  };

  const useSavedSignatureHandler = () => {
    if (savedSignature && employerSigRef.current) {
      employerSigRef.current.fromDataURL(savedSignature);
      setUsingSavedSignature(true);
      setEmployerSignature(savedSignature);
    }
  };

  const handleEmployerNext = () => {
    if (employerSigRef.current?.isEmpty()) {
      toast.error(t("auto.vennligst_signer_foer_du_gaar_videre"));
      return;
    }
    const sig = employerSigRef.current?.toDataURL() || "";
    setEmployerSignature(sig);
    setStep("employees");
  };

  const handleAddEmployeeSignature = () => {
    if (!currentEmployeeName.trim()) {
      toast.error(t("auto.velg_eller_skriv_inn_ansattens_navn"));
      return;
    }
    if (!employeeSigRef.current || employeeSigRef.current.isEmpty()) {
      toast.error(t("auto.den_ansatte_maa_signere_foer_den_kan_leg"));
      return;
    }

    const sig = employeeSigRef.current.toDataURL();
    const newEntry: EmployeeSignatureEntry = {
      name: currentEmployeeName.trim(),
      signature: sig,
      signed_at: new Date().toISOString(),
    };

    setEmployeeSignatures(prev => [...prev, newEntry]);
    setCurrentEmployeeName("");
    setSelectedEmployeeUserId("");
    setEmployeeSigEmpty(true);
    // Clear canvas after a short delay to ensure state updates first
    setTimeout(() => {
      employeeSigRef.current?.clear();
    }, 50);
    toast.success(`${newEntry.name} har signert avtalen`);
  };

  const handleRemoveEmployeeSignature = (index: number) => {
    setEmployeeSignatures(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isExemptionAllowed) {
      toast.error(t("auto.virksomheter_med_5_eller_flere_ansatte_m"));
      return;
    }

    if (employeeSignatures.length === 0) {
      toast.error(t("auto.minst_n_ansatt_maa_signere_avtalen"));
      return;
    }

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("verneombud_exemption_agreements")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();

      const payload = {
        total_employees: totalEmployees,
        employer_name: employerName,
        employer_signature: employerSignature,
        employer_signed_at: new Date().toISOString(),
        employee_signatures: employeeSignatures,
        status: "active",
        agreement_date: new Date().toISOString().split("T")[0],
      };

      let error;
      if (existing) {
        const result = await supabase
          .from("verneombud_exemption_agreements")
          .update(payload)
          .eq("id", existing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("verneombud_exemption_agreements")
          .insert([{ company_id: companyId, ...payload }]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(t("auto.avtale_om_fritak_fra_verneombud_er_signe"));
      setStep("complete");
    } catch (error) {
      console.error("Error saving exemption agreement:", error);
      toast.error(t("auto.kunne_ikke_lagre_avtalen_proev_igjen"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (clearState = false) => {
    if (step === "complete") {
      onComplete(false);
      clearState = true;
    }
    onOpenChange(false);
    
    if (clearState) {
      setStep("info");
      setEmployerName("");
      setEmployerSignature("");
      setSelectedUserId("");
      setEmployeeSignatures([]);
      setUsingSavedSignature(false);
      setCurrentEmployeeName("");
      setSelectedEmployeeUserId("");
      setEmployeeSigEmpty(true);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const handleCancel = () => {
    handleClose(true);
  };

  const today = new Date().toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stepDescriptions: Record<Step, string> = {
    info: "Virksomheter med færre enn 5 ansatte kan avtale skriftlig fritak fra verneombud",
    employer: "Arbeidsgiver signerer avtalen på vegne av bedriften",
    employees: "Alle ansatte må signere avtalen for at den skal være gyldig",
    complete: "Avtalen er signert og lagret",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Avtale om fritak fra verneombud
          </DialogTitle>
          <DialogDescription>{stepDescriptions[step]}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        {step !== "complete" && (
          <div className="flex items-center gap-2 px-1">
            {(["info", "employer", "employees"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s ? "bg-primary text-primary-foreground" :
                  (["info", "employer", "employees"].indexOf(step) > i) ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {s === "info" ? "Avtale" : s === "employer" ? "Arbeidsgiver" : "Ansatte"}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {step === "info" && (
            <div className="space-y-4">
              {!isExemptionAllowed && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="font-medium text-destructive mb-1">{t("auto.fritak_kan_ikke_brukes")}</p>
                  <p className="text-sm text-muted-foreground">
                    Virksomheten har {totalEmployees} ansatte. Ved 5 eller flere ansatte skal det velges verneombud.
                  </p>
                </div>
              )}

              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-3">{t("auto.avtale_om_fritak_fra_verneombud")}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">{t("auto.mellom_arbeidsgiver")}</span>
                    <span className="font-medium">{companyName}</span>
                  </div>
                  {orgNumber && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">{t("auto.organisasjonsnummer_2")}</span>
                      <span className="font-mono">{orgNumber}</span>
                    </div>
                  )}
                  {companyAddress && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">{t("auto.adresse_2")}</span>
                      <span>{companyAddress}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">{t("auto.antall_ansatte_2")}</span>
                    <Badge variant="secondary">{totalEmployees} ansatte</Badge>
                  </div>
                </div>
              </Card>

              <div className="space-y-3 text-sm">
                <p className="font-medium">{t("auto.og_de_ansatte_ved_virksomheten")}</p>
                
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="font-medium text-primary mb-1">{t("auto.bakgrunn")}</p>
                  <p className="text-muted-foreground">
                    {t("auto.denne_avtalen_inngaas_i_henhold_til_arbe")}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">{t("auto.1_avtalens_formaal")}</p>
                  <p className="text-muted-foreground">
                    Formålet med denne avtalen er å formalisere enighet mellom arbeidsgiver og ansatte 
                    om at det ikke er nødvendig å velge verneombud i virksomheten, grunnet virksomhetens 
                    størrelse og enighet mellom partene.
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">{t("auto.2_grunnlag_for_fritak")}</p>
                  <p className="text-muted-foreground">
                    Virksomheten har totalt {totalEmployees} ansatte, og partene er enige om at det ikke er 
                    behov for verneombud i henhold til gjeldende regelverk. Arbeidsgiver forplikter seg til 
                    fortsatt å ivareta helse, miljø og sikkerhet (HMS) på en forsvarlig måte.
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">{t("auto.3_ansvar_og_oppfoelging")}</p>
                  <p className="text-muted-foreground">
                    {t("auto.selv_om_verneombud_ikke_velges_forplikte")}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">{t("auto.4_avtalens_varighet_og_revisjon")}</p>
                  <p className="text-muted-foreground">
                    {t("auto.denne_avtalen_gjelder_inntil_videre_men_")}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">{t("auto.krav_til_signering")}</p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs">
                    {t("auto.denne_avtalen_krever_signatur_fra_baade_")}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-muted-foreground">Dato: {today}</p>
                </div>
              </div>
            </div>
          )}

          {step === "employer" && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  {t("auto.daglig_leder_eller_den_som_representerer")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerSelect">{t("auto.velg_person_eller_skriv_inn_navn")}</Label>
                <Select 
                  value={selectedUserId} 
                  onValueChange={(value) => {
                    setSelectedUserId(value);
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

              {(selectedUserId === "custom" || !selectedUserId) && (
                <div>
                  <Label htmlFor="employerName">{t("auto.arbeidsgivers_navn_2")}</Label>
                  <Input
                    id="employerName"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder={t("auto.skriv_inn_fullt_navn")}
                    className="mt-1"
                  />
                </div>
              )}

              {selectedUserId && selectedUserId !== "custom" && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm"><strong>{t("auto.valgt_person")}</strong> {employerName}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("auto.arbeidsgivers_signatur_2")}</Label>
                  {savedSignature && !usingSavedSignature && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={useSavedSignatureHandler}
                      className="text-primary"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Bruk min signatur
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg bg-white relative">
                  <SignatureCanvas
                    ref={employerSigRef}
                    canvasProps={{
                      className: "w-full h-32 touch-none",
                    }}
                    backgroundColor="white"
                  />
                  {!usingSavedSignature && employerSigRef.current?.isEmpty() !== false && !employerSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-muted-foreground text-sm">
                        {savedSignature ? "Tegn eller bruk lagret signatur" : "Tegn signaturen din her"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearEmployerSig}>
                    {t("auto.toem_signatur")}
                  </Button>
                  {usingSavedSignature && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Bruker lagret signatur
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Dato: {today}
              </div>
            </div>
          )}

          {step === "employees" && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  {t("auto.alle_ansatte_i_virksomheten_maa_signere_")}
                </p>
              </div>

              {/* Already signed employees */}
              {employeeSignatures.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Ansatte som har signert ({employeeSignatures.length})
                  </Label>
                  <div className="space-y-2">
                    {employeeSignatures.map((es, index) => (
                      <Card key={index} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{es.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Signert {new Date(es.signed_at).toLocaleDateString("nb-NO", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmployeeSignature(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Add new employee signature */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Legg til ansatt-signatur
                </Label>

                <div className="space-y-2">
                  <Label className="text-xs">{t("auto.velg_ansatt")}</Label>
                  <Select 
                    value={selectedEmployeeUserId} 
                    onValueChange={(value) => {
                      setSelectedEmployeeUserId(value);
                      if (value === "custom") {
                        setCurrentEmployeeName("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_ansatt_fra_listen_eller_skriv_inn_m")} />
                    </SelectTrigger>
                    <SelectContent>
                      {unsignedEmployees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserDisplayName(user)}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">{t("auto.skriv_inn_manuelt_2")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedEmployeeUserId === "custom") && (
                  <div>
                    <Label className="text-xs">{t("auto.ansattens_navn")}</Label>
                    <Input
                      value={currentEmployeeName}
                      onChange={(e) => setCurrentEmployeeName(e.target.value)}
                      placeholder={t("auto.skriv_inn_fullt_navn")}
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedEmployeeUserId && selectedEmployeeUserId !== "custom" && (
                  <div className="p-2 bg-muted/50 rounded text-sm">
                    <strong>{t("auto.ansatt_3")}</strong> {currentEmployeeName}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">{t("auto.ansattens_signatur")}</Label>
                  <div className="border rounded-lg bg-white relative">
                    <SignatureCanvas
                      ref={employeeSigRef}
                      canvasProps={{
                        className: "w-full h-32 touch-none",
                      }}
                      backgroundColor="white"
                      onBegin={() => setEmployeeSigEmpty(false)}
                    />
                    {employeeSigEmpty && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-muted-foreground text-sm">{t("auto.tegn_signaturen_her")}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { employeeSigRef.current?.clear(); setEmployeeSigEmpty(true); }}>
                      {t("auto.toem")}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddEmployeeSignature}
                  disabled={!currentEmployeeName.trim()}
                  className="w-full"
                  variant="secondary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Legg til signatur
                </Button>
              </div>

              {employeeSignatures.length === 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                  {t("auto.minst_n_ansatt_maa_signere_for_aa_fullfo")}
                </div>
              )}
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("auto.avtalen_er_signert")}</h3>
              <p className="text-muted-foreground mb-4">
                Avtale om fritak fra verneombud er nå signert av arbeidsgiver og {employeeSignatures.length} ansatt{employeeSignatures.length !== 1 ? "e" : ""}, og lagret i systemet. 
                Husk at avtalen må revurderes dersom dere får 5 eller flere ansatte.
              </p>
              <div className="text-left max-w-sm mx-auto space-y-1 mb-6">
                <p className="text-sm font-medium">{t("auto.signaturer_2")}</p>
                <p className="text-sm text-muted-foreground">✅ {employerName} (arbeidsgiver)</p>
                {employeeSignatures.map((es, i) => (
                  <p key={i} className="text-sm text-muted-foreground">✅ {es.name} (ansatt)</p>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => generateVerneombudExemptionPdf({
                  companyName,
                  orgNumber,
                  companyAddress,
                  totalEmployees,
                  employerName,
                  employerSignature,
                  employerSignedAt: new Date().toISOString(),
                  employeeSignatures,
                  agreementDate: today,
                })}
              >
                <Download className="w-4 h-4 mr-2" />
                Last ned avtale (PDF)
              </Button>
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        <DialogFooter>
          {step === "info" && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                {t("auto.avbryt")}
              </Button>
              <Button onClick={() => setStep("employer")} disabled={!isExemptionAllowed}>
                {t("auto.start_signering")}
              </Button>
            </>
          )}

          {step === "employer" && (
            <>
              <Button variant="outline" onClick={() => setStep("info")}>
                {t("auto.tilbake")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  sessionStorage.removeItem(SESSION_STORAGE_KEY);
                  onComplete(true);
                  onOpenChange(false);
                }}
              >
                Hopp over (signer senere)
              </Button>
              <Button onClick={handleEmployerNext} disabled={!employerName.trim()}>
                {t("auto.neste_ansatt_signaturer")}
              </Button>
            </>
          )}

          {step === "employees" && (
            <>
              <Button variant="outline" onClick={() => setStep("employer")}>
                {t("auto.tilbake")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  sessionStorage.removeItem(SESSION_STORAGE_KEY);
                  onComplete(true);
                  onOpenChange(false);
                }}
              >
                Hopp over
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || employeeSignatures.length === 0 || !isExemptionAllowed}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Fullfør og lagre avtale ({employeeSignatures.length} signert)
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
