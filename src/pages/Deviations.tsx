import { useState } from "react";
import { motion } from "framer-motion";
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
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NewDeviationDialog } from "@/components/deviations/NewDeviationDialog";
import { DeviationDetailDialog } from "@/components/deviations/DeviationDetailDialog";
import { useDeviations, Deviation, NewDeviationInput } from "@/hooks/useDeviations";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  HMS: { color: "bg-primary/10 text-primary" },
  MAT: { color: "bg-accent/10 text-accent" },
  BYGG: { color: "bg-info/10 text-info" },
};

// Helper type for the detail dialog
interface DeviationForDialog {
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

const Deviations = () => {
  const { toast } = useToast();
  const { deviations, isLoading, createDeviation, updateDeviation } = useDeviations();
  const { users, getUserDisplayName } = useCompanyUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<DeviationForDialog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  const handleNewDeviation = async (input: { 
    title: string; 
    description: string; 
    category: "HMS" | "MAT" | "BYGG"; 
    priority: "low" | "medium" | "high" | "critical"; 
    assignee: string; 
    dueDate: string; 
  }) => {
    // Find assignee user by name
    const assigneeUser = users.find(u => getUserDisplayName(u) === input.assignee);
    
    const newDeviation: NewDeviationInput = {
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      assignee_id: assigneeUser?.id || null,
      assignee_name: input.assignee,
      due_date: input.dueDate,
    };

    await createDeviation(newDeviation);
  };

  const handleDeviationClick = (deviation: Deviation) => {
    // Convert to dialog format
    const dialogDeviation: DeviationForDialog = {
      id: deviation.id,
      title: deviation.title,
      description: deviation.description || "",
      category: deviation.category,
      priority: deviation.priority,
      status: deviation.status,
      assignee: deviation.assignee_name || "Ikke tildelt",
      reporter: deviation.reporter_name,
      createdAt: deviation.created_at.split("T")[0],
      dueDate: deviation.due_date,
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
    const success = await updateDeviation(id, { 
      assignee_id: assigneeUser?.id || null,
      assignee_name: assigneeName 
    });
    if (success) {
      setSelectedDeviation(prev => prev ? { ...prev, assignee: assigneeName } : null);
      toast({
        title: "Ansvarlig oppdatert",
        description: `Avviket er nå tildelt "${assigneeName}"`,
      });
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
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Avvikshåndtering</h1>
            <p className="text-muted-foreground">
              Registrer og følg opp avvik og hendelser
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nytt avvik
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Totalt", value: stats.total, color: "text-foreground" },
            { label: "Åpne", value: stats.open, color: "text-destructive" },
            { label: "Under arbeid", value: stats.inProgress, color: "text-warning" },
            { label: "Løst", value: stats.resolved, color: "text-success" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl border border-border p-4 shadow-card"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søk i avvik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Status filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            Alle
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={filterStatus === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(key)}
            >
              {config.label}
            </Button>
          ))}
        </motion.div>

        {/* Deviations list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        >
          <div className="divide-y divide-border">
            {filteredDeviations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ingen avvik funnet</p>
                {searchQuery ? (
                  <p className="text-sm mt-1">Prøv å endre søkekriteriene</p>
                ) : (
                  <p className="text-sm mt-1">Klikk "Nytt avvik" for å registrere det første avviket</p>
                )}
              </div>
            ) : (
              filteredDeviations.map((deviation, index) => (
                <motion.div
                  key={deviation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
                  onClick={() => handleDeviationClick(deviation)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {deviation.deviation_number}
                        </span>
                        <Badge className={categoryConfig[deviation.category].color}>
                          {deviation.category}
                        </Badge>
                        <Badge className={priorityConfig[deviation.priority].color}>
                          {priorityConfig[deviation.priority].label}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                        {deviation.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {deviation.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {deviation.assignee_name || "Ikke tildelt"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Frist: {deviation.due_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {deviation.created_at.split("T")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig[deviation.status].color}>
                        {statusConfig[deviation.status].label}
                      </Badge>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
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
      />
    </AppLayout>
  );
};

export default Deviations;
