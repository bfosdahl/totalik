import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  FileText,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Bell,
  ShieldAlert,
  Timer,
  ChevronRight,
} from "lucide-react";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { useKsModule2Subcontractors } from "@/hooks/useKsModule2Subcontractors";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useKsModule2Templates } from "@/hooks/useKsModule2Templates";
import { format, isThisWeek, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { calendarDaysFromToday } from "@/lib/dateUtils";
import { nb } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Ks2PopulateExampleButton } from "./Ks2PopulateExampleButton";
import { Ks2WelcomeCard } from "./Ks2WelcomeCard";
import { Ks2SmartPanel } from "./Ks2SmartPanel";
import { t } from "@/i18n/t";

interface Ks2EnhancedDashboardProps {
  contractorType?: string | null;
  projectAddress?: string | null;
  noSubcontractors?: boolean;
  projectName?: string | null;
}

export function Ks2EnhancedDashboard({ contractorType, projectAddress, noSubcontractors, projectName }: Ks2EnhancedDashboardProps = {}) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { checklists, stats, isLoading } = useKsModule2Checklists(projectId || "");
  const { subcontractors } = useKsModule2Subcontractors(projectId || "");
  const { avvikList: avvik } = useKsModule2Avvik(projectId || "");
  const { templates } = useKsModule2Templates();

  // Scroll to top on mount
  const basePath = `/ks/project/${projectId}`;

  // Calculate additional stats
  const enhancedStats = useMemo(() => {
    const now = new Date();
    
    // Checklists due this week
    const thisWeekDue = checklists.filter(
      (c) => c.deadline_date && isThisWeek(parseISO(c.deadline_date), { locale: nb }) && c.status !== "completed"
    ).length;

    // Checklists completed this week
    const thisWeekCompleted = checklists.filter(
      (c) => c.completed_at && isThisWeek(parseISO(c.completed_at), { locale: nb })
    ).length;

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = checklists
      .filter((c) => {
        if (!c.deadline_date || c.status === "completed") return false;
        const days = calendarDaysFromToday(c.deadline_date);
        return days !== null && days >= 0 && days <= 7;
      })
      .sort((a, b) => (calendarDaysFromToday(a.deadline_date) ?? 0) - (calendarDaysFromToday(b.deadline_date) ?? 0));

    // Subcontractor stats
    const approvedSubcontractors = subcontractors.filter((s) => s.approval_status === "approved").length;
    const pendingSubcontractors = subcontractors.filter((s) => s.approval_status === "pending").length;

    // Open avvik
    const openAvvik = avvik.filter((a) => a.status === "open" || a.status === "in_progress").length;

    return {
      thisWeekDue,
      thisWeekCompleted,
      upcomingDeadlines,
      totalSubcontractors: subcontractors.length,
      approvedSubcontractors,
      pendingSubcontractors,
      openAvvik,
    };
  }, [checklists, subcontractors, avvik]);

  // Chart data - weekly completion trend
  const weeklyTrendData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: nb });
    const weekEnd = endOfWeek(now, { locale: nb });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => {
      const dayStr = format(day, "EEE", { locale: nb });
      const completed = checklists.filter((c) => {
        if (!c.completed_at) return false;
        const completedDate = parseISO(c.completed_at);
        return format(completedDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      }).length;
      
      return { day: dayStr, fullført: completed };
    });
  }, [checklists]);

  // Pie chart data - status distribution
  const statusDistribution = useMemo(() => {
    return [
      { name: "Fullført", value: stats.completed, color: "hsl(142, 71%, 45%)" },
      { name: "Planlagt", value: stats.planned, color: "hsl(217, 91%, 60%)" },
      { name: "Pågår", value: stats.inProgress, color: "hsl(45, 93%, 47%)" },
      { name: "Forfalt", value: stats.overdue, color: "hsl(0, 84%, 60%)" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const thisWeekChecklists = checklists.filter(
    (c) => c.deadline_date && isThisWeek(parseISO(c.deadline_date), { locale: nb })
  );

  const recentCompleted = checklists
    .filter((c) => c.status === "completed")
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome/Onboarding Card for new projects */}
      <Ks2WelcomeCard 
        hasChecklists={checklists.length > 0}
        hasSubcontractors={subcontractors.length > 0 || !!noSubcontractors}
        hasTemplates={templates.length > 0}
        contractorType={contractorType}
        hasProjectInfo={!!projectAddress}
      />

      {/* Quick Actions - TOP OF PAGE (hidden on mobile, use FAB instead) */}
      <Card className="hidden sm:block bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">{t("auto.hurtighandlinger")}</h2>
              <p className="text-sm text-muted-foreground">{t("auto.kom_raskt_i_gang_med_de_viktigste_oppgav")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                className="gap-2 shadow-md"
                onClick={() => navigate(`${basePath}/egenkontroller?new=true`)}
              >
                <Plus className="h-5 w-5" />
                {t("auto.ny_egenkontroll")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => navigate(`${basePath}/avvik`)}
              >
                <AlertTriangle className="h-5 w-5" />
                Registrer avvik
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => navigate(`${basePath}/hms/sja`)}
              >
                <ClipboardCheck className="h-5 w-5" />
                {t("auto.ny_sja")}
              </Button>
              {projectId && <Ks2PopulateExampleButton projectId={projectId} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart prosjekthjelp (Jev) */}
      {projectId && (
        <Ks2SmartPanel
          projectId={projectId}
          projectName={projectName || ""}
          checklists={checklists}
          avvik={avvik}
        />
      )}

      {/* Progress Circle and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={352}
                  strokeDashoffset={352 - (352 * stats.progressPercent) / 100}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{isLoading ? "–" : `${stats.progressPercent}%`}</span>
                <span className="text-xs text-muted-foreground">{t("auto.fullfoert_2")}</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground text-center">
              {isLoading ? "Laster egenkontroller…" : `${stats.completed} av ${stats.total} egenkontroller`}
            </p>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Status fordeling
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid - Horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible">
        <Card className="shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10 shrink-0">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">{t("auto.fullfoert")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/10 shrink-0">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{stats.planned + stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">{t("auto.ufullfoert")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/10 shrink-0">
              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground">{t("auto.forfalt")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/10 shrink-0">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{enhancedStats.openAvvik}</p>
              <p className="text-xs text-muted-foreground">{t("auto.aapne_avvik")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{enhancedStats.totalSubcontractors}</p>
              <p className="text-xs text-muted-foreground">UE</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shrink-0 min-w-[140px] md:min-w-0">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 shrink-0">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{enhancedStats.thisWeekDue}</p>
              <p className="text-xs text-muted-foreground">{t("auto.frister_denne_uke")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t("auto.fullfoert_denne_uken")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="fullført" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Kommende frister
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enhancedStats.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("auto.ingen_kommende_frister_de_neste_7_dagene")}</p>
            ) : (
              <div className="space-y-2">
                {enhancedStats.upcomingDeadlines.slice(0, 5).map((checklist) => {
                  const daysLeft = (calendarDaysFromToday(checklist.deadline_date!) ?? 0);
                  return (
                    <div
                      key={checklist.id}
                      role="button"
                      tabIndex={0}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      onClick={() => navigate(`/ks/project/${projectId}/egenkontroller?checklistId=${checklist.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/ks/project/${projectId}/egenkontroller?checklistId=${checklist.id}`);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{checklist.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Frist: {checklist.deadline_date && format(parseISO(checklist.deadline_date), "d. MMM", { locale: nb })}
                        </p>
                      </div>
                      <Badge variant={daysLeft <= 1 ? "destructive" : daysLeft <= 3 ? "secondary" : "outline"}>
                        {daysLeft === 0 ? "I dag" : daysLeft === 1 ? "I morgen" : `${daysLeft} dager`}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t("auto.siste_fullfoerte")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("auto.ingen_fullfoerte_egenkontroller_ennaa")}</p>
            ) : (
              <div className="space-y-2">
                {recentCompleted.map((checklist) => (
                  <div
                    key={checklist.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/ks/project/${projectId}/egenkontroller?checklistId=${checklist.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/ks/project/${projectId}/egenkontroller?checklistId=${checklist.id}`);
                      }
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    <div className="w-10 h-10 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{checklist.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {checklist.completed_at && format(parseISO(checklist.completed_at), "d. MMM yyyy", { locale: nb })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subcontractor Overview */}
      {subcontractors.length > 0 && (!contractorType || ["total", "hoved"].includes(contractorType)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {t("auto.underleverandoerer")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-600">{enhancedStats.approvedSubcontractors}</div>
                <div className="text-sm text-muted-foreground">{t("auto.godkjent")}</div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-600">{enhancedStats.pendingSubcontractors}</div>
                <div className="text-sm text-muted-foreground">{t("auto.venter_godkjenning")}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted border border-border">
                <div className="text-2xl font-bold">{enhancedStats.totalSubcontractors}</div>
                <div className="text-sm text-muted-foreground">{t("auto.totalt_registrert")}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate(`/ks/project/${projectId}/underleverandorer`)}
            >
              {t("auto.se_alle_underleverandoerer")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("auto.snarveier")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/egenkontroller?new=true`)}
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs">{t("auto.ny_egenkontroll")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/sjekklister`)}
            >
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-xs">{t("auto.sjekklister")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/hms/sja`)}
            >
              <ShieldAlert className="h-6 w-6" />
              <span className="text-xs">SJA</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/timeregistrering`)}
            >
              <Timer className="h-6 w-6" />
              <span className="text-xs">{t("auto.timefoering")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/avvik`)}
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs">{t("auto.registrer_avvik")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/rapport`)}
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">{t("auto.ks_rapport")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
