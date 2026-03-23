import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Clock,
  User,
  ChevronDown,
  Calendar,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
  HeartPulse,
  Smartphone
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NewDeviationDialog, NewDeviation } from "@/components/deviations/NewDeviationDialog";
import { DeviationDetailDialog } from "@/components/deviations/DeviationDetailDialog";
import { WorkAccidentDialog, WorkAccidentData } from "@/components/deviations/WorkAccidentDialog";
import { useDeviations, Deviation as DeviationType, NewDeviationInput, DeviationStatus } from "@/hooks/useDeviations";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useToast } from "@/hooks/use-toast";
import { exportDeviationsToPDF, exportDeviationsToExcel } from "@/utils/deviationExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const priorityConfig = {
  low: { label: "Lav", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-warning/10 text-warning" },
  high: { label: "Høy", color: "bg-destructive/10 text-destructive" },
  critical: { label: "Kritisk", color: "bg-destructive text-destructive-foreground" },
};

const statusConfig: Record<DeviationStatus, { label: string; color: string }> = {
  open: { label: "Åpen", color: "bg-destructive/10 text-destructive" },
  "in-progress": { label: "Under arbeid", color: "bg-warning/10 text-warning" },
  resolved: { label: "Løst", color: "bg-success/10 text-success" },
  closed: { label: "Lukket", color: "bg-success/10 text-success" },
};

// Use the shared DeviationCategory type from useDeviations
import type { DeviationCategory } from "@/hooks/useDeviations";

const categoryConfig: Record<DeviationCategory, { label: string; color: string }> = {
  safety: { label: "HMS / Sikkerhet", color: "bg-primary/10 text-primary" },
  quality: { label: "Kvalitet", color: "bg-blue-500/10 text-blue-600" },
  environment: { label: "Miljø", color: "bg-green-500/10 text-green-600" },
  process: { label: "Prosess", color: "bg-purple-500/10 text-purple-600" },
  equipment: { label: "Utstyr", color: "bg-orange-500/10 text-orange-600" },
  personnel: { label: "Personell", color: "bg-pink-500/10 text-pink-600" },
  documentation: { label: "Dokumentasjon", color: "bg-slate-500/10 text-slate-600" },
  other: { label: "Annet", color: "bg-muted text-muted-foreground" },
  temperature: { label: "Temperaturavvik", color: "bg-red-500/10 text-red-600" },
  cleaning: { label: "Renhold", color: "bg-yellow-500/10 text-yellow-600" },
  pest_control: { label: "Skadedyr", color: "bg-orange-500/10 text-orange-600" },
  allergen: { label: "Allergenhåndtering", color: "bg-purple-500/10 text-purple-600" },
  traceability: { label: "Sporbarhet", color: "bg-cyan-500/10 text-cyan-600" },
  hygiene: { label: "Hygiene", color: "bg-pink-500/10 text-pink-600" },
  storage: { label: "Lagring", color: "bg-blue-500/10 text-blue-600" },
  pests: { label: "Skadedyr", color: "bg-orange-500/10 text-orange-600" },
  expiry: { label: "Utgått holdbarhet", color: "bg-amber-500/10 text-amber-600" },
  contamination: { label: "Krysskontaminering", color: "bg-rose-500/10 text-rose-600" },
  receiving: { label: "Varemottak", color: "bg-teal-500/10 text-teal-600" },
  other_food: { label: "Annet matsikkerhet", color: "bg-muted text-muted-foreground" },
};

// Helper type for the detail dialog - includes all RUH fields
interface DeviationForDialog {
  id: string;
  deviation_number: string;
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

const Deviations = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { deviations, isLoading, createDeviation, updateDeviation, deleteDeviation } = useDeviations();
  const { users, getUserDisplayName } = useCompanyUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWorkAccidentOpen, setIsWorkAccidentOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<DeviationForDialog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Helper function to upload files for a deviation
  const uploadFilesForDeviation = async (deviationId: string, files: File[]) => {
    if (!profile?.company_id || files.length === 0) return;
    
    const uploaderName = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.email || "Ukjent";
    
    for (const file of files) {
      try {
        // Create unique file path
        const fileExt = file.name.split(".").pop();
        const fileName = `${deviationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("deviation-attachments")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        // Save attachment record
        await supabase
          .from("deviation_attachments")
          .insert({
            deviation_id: deviationId,
            company_id: profile.company_id,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: profile.id,
            uploaded_by_name: uploaderName,
          });
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const filteredDeviations = deviations.filter((dev) => {
    const matchesSearch = dev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterStatus || dev.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: deviations.length,
    open: deviations.filter((d) => d.status === "open").length,
    inProgress: deviations.filter((d) => d.status === "in-progress").length,
    resolved: deviations.filter((d) => d.status === "resolved").length,
  };

  const handleNewDeviation = async (input: NewDeviation) => {
    // Find assignee user by name if not provided by ID
    const assigneeUser = input.assigneeId 
      ? users.find(u => u.id === input.assigneeId)
      : users.find(u => getUserDisplayName(u) === input.assignee);
    
    // Build additional info from extended fields
    const additionalInfo = [
      input.happenedBefore && input.happenedBefore !== "unknown" ? `Skjedd tidligere: ${input.happenedBefore === "yes" ? "Ja" : "Nei"}` : null,
      input.consequenceFor ? `Konsekvens for: ${input.consequenceFor}` : null,
      input.estimatedLoss ? `Estimert tap: ${input.estimatedLoss} kr` : null,
    ].filter(Boolean).join("\n");
    
    const newDeviation: NewDeviationInput = {
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      assignee_id: assigneeUser?.id || null,
      assignee_name: input.assignee,
      due_date: input.dueDate,
      // Extended fields
      incident_location: input.incidentLocation,
      incident_date: input.incidentDate, // Date when discovered (now uses correct field)
      // incident_time is optional and would need a separate time picker
      reporter_contact: input.discoveredBy,
      additional_info: additionalInfo || undefined,
      consequences: input.consequenceFor,
      immediate_actions: input.shortTermImprovement,
      preventive_measures: input.longTermImprovement,
      responsible_receiver: input.responsibleForClosing,
    };

    const createdDeviation = await createDeviation(newDeviation);
    
    // Upload pending files if any
    if (createdDeviation && input.pendingFiles && input.pendingFiles.length > 0) {
      await uploadFilesForDeviation(createdDeviation.id, input.pendingFiles);
      toast({
        title: "Vedlegg lastet opp",
        description: `${input.pendingFiles.length} fil(er) ble lastet opp`,
      });
    }
  };

  const handleDeviationClick = (deviation: DeviationType) => {
    // Convert to dialog format with all fields
    const dialogDeviation: DeviationForDialog = {
      id: deviation.id,
      deviation_number: deviation.deviation_number,
      title: deviation.title,
      description: deviation.description || "",
      category: deviation.category,
      priority: deviation.priority,
      status: deviation.status,
      assignee: deviation.assignee_name || "Ikke tildelt",
      reporter: deviation.reporter_name,
      createdAt: deviation.created_at.split("T")[0],
      dueDate: deviation.due_date,
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
      notify_arbeidstilsynet: deviation.notify_arbeidstilsynet,
      notify_insurance: deviation.notify_insurance,
    };
    setSelectedDeviation(dialogDeviation);
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: DeviationForDialog["status"]) => {
    const success = await updateDeviation(id, { status: newStatus });
    if (success) {
      setSelectedDeviation(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Status oppdatert",
        description: `Avviket er nå "${statusConfig[newStatus].label}"`,
      });
    }
  };

  const handleAssigneeChange = async (id: string, assigneeName: string) => {
    const assigneeUser = users.find(u => getUserDisplayName(u) === assigneeName);
    const success = await updateDeviation(
      id, 
      { 
        assignee_id: assigneeUser?.id || null,
        assignee_name: assigneeName 
      },
      {
        sendNotification: true,
        assigneeEmail: assigneeUser?.email || undefined,
      }
    );
    if (success) {
      setSelectedDeviation(prev => prev ? { ...prev, assignee: assigneeName } : null);
      toast({
        title: "Ansvarlig oppdatert",
        description: assigneeUser?.email 
          ? `${assigneeName} vil motta en e-postvarsling`
          : `Avviket er nå tildelt "${assigneeName}"`,
      });
    }
  };

  const handleFollowUpChange = async (
    id: string, 
    updates: { 
      immediate_actions?: string; 
      root_cause_analysis?: string; 
      preventive_measures?: string;
    }
  ): Promise<boolean> => {
    const success = await updateDeviation(id, updates);
    if (success) {
      // Update local selected deviation state
      setSelectedDeviation(prev => prev ? {
        ...prev,
        immediate_actions: updates.immediate_actions ?? prev.immediate_actions,
        root_cause_analysis: updates.root_cause_analysis ?? prev.root_cause_analysis,
        preventive_measures: updates.preventive_measures ?? prev.preventive_measures,
      } : null);
    }
    return success;
  };

  // Delete a single deviation
  const handleDeleteDeviation = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette dette avviket?")) return;
    
    const success = await deleteDeviation(id);
    if (success) {
      setIsDetailOpen(false);
      setSelectedDeviation(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Avvikshåndtering</h1>
              <p className="text-sm text-muted-foreground">
                Registrer og følg opp avvik og hendelser
              </p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Eksporter</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportDeviationsToPDF(filteredDeviations)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Last ned som PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDeviationsToExcel(filteredDeviations)}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Last ned som Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/install/avvik" className="flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Last ned Avvik-appen
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="destructive" 
                size="sm"
                className="gap-1.5" 
                onClick={() => setIsWorkAccidentOpen(true)}
              >
                <HeartPulse className="w-4 h-4" />
                <span className="hidden sm:inline">Meld arbeidsulykke</span>
                <span className="sm:hidden">Ulykke</span>
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nytt avvik</span>
                <span className="sm:hidden">Ny</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats - horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4"
        >
          {[
            { label: "Totalt", value: stats.total, color: "text-foreground", bg: "bg-muted/50" },
            { label: "Åpne", value: stats.open, color: "text-destructive", bg: "bg-destructive/5" },
            { label: "Under arbeid", value: stats.inProgress, color: "text-warning", bg: "bg-warning/5" },
            { label: "Løst", value: stats.resolved, color: "text-success", bg: "bg-success/5" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex-shrink-0 min-w-[100px] md:min-w-0 rounded-xl border border-border p-3 md:p-4 shadow-sm",
                stat.bg
              )}
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-xl md:text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søk i avvik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          {/* Status filter tabs - horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <Button
              variant={filterStatus === null ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setFilterStatus(null)}
            >
              Alle
            </Button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={filterStatus === key ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setFilterStatus(key)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Deviations list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {filteredDeviations.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen avvik funnet</p>
              {searchQuery ? (
                <p className="text-sm mt-1">Prøv å endre søkekriteriene</p>
              ) : (
                <p className="text-sm mt-1">Klikk "Nytt avvik" for å registrere det første avviket</p>
              )}
            </div>
          ) : (
            filteredDeviations.map((deviation, index) => {
              const statusBgColors: Record<string, string> = {
                open: "border-l-4 border-l-destructive",
                "in-progress": "border-l-4 border-l-warning",
                resolved: "border-l-4 border-l-success",
                closed: "border-l-4 border-l-success",
              };
              return (
                <motion.div
                  key={deviation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className={cn(
                    "bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer",
                    statusBgColors[deviation.status]
                  )}
                  onClick={() => handleDeviationClick(deviation)}
                >
                  {/* Mobile-optimized card layout */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header row with number and status */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {deviation.deviation_number}
                        </span>
                        <Badge className={cn("text-[10px] md:text-xs", statusConfig[deviation.status].color)}>
                          {statusConfig[deviation.status].label}
                        </Badge>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {deviation.title}
                      </h3>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Badge className={cn("text-[10px]", (categoryConfig[deviation.category] || { color: "bg-muted text-muted-foreground" }).color)}>
                          {(categoryConfig[deviation.category] || { label: deviation.category }).label}
                        </Badge>
                        <Badge className={cn("text-[10px]", priorityConfig[deviation.priority].color)}>
                          {priorityConfig[deviation.priority].label}
                        </Badge>
                      </div>
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{deviation.assignee_name || "Ikke tildelt"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {deviation.due_date}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* New Deviation Dialog */}
      <NewDeviationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleNewDeviation}
      />

      {/* Deviation Detail Dialog */}
      <DeviationDetailDialog
        deviation={selectedDeviation}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusChange={handleStatusChange}
        onAssigneeChange={handleAssigneeChange}
        onFollowUpChange={handleFollowUpChange}
        onDelete={handleDeleteDeviation}
      />

      {/* Work Accident Dialog */}
      <WorkAccidentDialog
        open={isWorkAccidentOpen}
        onOpenChange={setIsWorkAccidentOpen}
        onSubmit={async (data: WorkAccidentData) => {
          const severityMap: Record<string, string> = {
            minor: "Lav",
            moderate: "Medium", 
            serious: "Høy",
            fatal: "Kritisk",
          };
          
          const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
            minor: "medium",
            moderate: "high",
            serious: "critical",
            fatal: "critical",
          };

          const newDeviation: NewDeviationInput = {
            title: `Arbeidsulykke: ${data.title}`,
            description: data.description,
            category: "safety",
            priority: priorityMap[data.severity] || "high",
            assignee_id: null,
            assignee_name: null,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            incident_location: data.incidentLocation,
            incident_time: data.incidentDate && data.incidentTime 
              ? `${data.incidentDate}T${data.incidentTime}` 
              : data.incidentDate,
            incident_type: "Arbeidsulykke",
            severity: severityMap[data.severity],
            consequences: data.consequences,
            involved_persons: data.involvedPersons,
            immediate_actions: data.immediateActions,
            notify_arbeidstilsynet: data.notifyArbeidstilsynet,
            notify_insurance: data.notifyInsurance,
          };

          await createDeviation(newDeviation);
          
          toast({
            title: "Arbeidsulykke registrert",
            description: data.notifyArbeidstilsynet 
              ? "Husk å melde ulykken til Arbeidstilsynet via Altinn"
              : "Ulykken er registrert i avvikssystemet",
          });
        }}
      />
    </AppLayout>
  );
};

export default Deviations;
