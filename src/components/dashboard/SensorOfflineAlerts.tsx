import { motion } from "framer-motion";
import { WifiOff, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SensorRow {
  id: string;
  name: string | null;
  external_id: string;
  location: string | null;
  is_active: boolean;
  last_reading_at: string | null;
  offline_after_minutes: number | null;
}

function minutesSince(iso: string | null) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function formatAge(minutes: number | null) {
  if (minutes === null) return "aldri";
  if (minutes < 60) return `${minutes} min siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} t siden`;
  return `${Math.floor(hours / 24)} d siden`;
}

/** Varsler på dashbordet når IK MAT-sensorer ikke har sendt data innen sitt valgte tidsintervall. */
export function SensorOfflineAlerts() {
  const { company } = useAuth();
  const { modules } = useCompanyModules();
  const navigate = useNavigate();

  const hasIkMat = modules.some((m) => m.module_type === "IK_MAT" && m.is_active);

  const { data: sensors = [] } = useQuery({
    queryKey: ["dashboard-sensor-offline", company?.id],
    queryFn: async () => {
      if (!company?.id) return [] as SensorRow[];
      const { data, error } = await supabase
        .from("ik_mat_sensors")
        .select("id,name,external_id,location,is_active,last_reading_at,offline_after_minutes")
        .eq("company_id", company.id)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as SensorRow[];
    },
    enabled: !!company?.id && hasIkMat,
    refetchInterval: 60_000,
  });

  if (!hasIkMat || sensors.length === 0) return null;

  const offline = sensors
    .map((s) => {
      const age = minutesSince(s.last_reading_at);
      const limit = s.offline_after_minutes || 120;
      return { ...s, age, limit, isOffline: age === null || age > limit };
    })
    .filter((s) => s.isOffline)
    .sort((a, b) => (b.age ?? Number.MAX_SAFE_INTEGER) - (a.age ?? Number.MAX_SAFE_INTEGER));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`p-1.5 md:p-2 rounded-lg ${offline.length ? "bg-destructive/10" : "bg-primary/10"}`}>
            {offline.length ? (
              <WifiOff className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
            ) : (
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            )}
          </div>
          <h3 className="text-base md:text-lg font-semibold">Sensorstatus</h3>
        </div>
        {offline.length > 0 && <Badge variant="destructive">{offline.length}</Badge>}
      </div>

      {offline.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Alle {sensors.length} sensorer sender data innenfor valgt tidsintervall.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Disse sensorene har ikke sendt data innen grensen som er satt:
          </p>
          <ul className="space-y-2 mb-4">
            {offline.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{s.name || s.external_id}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {s.location ? `${s.location} · ` : ""}grense {s.limit} min
                  </p>
                </div>
                <span className="text-xs text-destructive whitespace-nowrap">{formatAge(s.age)}</span>
              </li>
            ))}
          </ul>
          {offline.length > 5 && (
            <p className="text-xs text-muted-foreground mb-3">+ {offline.length - 5} flere</p>
          )}
        </>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/n/sensorer")}>
        Åpne sensoroversikt
      </Button>
    </motion.div>
  );
}
