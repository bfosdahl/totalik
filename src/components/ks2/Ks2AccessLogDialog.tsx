import { Shield, User, Calendar, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useKsModule2AccessLog } from "@/hooks/useKsModule2ProjectAccess";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Ks2AccessLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  login: { label: "Innlogging", color: "bg-green-100 text-green-800" },
  logout: { label: "Utlogging", color: "bg-gray-100 text-gray-800" },
  view: { label: "Visning", color: "bg-blue-100 text-blue-800" },
  checklist_complete: { label: "Sjekkliste fullført", color: "bg-purple-100 text-purple-800" },
  deviation_created: { label: "Avvik registrert", color: "bg-orange-100 text-orange-800" },
};

export function Ks2AccessLogDialog({ 
  open, 
  onOpenChange, 
  projectId 
}: Ks2AccessLogDialogProps) {
  const { logs, isLoading } = useKsModule2AccessLog(projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tilgangslogg
          </DialogTitle>
          <DialogDescription>
            Oversikt over innlogginger og aktivitet fra gjestebrukere
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Laster...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen aktivitet registrert ennå</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const action = actionLabels[log.action] || { label: log.action, color: "bg-gray-100 text-gray-800" };
                
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.email}</span>
                        <Badge className={action.color}>{action.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.created_at), "d. MMM yyyy HH:mm:ss", { locale: nb })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
