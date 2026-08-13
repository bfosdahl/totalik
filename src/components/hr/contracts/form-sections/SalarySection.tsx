import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, salaryTypes, paymentMethods } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

interface SalarySectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function SalarySection({ formData, onChange }: SalarySectionProps) {
  const salaryLabel = formData.salary_type === 'hourly' 
    ? 'Timelønn (NOK)' 
    : formData.salary_type === 'annual' 
      ? 'Årslønn (NOK)' 
      : 'Månedslønn (NOK)';

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.loenn_og_godtgjoerelse")}</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salary_type">{t("auto.loennstype")}</Label>
          <Select
            value={formData.salary_type}
            onValueChange={(value) => onChange({ salary_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {salaryTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary_amount">{salaryLabel} *</Label>
          <Input
            id="salary_amount"
            type="number"
            min={0}
            value={formData.salary_amount || ''}
            onChange={(e) => onChange({ salary_amount: parseFloat(e.target.value) || undefined })}
            placeholder={t("auto.beloep")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment_method">{t("auto.utbetalingsmaate")}</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => onChange({ payment_method: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_day">{t("auto.loenningsdag")}</Label>
          <Input
            id="payment_day"
            type="number"
            min={1}
            max={31}
            value={formData.payment_day}
            onChange={(e) => onChange({ payment_day: parseInt(e.target.value) || 15 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="overtime_compensation">{t("auto.overtidsgodtgjoerelse")}</Label>
        <Textarea
          id="overtime_compensation"
          value={formData.overtime_compensation || ''}
          onChange={(e) => onChange({ overtime_compensation: e.target.value })}
          placeholder={t("auto.beskriv_satser_for_overtid_nattillegg_he")}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="other_allowances">{t("auto.andre_tillegg_og_godtgjoerelser")}</Label>
        <Textarea
          id="other_allowances"
          value={formData.other_allowances || ''}
          onChange={(e) => onChange({ other_allowances: e.target.value })}
          placeholder={t("auto.f_eks_bilgodtgjoerelse_telefongodtgjoere")}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          {t("auto.tillegg_og_godtgjoerelser_som_ikke_innga")}
        </p>
      </div>
    </div>
  );
}
