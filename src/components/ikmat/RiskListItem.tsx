import { Badge } from "@/components/ui/badge";
import { IkMatRisk, IkMatActionItem, getTrafficLight, getActionPlanStatus, getActionPlanStatusLabel } from "@/hooks/useIkMatContent";
import { ChevronRight, AlertTriangle, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface RiskListItemProps {
  risk: IkMatRisk;
  actions: IkMatActionItem[];
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

export const RiskListItem = ({ risk, actions, onClick, hasDeviation }: RiskListItemProps) => {
  const trafficLight = getTrafficLight(risk.riskLevel);
  const actionStatus = getActionPlanStatus(actions, risk.id);
  const riskActions = actions.filter(a => a.riskId === risk.id);
  
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

  const getActionStatusBadge = () => {
    switch (actionStatus) {
      case 'none':
        return null; // Don't show badge if no actions
      case 'in_progress':
        return (
          <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400 gap-1">
            <Clock className="h-3 w-3" />
            {riskActions.length} tiltak
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="text-xs font-normal border-red-300 text-red-700 dark:border-red-800 dark:text-red-400 gap-1">
            <AlertCircle className="h-3 w-3" />
            Forfalt
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-xs font-normal border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Lukket
          </Badge>
        );
    }
  };

  const indicatorColor = () => {
    if (hasDeviation || actionStatus === 'overdue') return 'bg-red-500';
    if (risk.status === 'closed') return 'bg-green-500';
    switch (trafficLight) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-orange-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors text-left group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Risk level indicator - small, discrete circle */}
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${indicatorColor()}`} />
        
        {/* Hazard name */}
        <span className="font-medium truncate">{risk.hazard || 'Ikke navngitt'}</span>
        
        {/* Discrete badges */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
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
          
          {getActionStatusBadge()}
          
          {hasDeviation && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>
      </div>
      
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
    </button>
  );
};
