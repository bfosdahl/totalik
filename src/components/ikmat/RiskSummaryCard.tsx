import { Card, CardContent } from "@/components/ui/card";
import { IkMatRisk, getTrafficLight } from "@/hooks/useIkMatContent";

interface RiskSummaryCardProps {
  risks: IkMatRisk[];
}

export const RiskSummaryCard = ({ risks }: RiskSummaryCardProps) => {
  const counts = {
    green: risks.filter(r => getTrafficLight(r.riskLevel) === 'green').length,
    yellow: risks.filter(r => getTrafficLight(r.riskLevel) === 'yellow').length,
    red: risks.filter(r => getTrafficLight(r.riskLevel) === 'red').length,
    haccp: risks.filter(r => r.isHaccp).length,
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
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
          
          {counts.haccp > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">KKP:</span>
              <span className="font-medium">{counts.haccp}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
