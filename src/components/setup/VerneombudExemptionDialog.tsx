import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface EmployeeSignature {
  name: string;
  signature: string;
  signed_at: string;
}

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

const SESSION_STORAGE_KEY = "verneombud_exemption_state";

interface PersistedState {
  step: "info" | "employer" | "employees" | "complete";
  employerName: string;
  employerSignature: string;
  employees: { name: string; signature: string }[];
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
  // Load initial state from sessionStorage
  const getInitialState = useCallback((): PersistedState | null => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedState;
        // Only restore if it's for the same company
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

  const [step, setStep] = useState<"info" | "employer" | "employees" | "complete">(
    initialState?.step || "info"
  );
  const [employerName, setEmployerName] = useState(initialState?.employerName || "");
  const [employerSignature, setEmployerSignature] = useState(initialState?.employerSignature || "");
  const [employees, setEmployees] = useState<{ name: string; signature: string }[]>(
    initialState?.employees || [{ name: "", signature: "" }]
  );
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const employerSigRef = useRef<SignatureCanvas | null>(null);
  const employeeSigRef = useRef<SignatureCanvas | null>(null);

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    if (step === "complete") {
      // Clear persisted state when complete
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    
    const stateToSave: PersistedState = {
      step,
      employerName,
      employerSignature,
      employees,
      companyId,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [step, employerName, employerSignature, employees, companyId]);

  const handleClearEmployerSig = () => {
    employerSigRef.current?.clear();
    setEmployerSignature("");
  };

  const handleSaveEmployerSig = () => {
    if (employerSigRef.current?.isEmpty()) {
      toast.error("Vennligst signer før du går videre");
      return;
    }
    const sig = employerSigRef.current?.toDataURL() || "";
    setEmployerSignature(sig);
    setStep("employees");
  };

  const handleAddEmployee = () => {
    setEmployees([...employees, { name: "", signature: "" }]);
  };

  const handleRemoveEmployee = (index: number) => {
    if (employees.length <= 1) return;
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const handleEmployeeNameChange = (index: number, name: string) => {
    const updated = [...employees];
    updated[index].name = name;
    setEmployees(updated);
  };

  const handleOpenEmployeeSignature = (index: number) => {
    if (!employees[index].name.trim()) {
      toast.error("Vennligst skriv inn navnet først");
      return;
    }
    setCurrentEmployeeIndex(index);
  };

  const handleSaveEmployeeSignature = () => {
    if (currentEmployeeIndex === null) return;
    if (employeeSigRef.current?.isEmpty()) {
      toast.error("Vennligst signer før du lagrer");
      return;
    }
    const sig = employeeSigRef.current?.toDataURL() || "";
    const updated = [...employees];
    updated[currentEmployeeIndex].signature = sig;
    setEmployees(updated);
    setCurrentEmployeeIndex(null);
  };

  const handleClearEmployeeSig = () => {
    employeeSigRef.current?.clear();
  };

  const handleSubmit = async () => {
    // Validate all employees have names and signatures
    const validEmployees = employees.filter(e => e.name.trim() && e.signature);
    if (validEmployees.length === 0) {
      toast.error("Minst én ansatt må signere avtalen");
      return;
    }

    setIsSaving(true);
    try {
      const employeeSignatures = validEmployees.map(e => ({
        name: e.name.trim(),
        signature: e.signature,
        signed_at: new Date().toISOString(),
      }));

      // Check if agreement already exists
      const { data: existing } = await supabase
        .from("verneombud_exemption_agreements")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from("verneombud_exemption_agreements")
          .update({
            total_employees: totalEmployees,
            employer_name: employerName,
            employer_signature: employerSignature,
            employer_signed_at: new Date().toISOString(),
            employee_signatures: JSON.parse(JSON.stringify(employeeSignatures)),
            status: "active",
            agreement_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", existing.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from("verneombud_exemption_agreements")
          .insert([{
            company_id: companyId,
            total_employees: totalEmployees,
            employer_name: employerName,
            employer_signature: employerSignature,
            employer_signed_at: new Date().toISOString(),
            employee_signatures: JSON.parse(JSON.stringify(employeeSignatures)),
            status: "active",
            agreement_date: new Date().toISOString().split("T")[0],
          }]);
        error = result.error;
      }

      if (error) throw error;

      toast.success("Avtale om fritak fra verneombud er signert og lagret!");
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
      onComplete(false); // Was not skipped - properly completed
      clearState = true;
    }
    onOpenChange(false);
    
    // Only reset state if explicitly requested or complete
    if (clearState) {
      setStep("info");
      setEmployerName("");
      setEmployerSignature("");
      setEmployees([{ name: "", signature: "" }]);
      setCurrentEmployeeIndex(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const handleCancel = () => {
    handleClose(true); // Clear state when user explicitly cancels
  };

  const today = new Date().toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Avtale om fritak fra verneombud
          </DialogTitle>
          <DialogDescription>
            {step === "info" && "Virksomheter med færre enn 5 ansatte kan avtale skriftlig fritak fra verneombud"}
            {step === "employer" && "Steg 1: Arbeidsgiver signerer avtalen"}
            {step === "employees" && "Steg 2: Ansatte signerer avtalen"}
            {step === "complete" && "Avtalen er signert og lagret"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
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

                <div className="pt-2">
                  <p className="text-muted-foreground">Dato: {today}</p>
                </div>
              </div>
            </div>
          )}

          {step === "employer" && (
            <div className="space-y-4">
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

              <div>
                <Label>Arbeidsgivers signatur</Label>
                <div className="mt-1 border rounded-lg bg-white">
                  <SignatureCanvas
                    ref={employerSigRef}
                    canvasProps={{
                      className: "w-full h-32 touch-none",
                    }}
                    backgroundColor="white"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleClearEmployerSig}>
                    Tøm signatur
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "employees" && currentEmployeeIndex === null && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alle ansatte må signere avtalen. Legg til navn og signatur for hver ansatt.
              </p>

              {employees.map((employee, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Ansatt {index + 1}</Label>
                        <Input
                          value={employee.name}
                          onChange={(e) => handleEmployeeNameChange(index, e.target.value)}
                          placeholder="Skriv inn fullt navn"
                          className="mt-1"
                        />
                      </div>
                      
                      {employee.signature ? (
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Signert</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEmployeeSignature(index)}
                          disabled={!employee.name.trim()}
                        >
                          Signer
                        </Button>
                      )}
                    </div>
                    
                    {employees.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmployee(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

              <Button variant="outline" onClick={handleAddEmployee} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Legg til ansatt
              </Button>
            </div>
          )}

          {step === "employees" && currentEmployeeIndex !== null && (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                Signatur for: {employees[currentEmployeeIndex].name}
              </p>
              
              <div className="border rounded-lg bg-white">
                <SignatureCanvas
                  ref={employeeSigRef}
                  canvasProps={{
                    className: "w-full h-32 touch-none",
                  }}
                  backgroundColor="white"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearEmployeeSig}>
                  Tøm signatur
                </Button>
                <Button onClick={handleSaveEmployeeSignature}>
                  Lagre signatur
                </Button>
                <Button variant="ghost" onClick={() => setCurrentEmployeeIndex(null)}>
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Avtalen er signert!</h3>
              <p className="text-muted-foreground">
                Avtale om fritak fra verneombud er nå lagret i systemet. 
                Husk at avtalen må revurderes dersom dere får 5 eller flere ansatte.
              </p>
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
                  // Skip signing (useful when setting up on behalf of a customer)
                  sessionStorage.removeItem(SESSION_STORAGE_KEY);
                  onComplete(true); // Pass wasSkipped=true
                  onOpenChange(false);
                }}
              >
                Hopp over
              </Button>
              <Button onClick={handleSaveEmployerSig} disabled={!employerName.trim()}>
                Neste: Ansatte signerer
              </Button>
            </>
          )}

          {step === "employees" && currentEmployeeIndex === null && (
            <>
              <Button variant="outline" onClick={() => setStep("employer")}>
                Tilbake
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  // Skip without signatures - just close and complete
                  sessionStorage.removeItem(SESSION_STORAGE_KEY);
                  onComplete(true); // Pass wasSkipped=true
                  onOpenChange(false);
                }}
              >
                Hopp over
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || !employees.some(e => e.name.trim() && e.signature)}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Fullfør og lagre avtale
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
