import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ExtendedContractFormData } from "../ExtendedContractFormData";
import { AlertTriangle } from "lucide-react";

interface StaffingAgencySectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function StaffingAgencySection({ formData, onChange }: StaffingAgencySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Bemanningsforetak / Innleie</h3>
      
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="is_staffing_agency">Bemanningsforetak</Label>
          <p className="text-xs text-muted-foreground">
            Er arbeidsgiver et bemanningsforetak som leier ut arbeidstaker?
          </p>
        </div>
        <Switch
          id="is_staffing_agency"
          checked={formData.is_staffing_agency}
          onCheckedChange={(checked) => onChange({ is_staffing_agency: checked })}
        />
      </div>

      {formData.is_staffing_agency && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-warning-foreground">
              Ved innleie skal innleiers identitet oppgis både ved starten av arbeidsforholdet 
              og ved skifte av innleievirksomhet underveis.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_company_name">Innleiers navn (hvis kjent)</Label>
            <Input
              id="client_company_name"
              value={formData.client_company_name || ''}
              onChange={(e) => onChange({ client_company_name: e.target.value })}
              placeholder="Navn på virksomheten som leier inn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_company_org_number">Innleiers organisasjonsnummer</Label>
            <Input
              id="client_company_org_number"
              value={formData.client_company_org_number || ''}
              onChange={(e) => onChange({ client_company_org_number: e.target.value })}
              placeholder="9 siffer"
              maxLength={9}
            />
          </div>
        </div>
      )}
    </div>
  );
}
