import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Check, X, Clock, Trash2, QrCode, CalendarCheck, MapPin, Pencil } from "lucide-react";
import { EditTimeEntryDialog } from "./EditTimeEntryDialog";
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
  total_break_minutes?: number | null;
  work_schedule_id?: string | null;
  schedule_location?: string | null;
  schedule_role?: string | null;
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
  draft: { label: "Utkast", variant: "secondary" },
  submitted: { label: "Innsendt", variant: "default" },
  approved: { label: "Godkjent", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  rejected: { label: "Avvist", variant: "destructive" },
  pending_confirmation: { label: "Planlagt", variant: "secondary", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
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
  const { user, isCompanyAdmin } = useAuth();
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Ingen timeregistreringer</h3>
        <p className="text-muted-foreground">
          {showEmployee
            ? "Det er ingen timeregistreringer i denne perioden."
            : "Du har ikke registrert noen timer ennå."}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dato</TableHead>
            {showEmployee && <TableHead>Ansatt</TableHead>}
            <TableHead className="text-right">Timer</TableHead>
            <TableHead>Prosjekt</TableHead>
            <TableHead className="hidden md:table-cell">Beskrivelse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const config = statusConfig[entry.status];
            const canModify =
              (isCompanyAdmin && entry.status !== "pending_confirmation") ||
              (entry.user_id === user?.id &&
                (entry.status === "draft" || entry.status === "submitted" || entry.status === "rejected"));
            const canApprove = isCompanyAdmin && entry.status === "submitted";

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
                          <p>QR-stempling</p>
                          {entry.clock_in && entry.clock_out && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.clock_in), "HH:mm")} - {format(new Date(entry.clock_out), "HH:mm")}
                              {entry.total_break_minutes ? ` (${entry.total_break_minutes} min pause)` : ""}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {entry.source === "work_schedule" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <CalendarCheck className="h-4 w-4 text-blue-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fra vaktplan</p>
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
                <TableCell className="text-right font-mono">
                  {Number(entry.hours).toFixed(1)}
                </TableCell>
                <TableCell>{entry.project_name || "-"}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {entry.description || "-"}
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
                        <TooltipContent>Bekreft at du jobbet disse timene</TooltipContent>
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
                        <TooltipContent>Godkjenn</TooltipContent>
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
                        <TooltipContent>Avvis</TooltipContent>
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
                        <TooltipContent>Rediger</TooltipContent>
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
                        <TooltipContent>Slett</TooltipContent>
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
