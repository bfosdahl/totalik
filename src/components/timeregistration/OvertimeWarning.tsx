import { AlertTriangle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OvertimeWarningProps {
  weeklyHours: number;
  weeklyLimit?: number;
  dailyHours?: number;
  dailyLimit?: number;
  className?: string;
}

export function OvertimeWarning({
  weeklyHours,
  weeklyLimit = 40,
  dailyHours,
  dailyLimit = 9,
  className,
}: OvertimeWarningProps) {
  const weeklyPercentage = Math.min((weeklyHours / weeklyLimit) * 100, 100);
  const dailyPercentage = dailyHours ? Math.min((dailyHours / dailyLimit) * 100, 100) : 0;
  
  const isWeeklyWarning = weeklyHours >= weeklyLimit * 0.9;
  const isWeeklyOvertime = weeklyHours > weeklyLimit;
  const isDailyWarning = dailyHours && dailyHours >= dailyLimit * 0.9;
  const isDailyOvertime = dailyHours && dailyHours > dailyLimit;
  
  const overtimeHours = Math.max(0, weeklyHours - weeklyLimit);
  const showWarning = isWeeklyWarning || isDailyWarning;

  if (!showWarning && !isWeeklyOvertime && !isDailyOvertime) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Ukentlige timer</span>
          <span className="font-medium">{weeklyHours.toFixed(1)} / {weeklyLimit}t</span>
        </div>
        <Progress value={weeklyPercentage} className="h-2" />
      </div>
    );
  }

  return (
    <Alert 
      variant={isWeeklyOvertime || isDailyOvertime ? "destructive" : "default"}
      className={cn(
        className,
        (isWeeklyOvertime || isDailyOvertime) && "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400 [&>svg]:text-orange-500"
      )}
    >
      {isWeeklyOvertime || isDailyOvertime ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle className="text-sm font-medium">
        {isWeeklyOvertime 
          ? `Overtid: +${overtimeHours.toFixed(1)} timer denne uken`
          : isDailyOvertime
            ? `Overtid i dag: +${((dailyHours || 0) - dailyLimit).toFixed(1)} timer`
            : "Nærmer deg overtidsgrense"}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Uke: {weeklyHours.toFixed(1)} / {weeklyLimit}t</span>
            <span>{weeklyPercentage.toFixed(0)}%</span>
          </div>
          <Progress 
            value={weeklyPercentage} 
            className={cn(
              "h-2",
              isWeeklyOvertime && "[&>div]:bg-orange-500"
            )} 
          />
        </div>
        {dailyHours !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Dag: {dailyHours.toFixed(1)} / {dailyLimit}t</span>
              <span>{dailyPercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={dailyPercentage} 
              className={cn(
                "h-2",
                isDailyOvertime && "[&>div]:bg-orange-500"
              )} 
            />
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
