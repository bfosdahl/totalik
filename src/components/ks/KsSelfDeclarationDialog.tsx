import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, CheckCircle2, User } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";

interface KsSelfDeclarationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  companyAddress?: string;
  postalCode?: string;
  city?: string;
  onComplete: (wasSkipped?: boolean) => void;
}

export function KsSelfDeclarationDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  companyAddress,
  postalCode,
  city,
  onComplete,
}: KsSelfDeclarationDialogProps) {
  const { profile } = useAuth();
  const { users, isLoading: isLoadingUsers, getUserDisplayName } = useCompanyUsers();
  const [step, setStep] = useState<"info" | "manager" | "complete">("info");
  const [managerName, setManagerName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const managerSigRef = useRef<SignatureCanvas | null>(null);

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

  useEffect(() => {
    if (selectedUserId && selectedUserId !== "custom") {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setManagerName(getUserDisplayName(user));
      }
    }
  }, [selectedUserId, users, getUserDisplayName]);

  const handleClearManagerSig = () => {
    managerSigRef.current?.clear();
    setUsingSavedSignature(false);
  };

  const useSavedSignatureHandler = () => {
    if (savedSignature && managerSigRef.current) {
      managerSigRef.current.fromDataURL(savedSignature);
      setUsingSavedSignature(true);
    }
  };

  const handleSubmit = async () => {
    const sig = usingSavedSignature ? savedSignature : managerSigRef.current?.toDataURL() || "";
    
    if (!sig || (managerSigRef.current?.isEmpty() && !usingSavedSignature)) {
      toast.error("Vennligst signer før du lagrer");
      return;
    }

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("ks_self_declarations")
        .select("id")
        .eq("company_id", companyId)
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
        status: "active" as const,
      };

      let error;
      if (existing) {
        const result = await supabase
          .from("ks_self_declarations")
          .update(declarationData)
          .eq("id", existing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("ks_self_declarations")
          .insert([{ company_id: companyId, ...declarationData }]);
        error = result.error;
      }

      if (error) throw error;

      toast.success("Egenerklæring om kvalitetssikringssystem er signert og lagret!");
      setStep("complete");
    } catch (error) {
      console.error("Error saving KS self-declaration:", error);
      toast.error("Kunne ikke lagre egenerklæringen. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (step === "complete") {
      onComplete();
    }
    onOpenChange(false);
    setStep("info");
    setManagerName("");
    setSelectedUserId("");
    setUsingSavedSignature(false);
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
            Egenerklæring om kvalitetssikringssystem
          </DialogTitle>
          <DialogDescription>
            {step === "info" && "Bekreftelse på at bedriften har et velfungerende KS-system"}
            {step === "manager" && "Daglig leder signerer på vegne av bedriften"}
            {step === "complete" && "Egenerklæringen er signert og lagret"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {step === "info" && (
            <div className="space-y-4">
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-3">Denne bekreftelsen gjelder:</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">Firma:</span>
                    <span className="font-medium py-1">{companyName}</span>
                  </div>
                  {companyAddress && (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">Adresse:</span>
                      <span className="py-1">{companyAddress}</span>
                    </div>
                  )}
                  {(postalCode || city) && (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">Postnr. /-sted:</span>
                      <span className="py-1">{[postalCode, city].filter(Boolean).join(" ")}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">Land:</span>
                    <span className="py-1">Norge</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="leading-relaxed">
                    Det kreves at tilbyder har et godt og velfungerende kvalitetssikringssystem / styringssystem 
                    samt helse, miljø og sikkerhetspolicy for ytelsen som skal leveres. Tilbyder skal sørge for 
                    til enhver tid å ha et oppdatert kvalitetssikringssystem, samt sørge for at ansatte i egen 
                    organisasjon kjenner til og utfører sitt arbeid i henhold til dette.
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="leading-relaxed">
                    Kvalitetssikringssystemet skal være utarbeidet i den form og det omfang som er nødvendig på 
                    bakgrunn av virksomhetens art, aktiviteter, risikoforhold og størrelse.
                    Kvalitetssikringssystemet skal være i henhold til enhver tid gjeldende lover og forskrifter.
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="leading-relaxed">
                    Tilbyder skal på anmodning legge fram dokumentasjon på kvalitetssikringssystemet. 
                    Oppdragsgiver stiller krav om at bekreftelsen signeres.
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="leading-relaxed font-medium">
                    Undertegnende leverandør erklærer med dette at nevnte forpliktelser vil bli overholdt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "manager" && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  Daglig leder eller den som er ansvarlig for kvalitetssikringssystemet signerer denne erklæringen 
                  på vegne av bedriften.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerSelect">Velg person eller skriv inn navn</Label>
                <Select 
                  value={selectedUserId} 
                  onValueChange={(value) => {
                    setSelectedUserId(value);
                    if (value === "custom") {
                      setManagerName("");
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
                  <Label htmlFor="managerName">Daglig leder / Ansvarlig - Navn</Label>
                  <Input
                    id="managerName"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Skriv inn fullt navn"
                    className="mt-1"
                  />
                </div>
              )}

              {selectedUserId && selectedUserId !== "custom" && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm"><strong>Valgt person:</strong> {managerName}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Signatur</Label>
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
                    ref={managerSigRef}
                    canvasProps={{
                      className: "w-full h-32 touch-none",
                    }}
                    backgroundColor="white"
                  />
                  {!usingSavedSignature && managerSigRef.current?.isEmpty() !== false && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-muted-foreground text-sm">
                        {savedSignature ? "Tegn eller bruk lagret signatur" : "Tegn signaturen din her"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearManagerSig}>
                    Tøm signatur
                  </Button>
                  {usingSavedSignature && (
                    <span className="text-xs text-success flex items-center gap-1">
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

          {step === "complete" && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Egenerklæringen er signert!</h3>
              <p className="text-muted-foreground">
                Egenerklæring om kvalitetssikringssystem er nå lagret og dokumenterer at virksomheten 
                har et velfungerende system for kvalitetssikring i henhold til gjeldende krav.
              </p>
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        <DialogFooter>
          {step === "info" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button onClick={() => setStep("manager")}>
                Start signering
              </Button>
            </>
          )}

          {step === "manager" && (
            <>
              <Button variant="outline" onClick={() => setStep("info")}>
                Tilbake
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || !managerName.trim()}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Fullfør og lagre egenerklæring
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>
              Lukk
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
