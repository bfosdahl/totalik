import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { exportDrivingLogToExcel } from "@/utils/drivingLogExport";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Car, TrendingUp, Briefcase, Home, Route, Trash2, Info, Play, ChevronDown, ChevronRight, ClipboardList, Receipt, Pencil, Download, Upload, X, FileText } from "lucide-react";
import { useDrivingLog } from "@/hooks/useDrivingLog";
import { useTravelExpenseReports } from "@/hooks/useTravelExpenseReports";
import { AddTripDialog } from "@/components/driving-log/AddTripDialog";
import { StartTripDialog } from "@/components/driving-log/StartTripDialog";
import { CompleteTripDialog } from "@/components/driving-log/CompleteTripDialog";
import { ActiveTripCard } from "@/components/driving-log/ActiveTripCard";
import { TripExpenses } from "@/components/driving-log/TripExpenses";
import { EditTripDialog } from "@/components/driving-log/EditTripDialog";
import { ImportDrivingLogDialog } from "@/components/driving-log/ImportDrivingLogDialog";
import { CreateTravelExpenseDialog } from "@/components/driving-log/CreateTravelExpenseDialog";
import { TravelExpenseList } from "@/components/driving-log/TravelExpenseList";
import { CreateDrivingLogInput } from "@/hooks/useDrivingLog";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nb } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { profile, roles } = useAuth();
  const { entries, activeTrip, startTrip, completeTrip, createEntry, updateEntry, deleteEntry, stats } = useDrivingLog();
  const { reports, createReport, submitReport, approveReport, rejectReport, deleteReport } = useTravelExpenseReports();
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [fullDialogOpen, setFullDialogOpen] = useState(false);
  const [travelExpenseDialogOpen, setTravelExpenseDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTrip, setEditTrip] = useState<any>(null);
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [tripTypeFilter, setTripTypeFilter] = useState("all");
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPending, setImportPending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const isAdmin = roles.includes("company_admin") || roles.includes("system_admin");

  const handleBulkImport = async (inputs: CreateDrivingLogInput[]) => {
    setImportPending(true);
    try {
      for (const input of inputs) {
        await createEntry.mutateAsync(input);
      }
    } finally {
      setImportPending(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteEntry.mutateAsync(id);
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(currentYear, i, 1), "MMMM", { locale: nb }),
  }));

  const completedEntries = entries.data?.filter(e => e.status === "completed") ?? [];

  const availableYears = [...new Set(completedEntries.map(e => new Date(e.trip_date).getFullYear()))].sort((a, b) => b - a);

  const filteredEntries = completedEntries.filter(entry => {
    const date = parseISO(entry.trip_date);
    // Year filter
    if (yearFilter !== "all" && date.getFullYear() !== parseInt(yearFilter)) return false;
    // Month filter
    if (monthFilter !== "all") {
      const selectedYear = yearFilter !== "all" ? parseInt(yearFilter) : currentYear;
      const monthStart = startOfMonth(new Date(selectedYear, parseInt(monthFilter)));
      const monthEnd = endOfMonth(monthStart);
      if (!isWithinInterval(date, { start: monthStart, end: monthEnd })) return false;
    }
    // Trip type filter
    if (tripTypeFilter !== "all" && entry.trip_type !== tripTypeFilter) return false;
    return true;
  });

  const allFilteredSelected = filteredEntries.length > 0 && filteredEntries.every(e => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredEntries.forEach(e => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredEntries.forEach(e => next.add(e.id));
        return next;
      });
    }
  };

  const lastOdometerEnd = completedEntries[0]?.odometer_end ?? null;

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
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4" />
              Importer
            </Button>
            {completedEntries.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Last ned Excel
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ansatt";
                    exportDrivingLogToExcel(entries.data || [], userName, currentYear);
                  }}>
                    {currentYear} (valgt år)
                  </DropdownMenuItem>
                  {(() => {
                    const allYears = [...new Set((entries.data || [])
                      .filter(e => e.status === "completed")
                      .map(e => new Date(e.trip_date).getFullYear())
                    )].sort((a, b) => b - a);
                    return allYears
                      .filter(y => y !== currentYear)
                      .map(y => (
                        <DropdownMenuItem key={y} onClick={() => {
                          const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ansatt";
                          exportDrivingLogToExcel(entries.data || [], userName, y);
                        }}>
                          {y}
                        </DropdownMenuItem>
                      ));
                  })()}
                  <DropdownMenuItem onClick={() => {
                    const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ansatt";
                    exportDrivingLogToExcel(entries.data || [], userName);
                  }}>
                    Alle år samlet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {activeTrip ? (
            <Button onClick={() => setCompleteDialogOpen(true)} className="gap-2">
              <Play className="w-4 h-4" />
              Fullfør aktiv tur
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Registrer tur
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStartDialogOpen(true)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start tur (fullfør senere)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFullDialogOpen(true)}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Registrer fullstendig tur
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Active Trip */}
        {activeTrip && (
          <ActiveTripCard
            trip={activeTrip}
            onComplete={() => setCompleteDialogOpen(true)}
            onCancel={() => {
              if (confirm("Er du sikker på at du vil avbryte denne turen?")) {
                deleteEntry.mutate(activeTrip.id);
              }
            }}
          />
        )}

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
        <div className="flex flex-wrap items-center gap-3">
          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="År" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle år</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={(v) => { setMonthFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Måned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle måneder</SelectItem>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tripTypeFilter} onValueChange={(v) => { setTripTypeFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Turtype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle turtyper</SelectItem>
              <SelectItem value="business">Yrkeskjøring</SelectItem>
              <SelectItem value="commute">Arbeidsreise</SelectItem>
              <SelectItem value="private">Privat</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? "tur" : "turer"}
          </span>
          {(yearFilter !== String(currentYear) || monthFilter !== "all" || tripTypeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => { setYearFilter(String(currentYear)); setMonthFilter("all"); setTripTypeFilter("all"); setSelectedIds(new Set()); }}
            >
              <X className="w-3 h-3" />
              Nullstill
            </Button>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="text-sm font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? "tur" : "turer"} valgt
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Slett valgte
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Avmerk alle
            </Button>
          </div>
        )}

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
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Velg alle"
                        />
                      </TableHead>
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
                      <React.Fragment key={entry.id}>
                        <TableRow className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(entry.id) ? "bg-primary/5" : ""}`} onClick={() => setExpandedTrip(expandedTrip === entry.id ? null : entry.id)}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(entry.id)}
                              onCheckedChange={() => toggleSelected(entry.id)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {expandedTrip === entry.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              {format(parseISO(entry.trip_date), "dd.MM.yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tripTypeBadgeVariant[entry.trip_type] || "outline"}>
                              {tripTypeLabels[entry.trip_type] || entry.trip_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{entry.purpose || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {entry.start_location} → {entry.end_location || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{Number(entry.odometer_start).toFixed(0)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{entry.odometer_end ? Number(entry.odometer_end).toFixed(0) : "—"}</TableCell>
                          <TableCell className="text-right font-bold">{Number(entry.distance_km).toFixed(1)} km</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {vehicleTypeLabels[entry.vehicle_type] || entry.vehicle_type}
                              {entry.vehicle_registration ? ` (${entry.vehicle_registration})` : ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); setEditTrip(entry); }}
                                title="Rediger tur"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); setDeleteId(entry.id); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedTrip === entry.id && (
                          <TableRow key={`${entry.id}-expenses`}>
                            <TableCell colSpan={10} className="bg-muted/30 p-4">
                              <TripExpenses tripId={entry.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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

      <StartTripDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onSubmit={(data) => startTrip.mutate(data)}
        isPending={startTrip.isPending}
        lastOdometerEnd={lastOdometerEnd}
      />

      {activeTrip && (
        <CompleteTripDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          onSubmit={(data) => completeTrip.mutate(data)}
          isPending={completeTrip.isPending}
          activeTrip={activeTrip}
        />
      )}

      <AddTripDialog
        open={fullDialogOpen}
        onOpenChange={setFullDialogOpen}
        onSubmit={(data) => createEntry.mutate(data)}
        isPending={createEntry.isPending}
        lastOdometerEnd={lastOdometerEnd}
      />

      <EditTripDialog
        open={!!editTrip}
        onOpenChange={(open) => { if (!open) setEditTrip(null); }}
        onSubmit={(data) => updateEntry.mutate(data)}
        isPending={updateEntry.isPending}
        trip={editTrip}
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett {selectedIds.size} turer</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette {selectedIds.size} valgte turer fra kjøreboken? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Sletter..." : `Slett ${selectedIds.size} turer`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportDrivingLogDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleBulkImport}
        isPending={importPending}
      />
    </AppLayout>
  );
}
