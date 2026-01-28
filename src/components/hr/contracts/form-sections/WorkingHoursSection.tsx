import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, workTimeArrangements } from "../ExtendedContractFormData";

interface WorkingHoursSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function WorkingHoursSection({ formData, onChange }: WorkingHoursSectionProps) {
  const isSpecialArrangement = ['exempt_manager', 'exempt_independent'].includes(formData.work_time_arrangement);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Arbeidstid</h3>
      
      <div className="space-y-2">
        <Label htmlFor="work_time_arrangement">Arbeidstidsordning *</Label>
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
          <Label htmlFor="working_hours_per_week">Timer per uke *</Label>
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
          <Label htmlFor="working_hours_per_day">Timer per dag</Label>
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
          <Label htmlFor="variable_working_hours">Varierende arbeidstid</Label>
          <p className="text-xs text-muted-foreground">
            Arbeidstiden varierer dag til dag eller uke til uke
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
            <Label htmlFor="variable_hours_description">Beskriv varierende arbeidstid</Label>
            <Textarea
              id="variable_hours_description"
              value={formData.variable_hours_description || ''}
              onChange={(e) => onChange({ variable_hours_description: e.target.value })}
              placeholder="F.eks. gjennomsnittlig arbeidstid, arbeidsplan, referanse til turnusplan..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_change_rules">Regler for endring av vakter/arbeidsplan</Label>
            <Textarea
              id="shift_change_rules"
              value={formData.shift_change_rules || ''}
              onChange={(e) => onChange({ shift_change_rules: e.target.value })}
              placeholder="Beskriv hvordan og når vakter kan endres..."
              rows={2}
            />
          </div>
        </div>
      )}

      {isSpecialArrangement && (
        <div className="space-y-2 pl-4 border-l-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-r-md">
          <Label htmlFor="special_work_time_details">Begrunnelse for unntak fra arbeidstidsbestemmelser</Label>
          <Textarea
            id="special_work_time_details"
            value={formData.special_work_time_details || ''}
            onChange={(e) => onChange({ special_work_time_details: e.target.value })}
            placeholder="Beskriv hvorfor stillingen er unntatt fra arbeidstidsbestemmelsene..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Jf. arbeidsmiljøloven § 10-12 om unntak for ledende og særlig uavhengige stillinger
          </p>
        </div>
      )}
    </div>
  );
}
