import { motion } from "framer-motion";
import {
  Building2,
  Users,
  AlertTriangle,
  Mail,
  UserPlus,
  Activity,
  RefreshCw,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
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

export default function AdminMonitoring() {
  const {
    data: stats,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: async (): Promise<MonitoringStats> => {
      const { data, error } = await supabase.functions.invoke(
        "monitoring-stats"
      );
      if (error) throw error;
      return data as MonitoringStats;
    },
    refetchInterval: 60_000,
  });

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
            variant={
              (stats?.bounceRate ?? 0) > 5 ? "destructive" : "success"
            }
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
      </div>
    </AdminLayout>
  );
}
