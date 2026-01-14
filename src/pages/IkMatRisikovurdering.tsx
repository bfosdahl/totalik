import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, getTrafficLight, getTrafficLightLabel } from "@/hooks/useIkMatContent";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Edit, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskSummaryCard } from "@/components/ikmat/RiskSummaryCard";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig',
  quarterly: 'Kvartalsvis',
  biannually: 'Halvårlig',
  yearly: 'Årlig',
};

const IkMatRisikovurdering = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading: contentLoading } = useIkMatContent();

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  if (modulesLoading || contentLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const risks = content.risks || [];
  const actions = content.actionPlan || [];

  const getRiskLevelBadge = (level: number) => {
    const trafficLight = getTrafficLight(level);
    switch (trafficLight) {
      case 'green':
        return <Badge variant="secondary" className="text-xs font-normal">Lav</Badge>;
      case 'yellow':
        return <Badge variant="secondary" className="text-xs font-normal bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Middels</Badge>;
      case 'red':
        return <Badge variant="secondary" className="text-xs font-normal bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Høy</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Risikovurdering
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Oversikt over identifiserte farer og kontrollpunkter
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/ik-mat/risiko-og-tiltak">
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Link>
          </Button>
        </div>

        {risks.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">
              Ingen risikoer definert
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Legg til risikoer for å dokumentere fareanalysen
            </p>
            <Button asChild>
              <Link to="/ik-mat/risiko-og-tiltak">Kom i gang</Link>
            </Button>
          </div>
        ) : (
          <>
            <RiskSummaryCard risks={risks} actions={actions} />
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Risikoer for {company?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {risks.map((risk) => {
                  const trafficLight = getTrafficLight(risk.riskLevel);
                  return (
                    <div 
                      key={risk.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          trafficLight === 'green' ? 'bg-green-500' :
                          trafficLight === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
                        }`} />
                        <span className="font-medium truncate">{risk.hazard || 'Ikke navngitt'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getRiskLevelBadge(risk.riskLevel)}
                        
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
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Alert className="bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs text-muted-foreground">
                Trykk "Rediger" for å oppdatere risikoer, legge til tiltak eller endre kontrollhyppighet.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatRisikovurdering;
