import { Button } from "@/components/ui/button";
import { HOUR_QUICK_PICKS, formatHoursNo } from "@/utils/timeCalc";
import { cn } from "@/lib/utils";

interface HourQuickPicksProps {
  value: string;
  onPick: (hours: number) => void;
  className?: string;
}

export function HourQuickPicks({ value, onPick, className }: HourQuickPicksProps) {
  const current = parseFloat(String(value ?? "").replace(",", "."));
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {HOUR_QUICK_PICKS.map((h) => {
        const active = Number.isFinite(current) && Math.abs(current - h) < 0.001;
        return (
          <Button
            key={h}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            className="h-7 px-2 text-xs"
            onClick={() => onPick(h)}
          >
            {formatHoursNo(h)} t
          </Button>
        );
      })}
    </div>
  );
}
