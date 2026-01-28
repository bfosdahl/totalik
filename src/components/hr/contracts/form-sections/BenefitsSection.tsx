import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExtendedContractFormData } from "../ExtendedContractFormData";

interface BenefitsSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function BenefitsSection({ formData, onChange }: BenefitsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Opplæring, pensjon og forsikring</h3>
      
      <div className="space-y-2">
        <Label htmlFor="training_provisions">Rett til kompetanseutvikling</Label>
        <Textarea
          id="training_provisions"
          value={formData.training_provisions || ''}
          onChange={(e) => onChange({ training_provisions: e.target.value })}
          placeholder="Beskriv omfanget av opplæring og kompetanseutviklingstilbud"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 k) - rett til kompetanseutvikling som arbeidsgiver tilbyr
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pension_scheme">Pensjonsordning</Label>
        <Textarea
          id="pension_scheme"
          value={formData.pension_scheme || ''}
          onChange={(e) => onChange({ pension_scheme: e.target.value })}
          placeholder="F.eks. innskuddspensjon, ytelsespensjon, navn på pensjonsleverandør"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 l) - ytelser til sosial trygghet
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="insurance_provisions">Forsikringsordninger</Label>
        <Textarea
          id="insurance_provisions"
          value={formData.insurance_provisions || ''}
          onChange={(e) => onChange({ insurance_provisions: e.target.value })}
          placeholder="F.eks. yrkesskadeforsikring, gruppelivsforsikring, reiseforsikring"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sick_pay_rules">Sykelønn</Label>
        <Textarea
          id="sick_pay_rules"
          value={formData.sick_pay_rules || ''}
          onChange={(e) => onChange({ sick_pay_rules: e.target.value })}
          placeholder="Beskriv regler for sykelønn utover folketrygdens ytelser"
          rows={2}
        />
      </div>
    </div>
  );
}
