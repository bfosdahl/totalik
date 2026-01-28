import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExtendedContractFormData } from "../ExtendedContractFormData";

interface VacationSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function VacationSection({ formData, onChange }: VacationSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Ferie og feriepenger</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vacation_days">Feriedager per år *</Label>
          <Input
            id="vacation_days"
            type="number"
            min={21}
            max={35}
            value={formData.vacation_days}
            onChange={(e) => onChange({ vacation_days: parseInt(e.target.value) || 25 })}
          />
          <p className="text-xs text-muted-foreground">
            Lovfestet minimum er 25 virkedager (4 uker + 1 dag)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="holiday_pay_percentage">Feriepenger (%)</Label>
          <Input
            id="holiday_pay_percentage"
            type="number"
            step="0.1"
            min={10.2}
            max={14}
            value={formData.holiday_pay_percentage}
            onChange={(e) => onChange({ holiday_pay_percentage: parseFloat(e.target.value) || 10.2 })}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 10,2% (12% for 60+)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vacation_rules">Regler for fastsetting av ferietidspunkt</Label>
        <Textarea
          id="vacation_rules"
          value={formData.vacation_rules || ''}
          onChange={(e) => onChange({ vacation_rules: e.target.value })}
          placeholder="Beskriv prosedyrer for planlegging av ferie, frister for ferieønsker, mv. Kan vise til ferieloven."
          rows={2}
        />
      </div>
    </div>
  );
}
