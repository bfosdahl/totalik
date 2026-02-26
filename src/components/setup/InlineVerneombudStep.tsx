import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, CheckCircle2, User, ArrowRight, Info, FileText } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";

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
  const needsVerneombud = employeeCount >= 5;
  
  const [mode, setMode] = useState<"choose" | "assign" | "exempt" | "sign_exempt" | "sign_agreement" | "done">("choose");
  const [verneombudName, setVerneombudName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyHasAgreement, setAlreadyHasAgreement] = useState(false);
  const [alreadyHasExemption, setAlreadyHasExemption] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);

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
      supabase.from("profiles").select("signature_data").eq("id", profile.id).single()
        .then(({ data }) => { if (data?.signature_data) setSavedSignature(data.signature_data); });
    }
  }, [companyId, profile?.id]);

  useEffect(() => {
    if (selectedUserId && selectedUserId !== "custom") {
      const user = users.find(u => u.id === selectedUserId);
      if (user) setVerneombudName(getUserDisplayName(user));
    }
  }, [selectedUserId, users, getUserDisplayName]);

  // Already handled
  if (alreadyHasAgreement || alreadyHasExemption) {
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
          <Button size="sm" onClick={() => onComplete(verneombudName, alreadyHasExemption)} className="shrink-0">
            Neste <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    );
  }

  const handleSaveExemption = async () => {
    const sig = usingSavedSignature ? savedSignature : sigRef.current?.toDataURL() || "";
    if (!sig || (sigRef.current?.isEmpty() && !usingSavedSignature)) {
      toast.error("Vennligst signer");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("verneombud_exemption_agreements").insert([{
        company_id: companyId,
        total_employees: employeeCount,
        employer_name: verneombudName || "Daglig leder",
        employer_signature: sig,
        employer_signed_at: new Date().toISOString(),
        employee_signatures: [],
        status: "active",
        agreement_date: new Date().toISOString().split("T")[0],
      }]);
      if (error) throw error;
      toast.success("Avtale om fritak signert!");
      setMode("done");
      onComplete("", true);
    } catch (error) {
      console.error(error);
      toast.error("Kunne ikke lagre avtalen");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVerneombud = async () => {
    if (!verneombudName.trim()) {
      toast.error("Vennligst skriv inn navn på verneombud");
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
      toast.success("Verneombud registrert!");
      setMode("done");
      onComplete(verneombudName, false);
    } catch (error) {
      console.error(error);
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "done") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm font-medium text-success">Verneombud-steget fullført! ✅</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Verneombud</h3>
      </div>

      {mode === "choose" && (
        <>
          <div className="bg-primary/5 rounded-lg p-3 text-xs sm:text-sm border border-primary/10">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                {needsVerneombud ? (
                  <p>Bedriften har <strong>{employeeCount} ansatte</strong> og er <strong>pålagt å ha verneombud</strong> iht. Arbeidsmiljøloven §6-1.</p>
                ) : (
                  <p>Bedriften har <strong>færre enn 5 ansatte</strong>. Dere kan velge å ha verneombud, eller skriftlig avtale fritak iht. Arbeidsmiljøloven §6-1.</p>
                )}
              </div>
            </div>
          </div>

          {needsVerneombud ? (
            <div className="space-y-3">
              <p className="text-sm">Hvem er verneombud i bedriften?</p>
              <div>
                <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); if (v === "custom") setVerneombudName(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg fra ansatte..." />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingUsers && users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{getUserDisplayName(user)}</SelectItem>
                    ))}
                    <SelectItem value="custom">Skriv inn manuelt...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(selectedUserId === "custom" || !selectedUserId) && (
                <Input value={verneombudName} onChange={(e) => setVerneombudName(e.target.value)} placeholder="Skriv inn navnet på verneombudet" />
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={onSkip}>Fullfør senere</Button>
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
                Avklar dette senere
              </Button>
            </div>
          )}
        </>
      )}

      {mode === "assign" && (
        <div className="space-y-3">
          <p className="text-sm">Hvem er verneombud?</p>
          <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); if (v === "custom") setVerneombudName(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Velg fra ansatte..." />
            </SelectTrigger>
            <SelectContent>
              {!isLoadingUsers && users.map((user) => (
                <SelectItem key={user.id} value={user.id}>{getUserDisplayName(user)}</SelectItem>
              ))}
              <SelectItem value="custom">Skriv inn manuelt...</SelectItem>
            </SelectContent>
          </Select>
          {(selectedUserId === "custom" || !selectedUserId) && (
            <Input value={verneombudName} onChange={(e) => setVerneombudName(e.target.value)} placeholder="Fullt navn" />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setMode("choose")}>Tilbake</Button>
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
            <p className="mb-2 font-medium">Avtale om fritak fra verneombud</p>
            <p className="text-muted-foreground">
              I henhold til arbeidsmiljøloven §6-1 avtales det at virksomheten ({companyName}, {employeeCount} ansatte) 
              er fritatt fra kravet om verneombud. Arbeidsgiver forplikter seg til å ivareta HMS forsvarlig.
            </p>
          </div>

          <div className="space-y-2">
            <Input value={verneombudName} onChange={(e) => setVerneombudName(e.target.value)} placeholder="Navn (arbeidsgiver)" />
            
            <div className="flex items-center justify-between">
              <Label className="text-xs">Signatur</Label>
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
              Tøm signatur
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setMode("choose")}>Tilbake</Button>
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
