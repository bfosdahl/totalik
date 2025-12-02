import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardData } from "../ProjectWizard";

interface WizardStepPlanningProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

export function WizardStepPlanning({ data, updateData }: WizardStepPlanningProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Planlegg kontroller</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Sett opp planlagte datoer for viktige kontroller i prosjektet
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kontroll_for_lukking_dato">Kontroll før lukking</Label>
            <Input
              id="kontroll_for_lukking_dato"
              type="date"
              value={data.kontroll_for_lukking_dato || ""}
              onChange={(e) => updateData({ kontroll_for_lukking_dato: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ferdigbefaring_dato">Ferdigbefaring</Label>
            <Input
              id="ferdigbefaring_dato"
              type="date"
              value={data.ferdigbefaring_dato || ""}
              onChange={(e) => updateData({ ferdigbefaring_dato: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sluttbefaring_dato">Sluttbefaring</Label>
            <Input
              id="sluttbefaring_dato"
              type="date"
              value={data.sluttbefaring_dato || ""}
              onChange={(e) => updateData({ sluttbefaring_dato: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="planlagte_milepeler">Planlagte milepæler</Label>
          <Textarea
            id="planlagte_milepeler"
            value={data.planlagte_milepeler || ""}
            onChange={(e) => updateData({ planlagte_milepeler: e.target.value })}
            placeholder="F.eks: Grunnarbeid ferdig 01.04, råbygg ferdig 01.07..."
            rows={4}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="motefrekvens">Plan for møtefrekvens (byggemøter)</Label>
          <Select
            value={data.motefrekvens}
            onValueChange={(value) => updateData({ motefrekvens: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg møtefrekvens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ukentlig">Ukentlig</SelectItem>
              <SelectItem value="annenhver_uke">Annenhver uke</SelectItem>
              <SelectItem value="manedlig">Månedlig</SelectItem>
              <SelectItem value="etter_behov">Etter behov</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="ue_oppfolging_plan">Planlegging av UE-oppfølging</Label>
          <Textarea
            id="ue_oppfolging_plan"
            value={data.ue_oppfolging_plan || ""}
            onChange={(e) => updateData({ ue_oppfolging_plan: e.target.value })}
            placeholder="Hvordan vil du følge opp underentreprenører? F.eks. ukentlige byggmøter, inspeksjoner..."
            rows={3}
          />
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-md">
        <p className="text-sm text-muted-foreground">
          <strong>Ferdig!</strong> Når du klikker "Fullfør" vil prosjektet opprettes med all informasjon du har lagt inn.
          Du vil få tilgang til prosjektdashboard der du kan starte med KS-arbeidet, administrere dokumenter, 
          registrere avvik, og følge opp underentreprenører.
        </p>
      </div>
    </div>
  );
}
