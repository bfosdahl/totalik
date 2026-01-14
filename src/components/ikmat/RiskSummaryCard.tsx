import { Card, CardContent } from "@/components/ui/card";
import { IkMatRisk, IkMatActionItem, getTrafficLight, getActionPlanStatus } from "@/hooks/useIkMatContent";

interface RiskSummaryCardProps {
  risks: IkMatRisk[];
  actions: IkMatActionItem[];
}

export const RiskSummaryCard = ({ risks, actions }: RiskSummaryCardProps) => {
  const counts = {
    green: risks.filter(r => getTrafficLight(r.riskLevel) === 'green').length,
    yellow: risks.filter(r => getTrafficLight(r.riskLevel) === 'yellow').length,
    red: risks.filter(r => getTrafficLight(r.riskLevel) === 'red').length,
    haccp: risks.filter(r => r.isHaccp).length,
    overdue: risks.filter(r => getActionPlanStatus(actions, r.id) === 'overdue').length,
    closed: risks.filter(r => r.status === 'closed').length,
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{counts.green}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Lav</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">{counts.yellow}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Middels</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-sm font-medium">{counts.red}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Høy</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {counts.haccp > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">KKP:</span>
                <span className="font-medium">{counts.haccp}</span>
              </div>
            )}
            {counts.closed > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Lukket:</span>
                <span className="font-medium text-green-600">{counts.closed}</span>
              </div>
            )}
            {counts.overdue > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Forfalt:</span>
                <span className="font-medium text-red-600">{counts.overdue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
