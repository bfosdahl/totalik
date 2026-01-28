import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, temporaryReasons } from "../ExtendedContractFormData";

interface DatesSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function DatesSection({ formData, onChange }: DatesSectionProps) {
  const isTemporary = ['temporary', 'project', 'internship'].includes(formData.contract_type);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Oppstart og varighet</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">Startdato *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">
            Sluttdato {isTemporary ? '*' : '(kun midlertidig)'}
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => onChange({ end_date: e.target.value || null })}
            required={isTemporary}
          />
        </div>
      </div>

      {isTemporary && (
        <div className="space-y-2">
          <Label htmlFor="temporary_reason">Grunnlag for midlertidig ansettelse *</Label>
          <Select
            value={formData.temporary_reason || ''}
            onValueChange={(value) => onChange({ temporary_reason: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg grunnlag" />
            </SelectTrigger>
            <SelectContent>
              {temporaryReasons.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Jf. arbeidsmiljøloven § 14-6 e) - grunnlaget for midlertidig ansettelse
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="probation_period">Prøvetid</Label>
        <Select
          value={formData.probation_period_months?.toString() || '0'}
          onValueChange={(value) => onChange({ probation_period_months: parseInt(value) || null })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Ingen prøvetid</SelectItem>
            <SelectItem value="1">1 måned</SelectItem>
            <SelectItem value="2">2 måneder</SelectItem>
            <SelectItem value="3">3 måneder</SelectItem>
            <SelectItem value="6">6 måneder</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Maks 6 måneder. Ved midlertidig: maks halvparten av ansettelsestiden.
        </p>
      </div>
    </div>
  );
}
