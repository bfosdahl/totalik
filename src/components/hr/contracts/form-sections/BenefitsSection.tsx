import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExtendedContractFormData } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

interface BenefitsSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function BenefitsSection({ formData, onChange }: BenefitsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.opplaering_pensjon_og_forsikring")}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="training_provisions">{t("auto.rett_til_kompetanseutvikling")}</Label>
        <Textarea
          id="training_provisions"
          value={formData.training_provisions || ''}
          onChange={(e) => onChange({ training_provisions: e.target.value })}
          placeholder={t("auto.beskriv_omfanget_av_opplaering_og_kompet")}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 k) - rett til kompetanseutvikling som arbeidsgiver tilbyr
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pension_scheme">{t("auto.pensjonsordning")}</Label>
        <Textarea
          id="pension_scheme"
          value={formData.pension_scheme || ''}
          onChange={(e) => onChange({ pension_scheme: e.target.value })}
          placeholder={t("auto.f_eks_innskuddspensjon_ytelsespensjon_na")}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 l) - ytelser til sosial trygghet
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="insurance_provisions">{t("auto.forsikringsordninger")}</Label>
        <Textarea
          id="insurance_provisions"
          value={formData.insurance_provisions || ''}
          onChange={(e) => onChange({ insurance_provisions: e.target.value })}
          placeholder={t("auto.f_eks_yrkesskadeforsikring_gruppelivsfor")}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sick_pay_rules">{t("auto.sykeloenn")}</Label>
        <Textarea
          id="sick_pay_rules"
          value={formData.sick_pay_rules || ''}
          onChange={(e) => onChange({ sick_pay_rules: e.target.value })}
          placeholder={t("auto.beskriv_regler_for_sykeloenn_utover_folk")}
          rows={2}
        />
      </div>
    </div>
  );
}
