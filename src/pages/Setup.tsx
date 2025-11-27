import { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { GoalsStep } from "@/components/setup/GoalsStep";
import { OrganizationStep } from "@/components/setup/OrganizationStep";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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

function NoCompanyMessage() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-warning/10 mb-4">
        <Building2 className="w-8 h-8 text-warning" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Ingen bedrift tilknyttet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Du må være tilknyttet en bedrift for å bruke oppsettveiviseren. 
        Kontakt din administrator for å bli lagt til i en bedrift.
      </p>
      <Button onClick={() => navigate("/")} variant="outline">
        Gå til dashboard
      </Button>
    </div>
  );
}

const Setup = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const { 
    isLoading, 
    isSaving, 
    goals, 
    organization,
    progress, 
    companyId,
    saveProgress, 
    saveGoals,
    saveOrganization,
    completeStep 
  } = useSetupWizard();
  
  const [currentStep, setCurrentStep] = useState(0);

  // Sync current step with saved progress
  useEffect(() => {
    if (progress.current_step !== currentStep && !isLoading) {
      setCurrentStep(progress.current_step);
    }
  }, [progress.current_step, isLoading]);

  const goNext = async () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      await saveProgress({ current_step: newStep });
      await completeStep(steps[currentStep].id);
    }
  };

  const goBack = async () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      await saveProgress({ current_step: newStep });
    }
  };

  const handleStepClick = async (index: number) => {
    setCurrentStep(index);
    await saveProgress({ current_step: index });
  };

  const renderStepContent = () => {
    if (!companyId) {
      return <NoCompanyMessage />;
    }

    switch (steps[currentStep].id) {
      case "goals":
        return (
          <GoalsStep 
            existingGoals={goals} 
            onSave={saveGoals} 
            isSaving={isSaving} 
          />
        );
      case "organization":
        return (
          <OrganizationStep
            existingData={organization || undefined}
            onSave={saveOrganization}
            isSaving={isSaving}
          />
        );
      default:
        return <PlaceholderStep step={steps[currentStep]} />;
    }
  };

  const isStepCompleted = (stepId: string) => {
    return progress.completed_steps.includes(stepId);
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all",
                    index <= currentStep || isStepCompleted(step.id) ? "opacity-100" : "opacity-40"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isStepCompleted(step.id)
                        ? "bg-success text-success-foreground"
                        : index === currentStep
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isStepCompleted(step.id) ? (
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
                      isStepCompleted(step.id) ? "bg-success" : "bg-muted"
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
            disabled={currentStep === 0 || isSaving}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Forrige
          </Button>

          <div className="text-sm text-muted-foreground">
            Steg {currentStep + 1} av {steps.length}
          </div>

          <Button onClick={goNext} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === steps.length - 1 ? (
              "Fullfør"
            ) : (
              "Neste"
            )}
            {!isSaving && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Setup;
