import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText,
  Flag,
  Download,
  Mail,
  ClipboardCheck,
  Save,
  Loader2,
  Trash2,
  Pencil,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { DeviationAttachments } from "./DeviationAttachments";
import { DeviationComments } from "./DeviationComments";
import { useDeviationAttachments } from "@/hooks/useDeviationAttachments";
import { useDeviationComments } from "@/hooks/useDeviationComments";
import { exportSingleDeviationToPDF } from "@/utils/deviationExport";
import { useAuth } from "@/contexts/AuthContext";
import { EmailSendDialog } from "@/components/shared/EmailSendDialog";
import { useToast } from "@/hooks/use-toast";

// Use shared DeviationCategory type
import type { DeviationCategory, DeviationStatus } from "@/hooks/useDeviations";
import { t } from "@/i18n/t";

interface Deviation {
  id: string;
  deviation_number?: string;
  title: string;
  description: string;
  category: DeviationCategory;
  priority: "low" | "medium" | "high" | "critical";
  status: DeviationStatus;
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
  low: { label: t("auto.lav"), color: "bg-muted text-muted-foreground" },
  medium: { label: t("auto.medium"), color: "bg-warning/10 text-warning" },
  high: { label: t("auto.hoey"), color: "bg-destructive/10 text-destructive" },
  critical: { label: t("auto.kritisk"), color: "bg-destructive text-destructive-foreground" },
};

const statusConfig: Record<DeviationStatus, { label: string; color: string }> = {
  open: { label: t("auto.aapen"), color: "bg-destructive/10 text-destructive" },
  "in-progress": { label: t("auto.under_arbeid"), color: "bg-warning/10 text-warning" },
  resolved: { label: t("auto.loest"), color: "bg-success/10 text-success" },
  closed: { label: t("auto.lukket"), color: "bg-muted text-muted-foreground" },
};

const categoryConfig: Record<DeviationCategory, { label: string; color: string }> = {
  safety: { label: t("auto.hms_sikkerhet"), color: "bg-primary/10 text-primary" },
  quality: { label: t("auto.kvalitet"), color: "bg-blue-500/10 text-blue-600" },
  environment: { label: t("auto.miljoe"), color: "bg-green-500/10 text-green-600" },
  process: { label: t("auto.prosess"), color: "bg-purple-500/10 text-purple-600" },
  equipment: { label: t("auto.utstyr"), color: "bg-orange-500/10 text-orange-600" },
  personnel: { label: t("auto.personell"), color: "bg-pink-500/10 text-pink-600" },
  documentation: { label: t("auto.dokumentasjon"), color: "bg-slate-500/10 text-slate-600" },
  other: { label: t("auto.annet"), color: "bg-muted text-muted-foreground" },
  temperature: { label: t("auto.temperaturavvik"), color: "bg-red-500/10 text-red-600" },
  cleaning: { label: t("auto.renhold"), color: "bg-yellow-500/10 text-yellow-600" },
  pest_control: { label: t("auto.skadedyr"), color: "bg-orange-500/10 text-orange-600" },
  allergen: { label: t("auto.allergenhaandtering"), color: "bg-purple-500/10 text-purple-600" },
  traceability: { label: t("auto.sporbarhet"), color: "bg-cyan-500/10 text-cyan-600" },
  hygiene: { label: t("auto.hygiene"), color: "bg-pink-500/10 text-pink-600" },
  storage: { label: t("auto.lagring"), color: "bg-blue-500/10 text-blue-600" },
  pests: { label: t("auto.skadedyr"), color: "bg-orange-500/10 text-orange-600" },
  expiry: { label: t("auto.utgaatt_holdbarhet"), color: "bg-amber-500/10 text-amber-600" },
  contamination: { label: t("auto.krysskontaminering"), color: "bg-rose-500/10 text-rose-600" },
  receiving: { label: t("auto.varemottak"), color: "bg-teal-500/10 text-teal-600" },
  other_food: { label: t("auto.annet_matsikkerhet"), color: "bg-muted text-muted-foreground" },
};

interface DeviationDetailDialogProps {
  deviation: Deviation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: Deviation["status"]) => void;
  onAssigneeChange?: (id: string, assignee: string) => void;
  onFollowUpChange?: (id: string, updates: { 
    immediate_actions?: string; 
    root_cause_analysis?: string; 
    preventive_measures?: string;
  }) => Promise<boolean>;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: { 
    title?: string; 
    description?: string; 
    category?: string; 
    priority?: string;
    due_date?: string;
  }) => Promise<boolean>;
}

// Categories editable in the UI (HMS + IK-MAT)
const editableCategories: { value: DeviationCategory; label: string }[] = [
  { value: "safety", label: t("auto.hms_sikkerhet") },
  { value: "quality", label: t("auto.kvalitet") },
  { value: "environment", label: t("auto.miljoe") },
  { value: "process", label: t("auto.prosess") },
  { value: "equipment", label: t("auto.utstyr") },
  { value: "personnel", label: t("auto.personell") },
  { value: "documentation", label: t("auto.dokumentasjon") },
  { value: "temperature", label: t("auto.temperaturavvik") },
  { value: "cleaning", label: t("auto.renhold") },
  { value: "hygiene", label: t("auto.hygiene") },
  { value: "storage", label: t("auto.lagring") },
  { value: "traceability", label: t("auto.sporbarhet") },
  { value: "allergen", label: t("auto.allergen") },
  { value: "pest_control", label: t("auto.skadedyr") },
  { value: "other", label: t("auto.annet") },
];

export function DeviationDetailDialog({ 
  deviation, 
  open, 
  onOpenChange,
  onStatusChange,
  onAssigneeChange,
  onFollowUpChange,
  onDelete,
  onUpdate
}: DeviationDetailDialogProps) {
  const { users, getUserDisplayName } = useCompanyUsers();
  const { company } = useAuth();
  const { toast } = useToast();
  const { attachments, getAttachmentUrl } = useDeviationAttachments(deviation?.id || null);
  const { comments, addComment } = useDeviationComments(deviation?.id || null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Deviation["priority"]>("medium");
  const [editCategory, setEditCategory] = useState<DeviationCategory>("other");
  const [editDueDate, setEditDueDate] = useState("");
  
  // Local state for follow-up fields
  const [immediateActions, setImmediateActions] = useState("");
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState("");
  const [preventiveMeasures, setPreventiveMeasures] = useState("");
  
  // Track if any follow-up field has been modified
  const [hasFollowUpChanges, setHasFollowUpChanges] = useState(false);

  // Closure comment dialog state
  const [closureDialogOpen, setClosureDialogOpen] = useState(false);
  const [closureComment, setClosureComment] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Initialize fields when deviation changes
  useEffect(() => {
    if (deviation) {
      setImmediateActions(deviation.immediate_actions || "");
      setRootCauseAnalysis(deviation.root_cause_analysis || "");
      setPreventiveMeasures(deviation.preventive_measures || "");
      setHasFollowUpChanges(false);
      setEditTitle(deviation.title);
      setEditDescription(deviation.description || "");
      setEditPriority(deviation.priority);
      setEditCategory(deviation.category);
      // dueDate comes as ISO or YYYY-MM-DD, normalize to YYYY-MM-DD for date input
      const d = deviation.dueDate ? new Date(deviation.dueDate) : null;
      setEditDueDate(d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "");
      setIsEditing(false);
    }
  }, [deviation]);
  
  if (!deviation) return null;

  const handleFollowUpFieldChange = (
    setter: (value: string) => void, 
    value: string
  ) => {
    setter(value);
    setHasFollowUpChanges(true);
  };

  const handleSaveFollowUp = async () => {
    if (!onFollowUpChange || !hasFollowUpChanges) return;
    
    setIsSavingFollowUp(true);
    try {
      const success = await onFollowUpChange(deviation.id, {
        immediate_actions: immediateActions || undefined,
        root_cause_analysis: rootCauseAnalysis || undefined,
        preventive_measures: preventiveMeasures || undefined,
      });
      
      if (success) {
        setHasFollowUpChanges(false);
        toast({
          title: t("auto.oppfoelging_lagret"),
          description: t("auto.oppfoelgingsinformasjonen_ble_oppdatert"),
        });
      }
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!onUpdate) return;
    setIsSavingEdit(true);
    try {
      const success = await onUpdate(deviation.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        category: editCategory,
        due_date: editDueDate || undefined,
      });
      if (success) {
        setIsEditing(false);
        toast({
          title: t("auto.avvik_oppdatert"),
          description: t("auto.endringene_ble_lagret"),
        });
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Intercept status changes: require a closure comment when closing an avvik
  const handleStatusSelect = (newStatus: Deviation["status"]) => {
    if (newStatus === "closed" && deviation.status !== "closed") {
      setClosureComment("");
      setClosureDialogOpen(true);
      return;
    }
    onStatusChange(deviation.id, newStatus);
  };

  const handleConfirmClosure = async () => {
    if (!closureComment.trim()) {
      toast({
        title: t("auto.kommentar_mangler"),
        description: t("auto.skriv_en_kort_beskrivelse_av_hvordan_avv"),
        variant: "destructive",
      });
      return;
    }
    setIsClosing(true);
    try {
      await addComment(`🔒 Lukkekommentar: ${closureComment.trim()}`);
      onStatusChange(deviation.id, "closed");
      setClosureDialogOpen(false);
      setClosureComment("");
    } finally {
      setIsClosing(false);
    }
  };

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
          <p><strong>{t("auto.status")}</strong> ${statusLabels[deviation.status] || deviation.status}</p>
          <p><strong>{t("auto.ansvarlig")}</strong> ${deviation.assignee}</p>
          <p><strong>{t("auto.rapportert_av")}</strong> ${deviation.reporter}</p>
          <p><strong>{t("auto.opprettet")}</strong> ${formatDateStr(deviation.createdAt)}</p>
          <p><strong>{t("auto.frist")}</strong> ${formatDateStr(deviation.dueDate)}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">{t("auto.beskrivelse")}</h2>
          <p style="white-space: pre-wrap;">${deviation.description || "Ingen beskrivelse"}</p>
        </div>

        ${deviation.type === "ruh" ? `
          ${deviation.incident_location ? `<p><strong>{t("auto.hendelsessted")}</strong> ${deviation.incident_location}</p>` : ""}
          ${deviation.incident_time ? `<p><strong>{t("auto.tidspunkt")}</strong> ${deviation.incident_time}</p>` : ""}
          ${deviation.incident_type ? `<p><strong>{t("auto.hendelsestype")}</strong> ${deviation.incident_type}</p>` : ""}
          ${deviation.severity ? `<p><strong>{t("auto.alvorlighetsgrad")}</strong> ${deviation.severity}</p>` : ""}
          ${deviation.consequences ? `<p><strong>{t("auto.konsekvenser")}</strong> ${deviation.consequences}</p>` : ""}
          ${deviation.involved_persons ? `<p><strong>{t("auto.involverte_personer")}</strong> ${deviation.involved_persons}</p>` : ""}
          ${deviation.immediate_actions ? `<p><strong>{t("auto.umiddelbare_tiltak")}</strong> ${deviation.immediate_actions}</p>` : ""}
          ${deviation.preventive_measures ? `<p><strong>{t("auto.forebyggende_tiltak")}</strong> ${deviation.preventive_measures}</p>` : ""}
          ${deviation.root_cause_analysis ? `<p><strong>{t("auto.rotaarsaksanalyse")}</strong> ${deviation.root_cause_analysis}</p>` : ""}
        ` : ""}

        ${attachments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; margin-bottom: 10px;">{t("auto.vedlegg")}</h2>
            <ul>
              ${attachments.map(a => `<li>${a.file_name}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${comments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; margin-bottom: 10px;">{t("auto.kommentarer")}</h2>
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
          <p>{t("auto.denne_rapporten_ble_sendt_fra_hms_system")}</p>
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

  

  const fetchAsDataUrl = async (path: string): Promise<string | null> => {
    try {
      const url = await getAttachmentUrl(path);
      if (!url) return null;
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Kunne ikke laste bilde for PDF:", e);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    // Fetch image data urls for image attachments so they embed in the PDF
    const attachmentsForPdf = await Promise.all(
      attachments.map(async (a) => {
        const isImage = (a.file_type || "").startsWith("image/");
        const dataUrl = isImage ? await fetchAsDataUrl(a.file_path) : null;
        return {
          file_name: a.file_name,
          file_type: a.file_type,
          image_data_url: dataUrl || undefined,
        };
      })
    );

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
    attachmentsForPdf,
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
              <span className="font-mono text-xs">{deviation.deviation_number || deviation.id}</span>
              {!isEditing && deviation.priority && priorityConfig[deviation.priority] && (
                <Badge className={priorityConfig[deviation.priority].color}>
                  {priorityConfig[deviation.priority].label}
                </Badge>
              )}
            </div>
            {onUpdate && !isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                {t("auto.rediger")}
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsEditing(false);
                  setEditTitle(deviation.title);
                  setEditDescription(deviation.description || "");
                  setEditPriority(deviation.priority);
                }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit} className="gap-1.5">
                  {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Lagre
                </Button>
              </div>
            )}
          </div>
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-semibold"
              placeholder={t("auto.tittel")}
            />
          ) : (
            <DialogTitle className="text-lg sm:text-xl">{deviation.title}</DialogTitle>
          )}
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Priority / Category / Due date selectors in edit mode */}
          {isEditing && (
            <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("auto.prioritet")}</span>
                </div>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Deviation["priority"])}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("auto.lav")}</SelectItem>
                    <SelectItem value="medium">{t("auto.medium")}</SelectItem>
                    <SelectItem value="high">{t("auto.hoey")}</SelectItem>
                    <SelectItem value="critical">{t("auto.kritisk")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("auto.kategori")}</span>
                </div>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as DeviationCategory)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editableCategories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("auto.frist_2")}</span>
                </div>
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </div>
          )}

          {/* Status selector */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("auto.status_2")}</span>
            </div>
            <Select 
              value={deviation.status} 
              onValueChange={(value) => handleStatusSelect(value as Deviation["status"])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{t("auto.aapen")}</SelectItem>
                <SelectItem value="in-progress">{t("auto.under_arbeid")}</SelectItem>
                <SelectItem value="resolved">{t("auto.loest")}</SelectItem>
                <SelectItem value="closed">{t("auto.lukket")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {t("auto.beskrivelse")}
            </div>
            {isEditing ? (
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[80px] text-sm"
                placeholder={t("auto.beskrivelse_av_avviket")}
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed pl-6 whitespace-pre-wrap">
                {deviation.description || "Ingen beskrivelse"}
              </p>
            )}
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
                    <SelectItem value="unassigned">{t("auto.ikke_tildelt")}</SelectItem>
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

          {/* Follow-up and Resolution Section */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                {t("auto.oppfoelging_og_loesning")}
              </div>
              {onFollowUpChange && hasFollowUpChanges && (
                <Button 
                  size="sm" 
                  onClick={handleSaveFollowUp}
                  disabled={isSavingFollowUp}
                >
                  {isSavingFollowUp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Lagre
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="immediate-actions" className="text-xs text-muted-foreground">
                  {t("auto.umiddelbare_tiltak_hva_ble_gjort_med_en_")}
                </Label>
                {onFollowUpChange ? (
                  <Textarea
                    id="immediate-actions"
                    value={immediateActions}
                    onChange={(e) => handleFollowUpFieldChange(setImmediateActions, e.target.value)}
                    placeholder={t("auto.beskriv_tiltak_som_ble_iverksatt_umiddel")}
                    className="min-h-[60px] text-sm"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {immediateActions || "Ikke dokumentert"}
                  </p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="root-cause" className="text-xs text-muted-foreground">
                  {t("auto.rotaarsaksanalyse_hvorfor_skjedde_det")}
                </Label>
                {onFollowUpChange ? (
                  <Textarea
                    id="root-cause"
                    value={rootCauseAnalysis}
                    onChange={(e) => handleFollowUpFieldChange(setRootCauseAnalysis, e.target.value)}
                    placeholder={t("auto.beskriv_underliggende_aarsaker")}
                    className="min-h-[60px] text-sm"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {rootCauseAnalysis || "Ikke dokumentert"}
                  </p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="preventive-measures" className="text-xs text-muted-foreground">
                  {t("auto.forebyggende_tiltak_hvordan_unngaa_i_fre")}
                </Label>
                {onFollowUpChange ? (
                  <Textarea
                    id="preventive-measures"
                    value={preventiveMeasures}
                    onChange={(e) => handleFollowUpFieldChange(setPreventiveMeasures, e.target.value)}
                    placeholder={t("auto.beskriv_tiltak_for_aa_forhindre_gjentake")}
                    className="min-h-[60px] text-sm"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {preventiveMeasures || "Ikke dokumentert"}
                  </p>
                )}
              </div>
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
        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t flex-shrink-0">
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(deviation.id)} 
              className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("auto.slett")}
            </Button>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)} className="w-full sm:w-auto">
              <Mail className="w-4 h-4 mr-2" />
              {t("auto.send_paa_e_post")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Last ned PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              {t("auto.lukk")}
            </Button>
          </div>
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

      {/* Closure comment dialog */}
      <Dialog open={closureDialogOpen} onOpenChange={(open) => {
        if (!isClosing) setClosureDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("auto.lukk_avvik")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t("auto.beskriv_kort_hvordan_avviket_ble_loest_e")}
            </p>
            <Textarea
              value={closureComment}
              onChange={(e) => setClosureComment(e.target.value)}
              placeholder={t("auto.f_eks_feilen_ble_utbedret_rutinen_oppdat")}
              className="min-h-[120px]"
              autoFocus
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setClosureDialogOpen(false)} disabled={isClosing}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleConfirmClosure} disabled={isClosing || !closureComment.trim()}>
              {isClosing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
              Lukk avvik
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
