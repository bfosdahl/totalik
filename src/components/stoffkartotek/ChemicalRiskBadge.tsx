import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { useChemicalRiskAssessment, calculateChemicalRiskLevel } from "@/hooks/useChemicalRiskAssessment";
import { cn } from "@/lib/utils";

interface ChemicalRiskBadgeProps {
  chemicalEntryId: string;
  source?: 'global' | 'ik_hms';
  onClick?: () => void;
  showDetails?: boolean;
}

export const ChemicalRiskBadge = ({
  chemicalEntryId,
  source = 'global',
  onClick,
  showDetails = false,
}: ChemicalRiskBadgeProps) => {
  const { data: assessment, isLoading } = useChemicalRiskAssessment(chemicalEntryId, source);

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        Laster...
      </Badge>
    );
  }

  // No assessment yet
  if (!assessment) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground"
      >
        <Shield className="h-4 w-4 mr-1" />
        Risikovurder
      </Button>
    );
  }

  // Assessment exists - show status
  const riskLevel = calculateChemicalRiskLevel(
    assessment.hazard_severity || 0,
    assessment.exposure_probability || 0
  );

  const getStatusIcon = () => {
    if (assessment.status === "completed") {
      return <CheckCircle2 className="h-3 w-3" />;
    }
    if (assessment.status === "in_progress") {
      return <Clock className="h-3 w-3" />;
    }
    return <FileWarning className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (assessment.status === "completed") {
      return "Fullført";
    }
    if (assessment.status === "in_progress") {
      return `Fase ${assessment.current_phase}`;
    }
    return "Utkast";
  };

  const getBadgeClasses = () => {
    if (assessment.status !== "completed" && assessment.status !== "in_progress") {
      return "bg-muted text-muted-foreground border-muted";
    }
    return cn(riskLevel.bg, riskLevel.color, "border");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-auto p-1"
    >
      <Badge
        variant="outline"
        className={cn("cursor-pointer transition-colors", getBadgeClasses())}
      >
        {getStatusIcon()}
        <span className="ml-1">
          {showDetails ? (
            <>
              {riskLevel.score > 0 ? `R${riskLevel.score}` : ""} {getStatusText()}
            </>
          ) : (
            <>
              <Shield className="h-3 w-3 mr-1" />
              {riskLevel.score > 0 && <span className="font-bold mr-1">{riskLevel.score}</span>}
              {getStatusText()}
            </>
          )}
        </span>
      </Badge>
    </Button>
  );
};
