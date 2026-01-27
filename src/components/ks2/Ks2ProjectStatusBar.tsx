import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { cn } from "@/lib/utils";

interface Ks2ProjectStatusBarProps {
  className?: string;
}

export function Ks2ProjectStatusBar({ className }: Ks2ProjectStatusBarProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { stats, isLoading: loadingChecklists } = useKsModule2Checklists(projectId || "");
  const { avvikList: avvik, isLoading: loadingAvvik } = useKsModule2Avvik(projectId || "");

  const statusData = useMemo(() => {
    const openAvvik = avvik.filter(a => a.status === "open" || a.status === "in_progress").length;
    const overdueChecklists = stats.overdue || 0;
    
    return {
      progressPercent: stats.progressPercent || 0,
      completed: stats.completed || 0,
      total: stats.total || 0,
      openAvvik,
      overdueChecklists,
    };
  }, [stats, avvik]);

  if (loadingChecklists || loadingAvvik) {
    return null;
  }

  // Don't show if no data
  if (statusData.total === 0 && statusData.openAvvik === 0) {
    return null;
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 50) return "bg-blue-500";
    if (percent >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={cn(
      "bg-card border-b px-3 md:px-4 py-2 overflow-x-auto",
      className
    )}>
      <div className="flex items-center gap-3 md:gap-4 text-sm min-w-max">
        {/* Progress */}
        <div className="flex items-center gap-2 md:gap-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="w-24 md:w-40">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-muted-foreground hidden md:inline">Fremdrift</span>
              <span className="text-xs font-medium">{statusData.progressPercent}%</span>
            </div>
            <Progress 
              value={statusData.progressPercent} 
              className="h-1.5"
            />
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/ks/project/${projectId}/egenkontroller`)}
            className="flex items-center gap-1 md:gap-1.5 px-2 py-1 rounded-md bg-green-500/10 hover:bg-green-500/20 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {statusData.completed}/{statusData.total}
            </span>
          </button>

          {statusData.overdueChecklists > 0 && (
            <button
              onClick={() => navigate(`/ks/project/${projectId}/egenkontroller`)}
              className="flex items-center gap-1 md:gap-1.5 px-2 py-1 rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                {statusData.overdueChecklists} forfalt
              </span>
            </button>
          )}

          {statusData.openAvvik > 0 && (
            <button
              onClick={() => navigate(`/ks/project/${projectId}/avvik`)}
              className="flex items-center gap-1 md:gap-1.5 px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                {statusData.openAvvik} avvik
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
