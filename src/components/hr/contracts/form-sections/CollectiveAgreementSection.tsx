import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ExtendedContractFormData } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

interface CollectiveAgreementSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function CollectiveAgreementSection({ formData, onChange }: CollectiveAgreementSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.tariffavtale")}</h3>
      
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="has_collective_agreement">{t("auto.tariffavtale_gjelder")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("auto.reguleres_arbeidsforholdet_av_en_tariffa")}
          </p>
        </div>
        <Switch
          id="has_collective_agreement"
          checked={formData.has_collective_agreement}
          onCheckedChange={(checked) => onChange({ has_collective_agreement: checked })}
        />
      </div>

      {formData.has_collective_agreement && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          <div className="space-y-2">
            <Label htmlFor="collective_agreement_name">{t("auto.tariffavtalens_navn")}</Label>
            <Input
              id="collective_agreement_name"
              value={formData.collective_agreement_name || ''}
              onChange={(e) => onChange({ collective_agreement_name: e.target.value })}
              placeholder={t("auto.f_eks_fellesoverenskomsten_for_byggfag")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collective_agreement_parties">{t("auto.tariffpartene")}</Label>
            <Input
              id="collective_agreement_parties"
              value={formData.collective_agreement_parties || ''}
              onChange={(e) => onChange({ collective_agreement_parties: e.target.value })}
              placeholder={t("auto.f_eks_fellesforbundet_og_byggenaeringens")}
            />
            <p className="text-xs text-muted-foreground">
              {t("auto.hvis_tariffavtalen_er_inngaatt_utenfor_v")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
