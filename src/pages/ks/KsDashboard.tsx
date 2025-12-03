import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Clock,
  TrendingUp,
  FileCheck,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { nb } from "date-fns/locale";

interface DashboardStats {
  totalEgenkontroller: number;
  completedEgenkontroller: number;
  incompleteThisWeek: number;
  openAvvik: number;
  ksProgress: number;
}

interface RecentActivity {
  id: string;
  title: string;
  type: string;
  completedBy: string;
  completedAt: string;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  deadline: string;
  responsible: string;
  type: string;
}

export default function KsDashboard() {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEgenkontroller: 168,
    completedEgenkontroller: 143,
    incompleteThisWeek: 12,
    openAvvik: 4,
    ksProgress: 87,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.company_id) return;

      try {
        // Fetch egenkontroller stats
        const { data: checklists, error: checklistError } = await supabase
          .from("ks_checklists")
          .select(`
            id,
            filled_at,
            filled_by_user_id,
            created_at,
            ks_checklist_items(status)
          `)
          .eq("project_id", projectId || "");

        if (!checklistError && checklists) {
          const total = checklists.length;
          const completed = checklists.filter(c => c.filled_at).length;
          
          // Check for incomplete with deadline this week
          const now = new Date();
          const weekFromNow = addDays(now, 7);
          
          setStats(prev => ({
            ...prev,
            totalEgenkontroller: total || prev.totalEgenkontroller,
            completedEgenkontroller: completed || prev.completedEgenkontroller,
            ksProgress: total > 0 ? Math.round((completed / total) * 100) : prev.ksProgress,
          }));
        }

        // Fetch open deviations
        const { data: deviations, error: devError } = await supabase
          .from("deviations")
          .select("id")
          .eq("company_id", profile.company_id)
          .eq("project_id", projectId || "")
          .in("status", ["open", "in_progress"]);

        if (!devError && deviations) {
          setStats(prev => ({
            ...prev,
            openAvvik: deviations.length,
          }));
        }

        // Fetch recent activities
        const { data: recentChecklists } = await supabase
          .from("ks_checklists")
          .select(`
            id,
            filled_at,
            ks_templates(name)
          `)
          .eq("project_id", projectId || "")
          .not("filled_at", "is", null)
          .order("filled_at", { ascending: false })
          .limit(5);

        if (recentChecklists) {
          setRecentActivities(recentChecklists.map(c => ({
            id: c.id,
            title: (c.ks_templates as any)?.name || "Ukjent sjekkliste",
            type: "checklist",
            completedBy: "Bruker",
            completedAt: c.filled_at || "",
          })));
        }

        // Fetch upcoming deadlines (from SJA)
        const nowDate = new Date();
        const weekFromNowDate = addDays(nowDate, 7);
        const { data: upcomingSjas } = await supabase
          .from("ks_sja")
          .select("id, title, work_date, responsible_name")
          .eq("project_id", projectId || "")
          .gte("work_date", format(nowDate, "yyyy-MM-dd"))
          .lte("work_date", format(weekFromNowDate, "yyyy-MM-dd"))
          .order("work_date", { ascending: true })
          .limit(5);

        if (upcomingSjas) {
          setUpcomingDeadlines(upcomingSjas.map((s: any) => ({
            id: s.id,
            title: s.title,
            deadline: s.work_date,
            responsible: s.responsible_name || "Ikke tildelt",
            type: "sja",
          })));
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.company_id, projectId]);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressBg = (progress: number) => {
    if (progress >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (progress >= 50) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KS Dashboard</h1>
            <p className="text-muted-foreground">
              Oversikt over kvalitetssikring og egenkontroller
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/ks/egenkontroller")}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Ny egenkontroll
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* KS Dekning */}
          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">KS-dekning</p>
                  <p className={`text-4xl font-bold mt-2 ${getProgressColor(stats.ksProgress)}`}>
                    {stats.ksProgress}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">i prosjektet</p>
                </div>
                <div className={`p-4 rounded-full ${getProgressBg(stats.ksProgress)}`}>
                  <TrendingUp className={`h-8 w-8 ${getProgressColor(stats.ksProgress)}`} />
                </div>
              </div>
              <Progress value={stats.ksProgress} className="h-3 mt-4" />
            </CardContent>
          </Card>

          {/* Fullførte egenkontroller */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fullførte</p>
                  <p className="text-3xl font-bold mt-2">{stats.completedEgenkontroller}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    av {stats.totalEgenkontroller} egenkontroller
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ufullførte denne uken */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Frist denne uken</p>
                  <p className="text-3xl font-bold mt-2">{stats.incompleteThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">ufullførte</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <Badge variant="destructive" className="text-lg px-3">
                    {stats.incompleteThisWeek}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Åpne avvik */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Åpne avvik</p>
                  <p className="text-3xl font-bold mt-2">{stats.openAvvik}</p>
                  <p className="text-xs text-muted-foreground mt-1">fra KS-kontroller</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Siste fullførte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                Siste fullførte
              </CardTitle>
              <CardDescription>De 5 siste gjennomførte egenkontrollene</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(`/ks/checklists/${activity.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.completedBy}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {activity.completedAt && format(new Date(activity.completedAt), "dd. MMM", { locale: nb })}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          👍
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Ingen fullførte egenkontroller enda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kommende frister */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Kommende frister
              </CardTitle>
              <CardDescription>Neste 7 dager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {deadline.responsible}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            new Date(deadline.deadline) < new Date()
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {format(new Date(deadline.deadline), "dd. MMM", { locale: nb })}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Ingen kommende frister</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Hurtignavigasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate("/ks/egenkontroller")}
              >
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                <span className="text-xs">Egenkontroller</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate("/ks/uavhengig-kontroll")}
              >
                <Users className="h-6 w-6 text-purple-600" />
                <span className="text-xs">Uavhengig kontroll</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate("/ks/rapporter")}
              >
                <FileCheck className="h-6 w-6 text-green-600" />
                <span className="text-xs">Rapporter & FDV</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate("/ks/malbibliotek")}
              >
                <FileCheck className="h-6 w-6 text-orange-600" />
                <span className="text-xs">Malbibliotek</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate("/ks/avvik")}
              >
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <span className="text-xs">Avvik</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate("/ks/projects")}
              >
                <TrendingUp className="h-6 w-6 text-teal-600" />
                <span className="text-xs">Alle prosjekter</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
