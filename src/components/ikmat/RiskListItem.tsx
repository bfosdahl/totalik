import { Badge } from "@/components/ui/badge";
import { IkMatRisk, getTrafficLight } from "@/hooks/useIkMatContent";
import { ChevronRight, AlertTriangle } from "lucide-react";

interface RiskListItemProps {
  risk: IkMatRisk;
  onClick: () => void;
  hasDeviation?: boolean;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig',
  quarterly: 'Kvartalsvis',
  biannually: 'Halvårlig',
  yearly: 'Årlig',
};

export const RiskListItem = ({ risk, onClick, hasDeviation }: RiskListItemProps) => {
  const trafficLight = getTrafficLight(risk.riskLevel);
  
  const getRiskLevelBadge = () => {
    const baseClasses = "text-xs font-normal";
    switch (trafficLight) {
      case 'green':
        return <Badge variant="secondary" className={baseClasses}>Lav</Badge>;
      case 'yellow':
        return <Badge variant="secondary" className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`}>Middels</Badge>;
      case 'red':
        return <Badge variant="secondary" className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`}>Høy</Badge>;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors text-left group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Risk level indicator - small, discrete circle */}
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          hasDeviation ? 'bg-red-500' :
          trafficLight === 'green' ? 'bg-green-500' :
          trafficLight === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
        }`} />
        
        {/* Hazard name */}
        <span className="font-medium truncate">{risk.hazard || 'Ikke navngitt'}</span>
        
        {/* Discrete badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {getRiskLevelBadge()}
          
          {risk.isHaccp && (
            <Badge variant="outline" className="text-xs font-normal border-destructive/50 text-destructive">
              KKP
            </Badge>
          )}
          
          {risk.frequency && (
            <Badge variant="outline" className="text-xs font-normal hidden sm:inline-flex">
              {FREQUENCY_LABELS[risk.frequency] || risk.frequency}
            </Badge>
          )}
          
          {hasDeviation && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>
      </div>
      
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
    </button>
  );
};
