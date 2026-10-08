import { getLocalDateString } from "@/lib/dateUtils";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Mail, Calendar, Check, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKsModule2Subcontractors, NewSubcontractorInput } from "@/hooks/useKsModule2Subcontractors";
import { useKsModule2ProjectAccess } from "@/hooks/useKsModule2ProjectAccess";
import { toast } from "sonner";
import { t } from "@/i18n/t";

const TRADES = [
  "Tømrer",
  "Rørlegger",
  "Elektriker",
  "Maler",
  "Murer",
  "Betong",
  "Taktekker",
  "Ventilasjon",
  "Våtrom",
  "Kjøkken",
  "Grunnarbeid",
  "Annet",
];

const ROLES_IN_PROJECT = [
  "UE Tømrer",
  "UE Rørlegger",
  "UE Elektriker",
  "Ansvarlig kontrollerende",
  "Takstmann",
  "Arkitekt",
  t("auto.rib_raadgivende_ingenioer_bygg"),
  "RIE (Rådgivende ingeniør elektro)",
  "RIV (Rådgivende ingeniør VVS)",
  "Prosjekterende",
  "Annet",
];

interface NewSubcontractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function NewSubcontractorDialog({ 
  open, 
  onOpenChange, 
  projectId 
}: NewSubcontractorDialogProps) {
  const { createSubcontractor, isCreating } = useKsModule2Subcontractors(projectId);
  const { inviteAccess, isInviting } = useKsModule2ProjectAccess(projectId);
  const [trade, setTrade] = useState<string>("");
  const [grantAccess, setGrantAccess] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'guest' | 'full_ue'>('guest');
  const [roleInProject, setRoleInProject] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [invitedName, setInvitedName] = useState<string>("");

  const { register, handleSubmit, reset, formState: { errors }, watch, getValues } = useForm<NewSubcontractorInput>();

  const contactEmail = watch("contact_email");
  const contactPerson = watch("contact_person");

  const resetForm = () => {
    reset();
    setTrade("");
    setGrantAccess(false);
    setAccessLevel('guest');
    setRoleInProject("");
    setExpiryDate("");
    setShowSuccess(false);
    setInvitedName("");
  };

  const onSubmit = async (data: NewSubcontractorInput) => {
    // First create the subcontractor
    createSubcontractor(
      { ...data, trade: trade || undefined },
      {
        onSuccess: async (newSubcontractor) => {
          // If access is granted, create the access record
          if (grantAccess && data.contact_email && data.contact_person) {
            await inviteAccess.mutateAsync({
              project_id: projectId,
              subcontractor_id: newSubcontractor.id,
              email: data.contact_email,
              name: data.contact_person,
              company_name: data.firm_name,
              role_in_project: roleInProject || trade || 'UE',
              access_level: accessLevel,
              expires_at: expiryDate || undefined,
            });
            
            // Show success message - secure reset link is sent via email
            setInvitedName(data.contact_person);
            setShowSuccess(true);
          } else {
            resetForm();
            onOpenChange(false);
          }
        },
      }
    );
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Invitasjon sendt!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-3">
              <p className="text-sm">
                <strong>{invitedName || getValues("contact_person")}</strong> fra <strong>{getValues("firm_name")}</strong> {t("auto.har_faatt_tilgang_til_prosjektet")}
              </p>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("auto.e_post_2")}</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{getValues("contact_email")}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t("auto.en_e_post_med_innloggingslenke_er_sendt_")}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleClose}>{t("auto.lukk")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("auto.ny_underleverandoer")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firm_name">{t("auto.firmanavn")}</Label>
            <Input
              id="firm_name"
              {...register("firm_name", { required: "Firmanavn er påkrevd" })}
              placeholder={t("auto.firma_as")}
            />
            {errors.firm_name && (
              <p className="text-sm text-destructive">{errors.firm_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_number">{t("auto.org_nummer")}</Label>
            <Input
              id="org_number"
              {...register("org_number")}
              placeholder="123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_scope">{t("auto.arbeidsomfang")}</Label>
            <Textarea
              id="work_scope"
              {...register("work_scope", { required: "Arbeidsomfang er påkrevd" })}
              placeholder={t("auto.beskriv_arbeidet_som_skal_utfoeres")}
              rows={3}
            />
            {errors.work_scope && (
              <p className="text-sm text-destructive">{errors.work_scope.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("auto.fagomraade")}</Label>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger>
                <SelectValue placeholder={t("auto.velg_fagomraade")} />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t("auto.startdato")}</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">{t("auto.sluttdato")}</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_value">Kontraktsverdi (kr)</Label>
            <Input
              id="contract_value"
              type="number"
              {...register("contract_value", { valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-sm">{t("auto.kontaktperson_2")}</h4>
            
            <div className="space-y-2">
              <Label htmlFor="contact_person">Navn {grantAccess && "*"}</Label>
              <Input
                id="contact_person"
                {...register("contact_person", { 
                  required: grantAccess ? "Kontaktperson er påkrevd for tilgang" : false 
                })}
                placeholder={t("auto.ola_nordmann")}
              />
              {errors.contact_person && (
                <p className="text-sm text-destructive">{errors.contact_person.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">{t("auto.telefon")}</Label>
                <Input
                  id="contact_phone"
                  {...register("contact_phone")}
                  placeholder="123 45 678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-post {grantAccess && "*"}</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register("contact_email", { 
                    required: grantAccess ? "E-post er påkrevd for tilgang" : false 
                  })}
                  placeholder="kontakt@firma.no"
                />
                {errors.contact_email && (
                  <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Access Toggle Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Gi brukertilgang til prosjektet
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("auto.underleverandoeren_faar_innlogging_til_d")}
                </p>
              </div>
              <Switch
                checked={grantAccess}
                onCheckedChange={setGrantAccess}
              />
            </div>

            {grantAccess && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>{t("auto.rolle_i_prosjektet")}</Label>
                  <Select value={roleInProject} onValueChange={setRoleInProject}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_rolle")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES_IN_PROJECT.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("auto.tilgangsnivaa")}</Label>
                  <Select value={accessLevel} onValueChange={(v: 'guest' | 'full_ue') => setAccessLevel(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">
                        <div className="flex flex-col">
                          <span>{t("auto.gjest")}</span>
                          <span className="text-xs text-muted-foreground">
                            {t("auto.lese_fylle_ut_sjekklister_registrere_avv")}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="full_ue">
                        <div className="flex flex-col">
                          <span>{t("auto.full_ue")}</span>
                          <span className="text-xs text-muted-foreground">
                            Alt innenfor prosjektet (unntatt admin)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("auto.utloepsdato_valgfri")}
                  </Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={getLocalDateString()}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("auto.la_staa_tom_for_ingen_utloepsdato")}
                  </p>
                </div>

                {!contactEmail && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t("auto.fyll_inn_e_post_for_aa_gi_tilgang")}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
            >
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={isCreating || isInviting}>
              {isCreating || isInviting ? "Lagrer..." : grantAccess ? "Registrer og inviter" : "Registrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
