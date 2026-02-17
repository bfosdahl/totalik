import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  FileCheck, 
  FileText,
  AlertTriangle, 
  ClipboardCheck,
  HardHat,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useKsModule2Sja } from "@/hooks/useKsModule2Sja";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useKsModule2Vernerunder } from "@/hooks/useKsModule2Vernerunder";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { useMemo } from "react";

export default function Ks2HmsDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const basePath = `/ks/project/${projectId}`;

  const { sjaList } = useKsModule2Sja(projectId);
  const { avvikList } = useKsModule2Avvik(projectId || null);
  const { vernerunder } = useKsModule2Vernerunder(projectId);

  const stats = useMemo(() => {
    const openSja = (sjaList || []).filter(s => s.status !== "approved" && s.status !== "rejected").length;
    const openAvvik = (avvikList || []).filter(a => a.status === "open" || a.status === "in_progress").length;
    const completedVernerunder = (vernerunder || []).filter(v => v.status === "completed").length;
    const totalVernerunder = (vernerunder || []).length;

    // Calculate HMS progress: 100% if nothing is registered (empty = complete)
    // Only count categories where user has actively added items
    let progressPoints = 0;
    let totalPoints = 0;
    
    // SJA: only count if user has created any
    if ((sjaList || []).length > 0) {
      totalPoints += 1;
      const completedSja = (sjaList || []).filter(s => s.status === "approved" || s.status === "completed").length;
      progressPoints += completedSja / (sjaList || []).length;
    }
    
    // Avvik: only count if user has registered any
    if ((avvikList || []).length > 0) {
      totalPoints += 1;
      const closedAvvik = (avvikList || []).filter(a => a.status === "closed").length;
      progressPoints += closedAvvik / (avvikList || []).length;
    }
    
    // Vernerunder: only count if user has planned any
    if (totalVernerunder > 0) {
      totalPoints += 1;
      progressPoints += completedVernerunder / totalVernerunder;
    }

    const hmsProgress = totalPoints > 0 ? Math.round((progressPoints / totalPoints) * 100) : 100;

    // Find next upcoming vernerunde
    const upcoming = (vernerunder || [])
      .filter(v => v.status !== "completed" && v.scheduled_date)
      .sort((a, b) => (a.scheduled_date || "").localeCompare(b.scheduled_date || ""));
    const nextVernerunde = upcoming[0]?.scheduled_date 
      ? format(parseISO(upcoming[0].scheduled_date), "dd.MM.yyyy")
      : null;

    return { hmsProgress, openSja, openAvvik, completedVernerunder, totalVernerunder, nextVernerunde };
  }, [sjaList, avvikList, vernerunder]);

  // Recent SJA (last 3)
  const recentSja = useMemo(() => {
    return (sjaList || [])
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 3);
  }, [sjaList]);

  // Recent avvik (last 3)
  const recentAvvik = useMemo(() => {
    return (avvikList || [])
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 3);
  }, [avvikList]);

  const quickActions = [
    { label: "HMS-plan", icon: FileText, path: "/hms/hms-plan" },
    { label: "Ny SJA", icon: ClipboardCheck, path: "/hms/sja" },
    { label: "SHA-plan", icon: FileCheck, path: "/hms/sha-plan" },
    { label: "Vernerunde", icon: HardHat, path: "/hms/vernerunder" },
    { label: "HMS-avvik", icon: AlertTriangle, path: "/hms/avvik" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Shield className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">HMS / SHA Dashboard</h2>
          <p className="text-muted-foreground">Oversikt over HMS-arbeid i prosjektet</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HMS Fremdrift</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">{stats.hmsProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.hmsProgress} className="h-2 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne SJA</CardDescription>
            <CardTitle className="text-3xl">{stats.openSja}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.openSja > 0 ? "default" : "secondary"} className={stats.openSja > 0 ? "bg-emerald-500" : ""}>
              {stats.openSja > 0 ? "Aktive" : "Ingen åpne"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne HMS-avvik</CardDescription>
            <CardTitle className="text-3xl">{stats.openAvvik}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.openAvvik > 0 ? "destructive" : "secondary"}>
              {stats.openAvvik > 0 ? "Krever oppfølging" : "Ingen åpne"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vernerunder</CardDescription>
            <CardTitle className="text-3xl">
              {stats.totalVernerunder > 0 ? `${stats.completedVernerunder}/${stats.totalVernerunder}` : "0"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextVernerunde ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Neste: {stats.nextVernerunde}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen planlagt</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-500/5"
                onClick={() => navigate(`${basePath}${action.path}`)}
              >
                <action.icon className="h-6 w-6 text-emerald-500" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent SJA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Siste SJA</CardTitle>
              <CardDescription>Nylig gjennomførte sikker jobb analyser</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`${basePath}/hms/sja`)}
            >
              Se alle <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentSja.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Ingen SJA registrert ennå</p>
            ) : (
              <div className="space-y-3">
                {recentSja.map((sja) => (
                  <div key={sja.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{sja.title || "Uten tittel"}</p>
                      <p className="text-sm text-muted-foreground">
                        {sja.created_at ? format(parseISO(sja.created_at), "dd.MM.yyyy") : ""}
                      </p>
                    </div>
                    <Badge 
                      className={sja.status === "approved" ? "bg-emerald-500" : ""}
                      variant={sja.status === "rejected" ? "destructive" : sja.status === "approved" ? "default" : "secondary"}
                    >
                      {sja.status === "approved" ? "Godkjent" : sja.status === "rejected" ? "Avvist" : "Aktiv"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Avvik */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">HMS-avvik</CardTitle>
              <CardDescription>Siste registrerte HMS-avvik</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`${basePath}/hms/avvik`)}
            >
              Se alle <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentAvvik.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Ingen HMS-avvik registrert ennå</p>
            ) : (
              <div className="space-y-3">
                {recentAvvik.map((avvik) => (
                  <div key={avvik.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{avvik.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {avvik.avvik_number} • {avvik.created_at ? format(parseISO(avvik.created_at), "dd.MM.yyyy") : ""}
                      </p>
                    </div>
                    <Badge 
                      variant={avvik.status === "open" ? "destructive" : avvik.status === "closed" ? "secondary" : "default"}
                    >
                      {avvik.status === "open" ? "Åpen" : avvik.status === "in_progress" ? "Under arbeid" : "Lukket"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
