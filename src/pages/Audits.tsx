import { motion } from "framer-motion";
import { 
  FileCheck, 
  Plus, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Audit {
  id: string;
  title: string;
  type: "internal" | "external" | "routine";
  status: "scheduled" | "in-progress" | "completed" | "overdue";
  date: string;
  area: string;
  responsible: string;
  checklist: {
    total: number;
    completed: number;
  };
}

const mockAudits: Audit[] = [
  {
    id: "AUD-001",
    title: "Årlig HMS-revisjon",
    type: "internal",
    status: "scheduled",
    date: "2024-01-20",
    area: "Hele bedriften",
    responsible: "Per Hansen",
    checklist: { total: 25, completed: 0 },
  },
  {
    id: "AUD-002",
    title: "Brannrutiner kontroll",
    type: "routine",
    status: "in-progress",
    date: "2024-01-18",
    area: "Kontor og lager",
    responsible: "Kari Olsen",
    checklist: { total: 15, completed: 8 },
  },
  {
    id: "AUD-003",
    title: "Mattilsynet inspeksjon",
    type: "external",
    status: "completed",
    date: "2024-01-10",
    area: "Produksjon",
    responsible: "Erik Berg",
    checklist: { total: 30, completed: 30 },
  },
  {
    id: "AUD-004",
    title: "Førstehjelpsutstyr sjekk",
    type: "routine",
    status: "overdue",
    date: "2024-01-05",
    area: "Alle lokasjoner",
    responsible: "Anna Nilsen",
    checklist: { total: 10, completed: 3 },
  },
];

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
            <h1 className="text-2xl font-bold tracking-tight">Revisjoner</h1>
            <p className="text-muted-foreground">
              Planlegg og gjennomfør internrevisjoner
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Ny revisjon
          </Button>
        </motion.div>

        {/* Stats overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {Object.entries(statusConfig).map(([key, config], index) => {
            const count = mockAudits.filter((a) => a.status === key).length;
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
          
          <div className="grid gap-4">
            {mockAudits.map((audit, index) => {
              const statusInfo = statusConfig[audit.status];
              const StatusIcon = statusInfo.icon;
              const progress = (audit.checklist.completed / audit.checklist.total) * 100;

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
                          {audit.id}
                        </span>
                      </div>

                      <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                        {audit.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{audit.area}</span>
                        <span>•</span>
                        <span>{audit.responsible}</span>
                        <span>•</span>
                        <span>{audit.date}</span>
                      </div>

                      {/* Progress bar */}
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
                          {audit.checklist.completed} / {audit.checklist.total} punkter
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
                        <span className={cn("text-sm font-medium", statusInfo.color)}>
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
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Audits;
