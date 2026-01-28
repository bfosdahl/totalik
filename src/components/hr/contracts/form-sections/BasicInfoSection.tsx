import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, contractTypes } from "../ExtendedContractFormData";

interface BasicInfoSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
  employees: Array<{ id: string; first_name: string | null; last_name: string | null }>;
  loadingEmployees: boolean;
}

export function BasicInfoSection({ formData, onChange, employees, loadingEmployees }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Grunnleggende informasjon</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employee">Ansatt *</Label>
          <Select
            value={formData.employee_id}
            onValueChange={(value) => onChange({ employee_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingEmployees ? "Laster..." : "Velg ansatt"} />
            </SelectTrigger>
            <SelectContent>
              {employees?.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract_type">Avtale type *</Label>
          <Select
            value={formData.contract_type}
            onValueChange={(value) => onChange({ contract_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contractTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="position">Stilling / Tittel *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => onChange({ position: e.target.value })}
            placeholder="F.eks. Prosjektleder, Tømrer"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employment_percentage">Stillingsprosent *</Label>
          <Input
            id="employment_percentage"
            type="number"
            min={1}
            max={100}
            value={formData.employment_percentage}
            onChange={(e) => onChange({ employment_percentage: parseInt(e.target.value) || 100 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="work_description">Beskrivelse av arbeidet *</Label>
        <Textarea
          id="work_description"
          value={formData.work_description}
          onChange={(e) => onChange({ work_description: e.target.value })}
          placeholder="Beskriv arbeidsoppgaver og ansvarsområder..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 d) - beskrivelse av arbeidet eller arbeidstakerens tittel/stilling
        </p>
      </div>
    </div>
  );
}
