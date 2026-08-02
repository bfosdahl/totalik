import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JobRun {
  job_name: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
  items_processed: number | null;
  notifications_sent: number | null;
  error_count: number | null;
  error_message: string | null;
}

/** Expected max hours between successful runs — mirrors monitor-job-health */
const MAX_SILENT_HOURS: Record<string, number> = {
  "check-deviation-deadlines": 26,
  "check-ks2-deadlines": 26,
  "check-hms-card-expiry": 26,
  "check-course-expiry": 26,
  "check-alerts": 3,
  "ik-mat-sensor-watchdog": 2,
  "monitor-job-health": 3,
};

const JOB_LABELS: Record<string, string> = {
  "check-deviation-deadlines": "Avviksfrister",
  "check-ks2-deadlines": "KS Bygg-frister",
  "check-hms-card-expiry": "HMS-kort utløp",
  "check-course-expiry": "Kurs utløp",
  "check-alerts": "Systemalarmer",
  "ik-mat-sensor-watchdog": "IK Mat sensorvakt",
  "monitor-job-health": "Jobbvakt",
};

export function JobHealthTable() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["job-run-health"],
    queryFn: async (): Promise<JobRun[]> => {
      const { data, error } = await supabase
        .from("job_run_log")
        .select(
          "job_name, status, created_at, duration_ms, items_processed, notifications_sent, error_count, error_message",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as JobRun[];
    },
    refetchInterval: 60_000,
  });

  const jobNames = Object.keys(MAX_SILENT_HOURS);
  const rows = jobNames.map((name) => {
    const jobRuns = runs.filter((r) => r.job_name === name);
    const last = jobRuns[0];
    const lastSuccess = jobRuns.find((r) => r.status === "success");
    const hoursSince = lastSuccess
      ? (Date.now() - new Date(lastSuccess.created_at).getTime()) / 3_600_000
      : null;
    const silent = hoursSince === null || hoursSince > MAX_SILENT_HOURS[name];
    const failed = last?.status === "error";
    return { name, last, hoursSince, silent, failed };
  });

  const problems = rows.filter((r) => r.silent || r.failed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Jobbhelse (bakgrunnsjobber)</h2>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-md ${
            problems > 0
              ? "bg-destructive/10 text-destructive"
              : "bg-success/10 text-success"
          }`}
        >
          {problems > 0 ? `${problems} problem(er)` : "Alt OK"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Jobb</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Siste kjøring</th>
                <th className="py-2 pr-3 font-medium">Varsler</th>
                <th className="py-2 pr-3 font-medium">Varighet</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <span className="font-medium">
                      {JOB_LABELS[row.name] ?? row.name}
                    </span>
                    <div className="text-xs text-muted-foreground">{row.name}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {row.failed ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <XCircle className="w-3.5 h-3.5" /> Feilet
                      </span>
                    ) : row.silent ? (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <Clock className="w-3.5 h-3.5" /> Stille
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OK
                      </span>
                    )}
                    {row.last?.error_message && (
                      <div className="text-xs text-muted-foreground max-w-[280px] truncate">
                        {row.last.error_message}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {row.last
                      ? new Date(row.last.created_at).toLocaleString("nb-NO")
                      : "Aldri kjørt"}
                    {row.hoursSince !== null && (
                      <div className="text-xs text-muted-foreground">
                        {Math.round(row.hoursSince * 10) / 10} t siden suksess
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">{row.last?.notifications_sent ?? 0}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {row.last?.duration_ms != null
                      ? `${Math.round(row.last.duration_ms)} ms`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
