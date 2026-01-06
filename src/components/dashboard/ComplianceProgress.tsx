import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useSetupWizard } from "@/hooks/useSetupWizard";

interface ComplianceStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  stepIndex: number;
}

const baseSteps = [
  {
    id: "goals",
    title: "Mål for internkontroll",
    description: "Definer bedriftens HMS-mål",
    stepIndex: 0,
  },
  {
    id: "organization",
    title: "Organisering",
    description: "Dokumenter ansvarsforhold",
    stepIndex: 1,
  },
  {
    id: "risk",
    title: "Risikovurdering",
    description: "Kartlegg farer og tiltak",
    stepIndex: 2,
  },
  {
    id: "actions",
    title: "Handlingsplan",
    description: "Planlegg forbedringstiltak",
    stepIndex: 3,
  },
  {
    id: "routines",
    title: "Rutiner",
    description: "Etabler sikre arbeidsrutiner",
    stepIndex: 4,
  },
  {
    id: "handbook",
    title: "Handbok",
    description: "Generer IK-dokumentasjon",
    stepIndex: 5,
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success",
    label: "Fullført",
  },
  "in-progress": {
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning",
    label: "Pågår",
  },
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "Venter",
  },
};

export function ComplianceProgress() {
  const navigate = useNavigate();
  const { progress, goals, organization, riskAssessment, actionPlan, routines } = useSetupWizard();

  // Calculate step status based on BOTH wizard progress completion AND actual data presence
  // A step is only "completed" if the user has explicitly completed it in the wizard
  // This prevents auto-generated default data from showing as 100% complete
  const steps: ComplianceStep[] = baseSteps.map((step) => {
    let status: "completed" | "in-progress" | "pending";
    
    // First check if the step is marked as completed in the wizard progress
    const isCompletedInWizard = progress?.completed_steps?.includes(step.id) || false;
    
    // Map step IDs to wizard step IDs (they use different naming in some cases)
    const stepIdMapping: Record<string, string> = {
      "goals": "goals",
      "organization": "organization", 
      "risk": "risk",
      "actions": "actions",
      "routines": "routines",
      "handbook": "handbook"
    };
    
    const wizardStepId = stepIdMapping[step.id] || step.id;
    const stepCompletedInWizard = progress?.completed_steps?.includes(wizardStepId) || false;
    
    // Check if there's actual data present
    let hasData = false;
    switch (step.id) {
      case "goals":
        hasData = !!(goals && goals.length > 0);
        break;
      case "organization":
        hasData = !!(organization && organization.custom_content);
        break;
      case "risk":
        hasData = !!(riskAssessment && riskAssessment.risks && riskAssessment.risks.length > 0);
        break;
      case "actions":
        hasData = !!(actionPlan && actionPlan.actions && actionPlan.actions.length > 0);
        break;
      case "routines":
        hasData = !!(routines && routines.routines && routines.routines.length > 0);
        break;
      case "handbook":
        // Handbook is completed only if marked as completed in wizard
        hasData = stepCompletedInWizard;
        break;
    }
    
    // A step is "completed" ONLY if explicitly marked as completed in the wizard
    // This prevents pre-populated default data from showing as complete
    if (stepCompletedInWizard) {
      status = "completed";
    } else if (step.stepIndex === (progress?.current_step || 0)) {
      // Current step is in-progress
      status = "in-progress";
    } else {
      status = "pending";
    }
    
    return { ...step, status };
  });

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = (completedCount / steps.length) * 100;

  const handleStepClick = (step: ComplianceStep) => {
    navigate(`/setup?step=${step.stepIndex}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-base md:text-lg font-semibold">Oppsett-fremgang</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            {completedCount} av {steps.length} steg fullført
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-bold text-primary">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 md:mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="h-full bg-gradient-primary rounded-full"
        />
      </div>

      {/* Steps */}
      <div className="space-y-2 md:space-y-3">
        {steps.map((step, index) => {
          const config = statusConfig[step.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              onClick={() => handleStepClick(step)}
              className={cn(
                "flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg transition-colors cursor-pointer hover:bg-accent/50",
                step.status === "in-progress" && "bg-warning/5 border border-warning/20",
                step.status === "completed" && "bg-success/5",
                step.status === "pending" && "bg-muted/50"
              )}
            >
              <div className={cn("p-1 md:p-1.5 rounded-full", config.bg + "/10")}>
                <Icon className={cn("w-4 h-4 md:w-5 md:h-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs md:text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {step.description}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap",
                  step.status === "completed" && "bg-success/10 text-success",
                  step.status === "in-progress" && "bg-warning/10 text-warning",
                  step.status === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {config.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
