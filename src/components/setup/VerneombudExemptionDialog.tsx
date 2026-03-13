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
import { Loader2, FileText, CheckCircle2, User, UserPlus, Trash2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";

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

  // Fetch current user's saved signature
  useEffect(() => {
    if (profile?.id) {
      supabase
        .from("profiles")
        .select("signature_data")
        .eq("id", profile.id)
        .single()
        .then(({ data }) => {
          if (data?.signature_data) {
            setSavedSignature(data.signature_data);
          }
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
      toast.error("Vennligst signer før du går videre");
      return;
    }
    const sig = employerSigRef.current?.toDataURL() || "";
    setEmployerSignature(sig);
    setStep("employees");
  };

  const handleAddEmployeeSignature = () => {
    if (!currentEmployeeName.trim()) {
      toast.error("Velg eller skriv inn ansattens navn");
      return;
    }
    if (!employeeSigRef.current || employeeSigRef.current.isEmpty()) {
      toast.error("Den ansatte må signere før den kan legges til");
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
    if (employeeSignatures.length === 0) {
      toast.error("Minst én ansatt må signere avtalen");
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

      toast.success("Avtale om fritak fra verneombud er signert av alle og lagret!");
      setStep("complete");
    } catch (error) {
      console.error("Error saving exemption agreement:", error);
      toast.error("Kunne ikke lagre avtalen. Prøv igjen.");
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
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-3">Avtale om fritak fra verneombud</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Mellom arbeidsgiver:</span>
                    <span className="font-medium">{companyName}</span>
                  </div>
                  {orgNumber && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Organisasjonsnummer:</span>
                      <span className="font-mono">{orgNumber}</span>
                    </div>
                  )}
                  {companyAddress && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span>{companyAddress}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Antall ansatte:</span>
                    <Badge variant="secondary">{totalEmployees} ansatte</Badge>
                  </div>
                </div>
              </Card>

              <div className="space-y-3 text-sm">
                <p className="font-medium">Og: De ansatte ved virksomheten.</p>
                
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="font-medium text-primary mb-1">Bakgrunn:</p>
                  <p className="text-muted-foreground">
                    Denne avtalen inngås i henhold til arbeidsmiljøloven § 6-1, som åpner for fritak 
                    fra kravet om verneombud i virksomheter med færre enn 5 ansatte dersom arbeidsgiver 
                    og ansatte er enige om dette.
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">1. Avtalens formål</p>
                  <p className="text-muted-foreground">
                    Formålet med denne avtalen er å formalisere enighet mellom arbeidsgiver og ansatte 
                    om at det ikke er nødvendig å velge verneombud i virksomheten, grunnet virksomhetens 
                    størrelse og enighet mellom partene.
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">2. Grunnlag for fritak</p>
                  <p className="text-muted-foreground">
                    Virksomheten har totalt {totalEmployees} ansatte, og partene er enige om at det ikke er 
                    behov for verneombud i henhold til gjeldende regelverk. Arbeidsgiver forplikter seg til 
                    fortsatt å ivareta helse, miljø og sikkerhet (HMS) på en forsvarlig måte.
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">3. Ansvar og oppfølging</p>
                  <p className="text-muted-foreground">
                    Selv om verneombud ikke velges, forplikter arbeidsgiver seg til å sørge for et fullt 
                    forsvarlig arbeidsmiljø og følge opp HMS-arbeidet i tråd med lovens krav. Arbeidstakerne 
                    forplikter seg til å delta aktivt i HMS-arbeidet.
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">4. Avtalens varighet og revisjon</p>
                  <p className="text-muted-foreground">
                    Denne avtalen gjelder inntil videre, men skal revurderes dersom antall ansatte økes til 
                    5 eller flere, eller ved vesentlige endringer i arbeidsforholdene.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">⚠️ Krav til signering:</p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs">
                    Denne avtalen krever signatur fra både arbeidsgiver og alle ansatte i virksomheten 
                    for å være gyldig i henhold til arbeidsmiljøloven § 6-1.
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
                  Daglig leder eller den som representerer bedriften signerer først. 
                  Deretter må alle ansatte signere i neste steg.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerSelect">Velg person eller skriv inn navn</Label>
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
                    <SelectValue placeholder="Velg fra ansatte eller skriv inn manuelt" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingUsers && users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Skriv inn manuelt...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(selectedUserId === "custom" || !selectedUserId) && (
                <div>
                  <Label htmlFor="employerName">Arbeidsgivers navn</Label>
                  <Input
                    id="employerName"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="Skriv inn fullt navn"
                    className="mt-1"
                  />
                </div>
              )}

              {selectedUserId && selectedUserId !== "custom" && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm"><strong>Valgt person:</strong> {employerName}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Arbeidsgivers signatur</Label>
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
                    Tøm signatur
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
                  Alle ansatte i virksomheten må signere avtalen. La hver ansatt velge sitt navn og 
                  tegne sin signatur nedenfor.
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
                  <Label className="text-xs">Velg ansatt</Label>
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
                      <SelectValue placeholder="Velg ansatt fra listen eller skriv inn manuelt" />
                    </SelectTrigger>
                    <SelectContent>
                      {unsignedEmployees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserDisplayName(user)}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Skriv inn manuelt...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedEmployeeUserId === "custom") && (
                  <div>
                    <Label className="text-xs">Ansattens navn</Label>
                    <Input
                      value={currentEmployeeName}
                      onChange={(e) => setCurrentEmployeeName(e.target.value)}
                      placeholder="Skriv inn fullt navn"
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedEmployeeUserId && selectedEmployeeUserId !== "custom" && (
                  <div className="p-2 bg-muted/50 rounded text-sm">
                    <strong>Ansatt:</strong> {currentEmployeeName}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Ansattens signatur</Label>
                  <div className="border rounded-lg bg-white relative">
                    <SignatureCanvas
                      ref={employeeSigRef}
                      canvasProps={{
                        className: "w-full h-32 touch-none",
                      }}
                      backgroundColor="white"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-muted-foreground text-sm">Tegn signaturen her</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => employeeSigRef.current?.clear()}>
                      Tøm
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
                  ⚠️ Minst én ansatt må signere for å fullføre avtalen.
                </div>
              )}
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Avtalen er signert!</h3>
              <p className="text-muted-foreground mb-4">
                Avtale om fritak fra verneombud er nå signert av arbeidsgiver og {employeeSignatures.length} ansatt{employeeSignatures.length !== 1 ? "e" : ""}, og lagret i systemet. 
                Husk at avtalen må revurderes dersom dere får 5 eller flere ansatte.
              </p>
              <div className="text-left max-w-sm mx-auto space-y-1">
                <p className="text-sm font-medium">Signaturer:</p>
                <p className="text-sm text-muted-foreground">✅ {employerName} (arbeidsgiver)</p>
                {employeeSignatures.map((es, i) => (
                  <p key={i} className="text-sm text-muted-foreground">✅ {es.name} (ansatt)</p>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        <DialogFooter>
          {step === "info" && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Avbryt
              </Button>
              <Button onClick={() => setStep("employer")}>
                Start signering
              </Button>
            </>
          )}

          {step === "employer" && (
            <>
              <Button variant="outline" onClick={() => setStep("info")}>
                Tilbake
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
                Neste: Ansatt-signaturer
              </Button>
            </>
          )}

          {step === "employees" && (
            <>
              <Button variant="outline" onClick={() => setStep("employer")}>
                Tilbake
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
                disabled={isSaving || employeeSignatures.length === 0}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Fullfør og lagre avtale ({employeeSignatures.length} signert)
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={() => handleClose(true)}>
              Lukk
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
