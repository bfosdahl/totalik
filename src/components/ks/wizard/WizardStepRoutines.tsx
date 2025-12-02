import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WizardData } from "../ProjectWizard";

interface WizardStepRoutinesProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

const availableRoutines = [
  { id: "ks_rutiner", label: "KS-rutiner for prosjekt (arbeidsmetodikk, sjekklister, avvik)" },
  { id: "ue_rutine", label: "Rutine for bruk av underentreprenører" },
  { id: "kontroll_lukking", label: "Rutine for kontroll før lukking" },
  { id: "egenkontroll", label: "Rutine for egenkontroll" },
  { id: "ferdigstillelse", label: "Rutine for ferdigstillelse" },
  { id: "overtakelse", label: "Rutine for overtakelse" },
  { id: "sluttbefaring", label: "Rutine for sluttbefaring" },
  { id: "garanti", label: "Rutine for årlig garantibefaring" },
  { id: "vernerunder", label: "Rutine for vernerunder" },
  { id: "dokumentasjon", label: "Rutine for dokumenthåndtering" },
];

export function WizardStepRoutines({ data, updateData }: WizardStepRoutinesProps) {
  const handleToggleRoutine = (routineId: string) => {
    const current = data.aktive_rutiner || [];
    const updated = current.includes(routineId)
      ? current.filter(r => r !== routineId)
      : [...current, routineId];
    updateData({ aktive_rutiner: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Velg rutiner som skal gjelde i prosjektet</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Rutinene blir tilgjengelige i prosjektet og kan tilpasses etter behov
        </p>

        <div className="space-y-3">
          {availableRoutines.map((routine) => (
            <div key={routine.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/30">
              <Checkbox
                id={routine.id}
                checked={(data.aktive_rutiner || []).includes(routine.id)}
                onCheckedChange={() => handleToggleRoutine(routine.id)}
              />
              <Label
                htmlFor={routine.id}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {routine.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-md">
        <p className="text-sm text-muted-foreground">
          <strong>Tips:</strong> Du kan alltid legge til eller fjerne rutiner senere i prosjektet.
          Det anbefales å aktivere rutiner som er relevante for tiltaksklassen og prosjekttypen.
        </p>
      </div>
    </div>
  );
}
