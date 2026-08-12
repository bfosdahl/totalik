import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FdvRiskAssessment, FdvBuilding, FDV_RISK_CATEGORY_LABELS, FdvRiskCategory } from "@/types/fdv";
import { t } from "@/i18n/t";

const riskSchema = z.object({
  building_id: z.string().min(1, "Velg et bygg"),
  category: z.string().min(1, "Velg kategori"),
  hazard_description: z.string().min(1, "Beskrivelse er påkrevd"),
  existing_measures: z.string().optional(),
  probability: z.number().min(1).max(5),
  consequence: z.number().min(1).max(5),
  responsible_name: z.string().optional(),
  revision_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["aktiv", "under_behandling", "lukket"]).default("aktiv"),
});

type RiskFormData = z.infer<typeof riskSchema>;

interface FdvRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: FdvRiskAssessment | null;
  buildings: FdvBuilding[];
  onSave: (data: Partial<FdvRiskAssessment>) => Promise<void>;
}

const PROBABILITY_LABELS = ["", "Svært lite sannsynlig", "Lite sannsynlig", "Kan skje", "Sannsynlig", "Svært sannsynlig"];
const CONSEQUENCE_LABELS = ["", "Ubetydelig", "Lav", "Moderat", "Alvorlig", "Svært alvorlig"];

export function FdvRiskDialog({ open, onOpenChange, risk, buildings, onSave }: FdvRiskDialogProps) {
  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      building_id: "",
      category: "",
      hazard_description: "",
      existing_measures: "",
      probability: 3,
      consequence: 3,
      responsible_name: "",
      revision_date: "",
      notes: "",
      status: "aktiv",
    },
  });

  useEffect(() => {
    if (risk) {
      form.reset({
        building_id: risk.building_id,
        category: risk.category,
        hazard_description: risk.hazard_description,
        existing_measures: risk.existing_measures || "",
        probability: risk.probability,
        consequence: risk.consequence,
        responsible_name: risk.responsible_name || "",
        revision_date: risk.revision_date || "",
        notes: risk.notes || "",
        status: risk.status,
      });
    } else {
      form.reset();
    }
  }, [risk, form]);

  const probability = form.watch("probability");
  const consequence = form.watch("consequence");
  const riskScore = probability * consequence;

  const getRiskLevel = (score: number) => {
    if (score >= 15) return { label: t("auto.hoey_risiko"), color: "text-red-600" };
    if (score >= 8) return { label: t("auto.middels_risiko"), color: "text-yellow-600" };
    return { label: t("auto.lav_risiko"), color: "text-green-600" };
  };

  const riskLevel = getRiskLevel(riskScore);

  const onSubmit = async (data: RiskFormData) => {
    await onSave({
      ...data,
      category: data.category as FdvRiskCategory,
      existing_measures: data.existing_measures || null,
      responsible_name: data.responsible_name || null,
      revision_date: data.revision_date || null,
      notes: data.notes || null,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk ? "Rediger risikovurdering" : "Ny risikovurdering"}</DialogTitle>
          <DialogDescription>
            {risk ? "Oppdater risikovurderingen" : "Kartlegg en ny risiko knyttet til bygget"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="building_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auto.bygg")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_bygg")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildings.filter(b => b.status === 'aktiv').map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auto.risikokategori")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_kategori")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FDV_RISK_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hazard_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auto.beskrivelse_av_fare")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("auto.beskriv_faren_risikoen")}
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="existing_measures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auto.eksisterende_tiltak")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("auto.beskriv_tiltak_som_allerede_er_paa_plass")}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Matrix */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="text-center">
                <span className="text-sm text-muted-foreground">{t("auto.risikoscore")} </span>
                <span className={`text-2xl font-bold ${riskLevel.color}`}>{riskScore}</span>
                <span className={`ml-2 text-sm ${riskLevel.color}`}>({riskLevel.label})</span>
              </div>

              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sannsynlighet: {field.value} - {PROBABILITY_LABELS[field.value]}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konsekvens: {field.value} - {CONSEQUENCE_LABELS[field.value]}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsible_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auto.ansvarlig_2")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("auto.navn_2")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revision_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auto.revisjonsdato")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auto.status_2")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aktiv">{t("auto.aktiv")}</SelectItem>
                      <SelectItem value="under_behandling">{t("auto.under_behandling")}</SelectItem>
                      <SelectItem value="lukket">{t("auto.lukket")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auto.notater")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("auto.eventuelle_notater")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("auto.avbryt")}
              </Button>
              <Button type="submit">
                {risk ? "Lagre endringer" : "Opprett risikovurdering"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
