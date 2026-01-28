import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, salaryTypes, paymentMethods } from "../ExtendedContractFormData";

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
      <h3 className="font-semibold text-base border-b pb-2">Lønn og godtgjørelse</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salary_type">Lønnstype *</Label>
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
            placeholder="Beløp"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment_method">Utbetalingsmåte *</Label>
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
          <Label htmlFor="payment_day">Lønningsdag *</Label>
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
        <Label htmlFor="overtime_compensation">Overtidsgodtgjørelse</Label>
        <Textarea
          id="overtime_compensation"
          value={formData.overtime_compensation || ''}
          onChange={(e) => onChange({ overtime_compensation: e.target.value })}
          placeholder="Beskriv satser for overtid, nattillegg, helgetillegg, mv."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="other_allowances">Andre tillegg og godtgjørelser</Label>
        <Textarea
          id="other_allowances"
          value={formData.other_allowances || ''}
          onChange={(e) => onChange({ other_allowances: e.target.value })}
          placeholder="F.eks. bilgodtgjørelse, telefongodtgjørelse, kostgodtgjørelse, bonus, etc."
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Tillegg og godtgjørelser som ikke inngår i grunnlønnen skal oppgis separat
        </p>
      </div>
    </div>
  );
}
