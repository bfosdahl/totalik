import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText,
  Flag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { DeviationAttachments } from "./DeviationAttachments";
import { DeviationComments } from "./DeviationComments";

interface Deviation {
  id: string;
  title: string;
  description: string;
  category: "HMS" | "MAT" | "BYGG";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignee: string;
  reporter: string;
  createdAt: string;
  dueDate: string;
}

const priorityConfig = {
  low: { label: "Lav", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-warning/10 text-warning" },
  high: { label: "Høy", color: "bg-destructive/10 text-destructive" },
  critical: { label: "Kritisk", color: "bg-destructive text-destructive-foreground" },
};

const statusConfig = {
  open: { label: "Åpen", color: "bg-destructive/10 text-destructive" },
  "in-progress": { label: "Under arbeid", color: "bg-warning/10 text-warning" },
  resolved: { label: "Løst", color: "bg-success/10 text-success" },
  closed: { label: "Lukket", color: "bg-muted text-muted-foreground" },
};

const categoryConfig = {
  HMS: { color: "bg-primary/10 text-primary", label: "HMS" },
  MAT: { color: "bg-accent/10 text-accent", label: "Matsikkerhet" },
  BYGG: { color: "bg-info/10 text-info", label: "Bygg og anlegg" },
};

interface DeviationDetailDialogProps {
  deviation: Deviation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: Deviation["status"]) => void;
  onAssigneeChange?: (id: string, assignee: string) => void;
}

export function DeviationDetailDialog({ 
  deviation, 
  open, 
  onOpenChange,
  onStatusChange,
  onAssigneeChange
}: DeviationDetailDialogProps) {
  const { users, getUserDisplayName } = useCompanyUsers();
  
  if (!deviation) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateStr;
    }
  };

  // Find current assignee in users list
  const currentAssigneeUser = users.find(u => 
    getUserDisplayName(u) === deviation.assignee
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-mono">{deviation.id}</span>
            <Badge className={categoryConfig[deviation.category].color}>
              {deviation.category}
            </Badge>
            <Badge className={priorityConfig[deviation.priority].color}>
              {priorityConfig[deviation.priority].label}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{deviation.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status selector */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <Select 
              value={deviation.status} 
              onValueChange={(value) => onStatusChange(deviation.id, value as Deviation["status"])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Åpen</SelectItem>
                <SelectItem value="in-progress">Under arbeid</SelectItem>
                <SelectItem value="resolved">Løst</SelectItem>
                <SelectItem value="closed">Lukket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Beskrivelse
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {deviation.description || "Ingen beskrivelse"}
            </p>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Ansvarlig
              </Label>
              {onAssigneeChange ? (
                <Select 
                  value={currentAssigneeUser?.id || "unassigned"}
                  onValueChange={(value) => {
                    const selectedUser = users.find(u => u.id === value);
                    const newAssignee = selectedUser ? getUserDisplayName(selectedUser) : "Ikke tildelt";
                    onAssigneeChange(deviation.id, newAssignee);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={deviation.assignee} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Ikke tildelt</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium pl-6">{deviation.assignee}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Rapportert av
              </div>
              <p className="text-sm font-medium pl-6">{deviation.reporter}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Frist
              </div>
              <p className="text-sm font-medium pl-6">{formatDate(deviation.dueDate)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Opprettet
              </div>
              <p className="text-sm font-medium pl-6">{formatDate(deviation.createdAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Attachments */}
          <DeviationAttachments deviationId={deviation.id} />

          <Separator />

          {/* Comments */}
          <DeviationComments deviationId={deviation.id} />

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
