import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";

export interface SetupStep {
  id: string;
  label: string;
  shortLabel: string;
}

export const HMS_SETUP_STEPS: SetupStep[] = [
  { id: "bedriftsinfo", label: "Bedriftsinformasjon", shortLabel: "Bedrift" },
  { id: "egenerklaering", label: "Egenerklæring HMS", shortLabel: "Erklæring" },
  { id: "verneombud", label: "Verneombud", shortLabel: "Verneombud" },
  { id: "maal", label: "Mål for internkontroll", shortLabel: "Mål" },
  { id: "organisering", label: "Organisering og ansvar", shortLabel: "Org." },
  { id: "risiko", label: "Risikovurdering", shortLabel: "Risiko" },
  { id: "handlingsplan", label: "Handlingsplan", shortLabel: "Tiltak" },
  { id: "rutiner", label: "Rutiner og prosedyrer", shortLabel: "Rutiner" },
  { id: "lover", label: "Lover og forskrifter", shortLabel: "Lover" },
];

interface SetupStepIndicatorProps {
  currentStep: number;
  completedSteps: Set<string>;
}

export function SetupStepIndicator({ currentStep, completedSteps }: SetupStepIndicatorProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentStep]);

  return (
    <div className="bg-card border rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-max px-1">
          {HMS_SETUP_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;

            return (
              <div
                key={step.id}
                ref={isCurrent ? activeRef : undefined}
                className="flex items-center gap-1 sm:gap-1.5"
              >
                {index > 0 && (
                  <div
                    className={`w-3 sm:w-5 h-px ${
                      isPast || isCompleted ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0 ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    ) : isCurrent ? (
                      <CircleDot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] leading-tight text-center max-w-[48px] sm:max-w-[56px] ${
                      isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {step.shortLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
