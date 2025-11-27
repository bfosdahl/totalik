import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Info, Lightbulb, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CompanyGoal } from "@/hooks/useSetupWizard";

// Comprehensive predefined goals for Norwegian companies (HMS, MAT, BYGG)
const predefinedGoals = [
  // HMS (Workplace Health & Safety)
  {
    category: "HMS - Arbeidsmiljø",
    goals: [
      "Sikre at alle ansatte har et trygt og helsefremmende arbeidsmiljø",
      "Forebygge arbeidsulykker og yrkessykdommer",
      "Redusere sykefravær gjennom forebyggende tiltak",
      "Sikre at alle ansatte har nødvendig opplæring og kompetanse innen HMS",
      "Gjennomføre jevnlige vernerunder og risikovurderinger",
    ],
  },
  // Compliance
  {
    category: "Lovpålagte krav",
    goals: [
      "Overholde alle relevante lover og forskrifter innen HMS",
      "Sikre samsvar med Arbeidstilsynets krav og retningslinjer",
      "Dokumentere internkontrollarbeidet i henhold til forskriften",
      "Oppfylle krav i Internkontrollforskriften (HMS-forskriften)",
    ],
  },
  // Continuous improvement
  {
    category: "Kontinuerlig forbedring",
    goals: [
      "Kontinuerlig forbedre våre HMS-rutiner og prosedyrer",
      "Etablere en kultur for rapportering av avvik og forbedringsforslag",
      "Følge opp og lukke avvik innen fastsatte frister",
      "Gjennomgå og oppdatere risikovurderinger årlig",
    ],
  },
  // Food safety (MAT)
  {
    category: "Matsikkerhet",
    goals: [
      "Sikre trygg håndtering av matvarer i henhold til Mattilsynets krav",
      "Forebygge matbåren sykdom gjennom gode hygienrutiner",
      "Opprettholde korrekt temperaturkontroll gjennom hele verdikjeden",
      "Sikre sporbarhet av alle råvarer og produkter",
    ],
  },
  // Construction (BYGG)
  {
    category: "Bygg og anlegg",
    goals: [
      "Sikre trygg gjennomføring av byggeprosjekter",
      "Forebygge fallulykker og ulykker med maskiner og utstyr",
      "Sikre at alle har påkrevd sikkerhetsopplæring (HMS-kort)",
      "Gjennomføre sikker jobb-analyser (SJA) ved risikofylt arbeid",
    ],
  },
];

interface GoalsStepProps {
  existingGoals: CompanyGoal[];
  onSave: (goals: Array<{ goal_text: string; is_predefined: boolean }>) => Promise<void>;
  isSaving: boolean;
}

export function GoalsStep({ existingGoals, onSave, isSaving }: GoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<Map<string, boolean>>(new Map());
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [customGoalInput, setCustomGoalInput] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["HMS - Arbeidsmiljø"]));

  // Initialize from existing goals
  useEffect(() => {
    if (existingGoals.length > 0) {
      const goalMap = new Map<string, boolean>();
      const custom: string[] = [];

      existingGoals.forEach((goal) => {
        if (goal.is_predefined) {
          goalMap.set(goal.goal_text, true);
        } else {
          custom.push(goal.goal_text);
        }
      });

      setSelectedGoals(goalMap);
      setCustomGoals(custom);
    }
  }, [existingGoals]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(goal)) {
        newMap.delete(goal);
      } else {
        newMap.set(goal, true);
      }
      return newMap;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const addCustomGoal = () => {
    const trimmed = customGoalInput.trim();
    if (trimmed && !customGoals.includes(trimmed)) {
      setCustomGoals((prev) => [...prev, trimmed]);
      setCustomGoalInput("");
    }
  };

  const removeCustomGoal = (goal: string) => {
    setCustomGoals((prev) => prev.filter((g) => g !== goal));
  };

  const handleSave = async () => {
    const allGoals = [
      ...Array.from(selectedGoals.keys()).map((goal) => ({
        goal_text: goal,
        is_predefined: true,
      })),
      ...customGoals.map((goal) => ({
        goal_text: goal,
        is_predefined: false,
      })),
    ];
    await onSave(allGoals);
  };

  const totalSelected = selectedGoals.size + customGoals.length;

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-info mb-1">Slik velger du mål</p>
          <p className="text-muted-foreground">
            Velg mål som er relevante for din bedrift og bransje. Du kan velge fra 
            forhåndsdefinerte mål eller legge til egne. Målene blir en del av din IK-handbok.
          </p>
        </div>
      </div>

      {/* Predefined goals by category */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Forhåndsdefinerte mål etter kategori
        </h4>
        
        {predefinedGoals.map((category) => (
          <div key={category.category} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <span className="font-medium text-sm">{category.category}</span>
              <span className="text-xs text-muted-foreground">
                {category.goals.filter((g) => selectedGoals.has(g)).length} / {category.goals.length} valgt
              </span>
            </button>
            
            {expandedCategories.has(category.category) && (
              <div className="p-3 space-y-2">
                {category.goals.map((goal, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      selectedGoals.has(goal)
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-secondary/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        selectedGoals.has(goal)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selectedGoals.has(goal) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{goal}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom goals */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Legg til egne mål
        </h4>
        <div className="flex gap-2">
          <Input
            value={customGoalInput}
            onChange={(e) => setCustomGoalInput(e.target.value)}
            placeholder="Skriv inn et eget mål..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomGoal();
              }
            }}
          />
          <Button onClick={addCustomGoal} disabled={!customGoalInput.trim()}>
            Legg til
          </Button>
        </div>

        {/* Custom goals list */}
        {customGoals.length > 0 && (
          <div className="space-y-2">
            {customGoals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg border border-accent bg-accent/5"
              >
                <Check className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm flex-1">{goal}</span>
                <button
                  onClick={() => removeCustomGoal(goal)}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary and save */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">{totalSelected}</span>
          <span className="text-muted-foreground"> mål valgt</span>
        </div>
        <Button onClick={handleSave} disabled={isSaving || totalSelected === 0}>
          {isSaving ? "Lagrer..." : "Lagre mål"}
        </Button>
      </div>
    </div>
  );
}
