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
} from "lucide-react";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { format, isThisWeek, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

export function Ks2ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { checklists, stats, isLoading } = useKsModule2Checklists(projectId || "");

  const thisWeekChecklists = checklists.filter(
    (c) => c.deadline_date && isThisWeek(parseISO(c.deadline_date), { locale: nb })
  );

  const recentCompleted = checklists
    .filter((c) => c.status === "completed")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Progress Circle */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * stats.progressPercent) / 100}
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground">{stats.progressPercent}%</span>
              <span className="text-sm text-muted-foreground">fullført</span>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-foreground">
            {stats.completed} av {stats.total} egenkontroller fullført
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Fullført</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.planned + stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">Ufullført</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">Overskredet frist</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Frist denne uken
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeekChecklists.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen sjekklister med frist denne uken</p>
            ) : (
              <div className="space-y-2">
                {thisWeekChecklists.slice(0, 5).map((checklist) => (
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
                    <Badge variant={checklist.status === "completed" ? "default" : "secondary"}>
                      {checklist.status === "completed" ? "Fullført" : "Planlagt"}
                    </Badge>
                  </div>
                ))}
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
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="w-12 h-12 rounded bg-green-500/10 flex items-center justify-center">
                      <ClipboardCheck className="h-6 w-6 text-green-500" />
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

      {/* Open Deviations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Åpne KS-avvik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="text-lg px-3 py-1">0</Badge>
              <span className="text-sm text-muted-foreground">Ingen åpne avvik</span>
            </div>
            <Button variant="outline" size="sm" disabled>
              Se alle (Fase 3)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Snarveier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate(`/ks/project/${projectId}/egenkontroller?new=true`)}
            >
              <Plus className="h-6 w-6" />
              <span>Ny egenkontroll</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
              <FileText className="h-6 w-6" />
              <span>Generer KS-rapport</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
              <Package className="h-6 w-6" />
              <span>FDV-pakke (ZIP)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
