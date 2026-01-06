import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Check, X, Trash2 } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { EmployeeAbsence } from "@/hooks/useEmployeeAbsence";

interface AbsenceListProps {
  absences: EmployeeAbsence[];
  showEmployee?: boolean;
  canApprove?: boolean;
  canDelete?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  egenmelding: "Egenmelding",
  sykmelding: "Sykmelding",
  permisjon: "Permisjon",
  ferie: "Ferie",
  annet: "Annet",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Venter", variant: "secondary" },
  approved: { label: "Godkjent", variant: "default" },
  rejected: { label: "Avvist", variant: "destructive" },
};

export function AbsenceList({
  absences,
  showEmployee = true,
  canApprove = false,
  canDelete = false,
  onApprove,
  onReject,
  onDelete,
}: AbsenceListProps) {
  if (absences.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          Ingen fraværsregistreringer funnet
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showEmployee && <TableHead>Ansatt</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Dager</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => {
            const statusConfig = STATUS_CONFIG[absence.status] || STATUS_CONFIG.pending;
            const isPending = absence.status === "pending";

            return (
              <TableRow key={absence.id}>
                {showEmployee && (
                  <TableCell className="font-medium">
                    {absence.employee_name}
                  </TableCell>
                )}
                <TableCell>
                  {ABSENCE_TYPE_LABELS[absence.absence_type] || absence.absence_type}
                </TableCell>
                <TableCell>
                  {format(new Date(absence.start_date), "d. MMM", { locale: nb })} -{" "}
                  {format(new Date(absence.end_date), "d. MMM yyyy", { locale: nb })}
                </TableCell>
                <TableCell>{absence.total_days}</TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    {canApprove && isPending && onApprove && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onApprove(absence.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Godkjenn</TooltipContent>
                      </Tooltip>
                    )}
                    {canApprove && isPending && onReject && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onReject(absence.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Avvis</TooltipContent>
                      </Tooltip>
                    )}
                    {canDelete && isPending && onDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(absence.id)}
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
    </div>
  );
}
