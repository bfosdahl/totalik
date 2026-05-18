import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2,
  Pencil,
  Star,
  EyeOff,
  Eye,
  Trash2,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AarshjulEditDialog from "./AarshjulEditDialog";

// Map activity IDs to their corresponding routes/form types
const activityRoutes: Record<string, { route: string; formType?: string }> = {
  "annual-review": { route: "/audits", formType: "annual-hms-revision" },
  "vernerunde-q1": { route: "/audits", formType: "vernerunde" },
  "vernerunde-q2": { route: "/audits", formType: "vernerunde" },
  "vernerunde-q3": { route: "/audits", formType: "vernerunde" },
  "vernerunde-q4": { route: "/audits", formType: "vernerunde" },
  "el-kontroll": { route: "/audits", formType: "el-kontroll" },
  "brannvern": { route: "/audits", formType: "brannvern" },
  "fysiske-forhold": { route: "/audits", formType: "fysiske-arbeidsforhold" },
  "stoffkartotek": { route: "/ik-hms/stoffkartotek" },
  "risikovurdering": { route: "/setup", formType: "risk" },
  "hms-opplaering": { route: "/employees" },
  "medarbeidersamtaler": { route: "/hr/meetings" },
};

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

// Map form_type from database to activity IDs
const formTypeToActivityId: Record<string, string> = {
  "annual-hms-revision": "annual-review",
  "vernerunde": "vernerunde-q1", // Will check for Q1-Q4 based on month
  "elkontroll": "el-kontroll",
  "el-kontroll": "el-kontroll",
  "brannvern": "brannvern",
  "fysiske_forhold": "fysiske-forhold",
  "fysiske-arbeidsforhold": "fysiske-forhold",
  "daglig_drift": "daglig-drift",
  "stoffkartotek": "stoffkartotek",
  "risikovurdering": "risikovurdering",
};

interface CompletedActivity {
  form_type: string;
  completed_at: string;
  month: number;
  year: number;
}

interface CustomDbActivity {
  id: string;
  name: string;
  description: string | null;
  responsible: string | null;
  month: number;
}

const HmsAarshjul = ({ compact = false }: HmsAarshjulProps) => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);
  const [customActivities, setCustomActivities] = useState<CustomDbActivity[]>([]);
  const [hiddenDefaults, setHiddenDefaults] = useState<string[]>([]);
  const [monthOverrides, setMonthOverrides] = useState<Record<string, number[]>>({});
  const [editMonth, setEditMonth] = useState<number | null>(null);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch completed activities from database
  useEffect(() => {
    const fetchCompletedActivities = async () => {
      if (!company?.id) return;
      
      const { data, error } = await supabase
        .from("audit_form_responses")
        .select("form_type, completed_at")
        .eq("company_id", company.id)
        .eq("status", "completed")
        .not("completed_at", "is", null);
      
      if (!error && data) {
        const mapped = data.map((item) => {
          const date = new Date(item.completed_at);
          return {
            form_type: item.form_type,
            completed_at: item.completed_at,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
          };
        });
        setCompletedActivities(mapped);
      }
    };
    
    fetchCompletedActivities();
  }, [company?.id]);

  // Fetch custom activities
  const fetchCustomActivities = useCallback(async () => {
    if (!company?.id) return;
    let q = supabase
      .from("company_aarshjul_activities")
      .select("id, name, description, responsible, month")
      .eq("company_id", company.id);
    q = filterDepartmentId ? q.eq("department_id", filterDepartmentId) : q.is("department_id", null);
    const { data, error } = await q;
    if (!error && data) {
      setCustomActivities(data as CustomDbActivity[]);
    }
  }, [company?.id, filterDepartmentId]);

  useEffect(() => {
    fetchCustomActivities();
  }, [fetchCustomActivities]);

  // Fetch hidden default activities
  const fetchHiddenDefaults = useCallback(async () => {
    if (!company?.id) return;
    let q = supabase
      .from("company_aarshjul_hidden_defaults")
      .select("activity_id")
      .eq("company_id", company.id);
    q = filterDepartmentId ? q.eq("department_id", filterDepartmentId) : q.is("department_id", null);
    const { data, error } = await q;
    if (!error && data) {
      setHiddenDefaults(data.map((d: any) => d.activity_id));
    }
  }, [company?.id, filterDepartmentId]);

  useEffect(() => {
    fetchHiddenDefaults();
  }, [fetchHiddenDefaults]);

  // Fetch month overrides for default activities
  const fetchMonthOverrides = useCallback(async () => {
    if (!company?.id) return;
    let q = supabase
      .from("company_aarshjul_default_overrides")
      .select("activity_id, custom_months")
      .eq("company_id", company.id);
    q = filterDepartmentId ? q.eq("department_id", filterDepartmentId) : q.is("department_id", null);
    const { data, error } = await q;
    if (!error && data) {
      const overrides: Record<string, number[]> = {};
      data.forEach((d: any) => {
        overrides[d.activity_id] = d.custom_months;
      });
      setMonthOverrides(overrides);
    }
  }, [company?.id, filterDepartmentId]);

  useEffect(() => {
    fetchMonthOverrides();
  }, [fetchMonthOverrides]);

  // Hide a default activity
  const handleHideDefault = async (activityId: string) => {
    if (!company?.id) return;
    const { error } = await supabase
      .from("company_aarshjul_hidden_defaults")
      .insert({ company_id: company.id, department_id: filterDepartmentId, activity_id: activityId });
    if (error) {
      toast.error("Kunne ikke skjule aktiviteten");
    } else {
      toast.success("Aktivitet skjult fra årshjulet");
      setHiddenDefaults((prev) => [...prev, activityId]);
    }
  };

  // Unhide a default activity
  const handleUnhideDefault = async (activityId: string) => {
    if (!company?.id) return;
    let q = supabase
      .from("company_aarshjul_hidden_defaults")
      .delete()
      .eq("company_id", company.id)
      .eq("activity_id", activityId);
    q = filterDepartmentId ? q.eq("department_id", filterDepartmentId) : q.is("department_id", null);
    const { error } = await q;
    if (error) {
      toast.error("Kunne ikke gjenopprette aktiviteten");
    } else {
      toast.success("Aktivitet gjenopprettet i årshjulet");
      setHiddenDefaults((prev) => prev.filter((id) => id !== activityId));
    }
  };

  // Check if an activity is completed for current year
  const isActivityCompleted = (activityId: string): boolean => {
    // Find form types that match this activity
    const matchingFormTypes = Object.entries(formTypeToActivityId)
      .filter(([_, id]) => id === activityId || id.startsWith(activityId.split("-")[0]))
      .map(([formType]) => formType);
    
    return completedActivities.some(
      (ca) => matchingFormTypes.includes(ca.form_type) && ca.year === currentYear
    );
  };

  // Get completion date for an activity
  const getCompletionDate = (activityId: string): string | null => {
    const matchingFormTypes = Object.entries(formTypeToActivityId)
      .filter(([_, id]) => id === activityId || id.startsWith(activityId.split("-")[0]))
      .map(([formType]) => formType);
    
    const completed = completedActivities.find(
      (ca) => matchingFormTypes.includes(ca.form_type) && ca.year === currentYear
    );
    
    if (completed) {
      return new Date(completed.completed_at).toLocaleDateString("nb-NO");
    }
    return null;
  };

  const handleActivityClick = (activityId: string) => {
    const routeInfo = activityRoutes[activityId];
    if (routeInfo) {
      if (routeInfo.formType) {
        navigate(`${routeInfo.route}?form=${routeInfo.formType}`);
      } else {
        navigate(routeInfo.route);
      }
    }
  };

  const activitiesByMonth = useMemo(() => {
    const map: Record<number, Activity[]> = {};
    months.forEach((m) => {
      // For each default activity, check if it has custom months (override) or use original
      const defaults = defaultActivities
        .filter((a) => {
          const effectiveMonths = monthOverrides[a.id] || a.months;
          return effectiveMonths.includes(m.id);
        })
        .filter((a) => !hiddenDefaults.includes(a.id))
        .map((a) => ({
          ...a,
          months: monthOverrides[a.id] || a.months,
        }));
      const custom: Activity[] = customActivities
        .filter((c) => c.month === m.id)
        .map((c) => ({
          id: `custom-${c.id}`,
          name: c.name,
          description: c.description || "",
          icon: <Star className="w-4 h-4" />,
          color: "bg-violet-500 text-white",
          months: [c.month],
          frequency: "Egendefinert",
          responsible: c.responsible || undefined,
        }));
      map[m.id] = [...defaults, ...custom];
    });
    return map;
  }, [customActivities, hiddenDefaults, monthOverrides]);

  const currentMonthActivities = activitiesByMonth[currentMonth] || [];

  // In compact mode, return null if no activities this month
  if (compact && currentMonthActivities.length === 0) {
    return null;
  }

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
                  {currentMonthActivities.length} aktiviteter
                </Badge>
              </div>
              {currentMonthActivities.slice(0, 2).map((activity) => {
                const completed = isActivityCompleted(activity.id);
                const completionDate = getCompletionDate(activity.id);
                return (
                  <div 
                    key={activity.id} 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      completed ? "bg-success/10 border border-success/30" : "bg-muted/50 hover:bg-muted"
                    )}
                    onClick={() => handleActivityClick(activity.id)}
                  >
                    <div className={cn("p-1 rounded shrink-0", completed ? "bg-success text-success-foreground" : activity.color)}>
                      {completed ? <CheckCircle2 className="w-4 h-4" /> : activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{activity.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {completed ? `Fullført ${completionDate}` : activity.responsible}
                      </p>
                    </div>
                    {completed ? (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-success/20 text-success border-0">
                        Utført
                      </Badge>
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
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
              <div className="flex flex-col justify-center items-center">
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
                {/* Mobile: Edit button below wheel */}
                {isMobile && selectedMonth && (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-3 w-full max-w-[280px]"
                    onClick={() => setEditMonth(selectedMonth)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Rediger {months.find((m) => m.id === selectedMonth)?.fullName}
                  </Button>
                )}
                {isMobile && !selectedMonth && (
                  <p className="text-xs text-muted-foreground mt-2">Trykk på en måned for å se aktiviteter</p>
                )}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setEditMonth(displayMonth)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Rediger
                      </Button>
                    </div>
                    {displayActivities.length > 0 ? (
                      <div className="space-y-3">
                        {displayActivities.map((activity) => {
                          const completed = isActivityCompleted(activity.id);
                          const completionDate = getCompletionDate(activity.id);
                          return (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                completed ? "bg-success/10 border border-success/30" : "bg-muted/50 hover:bg-muted"
                              )}
                              onClick={() => handleActivityClick(activity.id)}
                            >
                              <div className={cn(
                                "p-2 rounded-lg shrink-0", 
                                completed ? "bg-success text-success-foreground" : activity.color
                              )}>
                                {completed ? <CheckCircle2 className="w-4 h-4" /> : activity.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">{activity.name}</h4>
                                  {completed && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-success/20 text-success border-0">
                                      Utført
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{activity.description}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.frequency}
                                  </Badge>
                                  {completed ? (
                                    <span className="text-xs text-success">
                                      Fullført {completionDate}
                                    </span>
                                  ) : activity.responsible && (
                                    <span className="text-xs text-muted-foreground">
                                      {activity.responsible}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 mt-1 opacity-100 sm:opacity-70 sm:hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Fjern fra årshjulet"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (activity.id.startsWith("custom-")) {
                                      setEditMonth(displayMonth);
                                    } else {
                                      handleHideDefault(activity.id);
                                    }
                                  }}
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                </Button>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Ingen planlagte aktiviteter denne måneden</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setEditMonth(displayMonth)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Legg til aktivitet
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Alle aktiviteter</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {defaultActivities.filter(a => !hiddenDefaults.includes(a.id)).map((activity) => {
                        const completed = isActivityCompleted(activity.id);
                        const completionDate = getCompletionDate(activity.id);
                        return (
                          <div
                            key={activity.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                              completed ? "bg-success/10 border border-success/30" : "hover:bg-muted/50"
                            )}
                            onClick={() => handleActivityClick(activity.id)}
                          >
                            <div className={cn(
                              "p-1.5 rounded shrink-0", 
                              completed ? "bg-success text-success-foreground" : activity.color
                            )}>
                              {completed ? <CheckCircle2 className="w-4 h-4" /> : activity.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{activity.name}</p>
                                {completed && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-success/20 text-success border-0">
                                    Utført
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {completed ? `Fullført ${completionDate}` : activity.frequency}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              title="Fjern fra årshjulet"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideDefault(activity.id);
                              }}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Hidden activities restore section */}
                    {hiddenDefaults.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" />
                          Skjulte aktiviteter ({hiddenDefaults.length})
                        </h4>
                        <div className="space-y-1">
                          {defaultActivities.filter(a => hiddenDefaults.includes(a.id)).map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <div className={cn("p-1.5 rounded shrink-0", activity.color)}>
                                {activity.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.name}</p>
                                <p className="text-xs text-muted-foreground">{activity.frequency}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => handleUnhideDefault(activity.id)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Gjenopprett
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
      {company?.id && editMonth && (
        <AarshjulEditDialog
          open={!!editMonth}
          onOpenChange={(open) => { if (!open) setEditMonth(null); }}
          month={editMonth}
          monthName={months.find((m) => m.id === editMonth)?.fullName || ""}
          companyId={company.id}
          departmentId={filterDepartmentId}
          monthOverrides={monthOverrides}
          hiddenDefaults={hiddenDefaults}
          onSaved={() => {
            fetchCustomActivities();
            fetchMonthOverrides();
            fetchHiddenDefaults();
          }}
        />
      )}
    </div>
  );
};

export default HmsAarshjul;
