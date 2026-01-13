import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  AlertTriangle, 
  CalendarCheck, 
  GraduationCap,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Wine
} from "lucide-react";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkAlkohol } from "@/hooks/useIkAlkohol";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { nb } from "date-fns/locale";

export default function IkAlkoholDashboard() {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { company, isLoading: authLoading } = useAuth();
  const { 
    licenses,
    complianceItems, 
    riskControls,
    training,
    incidents,
    reviews,
    initializeComplianceItems,
    complianceLoading,
  } = useIkAlkohol();

  const isLoading = modulesLoading || authLoading;

  // Redirect if module not active
  useEffect(() => {
    if (!isLoading && !hasModule("IK_ALKOHOL")) {
      navigate("/");
    }
  }, [hasModule, isLoading, navigate]);

  // Initialize compliance items on first load
  useEffect(() => {
    if (company?.id && complianceItems.length === 0 && !complianceLoading) {
      initializeComplianceItems.mutate();
    }
  }, [company?.id, complianceItems.length, complianceLoading]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Calculate stats
  const activeComplianceItems = complianceItems.filter(c => c.is_active).length;
  const itemsWithControls = new Set(riskControls.map(r => r.compliance_item_id)).size;
  const controlProgress = activeComplianceItems > 0 
    ? Math.round((itemsWithControls / activeComplianceItems) * 100) 
    : 0;

  const upcomingDeadlines = reviews.filter(r => {
    const plannedDate = new Date(r.planned_date);
    return r.status === "Planlagt" && isBefore(plannedDate, addDays(new Date(), 30));
  }).length;

  const expiringTraining = training.filter(t => {
    if (!t.expires_date) return false;
    const expiresDate = new Date(t.expires_date);
    return isBefore(expiresDate, addDays(new Date(), 30)) && isAfter(expiresDate, new Date());
  }).length;

  const openIncidents = incidents.filter(i => i.status !== "Lukket").length;

  const quickActions = [
    { label: "Ny hendelse", icon: Plus, path: "/ik-alkohol/hendelser?new=true", color: "text-red-500" },
    { label: "Planlegg revisjon", icon: CalendarCheck, path: "/ik-alkohol/internkontroll?tab=oppfolging", color: "text-blue-500" },
    { label: "Generer PDF", icon: FileText, path: "/ik-alkohol/internkontroll?export=true", color: "text-emerald-500" },
  ];

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Wine className="h-7 w-7 text-orange-500" />
              IK Alkohol
            </h1>
            <p className="text-muted-foreground mt-1">
              Internkontroll etter alkoholloven
            </p>
          </div>
          <div className="flex gap-2">
            {licenses.length === 0 && (
              <Button onClick={() => navigate("/ik-alkohol/internkontroll")}>
                <Plus className="h-4 w-4 mr-2" />
                Registrer bevilling
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Internkontroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{controlProgress}%</div>
              <Progress value={controlProgress} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {itemsWithControls} av {activeComplianceItems} regelpunkter dekket
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Frister (30 dager)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingDeadlines}</div>
              <Badge variant={upcomingDeadlines > 0 ? "default" : "secondary"} className="mt-2">
                {upcomingDeadlines > 0 ? "Kommende revisjoner" : "Ingen frister"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                Opplæring utløper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringTraining}</div>
              <Badge variant={expiringTraining > 0 ? "destructive" : "secondary"} className="mt-2">
                {expiringTraining > 0 ? "Krever oppmerksomhet" : "Alt i orden"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Åpne hendelser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openIncidents}</div>
              <Badge variant={openIncidents > 0 ? "destructive" : "secondary"} className="mt-2">
                {openIncidents > 0 ? "Krever behandling" : "Ingen åpne"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.path}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className={`h-5 w-5 mr-3 ${action.color}`} />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Incidents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Siste hendelser</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/ik-alkohol/hendelser")}>
                Se alle
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Ingen hendelser registrert</p>
              ) : (
                <div className="space-y-3">
                  {incidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{incident.incident_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(incident.incident_date), "d. MMM yyyy", { locale: nb })}
                        </p>
                      </div>
                      <Badge 
                        variant={incident.status === "Lukket" ? "secondary" : "destructive"}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Kommende revisjoner</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/ik-alkohol/internkontroll?tab=oppfolging")}>
                Se alle
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {reviews.filter(r => r.status === "Planlagt").length === 0 ? (
                <p className="text-muted-foreground text-sm">Ingen planlagte revisjoner</p>
              ) : (
                <div className="space-y-3">
                  {reviews.filter(r => r.status === "Planlagt").slice(0, 5).map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm capitalize">{review.review_type} revisjon</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.planned_date), "d. MMM yyyy", { locale: nb })}
                        </p>
                      </div>
                      <Badge variant="outline">Planlagt</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
