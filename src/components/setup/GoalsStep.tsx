import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Check, Info, Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompanyGoal } from "@/hooks/useSetupWizard";

export interface GoalsStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

// Authentic Norwegian goal examples for internal control
const goalExamples = [
  {
    id: "example1",
    title: "Forebygging og trivsel",
    description: "Vi vil forebygge ulykker, miljø- og helseskader for å skape trivsel på arbeidsplassen. Driften skal gi minst mulig påvirkning på det ytre miljø. Våre produkter og tjenester skal være sikre for våre kunder. Dette skal skje ved at helse, miljø og sikkerhet planlegges og prioriteres på lik linje med produksjon, service og økonomi.",
  },
  {
    id: "example2",
    title: "Trivsel og kontinuerlig forbedring",
    description: "I vår virksomhet skal det skapes et trivelig og sikkert arbeidsmiljø for alle ansatte. Vi skal også ta vare på virksomhetens bygninger og materiell, forhindre belastning på det ytre miljø, og våre produkter skal ikke skade brukerne. Disse målene skal nås gjennom stadige forbedringer. Både ledelse og ansatte skal delta aktivt i forbedringsarbeidet.",
  },
  {
    id: "example3",
    title: "Mennesket som ressurs",
    description: "Mennesket er den viktigste ressurs i arbeidslivet, og god helse er viktig. Virksomheten vil derfor gjennom et HMS-system forebygge ulykker og helseskader, og skape trivsel på arbeidsplassen. Dette skal skje ved at sikkerhet og arbeidsmiljø planlegges og prioriteres på lik linje med produksjon, teknikk og økonomi.",
  },
  {
    id: "example4",
    title: "Helsefremmende arbeidsplass",
    description: "Vårt mål er en helsefremmende arbeidsplass med faglig og personlig utvikling for de ansatte. Konkrete mål for helse, miljø og sikkerhetsarbeidet: Den overordnede målsettingen må nedfelles i konkrete mål som skal være mulige å oppnå. For at du skal se om virksomheten har nådd de oppsatte mål, er det viktig at målene er konkrete og målbare.",
  },
  {
    id: "example5",
    title: "Konkrete målbare mål",
    description: "I vår virksomhet skal vi i år redusere sykefraværet med en prosent. For å fremme faglig og personlig utvikling skal hver av de ansatte i år ha mulighet for å gå på et kurs på et selvvalgt tema for å bedre arbeidsutførelsen.",
  },
];

interface GoalsStepProps {
  existingGoals: CompanyGoal[];
  onSave: (goals: Array<{ goal_text: string; is_predefined: boolean }>) => Promise<void>;
  isSaving: boolean;
}

export const GoalsStep = forwardRef<GoalsStepRef, GoalsStepProps>(
  function GoalsStep({ existingGoals, onSave, isSaving }, ref) {
    const [selectedExample, setSelectedExample] = useState<string | null>(null);
    const [customGoal, setCustomGoal] = useState("");
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Initialize from existing goals
    useEffect(() => {
      if (existingGoals.length > 0) {
        const existingGoal = existingGoals[0];
        if (existingGoal.is_predefined) {
          // Find matching example
          const match = goalExamples.find((e) => e.description === existingGoal.goal_text);
          if (match) {
            setSelectedExample(match.id);
          }
        } else {
          setCustomGoal(existingGoal.goal_text);
          setIsCustomMode(true);
        }
      }
    }, [existingGoals]);

    const selectExample = (exampleId: string) => {
      setSelectedExample(exampleId);
      setIsCustomMode(false);
      setCustomGoal("");
    };

    const handleCustomMode = () => {
      setIsCustomMode(true);
      setSelectedExample(null);
    };

    const handleSave = async () => {
      if (isCustomMode && customGoal.trim()) {
        await onSave([{ goal_text: customGoal.trim(), is_predefined: false }]);
      } else if (selectedExample) {
        const example = goalExamples.find((e) => e.id === selectedExample);
        if (example) {
          await onSave([{ goal_text: example.description, is_predefined: true }]);
        }
      }
    };

    const hasSelection = selectedExample || (isCustomMode && customGoal.trim());

    // Expose save method to parent via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      hasData: () => !!hasSelection,
    }));

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-info mb-1">Velg målsetting for din virksomhet</p>
          <p className="text-muted-foreground">
            Velg en av eksemplene under eller skriv din egen målsetting. 
            Målsettingen blir en del av din IK-handbok.
          </p>
        </div>
      </div>

      {/* Goal examples */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Eksempler på målsettinger
        </h4>
        
        <div className="space-y-3">
          {goalExamples.map((example, index) => (
            <motion.button
              key={example.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => selectExample(example.id)}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                selectedExample === example.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-secondary/30"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  selectedExample === example.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedExample === example.id && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm mb-1">{example.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {example.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom goal */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Eller skriv din egen målsetting
          </h4>
        </div>
        
        <button
          onClick={handleCustomMode}
          className={cn(
            "w-full p-4 rounded-lg border text-left transition-all",
            isCustomMode
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                isCustomMode
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isCustomMode && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
            <span className="text-sm font-medium">Egen målsetting</span>
          </div>
        </button>

        {isCustomMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <textarea
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Skriv inn din egen målsetting her..."
              className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </motion.div>
        )}
      </div>

      {/* Summary and save */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasSelection ? "Målsetting valgt" : "Velg en målsetting"}
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasSelection}>
          {isSaving ? "Lagrer..." : "Lagre målsetting"}
        </Button>
      </div>
    </div>
  );
});
