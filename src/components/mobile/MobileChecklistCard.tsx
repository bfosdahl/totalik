import React from "react";
import { Check, X, Minus, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MobileChecklistCardProps {
  title: string;
  progress?: number;
  status?: "not_started" | "in_progress" | "completed";
  itemCount?: number;
  completedCount?: number;
  hasPhotos?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MobileChecklistCard({
  title,
  progress = 0,
  status = "not_started",
  itemCount = 0,
  completedCount = 0,
  hasPhotos = false,
  onClick,
  className,
}: MobileChecklistCardProps) {
  const statusConfig = {
    not_started: {
      label: "Ikke startet",
      color: "bg-muted text-muted-foreground",
      icon: null,
    },
    in_progress: {
      label: "Pågår",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      icon: null,
    },
    completed: {
      label: "Fullført",
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: <Check className="h-3.5 w-3.5" />,
    },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "haptic-card w-full text-left p-4 rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight truncate pr-2">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className={cn("text-xs", config.color)}>
              {config.icon}
              {config.label}
            </Badge>
            
            {hasPhotos && (
              <span className="text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          {/* Progress indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  status === "completed" ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedCount}/{itemCount}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}
