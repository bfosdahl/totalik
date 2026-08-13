import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, workTimeArrangements } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

interface WorkingHoursSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function WorkingHoursSection({ formData, onChange }: WorkingHoursSectionProps) {
  const isSpecialArrangement = ['exempt_manager', 'exempt_independent'].includes(formData.work_time_arrangement);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.arbeidstid")}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="work_time_arrangement">{t("auto.arbeidstidsordning_2")}</Label>
        <Select
          value={formData.work_time_arrangement}
          onValueChange={(value) => onChange({ 
            work_time_arrangement: value,
            special_work_time_exemptions: ['exempt_manager', 'exempt_independent'].includes(value)
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {workTimeArrangements.map((arr) => (
              <SelectItem key={arr.value} value={arr.value}>
                {arr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="working_hours_per_week">{t("auto.timer_per_uke_2")}</Label>
          <Input
            id="working_hours_per_week"
            type="number"
            step="0.5"
            min={0}
            max={60}
            value={formData.working_hours_per_week}
            onChange={(e) => onChange({ working_hours_per_week: parseFloat(e.target.value) || 37.5 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="working_hours_per_day">{t("auto.timer_per_dag_2")}</Label>
          <Input
            id="working_hours_per_day"
            type="number"
            step="0.5"
            min={0}
            max={12}
            value={formData.working_hours_per_day || ''}
            onChange={(e) => onChange({ working_hours_per_day: parseFloat(e.target.value) || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="break_duration_minutes">Pauselengde (min)</Label>
          <Input
            id="break_duration_minutes"
            type="number"
            min={0}
            max={120}
            value={formData.break_duration_minutes}
            onChange={(e) => onChange({ break_duration_minutes: parseInt(e.target.value) || 30 })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="variable_working_hours">{t("auto.varierende_arbeidstid")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("auto.arbeidstiden_varierer_dag_til_dag_eller_")}
          </p>
        </div>
        <Switch
          id="variable_working_hours"
          checked={formData.variable_working_hours}
          onCheckedChange={(checked) => onChange({ variable_working_hours: checked })}
        />
      </div>

      {formData.variable_working_hours && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          <div className="space-y-2">
            <Label htmlFor="variable_hours_description">{t("auto.beskriv_varierende_arbeidstid")}</Label>
            <Textarea
              id="variable_hours_description"
              value={formData.variable_hours_description || ''}
              onChange={(e) => onChange({ variable_hours_description: e.target.value })}
              placeholder={t("auto.f_eks_gjennomsnittlig_arbeidstid_arbeids")}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_change_rules">{t("auto.regler_for_endring_av_vakter_arbeidsplan")}</Label>
            <Textarea
              id="shift_change_rules"
              value={formData.shift_change_rules || ''}
              onChange={(e) => onChange({ shift_change_rules: e.target.value })}
              placeholder={t("auto.beskriv_hvordan_og_naar_vakter_kan_endre")}
              rows={2}
            />
          </div>
        </div>
      )}

      {isSpecialArrangement && (
        <div className="space-y-2 pl-4 border-l-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-r-md">
          <Label htmlFor="special_work_time_details">{t("auto.begrunnelse_for_unntak_fra_arbeidstidsbe")}</Label>
          <Textarea
            id="special_work_time_details"
            value={formData.special_work_time_details || ''}
            onChange={(e) => onChange({ special_work_time_details: e.target.value })}
            placeholder={t("auto.beskriv_hvorfor_stillingen_er_unntatt_fr")}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            {t("auto.jf_arbeidsmiljoeloven_10_12_om_unntak_fo")}
          </p>
        </div>
      )}
    </div>
  );
}
