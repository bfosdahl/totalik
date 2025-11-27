import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Building2, 
  AlertTriangle, 
  ListChecks, 
  FileText, 
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  Info
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Target;
}

const steps: SetupStep[] = [
  {
    id: "goals",
    title: "Mål for internkontroll",
    description: "Definer bedriftens HMS-mål og formål",
    icon: Target,
  },
  {
    id: "organization",
    title: "Organisering",
    description: "Dokumenter organisasjonsstruktur og ansvar",
    icon: Building2,
  },
  {
    id: "risk",
    title: "Risikovurdering",
    description: "Kartlegg farer og vurder risiko",
    icon: AlertTriangle,
  },
  {
    id: "actions",
    title: "Handlingsplan",
    description: "Planlegg tiltak basert på risikovurdering",
    icon: ListChecks,
  },
  {
    id: "routines",
    title: "Rutiner",
    description: "Etabler og dokumenter arbeidsrutiner",
    icon: FileText,
  },
  {
    id: "handbook",
    title: "Handbok",
    description: "Generer din IK-dokumentasjon",
    icon: BookOpen,
  },
];

const predefinedGoals = [
  "Sikre at alle ansatte har et trygt og helsefremmende arbeidsmiljø",
  "Forebygge arbeidsulykker og yrkessykdommer",
  "Overholde alle relevante lover og forskrifter innen HMS",
  "Kontinuerlig forbedre våre HMS-rutiner og prosedyrer",
  "Sikre at alle ansatte har nødvendig opplæring og kompetanse",
  "Redusere sykefravær gjennom forebyggende tiltak",
];

function GoalsStep() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-info mb-1">Tips</p>
          <p className="text-muted-foreground">
            Velg mål som er relevante for din bedrift. Du kan velge flere forhåndsdefinerte mål
            eller legge til egne.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Forhåndsdefinerte mål</h4>
        <div className="grid gap-3">
          {predefinedGoals.map((goal, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleGoal(goal)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                selectedGoals.includes(goal)
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  selectedGoals.includes(goal)
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedGoals.includes(goal) && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <span className="text-sm">{goal}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Legg til egne mål</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="Skriv inn et eget mål..."
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
          />
          <Button
            onClick={() => {
              if (customGoal.trim()) {
                toggleGoal(customGoal.trim());
                setCustomGoal("");
              }
            }}
            disabled={!customGoal.trim()}
          >
            Legg til
          </Button>
        </div>
      </div>

      {selectedGoals.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium text-sm mb-3">
            Valgte mål ({selectedGoals.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedGoals.map((goal, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {goal.length > 50 ? goal.substring(0, 50) + "..." : goal}
                <button
                  onClick={() => toggleGoal(goal)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderStep({ step }: { step: SetupStep }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-primary/10 mb-4">
        <step.icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
      <p className="text-muted-foreground max-w-md">
        {step.description}. Denne modulen er under utvikling.
      </p>
    </div>
  );
}

const Setup = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "goals":
        return <GoalsStep />;
      default:
        return <PlaceholderStep step={steps[currentStep]} />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight">Oppsett av internkontroll</h1>
          <p className="text-muted-foreground">
            Følg veiviseren for å etablere din bedrifts internkontrollsystem
          </p>
        </motion.div>

        {/* Progress steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all",
                    index <= currentStep ? "opacity-100" : "opacity-40"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      index < currentStep
                        ? "bg-success text-success-foreground"
                        : index === currentStep
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block max-w-[80px] text-center">
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 lg:w-16 h-0.5 mx-2",
                      index < currentStep ? "bg-success" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card min-h-[400px]"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return <StepIcon className="w-5 h-5 text-primary" />;
              })()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Steg {currentStep + 1}: {steps[currentStep].title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Forrige
          </Button>

          <div className="text-sm text-muted-foreground">
            Steg {currentStep + 1} av {steps.length}
          </div>

          <Button onClick={goNext} className="gap-2">
            {currentStep === steps.length - 1 ? "Fullfør" : "Neste"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Setup;
