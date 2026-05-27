import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IkMatRisk } from "@/hooks/useIkMatContent";
import { Calendar, Thermometer, ClipboardCheck, ExternalLink, AlertTriangle } from "lucide-react";
import { getLocalDateString } from "@/lib/dateUtils";

interface ControlPlanOverviewProps {
  risks: IkMatRisk[];
  onOpenRisk: (riskId: string) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig',
  quarterly: 'Kvartalsvis',
  biannually: 'Halvårlig',
  yearly: 'Årlig',
};

export const ControlPlanOverview = ({ risks, onOpenRisk }: ControlPlanOverviewProps) => {
  const [activeView, setActiveView] = useState<'today' | 'week' | 'all'>('today');

  const today = getLocalDateString();
  const weekFromNow = getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Group risks by frequency/timing
  const groupedRisks = useMemo(() => {
    const dailyRisks = risks.filter(r => r.frequency === 'daily');
    const weeklyRisks = risks.filter(r => r.frequency === 'weekly');
    const upcomingRisks = risks.filter(r => 
      r.controlDate && r.controlDate >= today && r.controlDate <= weekFromNow
    );
    const overdueRisks = risks.filter(r => 
      r.controlDate && r.controlDate < today
    );

    return { dailyRisks, weeklyRisks, upcomingRisks, overdueRisks };
  }, [risks, today, weekFromNow]);

  // Controls for today
  const todaysControls = useMemo(() => {
    const controls: IkMatRisk[] = [];
    
    // Add daily controls
    controls.push(...groupedRisks.dailyRisks);
    
    // Add controls due today
    risks.forEach(r => {
      if (r.controlDate === today && !groupedRisks.dailyRisks.includes(r)) {
        controls.push(r);
      }
    });

    return controls;
  }, [risks, groupedRisks.dailyRisks, today]);

  if (risks.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-medium text-muted-foreground mb-2">
          Ingen KKP-kontroller definert
        </h3>
        <p className="text-sm text-muted-foreground">
          Merk risikoer som kritiske kontrollpunkter (KKP) for å se dem her.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue warning */}
      {groupedRisks.overdueRisks.length > 0 && (
        <Card className="border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  {groupedRisks.overdueRisks.length} kontroll(er) er forfalt
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Disse kontrollene skulle vært utført og krever umiddelbar oppmerksomhet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'today' | 'week' | 'all')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="gap-2">
            <Calendar className="h-4 w-4" />
            I dag ({todaysControls.length})
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            Denne uken ({groupedRisks.upcomingRisks.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            Alle KKP ({risks.length})
          </TabsTrigger>
        </TabsList>

        {/* Today's controls */}
        <TabsContent value="today" className="space-y-3 mt-4">
          {todaysControls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Ingen kontroller planlagt i dag</p>
            </div>
          ) : (
            todaysControls.map((risk) => (
              <ControlCard 
                key={risk.id} 
                risk={risk} 
                onOpenRisk={onOpenRisk}
              />
            ))
          )}
        </TabsContent>

        {/* This week's controls */}
        <TabsContent value="week" className="space-y-3 mt-4">
          {groupedRisks.upcomingRisks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Ingen kontroller planlagt denne uken</p>
            </div>
          ) : (
            groupedRisks.upcomingRisks.map((risk) => (
              <ControlCard 
                key={risk.id} 
                risk={risk} 
                onOpenRisk={onOpenRisk}
                showDate
              />
            ))
          )}
        </TabsContent>

        {/* All KKP */}
        <TabsContent value="all" className="space-y-3 mt-4">
          {risks.map((risk) => (
            <ControlCard 
              key={risk.id} 
              risk={risk} 
              onOpenRisk={onOpenRisk}
              showDate
              showFrequency
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            💡 Kontroller loggføres for å dokumentere at kritiske grenser overholdes. 
            Ved avvik opprettes automatisk korrigerende tiltak i handlingsplanen.
            Logg og historikk kan eksporteres for tilsyn fra Mattilsynet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Control card component
interface ControlCardProps {
  risk: IkMatRisk;
  onOpenRisk: (riskId: string) => void;
  showDate?: boolean;
  showFrequency?: boolean;
}

const ControlCard = ({ risk, onOpenRisk, showDate, showFrequency }: ControlCardProps) => {
  const today = getLocalDateString();
  const isOverdue = risk.controlDate && risk.controlDate < today;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nb-NO', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <Card className={isOverdue ? 'border-red-300 dark:border-red-800' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Thermometer className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{risk.hazard}</p>
              {risk.criticalLimit && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Grense: {risk.criticalLimit}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {showFrequency && risk.frequency && (
                  <Badge variant="outline" className="text-xs">
                    {FREQUENCY_LABELS[risk.frequency]}
                  </Badge>
                )}
                {showDate && risk.controlDate && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${isOverdue ? 'border-red-300 text-red-700' : ''}`}
                  >
                    {formatDate(risk.controlDate)}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Forfalt
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenRisk(risk.id)}
              className="h-8"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Åpne
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
