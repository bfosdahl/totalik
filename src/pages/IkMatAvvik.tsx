import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Clock,
  User,
  ChevronDown,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
  Utensils,
  Trash2,
  RotateCcw
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NewDeviationDialog, NewDeviation } from "@/components/deviations/NewDeviationDialog";
import { DeviationDetailDialog } from "@/components/deviations/DeviationDetailDialog";
import { useDeviations, Deviation as DeviationType, NewDeviationInput } from "@/hooks/useDeviations";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useCompanyModules } from "@/hooks/useCompanyModules";
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
import { useNavigate } from "react-router-dom";
import { useIkMatOverdueSync } from "@/hooks/useIkMatOverdueSync";

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
  closed: { label: "Lukket", color: "bg-success/10 text-success" },
};

// IK-MAT specific categories - completely separate from HMS
const ikMatCategories = [
  "temperature",      // Temperaturavvik
  "cleaning",         // Renhold ikke utført
  "pests",           // Skadedyr
  "allergen",        // Allergenhåndtering
  "storage",         // Feil lagring
  "expiry",          // Utgått holdbarhet
  "hygiene",         // Personlig hygiene
  "contamination",   // Krysskontaminering
  "receiving",       // Varemottak
  "traceability",    // Sporbarhet/varemottak (fra kontroll)
  "other_food",      // Annet matsikkerhet
] as const;

type IkMatCategory = typeof ikMatCategories[number];

const ikMatCategoryConfig: Record<IkMatCategory, { label: string; color: string; icon?: string }> = {
  temperature: { label: "Temperaturavvik", color: "bg-red-500/10 text-red-600" },
  cleaning: { label: "Renhold ikke utført", color: "bg-yellow-500/10 text-yellow-600" },
  pests: { label: "Skadedyr", color: "bg-orange-500/10 text-orange-600" },
  allergen: { label: "Allergenhåndtering", color: "bg-purple-500/10 text-purple-600" },
  storage: { label: "Feil lagring", color: "bg-blue-500/10 text-blue-600" },
  expiry: { label: "Utgått holdbarhet", color: "bg-amber-500/10 text-amber-600" },
  hygiene: { label: "Personlig hygiene", color: "bg-pink-500/10 text-pink-600" },
  contamination: { label: "Krysskontaminering", color: "bg-rose-500/10 text-rose-600" },
  receiving: { label: "Varemottak", color: "bg-teal-500/10 text-teal-600" },
  traceability: { label: "Sporbarhet", color: "bg-cyan-500/10 text-cyan-600" },
  other_food: { label: "Annet", color: "bg-muted text-muted-foreground" },
};

// Use shared type from useDeviations
import type { DeviationCategory } from "@/hooks/useDeviations";

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

const IkMatAvvik = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { deviations, isLoading, createDeviation, updateDeviation, deleteDeviation, refetch } = useDeviations();
  // Auto-sync overdue Kontroll tasks as deviations
  useIkMatOverdueSync();
  const { users, getUserDisplayName } = useCompanyUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<DeviationForDialog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Redirect if module not enabled
  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [modulesLoading, hasModule, navigate]);

  // Filter to only IK-MAT deviations (type = 'ik_mat')
  const foodSafetyDeviations = deviations.filter(dev => 
    dev.type === "ik_mat"
  );

  const uploadFilesForDeviation = async (deviationId: string, files: File[]) => {
    if (!profile?.company_id || files.length === 0) return;
    
    const uploaderName = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.email || "Ukjent";
    
    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${deviationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("deviation-attachments")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

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

  const filteredDeviations = foodSafetyDeviations.filter((dev) => {
    const matchesSearch = dev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || dev.status === filterStatus;
    const matchesCategory = !filterCategory || dev.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Reset scope follows active status/category filters.
  // If no status is selected, default scope is open + in-progress.
  const resetScopedDeviations = foodSafetyDeviations.filter((dev) => {
    const matchesCategory = !filterCategory || dev.category === filterCategory;
    const matchesStatus = filterStatus
      ? dev.status === filterStatus
      : dev.status === "open" || dev.status === "in-progress";
    return matchesCategory && matchesStatus;
  });

  const stats = {
    total: foodSafetyDeviations.length,
    open: foodSafetyDeviations.filter((d) => d.status === "open").length,
    inProgress: foodSafetyDeviations.filter((d) => d.status === "in-progress").length,
    resolved: foodSafetyDeviations.filter((d) => d.status === "resolved").length,
  };

  const handleNewDeviation = async (input: NewDeviation) => {
    const assigneeUser = input.assigneeId 
      ? users.find(u => u.id === input.assigneeId)
      : users.find(u => getUserDisplayName(u) === input.assignee);
    
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
      type: 'ik_mat',
      assignee_id: assigneeUser?.id || null,
      assignee_name: input.assignee,
      due_date: input.dueDate,
      incident_location: input.incidentLocation,
      incident_date: input.incidentDate,
      reporter_contact: input.discoveredBy,
      additional_info: additionalInfo || undefined,
      consequences: input.consequenceFor,
      immediate_actions: input.shortTermImprovement,
      preventive_measures: input.longTermImprovement,
      responsible_receiver: input.responsibleForClosing,
    };

    const createdDeviation = await createDeviation(newDeviation);
    
    if (createdDeviation && input.pendingFiles && input.pendingFiles.length > 0) {
      await uploadFilesForDeviation(createdDeviation.id, input.pendingFiles);
      toast({
        title: "Vedlegg lastet opp",
        description: `${input.pendingFiles.length} fil(er) ble lastet opp`,
      });
    }
  };

  const handleDeviationClick = (deviation: DeviationType) => {
    const dialogDeviation: DeviationForDialog = {
      id: deviation.id,
      deviation_number: deviation.deviation_number,
      title: deviation.title,
      description: deviation.description || "",
      category: deviation.category as DeviationCategory,
      priority: deviation.priority,
      status: deviation.status,
      assignee: deviation.assignee_name || "Ikke tildelt",
      reporter: deviation.reporter_name,
      createdAt: deviation.created_at.split("T")[0],
      dueDate: deviation.due_date,
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
      setSelectedDeviation(prev => prev ? {
        ...prev,
        immediate_actions: updates.immediate_actions ?? prev.immediate_actions,
        root_cause_analysis: updates.root_cause_analysis ?? prev.root_cause_analysis,
        preventive_measures: updates.preventive_measures ?? prev.preventive_measures,
      } : null);
    }
    return success;
  };

  // Update deviation fields (title, description, priority etc.)
  const handleUpdateDeviation = async (
    id: string, 
    updates: { title?: string; description?: string; category?: string; priority?: string; due_date?: string }
  ): Promise<boolean> => {
    const success = await updateDeviation(id, updates as any);
    if (success) {
      setSelectedDeviation(prev => prev ? {
        ...prev,
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.priority && { priority: updates.priority as DeviationForDialog["priority"] }),
      } : null);
      refetch();
    }
    return success;
  };

  // Track dismissed auto-deviations so sync doesn't re-create them
  const dismissAutoDeviation = async (deviation: DeviationType) => {
    if (deviation.additional_info === 'Automatisk opprettet fra Kontroll' && company?.id) {
      try {
        await supabase.from('ik_mat_dismissed_auto_deviations').upsert({
          company_id: company.id,
          deviation_title: deviation.title,
          dismissed_by_id: profile?.user_id || null,
        }, { onConflict: 'company_id,deviation_title' });
      } catch (e) {
        console.error('Failed to track dismissed deviation:', e);
      }
    }
  };

  // Delete a single deviation
  const handleDeleteDeviation = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette dette avviket? Dette kan ikke angres.")) return;
    
    const dev = foodSafetyDeviations.find(d => d.id === id);
    const success = await deleteDeviation(id);
    if (success) {
      if (dev) await dismissAutoDeviation(dev);
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-dismissed-auto-deviations'] });
      setIsDetailOpen(false);
      setSelectedDeviation(null);
    }
  };

  // Quick delete from list (without opening detail)
  const handleQuickDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Er du sikker på at du vil slette dette avviket?")) return;
    const dev = foodSafetyDeviations.find(d => d.id === id);
    const success = await deleteDeviation(id);
    if (success && dev) {
      await dismissAutoDeviation(dev);
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-dismissed-auto-deviations'] });
    }
  };

  // Reset deviations in current status/category scope
  const handleDeleteAllOpenDeviations = async () => {
    if (!company?.id) return;

    const deviationsToDelete = resetScopedDeviations;

    if (deviationsToDelete.length === 0) {
      toast({
        title: "Ingen avvik å nullstille",
        description: "Ingen avvik matcher valgt status/kategori.",
      });
      return;
    }

    const statusLabel = filterStatus
      ? (statusConfig[filterStatus as keyof typeof statusConfig]?.label || filterStatus)
      : "Åpen + Under arbeid";
    const categoryLabel = filterCategory
      ? (ikMatCategoryConfig[filterCategory as IkMatCategory]?.label || filterCategory)
      : "Alle kategorier";

    if (!confirm(`Er du sikker på at du vil nullstille ${deviationsToDelete.length} avvik?\n\nStatus: ${statusLabel}\nKategori: ${categoryLabel}`)) {
      return;
    }

    setIsDeletingAll(true);

    try {
      const autoCreatedTitles = deviationsToDelete
        .filter((d) => d.additional_info === 'Automatisk opprettet fra Kontroll')
        .map((d) => d.title);

      if (autoCreatedTitles.length > 0) {
        await supabase.from('ik_mat_dismissed_auto_deviations').upsert(
          autoCreatedTitles.map((title) => ({
            company_id: company.id,
            deviation_title: title,
            dismissed_by_id: profile?.user_id || null,
          })),
          { onConflict: 'company_id,deviation_title' }
        );
      }

      let deleteQuery = supabase
        .from('deviations')
        .delete()
        .eq('company_id', company.id)
        .eq('type', 'ik_mat');

      if (filterCategory) {
        deleteQuery = deleteQuery.eq('category', filterCategory);
      }

      if (filterStatus) {
        deleteQuery = deleteQuery.eq('status', filterStatus);
      } else {
        deleteQuery = deleteQuery.in('status', ['open', 'in-progress']);
      }

      const { error } = await deleteQuery;
      if (error) throw error;

      if (selectedDeviation && deviationsToDelete.some(d => d.id === selectedDeviation.id)) {
        setIsDetailOpen(false);
        setSelectedDeviation(null);
      }

      toast({
        title: "Avvik nullstilt",
        description: `${deviationsToDelete.length} avvik ble slettet fra valgt visning.`,
      });

      // Invalidate calendar queries so Kontroll tab updates
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-dismissed-auto-deviations'] });

      await refetch();
    } catch (error) {
      console.error('Error resetting deviations:', error);
      toast({
        title: "Feil ved nullstilling",
        description: "Kunne ikke nullstille avvik. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (isLoading || modulesLoading) {
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Utensils className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">IK-MAT Avvik</h1>
                <p className="text-sm text-muted-foreground">
                  Avvik relatert til matsikkerhet og hygiene
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Reset button follows current status/category filter scope */}
              {resetScopedDeviations.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={handleDeleteAllOpenDeviations}
                  disabled={isDeletingAll}
                >
                  {isDeletingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Nullstill avvik</span>
                </Button>
              )}
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
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nytt avvik</span>
                <span className="sm:hidden">Ny</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
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
          
          {/* Status filter */}
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

          {/* Category filter for IK-MAT specific categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <Button
              variant={filterCategory === null ? "secondary" : "ghost"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setFilterCategory(null)}
            >
              Alle kategorier
            </Button>
            {ikMatCategories.map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? "secondary" : "ghost"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setFilterCategory(cat)}
              >
                {ikMatCategoryConfig[cat].label}
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
              <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen matsikkerhetsavvik funnet</p>
              {searchQuery || filterStatus || filterCategory ? (
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  className={cn(
                    "bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                    statusBgColors[deviation.status]
                  )}
                  onClick={() => handleDeviationClick(deviation)}
                >
                  <div className="flex items-start justify-between gap-2 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {deviation.deviation_number}
                        </span>
                        <Badge className={cn("text-xs", priorityConfig[deviation.priority]?.color || "")}>
                          {priorityConfig[deviation.priority]?.label || deviation.priority}
                        </Badge>
                        <Badge className={cn("text-xs", ikMatCategoryConfig[deviation.category as IkMatCategory]?.color || "bg-muted")}>
                          {ikMatCategoryConfig[deviation.category as IkMatCategory]?.label || deviation.category}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm md:text-base truncate">
                        {deviation.title}
                      </h4>
                      <div className="flex items-center gap-2 md:gap-4 mt-1.5 md:mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{deviation.assignee_name || "Ikke tildelt"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {deviation.due_date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs whitespace-nowrap", statusConfig[deviation.status]?.color || "")}>
                        {statusConfig[deviation.status]?.label || deviation.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={(e) => handleQuickDelete(e, deviation.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Dialogs */}
      <NewDeviationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleNewDeviation}
      />

      {selectedDeviation && (
        <DeviationDetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          deviation={selectedDeviation}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onFollowUpChange={handleFollowUpChange}
          onDelete={handleDeleteDeviation}
          onUpdate={handleUpdateDeviation}
        />
      )}
    </AppLayout>
  );
};

export default IkMatAvvik;
