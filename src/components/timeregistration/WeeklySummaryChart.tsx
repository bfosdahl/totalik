import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TimeEntry {
  id: string;
  user_id: string;
  entry_date: string;
  hours: number;
  status: string;
}

interface WeeklySummaryChartProps {
  entries: TimeEntry[];
  userId: string;
  weekStart?: Date;
  dailyTarget?: number;
  className?: string;
}

export function WeeklySummaryChart({
  entries,
  userId,
  weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }),
  dailyTarget = 7.5,
  className,
}: WeeklySummaryChartProps) {
  const chartData = useMemo(() => {
    const userEntries = entries.filter(e => e.user_id === userId);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayEntries = userEntries.filter(e => isSameDay(new Date(e.entry_date), date));
      const hours = dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);
      const isToday = isSameDay(date, new Date());
      const isWeekend = i >= 5;
      
      return {
        day: format(date, "EEE", { locale: nb }),
        fullDate: format(date, "d. MMM", { locale: nb }),
        hours: Math.round(hours * 10) / 10,
        target: isWeekend ? 0 : dailyTarget,
        isToday,
        isWeekend,
        status: hours >= dailyTarget ? "complete" : hours > 0 ? "partial" : "empty",
      };
    });
  }, [entries, userId, weekStart, dailyTarget]);

  const weekTotal = chartData.reduce((sum, d) => sum + d.hours, 0);
  const weekTarget = dailyTarget * 5;
  const weekPercentage = Math.round((weekTotal / weekTarget) * 100);

  const getBarColor = (entry: typeof chartData[0]) => {
    if (entry.hours === 0) return "hsl(var(--muted))";
    if (entry.hours >= entry.target) return "hsl(var(--primary))";
    return "hsl(var(--chart-3))";
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Ukeoversikt</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold">{weekTotal.toFixed(1)}t</p>
            <p className="text-xs text-muted-foreground">
              av {weekTarget}t ({weekPercentage}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[120px] sm:h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                      <p className="font-medium">{data.fullDate}</p>
                      <p className="text-muted-foreground">{data.hours}t registrert</p>
                      {!data.isWeekend && (
                        <p className="text-xs text-muted-foreground">Mål: {data.target}t</p>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine 
                y={dailyTarget} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={getBarColor(entry)}
                    className={cn(entry.isToday && "stroke-2 stroke-primary")}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Mål nådd</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
            <span>Delvis</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Ingen timer</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
