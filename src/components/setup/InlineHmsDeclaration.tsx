import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, CheckCircle2, User, ArrowRight } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";

interface InlineHmsDeclarationProps {
  companyId: string;
  companyName: string;
  companyAddress?: string;
  postalCode?: string;
  city?: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function InlineHmsDeclaration({
  companyId,
  companyName,
  companyAddress,
  postalCode,
  city,
  onComplete,
  onSkip,
}: InlineHmsDeclarationProps) {
  const { profile } = useAuth();
  const { users, isLoading: isLoadingUsers, getUserDisplayName } = useCompanyUsers();
  const [step, setStep] = useState<"info" | "sign" | "done">("info");
  const [managerName, setManagerName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    // Check if already signed
    supabase
      .from("hms_self_declarations")
      .select("id")
      .eq("company_id", companyId)
      .is("department_id", null)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAlreadySigned(true);
      });
    // Load saved signature
    if (profile?.id) {
      supabase
        .rpc("get_profile_sensitive_full", { p_profile_id: profile.id })
        .then(({ data }) => {
          const s = Array.isArray(data) ? data[0] : data;
          if (s?.signature_data) setSavedSignature(s.signature_data);
        });
    }
  }, [companyId, profile?.id]);

  useEffect(() => {
    if (selectedUserId && selectedUserId !== "custom") {
      const user = users.find(u => u.id === selectedUserId);
      if (user) setManagerName(getUserDisplayName(user));
    }
  }, [selectedUserId, users, getUserDisplayName]);

  if (alreadySigned) {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Egenerklæring om HMS er allerede signert ✅</p>
          </div>
          <Button size="sm" onClick={onComplete} className="shrink-0">
            Neste <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    );
  }

  const handleSubmit = async () => {
    const sig = usingSavedSignature ? savedSignature : sigRef.current?.toDataURL() || "";
    if (!sig || (sigRef.current?.isEmpty() && !usingSavedSignature)) {
      toast.error("Vennligst signer før du lagrer");
      return;
    }

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("hms_self_declarations")
        .select("id")
        .eq("company_id", companyId)
        .is("department_id", null)
        .maybeSingle();

      const declarationData = {
        company_name: companyName,
        company_address: companyAddress || null,
        postal_code: postalCode || null,
        city: city || null,
        country: "Norge",
        declaration_date: new Date().toISOString().split("T")[0],
        manager_name: managerName,
        manager_signature: sig,
        manager_signed_at: new Date().toISOString(),
        employee_rep_name: null,
        employee_rep_signature: null,
        employee_rep_signed_at: null,
        status: "active" as const,
      };

      if (existing) {
        const { error } = await supabase.from("hms_self_declarations").update(declarationData).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hms_self_declarations").insert([{ company_id: companyId, ...declarationData }]);
        if (error) throw error;
      }

      toast.success("Egenerklæring om HMS er signert og lagret!");
      setStep("done");
      onComplete();
    } catch (error) {
      console.error("Error saving HMS self-declaration:", error);
      toast.error("Kunne ikke lagre egenerklæringen. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  if (step === "done") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm font-medium text-success">Egenerklæring om HMS signert og lagret! ✅</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Egenerklæring om HMS</h3>
      </div>

      {step === "info" && (
        <>
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Firma:</span>
              <span className="font-medium">{companyName}</span>
            </div>
            {companyAddress && (
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground">Adresse:</span>
                <span>{companyAddress}</span>
              </div>
            )}
            {(postalCode || city) && (
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground">Postnr./-sted:</span>
                <span>{[postalCode, city].filter(Boolean).join(" ")}</span>
              </div>
            )}
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border leading-relaxed">
            Det bekreftes med dette at denne virksomheten arbeider systematisk for å oppfylle kravene
            i helse-, miljø- og sikkerhetslovgivningen og ved det tilfredsstille kravene i forskrift
            om systematisk helse-, miljø- og sikkerhetsarbeid i virksomheten (Internkontrollforskriften).
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Signer senere
            </Button>
            <Button size="sm" onClick={() => setStep("sign")}>
              Start signering
            </Button>
          </div>
        </>
      )}

      {step === "sign" && (
        <>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Velg person eller skriv inn navn</Label>
              <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); if (v === "custom") setManagerName(""); }}>
                <SelectTrigger className="mt-1">
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
              <div>
                <Label className="text-xs">Daglig leder / Ansvarlig</Label>
                <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Fullt navn" className="mt-1" />
              </div>
            )}

            {selectedUserId && selectedUserId !== "custom" && (
              <p className="text-sm"><strong>Valgt:</strong> {managerName}</p>
            )}

            <div className="space-y-1">
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
                <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-28 touch-none" }} backgroundColor="white" />
                {!usingSavedSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground text-xs">Tegn signaturen din her</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { sigRef.current?.clear(); setUsingSavedSignature(false); }}>
                  Tøm
                </Button>
                {usingSavedSignature && (
                  <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Lagret signatur</span>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Dato: {today}</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setStep("info")}>Tilbake</Button>
            <Button variant="ghost" size="sm" onClick={onSkip}>Hopp over</Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSaving || !managerName.trim()}>
              {isSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Signer og lagre
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
