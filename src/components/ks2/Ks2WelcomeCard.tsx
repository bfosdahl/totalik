import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Rocket, 
  ClipboardCheck, 
  FileText, 
  Users,
  ChevronRight,
  X,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: typeof Rocket;
  path: string;
  color: string;
}

const allOnboardingSteps: Step[] = [
  {
    id: "maler",
    title: "Velg maler",
    description: "Velg sjekklister og rutiner for prosjektet",
    icon: FileText,
    path: "/maler",
    color: "text-purple-500 bg-purple-500/10"
  },
  {
    id: "prosjektinfo",
    title: "Fyll ut prosjektinfo",
    description: "Legg inn adresse, kontaktpersoner og detaljer",
    icon: ClipboardCheck,
    path: "/prosjektinfo",
    color: "text-blue-500 bg-blue-500/10"
  },
  {
    id: "underleverandorer",
    title: "Legg til underleverandører",
    description: "Registrer UE med dokumentasjon",
    icon: Users,
    path: "/underleverandorer",
    color: "text-emerald-500 bg-emerald-500/10"
  },
];

/** Steps that only apply to certain contractor types */
const STEPS_REQUIRING_SUBCONTRACTORS = ["underleverandorer"];

/** Contractor types that typically manage subcontractors */
const CONTRACTOR_TYPES_WITH_SUBS = ["total", "hoved"];

interface Ks2WelcomeCardProps {
  hasChecklists: boolean;
  hasSubcontractors: boolean;
  hasTemplates: boolean;
  contractorType?: string | null;
}

export function Ks2WelcomeCard({ 
  hasChecklists, 
  hasSubcontractors,
  hasTemplates,
  contractorType,
}: Ks2WelcomeCardProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const basePath = `/ks/project/${projectId}`;
  
  // Check if user has dismissed the welcome card
  const storageKey = `ks2-welcome-dismissed-${projectId}`;
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });

  // Filter steps based on contractor type
  const needsSubs = contractorType ? CONTRACTOR_TYPES_WITH_SUBS.includes(contractorType) : true;
  const onboardingSteps = allOnboardingSteps.filter(step => {
    if (STEPS_REQUIRING_SUBCONTRACTORS.includes(step.id) && !needsSubs) return false;
    return true;
  });

  // Determine if project seems "new" (no data yet)
  const isNewProject = !hasChecklists && (!needsSubs || !hasSubcontractors);

  // Build completion status matching filtered steps
  const completedSteps = onboardingSteps.map(step => {
    switch (step.id) {
      case "maler": return hasTemplates;
      case "prosjektinfo": return hasChecklists;
      case "underleverandorer": return hasSubcontractors;
      default: return false;
    }
  });

  // Don't show if dismissed or all steps completed
  if (isDismissed || completedSteps.every(Boolean)) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsDismissed(true);
  };

  const progress = Math.round((completedSteps.filter(Boolean).length / completedSteps.length) * 100);

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20 relative overflow-hidden">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Lukk"
      >
        <X className="h-4 w-4" />
      </button>

      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {isNewProject ? "Velkommen til prosjektet! 🎉" : "Kom i gang"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isNewProject 
                ? "Følg stegene under for å sette opp prosjektet ditt"
                : `${progress}% fullført - fortsett der du slapp`
              }
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {onboardingSteps.map((step, index) => {
            const isCompleted = completedSteps[index];
            
            return (
              <button
                key={step.id}
                onClick={() => navigate(`${basePath}${step.path}`)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                  isCompleted 
                    ? "bg-muted/30 opacity-60" 
                    : "bg-card hover:bg-muted/50 shadow-sm border"
                )}
              >
                <div className={cn("p-2 rounded-lg", step.color)}>
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    isCompleted && "line-through text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                {isCompleted ? (
                  <span className="text-xs text-green-500 font-medium">✓ Ferdig</span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tip */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tips:</span> På mobil kan du trykke på <span className="font-medium text-primary">+</span>-knappen nederst til høyre for raske handlinger.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
