import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export interface AlertDetailsSource {
  key: string;
  label: string;
  count: number | null;
  last_seen: string | null;
}

export interface AlertDetails {
  window_hours?: number;
  since?: string;
  sources?: AlertDetailsSource[];
  missing_sources?: string[];
  silent_sensors?: {
    id: string;
    name: string | null;
    provider: string | null;
    location: string | null;
    last_reading_at: string | null;
  }[];
  silent_jobs?: { job_name: string; last_run: string | null; last_status: string | null }[];
}

interface AlertDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  createdAt: string;
  details: AlertDetails | null;
}

const fmt = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("nb-NO") : "Aldri";

export function AlertDetailsDialog({
  open,
  onOpenChange,
  title,
  message,
  createdAt,
  details,
}: AlertDetailsDialogProps) {
  const sources = details?.sources ?? [];
  const silentSensors = details?.silent_sensors ?? [];
  const silentJobs = details?.silent_jobs ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {message} — registrert {fmt(createdAt)}
          </DialogDescription>
        </DialogHeader>

        {!details ? (
          <p className="text-sm text-muted-foreground">
            Ingen detaljer lagret for dette varselet. Nye varsler får full kildeoversikt.
          </p>
        ) : (
          <div className="space-y-5">
            {details.window_hours && (
              <p className="text-xs text-muted-foreground">
                Måleperiode: siste {details.window_hours} timer (fra {fmt(details.since)})
              </p>
            )}

            {sources.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Målinger per kilde</h3>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {sources.map((s) => {
                    const missing = (s.count ?? 0) === 0;
                    return (
                      <div key={s.key} className="flex items-center justify-between gap-3 p-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {missing ? (
                            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Sist registrert: {fmt(s.last_seen)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={missing ? "destructive" : "secondary"}>
                          {s.count ?? 0} målinger
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">Stille jobber</h3>
              {silentJobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Alle jobber har kjørt i perioden.</p>
              ) : (
                <ul className="space-y-1">
                  {silentJobs.map((j) => (
                    <li
                      key={j.job_name}
                      className="text-sm flex items-center justify-between gap-3 rounded-md border border-border p-2"
                    >
                      <span className="font-mono text-xs">{j.job_name}</span>
                      <span className="text-xs text-muted-foreground">
                        Sist kjørt {fmt(j.last_run)} ({j.last_status ?? "ukjent"})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Stille sensorer</h3>
              {silentSensors.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Alle aktive sensorer har levert avlesning i perioden.
                </p>
              ) : (
                <ul className="space-y-1">
                  {silentSensors.map((s) => (
                    <li
                      key={s.id}
                      className="text-sm flex items-center justify-between gap-3 rounded-md border border-border p-2"
                    >
                      <span className="min-w-0 truncate">
                        {s.name || "Uten navn"}
                        {s.location ? ` — ${s.location}` : ""}
                        {s.provider ? ` (${s.provider})` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        Sist avlesning {fmt(s.last_reading_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
