import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  AlertTriangle,
  Mail,
  UserPlus,
  Activity,
  RefreshCw,
  Bell,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { JobHealthTable } from "@/components/admin/JobHealthTable";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface MonitoringStats {
  activeCompanies: number;
  totalCompanies: number;
  activeUsers: number;
  totalUsers: number;
  errors24h: number;
  errors7d: number;
  totalEmails: number;
  deliveredEmails: number;
  bouncedEmails: number;
  bounceRate: number;
  provisioningCount: number;
  provisioningSuccess: number;
  errorTrend: { date: string; count: number }[];
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  metric_value: number | null;
  threshold_value: number | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  details: AlertDetails | null;
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { icon: ShieldAlert, color: "text-warning", bg: "bg-warning/10" },
};

export default function AdminMonitoring() {
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);

  const {
    data: stats,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: async (): Promise<MonitoringStats> => {
      const { data, error } = await supabase.functions.invoke("monitoring-stats");
      if (error) throw error;
      return data as MonitoringStats;
    },
    refetchInterval: 60_000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["system-alerts", showResolved],
    queryFn: async (): Promise<SystemAlert[]> => {
      let query = supabase
        .from("system_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!showResolved) {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SystemAlert[];
    },
    refetchInterval: 30_000,
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("system_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
      toast.success("Alert markert som løst");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere alert");
    },
  });

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("nb-NO")
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
            <p className="text-muted-foreground">
              Produksjonsovervåking — nøkkeltall i sanntid
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Sist oppdatert: {lastUpdated}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Oppdater
            </Button>
          </div>
        </motion.div>

        {/* Active alerts banner */}
        <AnimatePresence>
          {activeAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-destructive" />
                <h2 className="font-semibold text-destructive">
                  {activeAlerts.length} aktiv{activeAlerts.length !== 1 ? "e" : ""} alert{activeAlerts.length !== 1 ? "s" : ""}
                </h2>
              </div>
              <div className="space-y-2">
                {activeAlerts.map((alert) => {
                  const config = severityConfig[alert.severity] || severityConfig.warning;
                  const IconComponent = config.icon;
                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <IconComponent className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {new Date(alert.created_at).toLocaleString("nb-NO")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert.mutate(alert.id)}
                        className="flex-shrink-0 gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Løs
                      </Button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Aktive bedrifter"
            value={isLoading ? "..." : stats?.activeCompanies ?? 0}
            description={`${stats?.totalCompanies ?? 0} totalt`}
            icon={Building2}
            variant="default"
            delay={0}
          />
          <StatsCard
            title="Aktive brukere"
            value={isLoading ? "..." : stats?.activeUsers ?? 0}
            description={`${stats?.totalUsers ?? 0} totalt`}
            icon={Users}
            variant="default"
            delay={0.05}
          />
          <StatsCard
            title="Feil siste 24t"
            value={isLoading ? "..." : stats?.errors24h ?? 0}
            description={`${stats?.errors7d ?? 0} siste 7 dager`}
            icon={AlertTriangle}
            variant={
              (stats?.errors24h ?? 0) > 10
                ? "destructive"
                : (stats?.errors24h ?? 0) > 0
                ? "warning"
                : "success"
            }
            delay={0.1}
          />
          <StatsCard
            title="E-post bounce-rate"
            value={isLoading ? "..." : `${stats?.bounceRate ?? 0}%`}
            description={`${stats?.bouncedEmails ?? 0} av ${stats?.totalEmails ?? 0}`}
            icon={Mail}
            variant={(stats?.bounceRate ?? 0) > 5 ? "destructive" : "success"}
            delay={0.15}
          />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="E-post levert"
            value={isLoading ? "..." : stats?.deliveredEmails ?? 0}
            description="Totalt levert"
            icon={Mail}
            variant="success"
            delay={0.2}
          />
          <StatsCard
            title="Nye brukere (7d)"
            value={isLoading ? "..." : stats?.provisioningCount ?? 0}
            description={`${stats?.provisioningSuccess ?? 0} fullført`}
            icon={UserPlus}
            variant="info"
            delay={0.25}
          />
          <StatsCard
            title="Systemstatus"
            value={isLoading ? "..." : "OK"}
            description="Alle tjenester operative"
            icon={Activity}
            variant="success"
            delay={0.3}
          />
        </div>

        {/* Error trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h2 className="font-semibold mb-4">Klientfeil siste 7 dager</h2>
          {isLoading ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Laster...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats?.errorTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val);
                    return `${d.getDate()}.${d.getMonth() + 1}`;
                  }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  labelFormatter={(val: string) => {
                    const d = new Date(val);
                    return d.toLocaleDateString("nb-NO");
                  }}
                  formatter={(value: number) => [value, "Feil"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Job health */}
        <JobHealthTable />

        {/* Alert history */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Alert-historikk</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
              className="text-xs"
            >
              {showResolved ? "Skjul løste" : "Vis løste"}
            </Button>
          </div>
          {alertsLoading ? (
            <p className="text-sm text-muted-foreground">Laster...</p>
          ) : alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Ingen aktive alerts
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity] || severityConfig.warning;
                const IconComponent = config.icon;
                const isResolved = alert.status === "resolved";
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                      isResolved ? "border-border/50 opacity-60" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isResolved ? "bg-muted" : config.bg}`}>
                        {isResolved ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <IconComponent className={`w-4 h-4 ${config.color}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString("nb-NO")}
                      </p>
                      {isResolved && alert.resolved_at && (
                        <p className="text-xs text-success">
                          Løst {new Date(alert.resolved_at).toLocaleString("nb-NO")}
                        </p>
                      )}
                      {!isResolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveAlert.mutate(alert.id)}
                          className="h-6 text-xs mt-1"
                        >
                          Løs
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
