import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ExtendedContractFormData } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

interface WorkplaceSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function WorkplaceSection({ formData, onChange }: WorkplaceSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.arbeidssted_2")}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="workplace_address">{t("auto.arbeidsstedets_adresse")}</Label>
        <Input
          id="workplace_address"
          value={formData.workplace_address}
          onChange={(e) => onChange({ workplace_address: e.target.value })}
          placeholder={t("auto.gateadresse_postnummer_og_sted")}
        />
        <p className="text-xs text-muted-foreground">
          {t("auto.jf_arbeidsmiljoeloven_14_6_c_arbeidssted")}
        </p>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="has_multiple_workplaces">{t("auto.flere_arbeidssteder")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("auto.arbeidstaker_arbeider_paa_forskjellige_s")}
          </p>
        </div>
        <Switch
          id="has_multiple_workplaces"
          checked={formData.has_multiple_workplaces}
          onCheckedChange={(checked) => onChange({ has_multiple_workplaces: checked })}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="remote_work_allowed">{t("auto.hjemmekontor_fjernarbeid")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("auto.arbeidstaker_kan_jobbe_helt_eller_delvis")}
          </p>
        </div>
        <Switch
          id="remote_work_allowed"
          checked={formData.remote_work_allowed}
          onCheckedChange={(checked) => onChange({ remote_work_allowed: checked })}
        />
      </div>

      {formData.remote_work_allowed && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          <Label htmlFor="remote_work_details">{t("auto.detaljer_om_hjemmekontor_fjernarbeid")}</Label>
          <Textarea
            id="remote_work_details"
            value={formData.remote_work_details || ''}
            onChange={(e) => onChange({ remote_work_details: e.target.value })}
            placeholder={t("auto.beskriv_vilkaar_for_hjemmekontor_antall_")}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            {t("auto.nb_egen_skriftlig_avtale_om_hjemmekontor")}
          </p>
        </div>
      )}
    </div>
  );
}
