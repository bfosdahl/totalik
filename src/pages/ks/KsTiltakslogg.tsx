import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, FileText, Users, AlertTriangle, CheckCircle2, XCircle, Edit, Trash2, Shield } from "lucide-react";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useKsActivityLog } from "@/hooks/useKsActivityLog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const activityIcons: Record<string, any> = {
  project_created: FileText,
  project_updated: Edit,
  document_uploaded: FileText,
  document_deleted: Trash2,
  checklist_created: CheckCircle2,
  checklist_completed: CheckCircle2,
  deviation_created: AlertTriangle,
  deviation_updated: Edit,
  deviation_closed: XCircle,
  sja_created: Shield,
  sja_updated: Edit,
  change_order_created: FileText,
  change_order_approved: CheckCircle2,
  safety_round_created: Shield,
  safety_round_completed: CheckCircle2,
  hazardous_condition_created: AlertTriangle,
  hazardous_condition_closed: CheckCircle2,
  subcontractor_added: Users,
  subcontractor_updated: Edit,
};

const activityColors: Record<string, string> = {
  project_created: "text-blue-600",
  project_updated: "text-blue-600",
  document_uploaded: "text-green-600",
  document_deleted: "text-red-600",
  checklist_created: "text-purple-600",
  checklist_completed: "text-green-600",
  deviation_created: "text-orange-600",
  deviation_updated: "text-yellow-600",
  deviation_closed: "text-green-600",
  sja_created: "text-indigo-600",
  sja_updated: "text-indigo-600",
  change_order_created: "text-cyan-600",
  change_order_approved: "text-green-600",
  safety_round_created: "text-teal-600",
  safety_round_completed: "text-green-600",
  hazardous_condition_created: "text-red-600",
  hazardous_condition_closed: "text-green-600",
  subcontractor_added: "text-purple-600",
  subcontractor_updated: "text-purple-600",
};

export default function KsTiltakslogg() {
  const { projects } = useKsProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { activities, isLoading } = useKsActivityLog(selectedProjectId);

  const getProjectInfo = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? `${project.project_number} - ${project.name}` : "Ukjent prosjekt";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tiltakslogg</h1>
          <p className="text-muted-foreground">
            Oversikt over alle aktiviteter og hendelser i prosjektene
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtrer</CardTitle>
            <CardDescription>Vis tiltakslogg for et spesifikt prosjekt</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId || "all"}
              onValueChange={(value) => setSelectedProjectId(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle prosjekter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle prosjekter</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_number} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Laster...</p>
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen aktiviteter</h3>
              <p className="text-muted-foreground text-center">
                {selectedProjectId ? "Ingen aktiviteter for valgt prosjekt" : "Ingen aktiviteter registrert enda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aktivitetslogg</CardTitle>
              <CardDescription>
                {activities.length} aktivitet{activities.length !== 1 ? "er" : ""} registrert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.activity_type] || FileText;
                  const iconColor = activityColors[activity.activity_type] || "text-muted-foreground";

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!selectedProjectId && (
                            <Badge variant="outline" className="text-xs">
                              {getProjectInfo(activity.project_id)}
                            </Badge>
                          )}
                          <p className="text-sm font-medium">{activity.activity_description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(activity.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}</span>
                          {activity.performed_by_name && (
                            <>
                              <span>•</span>
                              <span>{activity.performed_by_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
