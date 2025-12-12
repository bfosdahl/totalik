import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ClipboardCheck,
  Zap,
  Building2,
  Shield,
  Users,
  AlertTriangle,
  FileCheck,
  Flame,
  FlaskConical,
  BookOpen,
  ChevronRight,
  Check,
} from "lucide-react";

interface Activity {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  months: number[]; // 1-12
  frequency: string;
  responsible?: string;
}

const defaultActivities: Activity[] = [
  {
    id: "annual-review",
    name: "Årlig HMS-revisjon",
    description: "Gjennomgang av hele HMS-systemet",
    icon: <ClipboardCheck className="w-4 h-4" />,
    color: "bg-primary text-primary-foreground",
    months: [1],
    frequency: "Årlig (januar)",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "vernerunde-q1",
    name: "Vernerunde Q1",
    description: "Kvartalsvis vernerunde",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-emerald-500 text-white",
    months: [3],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "vernerunde-q2",
    name: "Vernerunde Q2",
    description: "Kvartalsvis vernerunde",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-emerald-500 text-white",
    months: [6],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "vernerunde-q3",
    name: "Vernerunde Q3",
    description: "Kvartalsvis vernerunde",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-emerald-500 text-white",
    months: [9],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "vernerunde-q4",
    name: "Vernerunde Q4",
    description: "Kvartalsvis vernerunde",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-emerald-500 text-white",
    months: [12],
    frequency: "Kvartalsvis",
    responsible: "Verneombud",
  },
  {
    id: "el-kontroll",
    name: "El-kontroll",
    description: "Elektrisk sikkerhetskontroll",
    icon: <Zap className="w-4 h-4" />,
    color: "bg-warning text-warning-foreground",
    months: [5],
    frequency: "Årlig",
    responsible: "Driftsleder",
  },
  {
    id: "brannvern",
    name: "Brannvernøvelse",
    description: "Evakueringsøvelse og brannslukking",
    icon: <Flame className="w-4 h-4" />,
    color: "bg-destructive text-destructive-foreground",
    months: [4, 10],
    frequency: "Halvårlig",
    responsible: "Brannvernleder",
  },
  {
    id: "fysiske-forhold",
    name: "Fysiske arbeidsforhold",
    description: "Gjennomgang av lokaler og utstyr",
    icon: <Building2 className="w-4 h-4" />,
    color: "bg-info text-info-foreground",
    months: [2],
    frequency: "Årlig",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "stoffkartotek",
    name: "Stoffkartotek-gjennomgang",
    description: "Oppdatering av kjemikalieregister",
    icon: <FlaskConical className="w-4 h-4" />,
    color: "bg-purple-500 text-white",
    months: [8],
    frequency: "Årlig",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "risikovurdering",
    name: "Risikovurdering",
    description: "Revisjon av risikovurderinger",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "bg-orange-500 text-white",
    months: [11],
    frequency: "Årlig",
    responsible: "HMS-ansvarlig",
  },
  {
    id: "hms-opplaering",
    name: "HMS-opplæring",
    description: "Opplæring av ansatte i HMS",
    icon: <BookOpen className="w-4 h-4" />,
    color: "bg-cyan-500 text-white",
    months: [1, 7],
    frequency: "Halvårlig",
    responsible: "Daglig leder",
  },
  {
    id: "medarbeidersamtaler",
    name: "Medarbeidersamtaler",
    description: "Årlige utviklingssamtaler",
    icon: <Users className="w-4 h-4" />,
    color: "bg-pink-500 text-white",
    months: [3, 9],
    frequency: "Halvårlig",
    responsible: "Avdelingsleder",
  },
];

const months = [
  { id: 1, name: "Jan", fullName: "Januar" },
  { id: 2, name: "Feb", fullName: "Februar" },
  { id: 3, name: "Mar", fullName: "Mars" },
  { id: 4, name: "Apr", fullName: "April" },
  { id: 5, name: "Mai", fullName: "Mai" },
  { id: 6, name: "Jun", fullName: "Juni" },
  { id: 7, name: "Jul", fullName: "Juli" },
  { id: 8, name: "Aug", fullName: "August" },
  { id: 9, name: "Sep", fullName: "September" },
  { id: 10, name: "Okt", fullName: "Oktober" },
  { id: 11, name: "Nov", fullName: "November" },
  { id: 12, name: "Des", fullName: "Desember" },
];

interface HmsAarshjulProps {
  compact?: boolean;
}

const HmsAarshjul = ({ compact = false }: HmsAarshjulProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const currentMonth = new Date().getMonth() + 1;

  const activitiesByMonth = useMemo(() => {
    const map: Record<number, Activity[]> = {};
    months.forEach((m) => {
      map[m.id] = defaultActivities.filter((a) => a.months.includes(m.id));
    });
    return map;
  }, []);

  const displayMonth = selectedMonth || hoveredMonth;
  const displayActivities = displayMonth ? activitiesByMonth[displayMonth] : [];

  // SVG dimensions - smaller for compact mode
  const size = compact ? 220 : 340;
  const center = size / 2;
  const outerRadius = compact ? 95 : 150;
  const innerRadius = compact ? 45 : 70;
  const labelRadius = (outerRadius + innerRadius) / 2;

  // Compact view for dashboard
  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base">HMS Årshjul</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center">
            {/* Mini wheel */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mb-3">
              <circle
                cx={center}
                cy={center}
                r={outerRadius}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <circle
                cx={center}
                cy={center}
                r={innerRadius}
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />

              {months.map((month, index) => {
                const startAngle = (index * 30 - 90) * (Math.PI / 180);
                const endAngle = ((index + 1) * 30 - 90) * (Math.PI / 180);
                const midAngle = ((index + 0.5) * 30 - 90) * (Math.PI / 180);

                const x1Outer = center + outerRadius * Math.cos(startAngle);
                const y1Outer = center + outerRadius * Math.sin(startAngle);
                const x2Outer = center + outerRadius * Math.cos(endAngle);
                const y2Outer = center + outerRadius * Math.sin(endAngle);
                const x1Inner = center + innerRadius * Math.cos(startAngle);
                const y1Inner = center + innerRadius * Math.sin(startAngle);
                const x2Inner = center + innerRadius * Math.cos(endAngle);
                const y2Inner = center + innerRadius * Math.sin(endAngle);

                const labelX = center + labelRadius * Math.cos(midAngle);
                const labelY = center + labelRadius * Math.sin(midAngle);

                const isCurrentMonth = month.id === currentMonth;
                const hasActivities = activitiesByMonth[month.id].length > 0;

                const path = `
                  M ${x1Inner} ${y1Inner}
                  L ${x1Outer} ${y1Outer}
                  A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer}
                  L ${x2Inner} ${y2Inner}
                  A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner}
                `;

                return (
                  <g key={month.id}>
                    <path
                      d={path}
                      fill={
                        isCurrentMonth
                          ? "hsl(var(--primary) / 0.2)"
                          : hasActivities
                          ? "hsl(var(--muted))"
                          : "hsl(var(--card))"
                      }
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-medium fill-foreground pointer-events-none select-none"
                    >
                      {month.name}
                    </text>
                    {hasActivities && (
                      <circle
                        cx={center + (outerRadius - 8) * Math.cos(midAngle)}
                        cy={center + (outerRadius - 8) * Math.sin(midAngle)}
                        r={3}
                        fill="hsl(var(--primary))"
                      />
                    )}
                  </g>
                );
              })}

              <text
                x={center}
                y={center - 5}
                textAnchor="middle"
                className="text-xs font-bold fill-foreground"
              >
                {new Date().getFullYear()}
              </text>
              <text
                x={center}
                y={center + 10}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
              >
                HMS
              </text>
            </svg>

            {/* Current month activities */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {months.find(m => m.id === currentMonth)?.fullName}
                </p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {activitiesByMonth[currentMonth]?.length || 0} aktiviteter
                </Badge>
              </div>
              {activitiesByMonth[currentMonth]?.slice(0, 2).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className={cn("p-1 rounded shrink-0", activity.color)}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{activity.name}</p>
                    <p className="text-[10px] text-muted-foreground">{activity.responsible}</p>
                  </div>
                </div>
              ))}
              {(!activitiesByMonth[currentMonth] || activitiesByMonth[currentMonth].length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Ingen aktiviteter denne måneden
                </p>
              )}
            </div>

            <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" asChild>
              <a href="/audits">
                Se alle aktiviteter
                <ChevronRight className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>HMS Årshjul</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Planlagte HMS-aktiviteter gjennom året
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Circular Wheel */}
              <div className="flex justify-center items-center">
                <div className="relative">
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background circle */}
                    <circle
                      cx={center}
                      cy={center}
                      r={outerRadius}
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                    />
                    <circle
                      cx={center}
                      cy={center}
                      r={innerRadius}
                      fill="hsl(var(--card))"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                    />

                    {/* Month segments */}
                    {months.map((month, index) => {
                      const startAngle = (index * 30 - 90) * (Math.PI / 180);
                      const endAngle = ((index + 1) * 30 - 90) * (Math.PI / 180);
                      const midAngle = ((index + 0.5) * 30 - 90) * (Math.PI / 180);

                      const x1Outer = center + outerRadius * Math.cos(startAngle);
                      const y1Outer = center + outerRadius * Math.sin(startAngle);
                      const x2Outer = center + outerRadius * Math.cos(endAngle);
                      const y2Outer = center + outerRadius * Math.sin(endAngle);
                      const x1Inner = center + innerRadius * Math.cos(startAngle);
                      const y1Inner = center + innerRadius * Math.sin(startAngle);
                      const x2Inner = center + innerRadius * Math.cos(endAngle);
                      const y2Inner = center + innerRadius * Math.sin(endAngle);

                      const labelX = center + labelRadius * Math.cos(midAngle);
                      const labelY = center + labelRadius * Math.sin(midAngle);

                      const isCurrentMonth = month.id === currentMonth;
                      const isSelected = month.id === selectedMonth;
                      const isHovered = month.id === hoveredMonth;
                      const hasActivities = activitiesByMonth[month.id].length > 0;

                      const path = `
                        M ${x1Inner} ${y1Inner}
                        L ${x1Outer} ${y1Outer}
                        A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer}
                        L ${x2Inner} ${y2Inner}
                        A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner}
                      `;

                      return (
                        <g key={month.id}>
                          <motion.path
                            d={path}
                            fill={
                              isSelected
                                ? "hsl(var(--primary))"
                                : isHovered
                                ? "hsl(var(--primary) / 0.3)"
                                : isCurrentMonth
                                ? "hsl(var(--primary) / 0.15)"
                                : hasActivities
                                ? "hsl(var(--muted))"
                                : "hsl(var(--card))"
                            }
                            stroke="hsl(var(--border))"
                            strokeWidth="1"
                            className="cursor-pointer transition-colors"
                            onClick={() => setSelectedMonth(month.id === selectedMonth ? null : month.id)}
                            onMouseEnter={() => setHoveredMonth(month.id)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            whileHover={{ scale: 1.02 }}
                            style={{ transformOrigin: `${center}px ${center}px` }}
                          />
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={cn(
                              "text-xs font-medium pointer-events-none select-none",
                              isSelected ? "fill-primary-foreground" : "fill-foreground"
                            )}
                          >
                            {month.name}
                          </text>
                          {/* Activity indicator dots */}
                          {hasActivities && !isSelected && (
                            <circle
                              cx={center + (outerRadius - 12) * Math.cos(midAngle)}
                              cy={center + (outerRadius - 12) * Math.sin(midAngle)}
                              r={4}
                              fill="hsl(var(--primary))"
                              className="pointer-events-none"
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Center text */}
                    <text
                      x={center}
                      y={center - 8}
                      textAnchor="middle"
                      className="text-sm font-bold fill-foreground"
                    >
                      {new Date().getFullYear()}
                    </text>
                    <text
                      x={center}
                      y={center + 12}
                      textAnchor="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      HMS Plan
                    </text>
                  </svg>
                </div>
              </div>

              {/* Month details / Activity list */}
              <div className="space-y-4">
                {displayMonth ? (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {months.find((m) => m.id === displayMonth)?.fullName}
                      </h3>
                      <Badge variant="outline">{displayActivities.length} aktiviteter</Badge>
                    </div>
                    {displayActivities.length > 0 ? (
                      <div className="space-y-3">
                        {displayActivities.map((activity) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <div className={cn("p-2 rounded-lg shrink-0", activity.color)}>
                              {activity.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{activity.name}</h4>
                              <p className="text-xs text-muted-foreground">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {activity.frequency}
                                </Badge>
                                {activity.responsible && (
                                  <span className="text-xs text-muted-foreground">
                                    {activity.responsible}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Ingen planlagte aktiviteter denne måneden</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Alle aktiviteter</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {defaultActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                          onClick={() => setSelectedMonth(activity.months[0])}
                        >
                          <div className={cn("p-1.5 rounded shrink-0", activity.color)}>
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">{activity.frequency}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick legend */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Aktivitetstyper</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { color: "bg-primary", label: "HMS-revisjon" },
              { color: "bg-emerald-500", label: "Vernerunder" },
              { color: "bg-warning", label: "El-kontroll" },
              { color: "bg-destructive", label: "Brannvern" },
              { color: "bg-info", label: "Fysiske forhold" },
              { color: "bg-purple-500", label: "Stoffkartotek" },
              { color: "bg-orange-500", label: "Risikovurdering" },
              { color: "bg-cyan-500", label: "Opplæring" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", item.color)} />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HmsAarshjul;
