import { getLocalDateString } from "@/lib/dateUtils";
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
import { t } from "@/i18n/t";

interface HmsSelfDeclarationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  companyAddress?: string;
  postalCode?: string;
  city?: string;
  onComplete: (wasSkipped?: boolean) => void;
}

export function HmsSelfDeclarationDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  companyAddress,
  postalCode,
  city,
  onComplete,
}: HmsSelfDeclarationDialogProps) {
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
        .rpc("get_profile_sensitive_full", { p_profile_id: profile.id })
        .then(({ data }) => {
          const s = Array.isArray(data) ? data[0] : data;
          if (s?.signature_data) setSavedSignature(s.signature_data);
        });
    }
  }, [profile?.id]);

  // Auto-populate manager name when user is selected
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
      toast.error(t("auto.vennligst_signer_foer_du_lagrer"));
      return;
    }

    setIsSaving(true);
    try {
      // Check if declaration already exists
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
        declaration_date: getLocalDateString(),
        manager_name: managerName,
        manager_signature: sig,
        manager_signed_at: new Date().toISOString(),
        // Employee rep signature is optional - can be added later
        employee_rep_name: null,
        employee_rep_signature: null,
        employee_rep_signed_at: null,
        status: "active" as const,
      };

      let error;
      if (existing) {
        const result = await supabase
          .from("hms_self_declarations")
          .update(declarationData)
          .eq("id", existing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("hms_self_declarations")
          .insert([{ company_id: companyId, ...declarationData }]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(t("auto.egenerklaering_om_hms_er_signert_og_lagr"));
      setStep("complete");
    } catch (error) {
      console.error("Error saving HMS self-declaration:", error);
      toast.error(t("auto.kunne_ikke_lagre_egenerklaeringen_proev_"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (step === "complete") {
      onComplete();
    }
    onOpenChange(false);
    // Reset state
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
            {t("auto.egenerklaering_om_hms")}
          </DialogTitle>
          <DialogDescription>
            {step === "info" && "Bekreftelse på systematisk HMS-arbeid"}
            {step === "manager" && "Daglig leder signerer på vegne av bedriften"}
            {step === "complete" && "Egenerklæringen er signert og lagret"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {step === "info" && (
            <div className="space-y-4">
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-3">{t("auto.denne_bekreftelsen_gjelder")}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">{t("auto.firma")}</span>
                    <span className="font-medium py-1">{companyName}</span>
                  </div>
                  {companyAddress && (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">{t("auto.adresse_2")}</span>
                      <span className="py-1">{companyAddress}</span>
                    </div>
                  )}
                  {(postalCode || city) && (
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">{t("auto.postnr_sted")}</span>
                      <span className="py-1">{[postalCode, city].filter(Boolean).join(" ")}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">{t("auto.land")}</span>
                    <span className="py-1">{t("auto.norge")}</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="leading-relaxed">
                    Det bekreftes med dette at denne virksomheten arbeider systematisk for å oppfylle kravene i helse-, miljø- 
                    og sikkerhetslovgivningen og ved det tilfredsstille kravene i forskrift om systematisk helse-, miljø- og 
                    sikkerhetsarbeid i virksomheten (Internkontrollforskriften) fastsatt ved kgl.res. av 6. desember 1996 nr. 
                    1127 i medhold av lov av 4. februar 1977 nr. 4 om arbeidervern og arbeidsmiljø m.v.
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="leading-relaxed">
                    Det bekreftes at virksomheten er lovlig organisert i henhold til gjeldende skatte- og arbeidsmiljøregelverk 
                    når det gjelder ansattes faglige og sosiale rettigheter. Det aksepteres at oppdragsgiver etter anmodning vil 
                    bli gitt rett til gjennomgåelse og verifikasjon av virksomhetens system for ivaretakelse 
                    av helse, miljø og sikkerhet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "manager" && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  {t("auto.daglig_leder_eller_den_som_setter_opp_sy")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerSelect">{t("auto.velg_person_eller_skriv_inn_navn")}</Label>
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
                  <Label htmlFor="managerName">{t("auto.daglig_leder_ansvarlig_navn")}</Label>
                  <Input
                    id="managerName"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder={t("auto.skriv_inn_fullt_navn")}
                    className="mt-1"
                  />
                </div>
              )}

              {selectedUserId && selectedUserId !== "custom" && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm"><strong>{t("auto.valgt_person")}</strong> {managerName}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("auto.signatur")}</Label>
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
                    {t("auto.toem_signatur")}
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
              <h3 className="text-lg font-semibold mb-2">{t("auto.egenerklaeringen_er_signert")}</h3>
              <p className="text-muted-foreground">
                {t("auto.egenerklaering_om_hms_er_naa_lagret_i_sy")}
              </p>
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        <DialogFooter>
          {step === "info" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t("auto.avbryt")}
              </Button>
              <Button onClick={() => setStep("manager")}>
                {t("auto.start_signering")}
              </Button>
            </>
          )}

          {step === "manager" && (
            <>
              <Button variant="outline" onClick={() => setStep("info")}>
                {t("auto.tilbake")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onComplete(true);
                  onOpenChange(false);
                }}
              >
                Hopp over (signer senere)
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || !managerName.trim()}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Fullfør og lagre egenerklæring
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>
              {t("auto.lukk")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
