import { useParams } from "react-router-dom";
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
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Ks2HmsDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const basePath = `/ks/project/${projectId}`;

  // Placeholder stats - will be dynamic later
  const stats = {
    hmsProgress: 35,
    openSja: 2,
    openHmsAvvik: 1,
    completedVernerunder: 3,
    totalVernerunder: 5,
    nextVernerunde: "15.12.2024",
  };

  const quickActions = [
    { label: "HMS-plan", icon: FileText, path: "/hms/hms-plan", color: "text-emerald-500" },
    { label: "Ny SJA", icon: ClipboardCheck, path: "/hms/sja", color: "text-emerald-500" },
    { label: "SHA-plan", icon: FileCheck, path: "/hms/sha-plan", color: "text-emerald-500" },
    { label: "Vernerunde", icon: HardHat, path: "/hms/vernerunder", color: "text-emerald-500" },
    { label: "HMS-avvik", icon: AlertTriangle, path: "/hms/avvik", color: "text-emerald-500" },
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
        {/* HMS Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HMS Fremdrift</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">{stats.hmsProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.hmsProgress} className="h-2 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>

        {/* Open SJA */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne SJA</CardDescription>
            <CardTitle className="text-3xl">{stats.openSja}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.openSja > 0 ? "default" : "secondary"} className="bg-emerald-500">
              {stats.openSja > 0 ? "Aktive" : "Ingen åpne"}
            </Badge>
          </CardContent>
        </Card>

        {/* HMS Avvik */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne HMS-avvik</CardDescription>
            <CardTitle className="text-3xl">{stats.openHmsAvvik}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.openHmsAvvik > 0 ? "destructive" : "secondary"}>
              {stats.openHmsAvvik > 0 ? "Krever oppfølging" : "Ingen åpne"}
            </Badge>
          </CardContent>
        </Card>

        {/* Vernerunder */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vernerunder</CardDescription>
            <CardTitle className="text-3xl">{stats.completedVernerunder}/{stats.totalVernerunder}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Neste: {stats.nextVernerunde}</span>
            </div>
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
                <action.icon className={`h-6 w-6 ${action.color}`} />
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
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Arbeid i høyden - Tak</p>
                  <p className="text-sm text-muted-foreground">02.12.2024</p>
                </div>
                <Badge className="bg-emerald-500">Godkjent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Varmt arbeid - Sveising</p>
                  <p className="text-sm text-muted-foreground">28.11.2024</p>
                </div>
                <Badge className="bg-emerald-500">Godkjent</Badge>
              </div>
            </div>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Manglende verneutstyr</p>
                  <p className="text-sm text-muted-foreground">HMS-001 • 01.12.2024</p>
                </div>
                <Badge variant="destructive">Åpen</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Rydding av arbeidsområde</p>
                  <p className="text-sm text-muted-foreground">HMS-002 • 25.11.2024</p>
                </div>
                <Badge variant="secondary">Lukket</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
