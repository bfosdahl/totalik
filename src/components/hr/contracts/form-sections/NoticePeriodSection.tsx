import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

interface NoticePeriodSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

const noticePeriodOptions = [
  { value: '1', label: '1 måned' },
  { value: '2', label: '2 måneder' },
  { value: '3', label: '3 måneder' },
  { value: '6', label: '6 måneder' },
];

export function NoticePeriodSection({ formData, onChange }: NoticePeriodSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.oppsigelse")}</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notice_period_employee_months">{t("auto.arbeidstakers_oppsigelsestid")}</Label>
          <Select
            value={formData.notice_period_employee_months.toString()}
            onValueChange={(value) => onChange({ notice_period_employee_months: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noticePeriodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notice_period_employer_months">{t("auto.arbeidsgivers_oppsigelsestid_2")}</Label>
          <Select
            value={formData.notice_period_employer_months.toString()}
            onValueChange={(value) => onChange({ notice_period_employer_months: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noticePeriodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="termination_procedures">{t("auto.oppsigelsesprosedyrer")}</Label>
        <Textarea
          id="termination_procedures"
          value={formData.termination_procedures || ''}
          onChange={(e) => onChange({ termination_procedures: e.target.value })}
          placeholder={t("auto.beskriv_fremgangsmaate_for_oppsigelse_el")}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 h) - frister og fremgangsmåte for oppsigelse
        </p>
      </div>
    </div>
  );
}
