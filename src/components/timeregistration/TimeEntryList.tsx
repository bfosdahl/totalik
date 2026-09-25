import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Check, X, Clock, Trash2, QrCode, CalendarCheck, MapPin, Pencil, PencilLine, Package } from "lucide-react";
import { EditTimeEntryDialog } from "./EditTimeEntryDialog";
import { SmartTimeCheck } from "./SmartTimeCheck";
import { getHourBreakdown } from "@/utils/hourBreakdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/i18n/t";

interface TimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  status: "draft" | "submitted" | "approved" | "rejected" | "pending_confirmation";
  approved_by_name: string | null;
  approved_at: string | null;
  source?: "manual" | "qr_clock" | "work_schedule";
  clock_in?: string | null;
  clock_out?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_break_minutes?: number | null;
  work_schedule_id?: string | null;
  geofence_status_in?: string | null;
  geofence_status_out?: string | null;
  geofence_distance_in_m?: number | null;
  geofence_distance_out_m?: number | null;
  geofence_reason?: string | null;
  schedule_location?: string | null;
  schedule_role?: string | null;
  hour_type?: string | null;
  overtime_segments?: any;
  materials?: Array<{ id: string; name: string; unit: string; quantity: number }>;
}


interface TimeEntryListProps {
  entries: TimeEntry[];
  onApprove?: (id: string) => Promise<boolean>;
  onReject?: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onEdit?: (id: string, updates: { hours: number; description?: string }) => Promise<boolean>;
  onConfirmSchedule?: (id: string, hours?: number) => Promise<boolean>;
  showEmployee?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive"; className?: string }> = {
  draft: { label: t("auto.utkast"), variant: "secondary" },
  submitted: { label: t("auto.innsendt"), variant: "default" },
  approved: { label: t("auto.godkjent"), variant: "default", className: "bg-green-500 hover:bg-green-600" },
  rejected: { label: t("auto.avvist"), variant: "destructive" },
  pending_confirmation: { label: t("auto.planlagt"), variant: "secondary", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
};

export function TimeEntryList({
  entries,
  onApprove,
  onReject,
  onDelete,
  onEdit,
  onConfirmSchedule,
  showEmployee = false,
}: TimeEntryListProps) {
  const { user, isCompanyAdmin, isDepartmentAdmin } = useAuth();
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [smartWarnings, setSmartWarnings] = useState<Record<string, string[]>>({});

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t("auto.ingen_timeregistreringer")}</h3>
        <p className="text-muted-foreground">
          {showEmployee
            ? "Det er ingen timeregistreringer i denne perioden."
            : "Du har ikke registrert noen timer ennå."}
        </p>
      </div>
    );
  }

  const submittedIds = onApprove && (isCompanyAdmin || isDepartmentAdmin)
    ? entries.filter((e) => e.status === "submitted" && e.user_id !== (isCompanyAdmin ? "" : user?.id)).map((e) => e.id)
    : [];

  return (
    <>
    <SmartTimeCheck entryIds={submittedIds} onResult={setSmartWarnings} />
    <div className="border rounded-lg overflow-x-auto">
      <Table>

        <TableHeader>
          <TableRow>
            <TableHead>{t("auto.dato")}</TableHead>
            {showEmployee && <TableHead>{t("auto.ansatt")}</TableHead>}
            <TableHead className="whitespace-nowrap">{t("auto.fra_til")}</TableHead>
            <TableHead className="text-right">{t("auto.timer")}</TableHead>
            <TableHead>{t("auto.prosjekt")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("auto.beskrivelse")}</TableHead>
            <TableHead>Materialforbruk</TableHead>
            <TableHead>{t("auto.status_2")}</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const config = statusConfig[entry.status];
            const canModify =
              (isCompanyAdmin && entry.status !== "pending_confirmation") ||
              (isDepartmentAdmin && entry.user_id !== user?.id && entry.status !== "pending_confirmation") ||
              (entry.user_id === user?.id &&
                (entry.status === "draft" || entry.status === "submitted" || entry.status === "rejected"));
            const canApprove = (isCompanyAdmin || (isDepartmentAdmin && entry.user_id !== user?.id)) && entry.status === "submitted";

            return (
              <TableRow key={entry.id} className={entry.status === "pending_confirmation" ? "bg-blue-50/50 dark:bg-blue-950/30" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {entry.source === "qr_clock" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <QrCode className="h-4 w-4 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("auto.qr_stempling")}</p>
                          {entry.clock_in && entry.clock_out && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.clock_in), "HH:mm")} - {format(new Date(entry.clock_out), "HH:mm")}
                              {entry.total_break_minutes ? ` (${entry.total_break_minutes} min pause)` : ""}
                            </p>
                          )}
                          {(entry.geofence_status_in || entry.geofence_status_out) && (
                            <p className="text-xs text-muted-foreground">
                              Start: {entry.geofence_status_in === "inside" ? "innenfor" : entry.geofence_status_in === "outside" ? `utenfor (${entry.geofence_distance_in_m ?? "?"} m)` : "ukjent"}
                              {" · "}
                              Slutt: {entry.geofence_status_out === "inside" ? "innenfor" : entry.geofence_status_out === "outside" ? `utenfor (${entry.geofence_distance_out_m ?? "?"} m)` : "ukjent"}
                            </p>
                          )}
                          {entry.geofence_reason && (
                            <p className="text-xs text-muted-foreground">Begrunnelse: {entry.geofence_reason}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {(entry.geofence_status_in === "outside" || entry.geofence_status_out === "outside") && (
                        <Tooltip>
                          <TooltipTrigger>
                            <MapPin className="h-4 w-4 text-amber-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Registrert utenfor prosjektområdet</p>
                            {entry.geofence_reason && (
                              <p className="text-xs text-muted-foreground">{entry.geofence_reason}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    {entry.source !== "qr_clock" && entry.source !== "work_schedule" && entry.geofence_status_in && (
                      <Tooltip>
                        <TooltipTrigger>
                          <MapPin className="h-4 w-4 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Startet med tidtaker og GPS</p>
                          <p className="text-xs text-muted-foreground">
                            Start: {entry.geofence_status_in === "inside" ? "innenfor området" : entry.geofence_status_in === "outside" ? `utenfor (${entry.geofence_distance_in_m ?? "?"} m)` : "posisjon ukjent"}
                            {" · "}
                            Slutt: {entry.geofence_status_out === "inside" ? "innenfor området" : entry.geofence_status_out === "outside" ? `utenfor (${entry.geofence_distance_out_m ?? "?"} m)` : "posisjon ukjent"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {showEmployee && entry.source !== "qr_clock" && entry.source !== "work_schedule" && !entry.geofence_status_in && (
                      <Tooltip>
                        <TooltipTrigger>
                          <PencilLine className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ført inn manuelt</p>
                          <p className="text-xs text-muted-foreground">Ikke stemplet inn/ut med GPS</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {entry.source === "work_schedule" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <CalendarCheck className="h-4 w-4 text-blue-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("auto.fra_vaktplan")}</p>
                          {entry.schedule_location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {entry.schedule_location}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {format(new Date(entry.entry_date), "EEE d. MMM", { locale: nb })}
                  </div>
                </TableCell>
                {showEmployee && <TableCell>{entry.user_name}</TableCell>}
                <TableCell className="font-mono text-sm whitespace-nowrap text-muted-foreground">
                  {(() => {
                    const fmt = (s?: string | null) => (s ? String(s).substring(0, 5) : null);
                    const from = fmt(entry.start_time) || (entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : null);
                    const to = fmt(entry.end_time) || (entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : null);
                    return from && to ? `${from}–${to}` : "–";
                  })()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(() => {
                    const b = getHourBreakdown(entry as any);
                    return (
                      <div className="flex flex-col items-end leading-tight">
                        <span>{Number(entry.hours).toFixed(1)}</span>
                        {b.hasOvertime && (
                          <span className="text-[10px] font-sans font-normal flex gap-1 mt-0.5">
                            {b.normal > 0 && <span className="text-muted-foreground">N {b.normal.toFixed(1)}</span>}
                            {b.overtime_50 > 0 && <span className="text-orange-600">50% {b.overtime_50.toFixed(1)}</span>}
                            {b.overtime_100 > 0 && <span className="text-red-600">100% {b.overtime_100.toFixed(1)}</span>}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </TableCell>

                <TableCell>
                  {entry.project_name || "-"}
                  {smartWarnings[entry.id] && (
                    <div className="mt-1 space-y-0.5">
                      {smartWarnings[entry.id].map((w) => (
                        <div key={w} className="text-[11px] leading-tight rounded bg-accent px-1.5 py-0.5 text-accent-foreground">⚠ {w}</div>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {entry.description || "-"}
                </TableCell>
                <TableCell className="min-w-[150px]">
                  {entry.materials && entry.materials.length > 0 ? (
                    <div className="space-y-1">
                      {entry.materials.map((material) => (
                        <div key={material.id} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{Number(material.quantity).toLocaleString("nb-NO")} {material.unit} {material.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className={config.className}>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    {/* Confirm schedule button for pending work schedules */}
                    {entry.status === "pending_confirmation" && entry.source === "work_schedule" && onConfirmSchedule && entry.user_id === user?.id && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => onConfirmSchedule(entry.id, entry.hours)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Bekreft timer
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("auto.bekreft_at_du_jobbet_disse_timene")}</TooltipContent>
                      </Tooltip>
                    )}
                    {/* Show direct action buttons for pending entries */}
                    {canApprove && onApprove && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onApprove(entry.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("auto.godkjenn")}</TooltipContent>
                      </Tooltip>
                    )}
                    {canApprove && onReject && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onReject(entry.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("auto.avvis")}</TooltipContent>
                      </Tooltip>
                    )}
                    {canModify && onEdit && entry.status !== "pending_confirmation" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => setEditEntry(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("auto.rediger")}</TooltipContent>
                      </Tooltip>
                    )}
                    {canModify && onDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("auto.slett")}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {onEdit && (
        <EditTimeEntryDialog
          open={!!editEntry}
          onOpenChange={(o) => !o && setEditEntry(null)}
          entry={editEntry}
          onSave={onEdit}
        />
      )}
    </div>
  );
}
