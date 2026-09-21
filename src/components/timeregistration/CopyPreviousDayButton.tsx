import { useState } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { format, subDays, isSameDay, startOfWeek, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { t } from "@/i18n/t";

interface TimeEntry {
  id: string;
  user_id: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  source?: string;
}

interface CopyPreviousDayButtonProps {
  entries: TimeEntry[];
  userId: string;
  currentDate: Date;
  onCopy: (entry: {
    entry_date: string;
    hours: number;
    project_name?: string;
    project_id?: string;
    description?: string;
  }) => Promise<boolean>;
  className?: string;
}

export function CopyPreviousDayButton({
  entries,
  userId,
  currentDate,
  onCopy,
  className,
}: CopyPreviousDayButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const previousDay = subDays(currentDate, 1);
  
  // Find manual entries from the previous day for this user
  const previousDayEntries = entries.filter(
    (e) =>
      e.user_id === userId &&
      isSameDay(new Date(e.entry_date), previousDay) &&
      e.source !== "qr_clock" &&
      e.source !== "work_schedule"
  );

  const handleCopy = async () => {
    if (previousDayEntries.length === 0) {
      toast.error(t("auto.ingen_timer_aa_kopiere_fra_gaarsdagen"));
      return;
    }

    setIsCopying(true);
    let successCount = 0;

    for (const entry of previousDayEntries) {
      const success = await onCopy({
        entry_date: format(currentDate, "yyyy-MM-dd"),
        hours: entry.hours,
        project_name: entry.project_name || undefined,
        project_id: entry.project_id || undefined,
        description: entry.description || undefined,
      });
      
      if (success) successCount++;
    }

    setIsCopying(false);
    
    if (successCount > 0) {
      setCopied(true);
      toast.success(`Kopierte ${successCount} ${successCount === 1 ? "oppføring" : "oppføringer"} fra ${format(previousDay, "EEEE", { locale: nb })}`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t("auto.kunne_ikke_kopiere_timer"));
    }
  };

  const hasEntriesYesterday = previousDayEntries.length > 0;
  const yesterdayTotal = previousDayEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!hasEntriesYesterday || isCopying}
            className={className}
          >
            {isCopying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">{t("auto.kopier_gaarsdagens_timer")}</span>
            <span className="ml-2 sm:hidden">{t("auto.kopier")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {hasEntriesYesterday ? (
            <p>
              Kopier {previousDayEntries.length} {previousDayEntries.length === 1 ? "oppføring" : "oppføringer"} ({yesterdayTotal.toFixed(1)}t) fra {format(previousDay, "EEEE", { locale: nb })}
            </p>
          ) : (
            <p>Ingen timer registrert {format(previousDay, "EEEE", { locale: nb })}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Kopierer hele forrige uke (man–søn) over på inneværende uke,
 * dag for dag på samme ukedag.
 */
export function CopyPreviousWeekButton({
  entries,
  userId,
  currentDate,
  onCopy,
  className,
}: CopyPreviousDayButtonProps) {
  const [isCopying, setIsCopying] = useState(false);

  const thisWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const lastWeekStart = subDays(thisWeekStart, 7);

  const lastWeekEntries = entries.filter((e) => {
    if (e.user_id !== userId) return false;
    if (e.source === "qr_clock" || e.source === "work_schedule") return false;
    const d = new Date(e.entry_date);
    return d >= lastWeekStart && d < thisWeekStart;
  });

  const handleCopyWeek = async () => {
    if (lastWeekEntries.length === 0) {
      toast.error("Ingen timer å kopiere fra forrige uke");
      return;
    }
    setIsCopying(true);
    let successCount = 0;
    for (const entry of lastWeekEntries) {
      const src = new Date(entry.entry_date);
      const offset = Math.round((src.getTime() - lastWeekStart.getTime()) / 86400000);
      const target = addDays(thisWeekStart, offset);
      const ok = await onCopy({
        entry_date: format(target, "yyyy-MM-dd"),
        hours: entry.hours,
        project_name: entry.project_name || undefined,
        project_id: entry.project_id || undefined,
        description: entry.description || undefined,
      });
      if (ok) successCount++;
    }
    setIsCopying(false);
    if (successCount > 0) {
      toast.success(`Kopierte ${successCount} ${successCount === 1 ? "oppføring" : "oppføringer"} fra forrige uke`);
    } else {
      toast.error(t("auto.kunne_ikke_kopiere_timer"));
    }
  };

  const total = lastWeekEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyWeek}
            disabled={lastWeekEntries.length === 0 || isCopying}
            className={className}
          >
            {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Kopier hele forrige uke</span>
            <span className="ml-2 sm:hidden">Uke</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {lastWeekEntries.length > 0 ? (
            <p>
              Kopier {lastWeekEntries.length} oppføringer ({total.toFixed(1)}t) fra forrige uke
            </p>
          ) : (
            <p>Ingen timer registrert forrige uke</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
