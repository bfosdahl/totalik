import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useDeviations } from "@/hooks/useDeviations";
import { useEffect } from "react";

const priorityConfig = {
  low: { label: "Lav", variant: "muted" as const },
  medium: { label: "Medium", variant: "warning" as const },
  high: { label: "Høy", variant: "destructive" as const },
  critical: { label: "Kritisk", variant: "destructive" as const },
};

const statusConfig = {
  open: { label: "Åpen", color: "text-destructive" },
  "in-progress": { label: "Under arbeid", color: "text-warning" },
  resolved: { label: "Løst", color: "text-success" },
  closed: { label: "Lukket", color: "text-muted-foreground" },
};

export function RecentDeviations() {
  const navigate = useNavigate();
  const { deviations, isLoading } = useDeviations();

  // Get recent deviations (max 3, excluding resolved/closed)
  const recentDeviations = deviations
    .filter((d) => d.status !== "resolved" && d.status !== "closed")
    .slice(0, 3);

  const openCount = deviations.filter((d) => d.status === "open" || d.status === "in-progress").length;

  const handleDeviationClick = (deviationId: string) => {
    navigate(`/deviations?selected=${deviationId}`);
  };

  const handleViewAll = () => {
    navigate("/deviations");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Nylige avvik</h3>
            <p className="text-sm text-muted-foreground">
              {openCount} åpne avvik
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={handleViewAll}>
          Se alle
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Laster avvik...
          </div>
        ) : recentDeviations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Ingen åpne avvik
          </div>
        ) : (
          recentDeviations.map((deviation, index) => (
            <motion.div
              key={deviation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              onClick={() => handleDeviationClick(deviation.id)}
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {deviation.deviation_number}
                    </span>
                    <Badge variant={priorityConfig[deviation.priority as keyof typeof priorityConfig]?.variant || "muted"}>
                      {priorityConfig[deviation.priority as keyof typeof priorityConfig]?.label || deviation.priority}
                    </Badge>
                    <Badge variant="outline">{deviation.category}</Badge>
                  </div>
                  <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {deviation.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {deviation.assignee_name || "Ikke tildelt"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {deviation.due_date}
                    </span>
                  </div>
                </div>
                <span className={cn("text-xs font-medium", statusConfig[deviation.status as keyof typeof statusConfig]?.color || "text-muted-foreground")}>
                  {statusConfig[deviation.status as keyof typeof statusConfig]?.label || deviation.status}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
