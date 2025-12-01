import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Check, X, Clock, Trash2, MoreHorizontal } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface TimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  description: string | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  approved_by_name: string | null;
  approved_at: string | null;
}

interface TimeEntryListProps {
  entries: TimeEntry[];
  onApprove?: (id: string) => Promise<boolean>;
  onReject?: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  showEmployee?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive"; className?: string }> = {
  draft: { label: "Utkast", variant: "secondary" },
  submitted: { label: "Innsendt", variant: "default" },
  approved: { label: "Godkjent", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  rejected: { label: "Avvist", variant: "destructive" },
};

export function TimeEntryList({
  entries,
  onApprove,
  onReject,
  onDelete,
  showEmployee = false,
}: TimeEntryListProps) {
  const { user, isCompanyAdmin } = useAuth();

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
              entry.user_id === user?.id &&
              (entry.status === "draft" || entry.status === "submitted" || entry.status === "rejected");
            const canApprove = isCompanyAdmin && entry.status === "submitted";

            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {format(new Date(entry.entry_date), "EEE d. MMM", { locale: nb })}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canApprove && onApprove && (
                        <DropdownMenuItem onClick={() => onApprove(entry.id)}>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Godkjenn
                        </DropdownMenuItem>
                      )}
                      {canApprove && onReject && (
                        <DropdownMenuItem onClick={() => onReject(entry.id)}>
                          <X className="mr-2 h-4 w-4 text-red-500" />
                          Avvis
                        </DropdownMenuItem>
                      )}
                      {canModify && onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(entry.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Slett
                        </DropdownMenuItem>
                      )}
                      {!canApprove && !canModify && (
                        <DropdownMenuItem disabled>
                          Ingen handlinger
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
