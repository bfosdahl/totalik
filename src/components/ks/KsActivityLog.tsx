import { Clock, FileText, CheckCircle, AlertTriangle, Users, Shield, Hammer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useKsActivityLog } from "@/hooks/useKsActivityLog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KsActivityLogProps {
  projectId: string;
}

const activityIcons: Record<string, any> = {
  checklist_created: CheckCircle,
  document_uploaded: FileText,
  deviation_registered: AlertTriangle,
  change_order: FileText,
  sja_completed: Shield,
  safety_round: Users,
  hazardous_condition: AlertTriangle,
  subcontractor_added: Users,
  default: Hammer,
};

const activityColors: Record<string, string> = {
  checklist_created: "text-green-600",
  document_uploaded: "text-blue-600",
  deviation_registered: "text-red-600",
  change_order: "text-orange-600",
  sja_completed: "text-purple-600",
  safety_round: "text-cyan-600",
  hazardous_condition: "text-red-600",
  subcontractor_added: "text-indigo-600",
  default: "text-muted-foreground",
};

export function KsActivityLog({ projectId }: KsActivityLogProps) {
  const { activities, isLoading } = useKsActivityLog(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiltakslogg</CardTitle>
        <CardDescription>Komplett oversikt over alle hendelser i prosjektet</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen aktiviteter registrert enda</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || activityIcons.default;
                const iconColor = activityColors[activity.activity_type] || activityColors.default;
                
                return (
                  <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className={`p-2 rounded-lg bg-muted h-fit ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.activity_description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.performed_by_name || "Ukjent"}</span>
                        <span>•</span>
                        <span>{new Date(activity.created_at).toLocaleString("nb-NO")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}