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
} from "lucide-react";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { useKsModule2Subcontractors } from "@/hooks/useKsModule2Subcontractors";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useKsModule2Templates } from "@/hooks/useKsModule2Templates";
import { format, isThisWeek, parseISO, subDays, isAfter, isBefore, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from "date-fns";
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

interface Ks2EnhancedDashboardProps {
  contractorType?: string | null;
  projectAddress?: string | null;
  noSubcontractors?: boolean;
}

export function Ks2EnhancedDashboard({ contractorType, projectAddress, noSubcontractors }: Ks2EnhancedDashboardProps = {}) {
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
    const upcomingDeadlines = checklists.filter((c) => {
      if (!c.deadline_date || c.status === "completed") return false;
      const deadline = parseISO(c.deadline_date);
      const weekFromNow = subDays(now, -7);
      return isAfter(deadline, now) && isBefore(deadline, weekFromNow);
    });

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
              <h2 className="font-semibold text-lg">Hurtighandlinger</h2>
              <p className="text-sm text-muted-foreground">Kom raskt i gang med de viktigste oppgavene</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                className="gap-2 shadow-md"
                onClick={() => navigate(`${basePath}/egenkontroller?new=true`)}
              >
                <Plus className="h-5 w-5" />
                Ny egenkontroll
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
                Ny SJA
              </Button>
              {projectId && <Ks2PopulateExampleButton projectId={projectId} />}
            </div>
          </div>
        </CardContent>
      </Card>

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
                <span className="text-3xl font-bold text-foreground">{stats.progressPercent}%</span>
                <span className="text-xs text-muted-foreground">fullført</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground text-center">
              {stats.completed} av {stats.total} egenkontroller
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
              <p className="text-xs text-muted-foreground">Fullført</p>
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
              <p className="text-xs text-muted-foreground">Ufullført</p>
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
              <p className="text-xs text-muted-foreground">Forfalt</p>
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
              <p className="text-xs text-muted-foreground">Åpne avvik</p>
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
              <p className="text-xs text-muted-foreground">Frister denne uke</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fullført denne uken
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
              <p className="text-sm text-muted-foreground">Ingen kommende frister de neste 7 dagene</p>
            ) : (
              <div className="space-y-2">
                {enhancedStats.upcomingDeadlines.slice(0, 5).map((checklist) => {
                  const daysLeft = differenceInDays(parseISO(checklist.deadline_date!), new Date());
                  return (
                    <div
                      key={checklist.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/ks/project/${projectId}/egenkontroller`)}
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
              Siste fullførte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen fullførte egenkontroller ennå</p>
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
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
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
              Underleverandører
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-600">{enhancedStats.approvedSubcontractors}</div>
                <div className="text-sm text-muted-foreground">Godkjent</div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-600">{enhancedStats.pendingSubcontractors}</div>
                <div className="text-sm text-muted-foreground">Venter godkjenning</div>
              </div>
              <div className="p-4 rounded-lg bg-muted border border-border">
                <div className="text-2xl font-bold">{enhancedStats.totalSubcontractors}</div>
                <div className="text-sm text-muted-foreground">Totalt registrert</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate(`/ks/project/${projectId}/underleverandorer`)}
            >
              Se alle underleverandører
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Snarveier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/egenkontroller?new=true`)}
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs">Ny egenkontroll</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/sjekklister`)}
            >
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-xs">Sjekklister</span>
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
              <span className="text-xs">Timeføring</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/avvik`)}
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs">Registrer avvik</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/rapport`)}
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">KS-rapport</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
