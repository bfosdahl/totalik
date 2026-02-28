import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Car, TrendingUp, Briefcase, Home, Route, Trash2, Info } from "lucide-react";
import { useDrivingLog } from "@/hooks/useDrivingLog";
import { AddTripDialog } from "@/components/driving-log/AddTripDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tripTypeLabels: Record<string, string> = {
  business: "Yrkeskjøring",
  commute: "Arbeidsreise",
  private: "Privat",
};

const tripTypeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  business: "default",
  commute: "secondary",
  private: "outline",
};

const vehicleTypeLabels: Record<string, string> = {
  company: "Firmabil",
  private: "Privatbil",
};

export default function MyDrivingLog() {
  const { entries, createEntry, deleteEntry, stats } = useDrivingLog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState("all");

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(currentYear, i, 1), "MMMM", { locale: nb }),
  }));

  const filteredEntries = entries.data?.filter(entry => {
    if (monthFilter === "all") return true;
    const date = parseISO(entry.trip_date);
    const monthStart = startOfMonth(new Date(currentYear, parseInt(monthFilter)));
    const monthEnd = endOfMonth(monthStart);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  }) || [];

  const lastOdometerEnd = entries.data?.[0]?.odometer_end ?? null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Kjørebok</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-5 h-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Kjøreboken oppfyller kravene fra Skatteetaten for dokumentasjon av kjøring med firmabil og privat bil i yrkessammenheng.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground mt-1">
              Dokumenter all kjøring i henhold til skattemyndighetenes krav
            </p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Registrer tur
          </Button>
        </div>

        {/* Stats */}
        {entries.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Car className="w-4 h-4" /> Totalt
                </div>
                <p className="text-2xl font-bold">{stats.totalKm.toFixed(0)} km</p>
                <p className="text-xs text-muted-foreground">{stats.totalTrips} turer</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Briefcase className="w-4 h-4" /> Yrkeskjøring
                </div>
                <p className="text-2xl font-bold">{stats.businessKm.toFixed(0)} km</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Route className="w-4 h-4" /> Arbeidsreise
                </div>
                <p className="text-2xl font-bold">{stats.commuteKm.toFixed(0)} km</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Home className="w-4 h-4" /> Privat
                </div>
                <p className="text-2xl font-bold">{stats.privateKm.toFixed(0)} km</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer på måned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle måneder</SelectItem>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? "tur" : "turer"}
          </span>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {entries.isLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Ingen turer registrert</p>
                <p className="text-sm mt-1">Klikk «Registrer tur» for å legge til din første kjøretur.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dato</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Formål</TableHead>
                      <TableHead>Fra → Til</TableHead>
                      <TableHead className="text-right">Km-start</TableHead>
                      <TableHead className="text-right">Km-slutt</TableHead>
                      <TableHead className="text-right">Distanse</TableHead>
                      <TableHead>Bil</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(parseISO(entry.trip_date), "dd.MM.yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tripTypeBadgeVariant[entry.trip_type] || "outline"}>
                            {tripTypeLabels[entry.trip_type] || entry.trip_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{entry.purpose}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entry.start_location} → {entry.end_location}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(entry.odometer_start).toFixed(0)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(entry.odometer_end).toFixed(0)}</TableCell>
                        <TableCell className="text-right font-bold">{Number(entry.distance_km).toFixed(1)} km</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {vehicleTypeLabels[entry.vehicle_type] || entry.vehicle_type}
                            {entry.vehicle_registration ? ` (${entry.vehicle_registration})` : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skatteetaten info */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Krav til kjørebok (Skatteetaten)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Elektronisk kjørebok skal inneholde: dato, formål, start- og sluttsted, kilometerstand ved start og slutt, og total kjørelengde.</p>
            <p>Yrkeskjøring, arbeidsreise og privat kjøring skal føres separat. Kjøreboken skal oppdateres fortløpende.</p>
          </CardContent>
        </Card>
      </div>

      <AddTripDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => createEntry.mutate(data)}
        isPending={createEntry.isPending}
        lastOdometerEnd={lastOdometerEnd}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett tur</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne turen fra kjøreboken?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteEntry.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
