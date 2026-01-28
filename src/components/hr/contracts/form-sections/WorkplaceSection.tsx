import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ExtendedContractFormData } from "../ExtendedContractFormData";

interface WorkplaceSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function WorkplaceSection({ formData, onChange }: WorkplaceSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Arbeidssted</h3>
      
      <div className="space-y-2">
        <Label htmlFor="workplace_address">Arbeidsstedets adresse *</Label>
        <Input
          id="workplace_address"
          value={formData.workplace_address}
          onChange={(e) => onChange({ workplace_address: e.target.value })}
          placeholder="Gateadresse, postnummer og sted"
        />
        <p className="text-xs text-muted-foreground">
          Jf. arbeidsmiljøloven § 14-6 c) - arbeidssted eller forretningsadresse
        </p>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="has_multiple_workplaces">Flere arbeidssteder</Label>
          <p className="text-xs text-muted-foreground">
            Arbeidstaker arbeider på forskjellige steder eller bestemmer selv
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
          <Label htmlFor="remote_work_allowed">Hjemmekontor / fjernarbeid</Label>
          <p className="text-xs text-muted-foreground">
            Arbeidstaker kan jobbe helt eller delvis fra hjemmekontor
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
          <Label htmlFor="remote_work_details">Detaljer om hjemmekontor/fjernarbeid</Label>
          <Textarea
            id="remote_work_details"
            value={formData.remote_work_details || ''}
            onChange={(e) => onChange({ remote_work_details: e.target.value })}
            placeholder="Beskriv vilkår for hjemmekontor, antall dager per uke, etc."
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            NB: Egen skriftlig avtale om hjemmekontor kreves i tillegg
          </p>
        </div>
      )}
    </div>
  );
}
