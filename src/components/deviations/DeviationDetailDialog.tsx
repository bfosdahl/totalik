import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText,
  Flag,
  Download,
  Mail
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
import { useDeviationAttachments } from "@/hooks/useDeviationAttachments";
import { useDeviationComments } from "@/hooks/useDeviationComments";
import { exportSingleDeviationToPDF } from "@/utils/deviationExport";
import { useAuth } from "@/contexts/AuthContext";
import { EmailSendDialog } from "@/components/shared/EmailSendDialog";

// Valid database category values
type DeviationCategory = "quality" | "safety" | "environment" | "documentation" | "other" | "process" | "equipment" | "personnel";

interface Deviation {
  id: string;
  deviation_number?: string;
  title: string;
  description: string;
  category: DeviationCategory;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignee: string;
  reporter: string;
  createdAt: string;
  dueDate: string;
  // Extended RUH fields
  type?: string;
  incident_location?: string | null;
  incident_time?: string | null;
  incident_type?: string | null;
  severity?: string | null;
  consequences?: string | null;
  involved_persons?: string | null;
  immediate_actions?: string | null;
  preventive_measures?: string | null;
  root_cause_analysis?: string | null;
  reporter_contact?: string | null;
  responsible_receiver?: string | null;
  additional_info?: string | null;
  notify_arbeidstilsynet?: boolean | null;
  notify_insurance?: boolean | null;
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

const categoryConfig: Record<DeviationCategory, { label: string; color: string }> = {
  safety: { label: "HMS / Sikkerhet", color: "bg-primary/10 text-primary" },
  quality: { label: "Kvalitet", color: "bg-blue-500/10 text-blue-600" },
  environment: { label: "Miljø", color: "bg-green-500/10 text-green-600" },
  process: { label: "Prosess", color: "bg-purple-500/10 text-purple-600" },
  equipment: { label: "Utstyr", color: "bg-orange-500/10 text-orange-600" },
  personnel: { label: "Personell", color: "bg-pink-500/10 text-pink-600" },
  documentation: { label: "Dokumentasjon", color: "bg-slate-500/10 text-slate-600" },
  other: { label: "Annet", color: "bg-muted text-muted-foreground" },
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
  const { company } = useAuth();
  const { attachments } = useDeviationAttachments(deviation?.id || null);
  const { comments } = useDeviationComments(deviation?.id || null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  
  if (!deviation) return null;

  const generateDeviationEmailHtml = () => {
    const formatDateStr = (dateStr: string) => {
      try {
        return format(new Date(dateStr), "d. MMMM yyyy", { locale: nb });
      } catch {
        return dateStr;
      }
    };

    const priorityLabels: Record<string, string> = {
      low: "Lav",
      medium: "Medium",
      high: "Høy",
      critical: "Kritisk"
    };

    const statusLabels: Record<string, string> = {
      open: "Åpen",
      "in-progress": "Under arbeid",
      resolved: "Løst",
      closed: "Lukket"
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Avvik - ${deviation.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="margin: 0 0 10px 0; color: #333;">${deviation.title}</h1>
          <p style="margin: 0; color: #666;">
            ${deviation.deviation_number || deviation.id} | ${deviation.category} | ${priorityLabels[deviation.priority] || deviation.priority}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Status:</strong> ${statusLabels[deviation.status] || deviation.status}</p>
          <p><strong>Ansvarlig:</strong> ${deviation.assignee}</p>
          <p><strong>Rapportert av:</strong> ${deviation.reporter}</p>
          <p><strong>Opprettet:</strong> ${formatDateStr(deviation.createdAt)}</p>
          <p><strong>Frist:</strong> ${formatDateStr(deviation.dueDate)}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">Beskrivelse</h2>
          <p style="white-space: pre-wrap;">${deviation.description || "Ingen beskrivelse"}</p>
        </div>

        ${deviation.type === "ruh" ? `
          ${deviation.incident_location ? `<p><strong>Hendelsessted:</strong> ${deviation.incident_location}</p>` : ""}
          ${deviation.incident_time ? `<p><strong>Tidspunkt:</strong> ${deviation.incident_time}</p>` : ""}
          ${deviation.incident_type ? `<p><strong>Hendelsestype:</strong> ${deviation.incident_type}</p>` : ""}
          ${deviation.severity ? `<p><strong>Alvorlighetsgrad:</strong> ${deviation.severity}</p>` : ""}
          ${deviation.consequences ? `<p><strong>Konsekvenser:</strong> ${deviation.consequences}</p>` : ""}
          ${deviation.involved_persons ? `<p><strong>Involverte personer:</strong> ${deviation.involved_persons}</p>` : ""}
          ${deviation.immediate_actions ? `<p><strong>Umiddelbare tiltak:</strong> ${deviation.immediate_actions}</p>` : ""}
          ${deviation.preventive_measures ? `<p><strong>Forebyggende tiltak:</strong> ${deviation.preventive_measures}</p>` : ""}
          ${deviation.root_cause_analysis ? `<p><strong>Rotårsaksanalyse:</strong> ${deviation.root_cause_analysis}</p>` : ""}
        ` : ""}

        ${attachments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; margin-bottom: 10px;">Vedlegg</h2>
            <ul>
              ${attachments.map(a => `<li>${a.file_name}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${comments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; margin-bottom: 10px;">Kommentarer</h2>
            ${comments.map(c => `
              <div style="border-left: 3px solid #ddd; padding-left: 10px; margin-bottom: 10px;">
                <p style="margin: 0; font-weight: bold;">${c.user_name}</p>
                <p style="margin: 5px 0; color: #666;">${c.content}</p>
                <p style="margin: 0; font-size: 12px; color: #999;">${formatDateStr(c.created_at)}</p>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Denne rapporten ble sendt fra HMS-systemet.</p>
        </div>
      </body>
      </html>
    `;
  };

  const emailUsers = users.map(u => ({
    id: u.id,
    email: u.email || "",
    first_name: u.first_name || "",
    last_name: u.last_name || ""
  })).filter(u => u.email);

  const handleDownloadPDF = () => {
    exportSingleDeviationToPDF({
      id: deviation.id,
      deviation_number: deviation.deviation_number,
      title: deviation.title,
      description: deviation.description,
      category: deviation.category,
      priority: deviation.priority,
      status: deviation.status,
      assignee: deviation.assignee,
      reporter: deviation.reporter,
      createdAt: deviation.createdAt,
      dueDate: deviation.dueDate,
      // Extended RUH fields
      type: deviation.type,
      incident_location: deviation.incident_location,
      incident_time: deviation.incident_time,
      incident_type: deviation.incident_type,
      severity: deviation.severity,
      consequences: deviation.consequences,
      involved_persons: deviation.involved_persons,
      immediate_actions: deviation.immediate_actions,
      preventive_measures: deviation.preventive_measures,
      root_cause_analysis: deviation.root_cause_analysis,
      reporter_contact: deviation.reporter_contact,
      responsible_receiver: deviation.responsible_receiver,
      additional_info: deviation.additional_info,
      notify_arbeidstilsynet: deviation.notify_arbeidstilsynet ?? undefined,
      notify_insurance: deviation.notify_insurance ?? undefined,
    }, 
    company?.name,
    attachments.map(a => ({ file_name: a.file_name, file_type: a.file_type })),
    comments.map(c => ({ user_name: c.user_name, content: c.content, created_at: c.created_at }))
    );
  };

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
      <DialogContent className="sm:max-w-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <span className="font-mono text-xs">{deviation.id}</span>
            {deviation.category && categoryConfig[deviation.category] && (
              <Badge className={categoryConfig[deviation.category].color}>
                {deviation.category}
              </Badge>
            )}
            {deviation.priority && priorityConfig[deviation.priority] && (
              <Badge className={priorityConfig[deviation.priority].color}>
                {priorityConfig[deviation.priority].label}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg sm:text-xl">{deviation.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
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
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)} className="w-full sm:w-auto">
            <Mail className="w-4 h-4 mr-2" />
            Send på e-post
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Last ned PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Lukk
          </Button>
        </div>
      </DialogContent>

      <EmailSendDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        documentType="deviation"
        subject={`Avvik: ${deviation.title} (${deviation.deviation_number || deviation.id})`}
        htmlContent={generateDeviationEmailHtml()}
        users={emailUsers}
        companyName={company?.name}
      />
    </Dialog>
  );
}
