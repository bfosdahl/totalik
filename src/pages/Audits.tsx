import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileCheck, 
  Plus, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Loader2,
  ClipboardCheck,
  ListChecks,
  Zap,
  Building2,
  Settings
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAudits, type Audit } from "@/hooks/useAudits";
import { NewAuditDialog } from "@/components/audits/NewAuditDialog";
import AnnualHmsRevisionForm from "@/components/audits/AnnualHmsRevisionForm";
import ElKontrollForm from "@/components/audits/ElKontrollForm";
import FysiskeArbeidsforholdForm from "@/components/audits/FysiskeArbeidsforholdForm";
import DagligDriftForm from "@/components/audits/DagligDriftForm";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const typeConfig = {
  internal: { label: "Intern", color: "bg-primary/10 text-primary" },
  external: { label: "Ekstern", color: "bg-accent/10 text-accent" },
  routine: { label: "Rutine", color: "bg-info/10 text-info" },
};

const statusConfig = {
  scheduled: { 
    label: "Planlagt", 
    icon: Calendar, 
    color: "text-muted-foreground",
    bg: "bg-muted"
  },
  "in-progress": { 
    label: "Pågår", 
    icon: Clock, 
    color: "text-warning",
    bg: "bg-warning/10"
  },
  completed: { 
    label: "Fullført", 
    icon: CheckCircle2, 
    color: "text-success",
    bg: "bg-success/10"
  },
  overdue: { 
    label: "Forfalt", 
    icon: AlertCircle, 
    color: "text-destructive",
    bg: "bg-destructive/10"
  },
};

const Audits = () => {
  const { audits, isLoading, createAudit, updateAudit } = useAudits();
  const [isNewAuditOpen, setIsNewAuditOpen] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d. MMM yyyy", { locale: nb });
    } catch {
      return dateString;
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
        >
          <h1 className="text-2xl font-bold tracking-tight">Revisjoner</h1>
          <p className="text-muted-foreground">
            Planlegg og gjennomfør internrevisjoner
          </p>
        </motion.div>

        {/* Tabs for different revision types */}
        <Tabs defaultValue="list" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-2 shadow-card">
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0 w-full">
              <TabsTrigger 
                value="list" 
                className="flex-1 min-w-[140px] gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <ListChecks className="w-4 h-4" />
                <span>Revisjoner</span>
              </TabsTrigger>
              <TabsTrigger 
                value="annual" 
                className="flex-1 min-w-[140px] gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Årlig HMS-revisjon</span>
              </TabsTrigger>
              <TabsTrigger 
                value="elkontroll" 
                className="flex-1 min-w-[140px] gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>El-Kontroll</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fysiske" 
                className="flex-1 min-w-[140px] gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>Fysiske forhold</span>
              </TabsTrigger>
              <TabsTrigger 
                value="drift" 
                className="flex-1 min-w-[140px] gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <Settings className="w-4 h-4" />
                <span>Daglig drift</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Revisions List Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* New audit button */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setIsNewAuditOpen(true)}>
                <Plus className="w-4 h-4" />
                Ny revisjon
              </Button>
            </div>

            {/* Stats overview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {Object.entries(statusConfig).map(([key, config]) => {
                const count = audits.filter((a) => a.status === key).length;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={key}
                    className="bg-card rounded-xl border border-border p-4 shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <StatusIcon className={cn("w-5 h-5", config.color)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Audits list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">Alle revisjoner</h2>
              
              {audits.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                  <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Ingen revisjoner</h3>
                  <p className="text-muted-foreground mb-4">
                    Du har ikke opprettet noen revisjoner ennå.
                  </p>
                  <Button onClick={() => setIsNewAuditOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Opprett første revisjon
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {audits.map((audit, index) => {
                    const statusInfo = statusConfig[audit.status];
                    const StatusIcon = statusInfo.icon;
                    const progress = audit.checklist_total > 0 
                      ? (audit.checklist_completed / audit.checklist_total) * 100 
                      : 0;

                    return (
                      <motion.div
                        key={audit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05 }}
                        className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl", statusInfo.bg)}>
                            <FileCheck className={cn("w-6 h-6", statusInfo.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={typeConfig[audit.type].color}>
                                {typeConfig[audit.type].label}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {audit.audit_number}
                              </span>
                            </div>

                            <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                              {audit.title}
                            </h3>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 flex-wrap">
                              {audit.area && <span>{audit.area}</span>}
                              {audit.responsible_name && (
                                <>
                                  <span>•</span>
                                  <span>{audit.responsible_name}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatDate(audit.scheduled_date)}</span>
                            </div>

                            {/* Progress bar */}
                            {audit.checklist_total > 0 && (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      audit.status === "completed" ? "bg-success" : "bg-primary"
                                    )}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {audit.checklist_completed} / {audit.checklist_total} punkter
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
                              <span className={cn("text-sm font-medium hidden sm:inline", statusInfo.color)}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Annual HMS Revision Tab */}
          <TabsContent value="annual">
            <AnnualHmsRevisionForm />
          </TabsContent>

          {/* El Kontroll Tab */}
          <TabsContent value="elkontroll">
            <ElKontrollForm />
          </TabsContent>

          {/* Fysiske arbeidsforhold Tab */}
          <TabsContent value="fysiske">
            <FysiskeArbeidsforholdForm />
          </TabsContent>

          {/* Daglig drift Tab */}
          <TabsContent value="drift">
            <DagligDriftForm />
          </TabsContent>
        </Tabs>
      </div>

      <NewAuditDialog 
        open={isNewAuditOpen} 
        onOpenChange={setIsNewAuditOpen}
        onSubmit={createAudit}
      />
    </AppLayout>
  );
};

export default Audits;
