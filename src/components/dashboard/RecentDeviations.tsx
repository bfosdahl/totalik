import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useDeviations } from "@/hooks/useDeviations";
import { useTranslate } from "@/hooks/useTranslate";

export function RecentDeviations() {
  const navigate = useNavigate();
  const { deviations, isLoading } = useDeviations();
  const { t } = useTranslate();

  const priorityConfig: Record<string, { labelKey: string; variant: "muted" | "warning" | "destructive" }> = {
    low: { labelKey: "deviations.priorities.low", variant: "muted" },
    medium: { labelKey: "deviations.priorities.medium", variant: "warning" },
    high: { labelKey: "deviations.priorities.high", variant: "destructive" },
    critical: { labelKey: "deviations.priorities.critical", variant: "destructive" },
  };

  const statusConfig: Record<string, { labelKey: string; color: string }> = {
    open: { labelKey: "deviations.statuses.open", color: "text-destructive" },
    "in-progress": { labelKey: "common.inProgress", color: "text-warning" },
    resolved: { labelKey: "common.completed", color: "text-success" },
    closed: { labelKey: "common.closed", color: "text-muted-foreground" },
  };

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
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold">{t("dashboard.recentDeviations")}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t("dashboard.openDeviationsCount", { count: openCount })}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1 text-xs md:text-sm" onClick={handleViewAll}>
          {t("common.seeAll")}
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      </div>

      <div className="space-y-2 md:space-y-3">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t("dashboard.loadingDeviations")}
          </div>
        ) : recentDeviations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t("dashboard.noOpenDeviations")}
          </div>
        ) : (
          recentDeviations.map((deviation, index) => (
            <motion.div
              key={deviation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              onClick={() => handleDeviationClick(deviation.id)}
              className="p-3 md:p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">
                      {deviation.deviation_number}
                    </span>
                    <Badge variant={priorityConfig[deviation.priority as string]?.variant || "muted"} className="text-xs">
                      {t(priorityConfig[deviation.priority as string]?.labelKey || "deviations.priorities.low")}
                    </Badge>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">{deviation.category}</Badge>
                  </div>
                  <h4 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors truncate">
                    {deviation.title}
                  </h4>
                  <div className="flex items-center gap-2 md:gap-4 mt-1.5 md:mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{deviation.assignee_name || t("common.notAssigned")}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {deviation.due_date}
                    </span>
                  </div>
                </div>
                <span className={cn("text-xs font-medium whitespace-nowrap", statusConfig[deviation.status as string]?.color || "text-muted-foreground")}>
                  {t(statusConfig[deviation.status as string]?.labelKey || "common.open")}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}