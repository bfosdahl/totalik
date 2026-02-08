import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, AlertTriangle, ClipboardCheck, FileText, Calendar, Users, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFdvBuildings } from "@/hooks/useFdvBuildings";
import { useFdvControls } from "@/hooks/useFdvControls";
import { useFdvRiskAssessments } from "@/hooks/useFdvRiskAssessments";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";

export default function FdvDashboard() {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { buildings, activeBuildings, isLoading: buildingsLoading } = useFdvBuildings();
  const { controls, overdueControls, upcomingControls, isLoading: controlsLoading } = useFdvControls();
  const { risks, highRisks, mediumRisks, isLoading: risksLoading } = useFdvRiskAssessments();

  // Redirect if module not active
  useEffect(() => {
    if (!modulesLoading && !hasModule("IK_FDV")) {
      navigate("/");
    }
  }, [modulesLoading, hasModule, navigate]);

  if (modulesLoading || !hasModule("IK_FDV")) {
    return null;
  }

  const isLoading = buildingsLoading || controlsLoading || risksLoading;

  // Calculate compliance score (simple example)
  const totalControls = controls.length;
  const completedControls = controls.filter(c => c.status === 'utfort').length;
  const complianceScore = totalControls > 0 ? Math.round((completedControls / totalControls) * 100) : 0;

  // Upcoming controls in next 30 days
  const upcomingIn30Days = upcomingControls.filter(c => {
    if (!c.next_due_date) return false;
    const days = differenceInDays(new Date(c.next_due_date), new Date());
    return days <= 30 && days >= 0;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              IK/FDV – Forvaltning, Drift og Vedlikehold
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over bygg, kontroller og vedlikehold
            </p>
          </div>
          <Button onClick={() => navigate("/fdv/bygg")} className="gap-2">
            <Building2 className="h-4 w-4" />
            Se alle bygg
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/fdv/bygg")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bygg</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{activeBuildings.length}</div>
                <Building2 className="h-8 w-8 text-primary/20" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {buildings.length - activeBuildings.length > 0 && `${buildings.length - activeBuildings.length} inaktive`}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/fdv/kontroller")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kontroller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{controls.length}</div>
                <ClipboardCheck className="h-8 w-8 text-primary/20" />
              </div>
              {overdueControls.length > 0 && (
                <Badge variant="destructive" className="mt-1">
                  {overdueControls.length} forfalt
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/fdv/risiko")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aktive risikoer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{risks.filter(r => r.status === 'aktiv').length}</div>
                <AlertTriangle className="h-8 w-8 text-primary/20" />
              </div>
              <div className="flex gap-2 mt-1">
                {highRisks.length > 0 && (
                  <Badge variant="destructive">{highRisks.length} høy</Badge>
                )}
                {mediumRisks.length > 0 && (
                  <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">{mediumRisks.length} middels</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Etterlevelse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{complianceScore}%</div>
                <Shield className="h-8 w-8 text-primary/20" />
              </div>
              <Progress value={complianceScore} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Kommende kontroller
              </CardTitle>
              <CardDescription>Kontroller som forfaller de neste 30 dagene</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Laster...</div>
              ) : upcomingIn30Days.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Ingen kontroller forfaller de neste 30 dagene
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingIn30Days.slice(0, 5).map((control) => (
                    <div key={control.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{control.name}</p>
                        <p className="text-sm text-muted-foreground">{control.responsible_name || 'Ikke tildelt'}</p>
                      </div>
                      <Badge variant="outline">
                        {control.next_due_date && format(new Date(control.next_due_date), 'd. MMM', { locale: nb })}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {upcomingIn30Days.length > 5 && (
                <Button variant="link" className="w-full mt-2" onClick={() => navigate("/fdv/kontroller")}>
                  Se alle {upcomingIn30Days.length} kontroller
                </Button>
              )}
            </CardContent>
          </Card>

          {/* High Risk Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Høyrisiko
              </CardTitle>
              <CardDescription>Risikoer som krever oppmerksomhet</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Laster...</div>
              ) : highRisks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Ingen høyrisiko-elementer
                </div>
              ) : (
                <div className="space-y-3">
                  {highRisks.slice(0, 5).map((risk) => (
                    <div key={risk.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                      <div>
                        <p className="font-medium">{risk.hazard_description}</p>
                        <p className="text-sm text-muted-foreground">{risk.responsible_name || 'Ikke tildelt'}</p>
                      </div>
                      <Badge variant="destructive">
                        Score: {risk.risk_score}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {highRisks.length > 5 && (
                <Button variant="link" className="w-full mt-2" onClick={() => navigate("/fdv/risiko")}>
                  Se alle {highRisks.length} høyrisiko-elementer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Hurtiglenker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/fdv/bygg")}>
                <Building2 className="h-6 w-6" />
                <span>Byggoversikt</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/fdv/ansvar")}>
                <Users className="h-6 w-6" />
                <span>Ansvar og roller</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/fdv/risiko")}>
                <AlertTriangle className="h-6 w-6" />
                <span>Risikoanalyse</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/fdv/kontroller")}>
                <ClipboardCheck className="h-6 w-6" />
                <span>Kontroller</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/fdv/avvik")}>
                <AlertTriangle className="h-6 w-6" />
                <span>Avvik</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/fdv/dokumenter")}>
                <FileText className="h-6 w-6" />
                <span>Dokumenter</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
