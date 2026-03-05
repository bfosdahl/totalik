import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { useHmsDeclarations } from "@/hooks/useHmsDeclarations";
import { useTranslate } from "@/hooks/useTranslate";

interface ComplianceStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  status: "completed" | "in-progress" | "pending";
  stepIndex: number;
}

export function ComplianceProgress() {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const { progress, goals, organization, riskAssessment, actionPlan, routines, isLoading } = useSetupWizard();
  const { hasSelfDeclaration } = useHmsDeclarations();

  const baseSteps = [
    { id: "goals", titleKey: "dashboard.goalsForInternalControl", descriptionKey: "dashboard.defineHmsGoals", stepIndex: 0 },
    { id: "organization", titleKey: "dashboard.organizationStep", descriptionKey: "dashboard.documentResponsibilities", stepIndex: 1 },
    { id: "risk", titleKey: "dashboard.riskAssessmentStep", descriptionKey: "dashboard.mapHazards", stepIndex: 2 },
    { id: "actions", titleKey: "dashboard.actionPlanStep", descriptionKey: "dashboard.planImprovements", stepIndex: 3 },
    { id: "routines", titleKey: "dashboard.routinesStep", descriptionKey: "dashboard.establishRoutines", stepIndex: 4 },
    { id: "handbook", titleKey: "dashboard.handbookStep", descriptionKey: "dashboard.generateDocumentation", stepIndex: 5 },
  ];

  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success",
      labelKey: "dashboard.statusCompleted",
    },
    "in-progress": {
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning",
      labelKey: "dashboard.statusInProgress",
    },
    pending: {
      icon: Circle,
      color: "text-muted-foreground",
      bg: "bg-muted",
      labelKey: "dashboard.statusPending",
    },
  };

  // Check if wizard is completed
  const wizardCompleted = progress?.is_completed ?? false;
  const completedStepsList = progress?.completed_steps ?? [];

  const isStepCompleted = (stepId: string, hasData: boolean, hasNonPredefinedData: boolean): boolean => {
    if (wizardCompleted) {
      return completedStepsList.includes(stepId) || hasData;
    }
    return completedStepsList.includes(stepId) || hasNonPredefinedData;
  };

  const steps: ComplianceStep[] = baseSteps.map((step) => {
    let status: "completed" | "in-progress" | "pending";
    let hasData = false;
    let hasNonPredefinedData = false;
    
    switch (step.id) {
      case "goals":
        hasData = !!(goals && goals.length > 0);
        hasNonPredefinedData = goals?.some(g => !g.is_predefined) ?? false;
        break;
      case "organization":
        hasData = !!(organization && (organization.roles?.length > 0 || (organization.description && organization.description.trim().length > 0)));
        hasNonPredefinedData = hasData;
        break;
      case "risk":
        hasData = !!(riskAssessment && riskAssessment.risks && riskAssessment.risks.length > 0);
        hasNonPredefinedData = false;
        break;
      case "actions":
        hasData = !!(actionPlan && actionPlan.actions && actionPlan.actions.length > 0);
        hasNonPredefinedData = actionPlan?.actions?.some(a => a.status && a.status !== 'ikke_startet') ?? false;
        break;
      case "routines":
        hasData = !!(routines && routines.routines && routines.routines.length > 0);
        hasNonPredefinedData = routines?.routines?.some(r => !r.is_predefined) ?? false;
        break;
      case "handbook":
        hasData = hasSelfDeclaration;
        hasNonPredefinedData = hasSelfDeclaration;
        break;
    }
    
    const stepCompleted = isStepCompleted(step.id, hasData, hasNonPredefinedData);
    
    if (stepCompleted) {
      status = "completed";
    } else if (step.stepIndex === (progress?.current_step || 0)) {
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
          <h3 className="text-base md:text-lg font-semibold">{t("dashboard.setupProgress")}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            {t("dashboard.stepsCompleted", { completed: completedCount, total: steps.length })}
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
                <p className="font-medium text-xs md:text-sm">{t(step.titleKey)}</p>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {t(step.descriptionKey)}
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
                {t(config.labelKey)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}