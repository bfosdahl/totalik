import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ExtendedContractFormData } from "../ExtendedContractFormData";
import { AlertTriangle } from "lucide-react";
import { t } from "@/i18n/t";

interface StaffingAgencySectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function StaffingAgencySection({ formData, onChange }: StaffingAgencySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.bemanningsforetak_innleie")}</h3>
      
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="is_staffing_agency">{t("auto.bemanningsforetak")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("auto.er_arbeidsgiver_et_bemanningsforetak_som")}
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
              {t("auto.ved_innleie_skal_innleiers_identitet_opp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_company_name">Innleiers navn (hvis kjent)</Label>
            <Input
              id="client_company_name"
              value={formData.client_company_name || ''}
              onChange={(e) => onChange({ client_company_name: e.target.value })}
              placeholder={t("auto.navn_paa_virksomheten_som_leier_inn")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_company_org_number">{t("auto.innleiers_organisasjonsnummer")}</Label>
            <Input
              id="client_company_org_number"
              value={formData.client_company_org_number || ''}
              onChange={(e) => onChange({ client_company_org_number: e.target.value })}
              placeholder={t("auto.9_siffer")}
              maxLength={9}
            />
          </div>
        </div>
      )}
    </div>
  );
}
