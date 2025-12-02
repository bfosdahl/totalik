import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { WizardData } from "../ProjectWizard";

interface WizardStepCompetenceProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

const standardCompetencies = [
  "Våtromsgodkjenning",
  "FSE (Forsvarlig sikkerhet mot brann og eksplosjon)",
  "Stillasgodkjenning",
  "Varme arbeider",
  "HMS-kort",
  "Elektriker med autorisasjon",
  "Rørlegger med autorisasjon",
  "Sentral godkjenning (SG)"
];

export function WizardStepCompetence({ data, updateData }: WizardStepCompetenceProps) {
  const [newCompetence, setNewCompetence] = useState("");

  const handleToggleCompetence = (competence: string) => {
    const current = data.kompetanse_krav || [];
    const updated = current.includes(competence)
      ? current.filter(c => c !== competence)
      : [...current, competence];
    updateData({ kompetanse_krav: updated });
  };

  const handleAddCustomCompetence = () => {
    if (!newCompetence.trim()) return;
    const current = data.kompetanse_krav || [];
    if (!current.includes(newCompetence)) {
      updateData({ kompetanse_krav: [...current, newCompetence] });
    }
    setNewCompetence("");
  };

  const handleRemoveCompetence = (competence: string) => {
    const current = data.kompetanse_krav || [];
    updateData({ kompetanse_krav: current.filter(c => c !== competence) });
  };

  const customCompetencies = (data.kompetanse_krav || []).filter(
    c => !standardCompetencies.includes(c)
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Hvilken kompetanse kreves i prosjektet?</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Velg standard kompetansekrav eller legg til egne
        </p>

        <div className="space-y-3 mb-4">
          {standardCompetencies.map((competence) => (
            <div key={competence} className="flex items-center space-x-2">
              <Checkbox
                id={competence}
                checked={(data.kompetanse_krav || []).includes(competence)}
                onCheckedChange={() => handleToggleCompetence(competence)}
              />
              <Label
                htmlFor={competence}
                className="text-sm font-normal cursor-pointer"
              >
                {competence}
              </Label>
            </div>
          ))}
        </div>

        {/* Custom competencies */}
        {customCompetencies.length > 0 && (
          <div className="mb-4 space-y-2">
            <Label className="text-sm font-semibold">Egendefinerte krav:</Label>
            <div className="flex flex-wrap gap-2">
              {customCompetencies.map((comp) => (
                <Badge key={comp} variant="secondary" className="gap-1">
                  {comp}
                  <button
                    onClick={() => handleRemoveCompetence(comp)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add custom competence */}
        <div className="flex gap-2">
          <Input
            value={newCompetence}
            onChange={(e) => setNewCompetence(e.target.value)}
            placeholder="Legg til eget kompetansekrav"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomCompetence();
              }
            }}
          />
          <Button onClick={handleAddCustomCompetence} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="spesialkompetanse">Trenger prosjektet spesialkompetanse?</Label>
          <Textarea
            id="spesialkompetanse"
            value={data.spesialkompetanse || ""}
            onChange={(e) => updateData({ spesialkompetanse: e.target.value })}
            placeholder="Beskriv eventuell spesialkompetanse som trengs..."
            rows={3}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="ue_kompetanse_krav">Krav til underentreprenører (UE)</Label>
          <Textarea
            id="ue_kompetanse_krav"
            value={data.ue_kompetanse_krav || ""}
            onChange={(e) => updateData({ ue_kompetanse_krav: e.target.value })}
            placeholder="F.eks. sentral godkjenning, fagbrev, erfaring..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Dette vil hjelpe deg når du vurderer underentreprenører senere
          </p>
        </div>
      </div>
    </div>
  );
}
