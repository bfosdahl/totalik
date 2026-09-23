import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { exportDrivingLogToExcel, exportFilteredDrivingLog } from "@/utils/drivingLogExport";
import { useGpsTracker } from "@/hooks/useGpsTracker";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { useCompanyVehicles } from "@/hooks/useCompanyVehicles";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import type { GpsTripSummary } from "@/components/driving-log/CompleteTripDialog";
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
import TripRouteMap from "@/components/driving-log/TripRouteMap";
import { EditTripDialog } from "@/components/driving-log/EditTripDialog";
import { ImportDrivingLogDialog } from "@/components/driving-log/ImportDrivingLogDialog";
import { CreateTravelExpenseDialog } from "@/components/driving-log/CreateTravelExpenseDialog";
import { TravelExpenseList } from "@/components/driving-log/TravelExpenseList";
import { CreateDrivingLogInput } from "@/hooks/useDrivingLog";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nb } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { t } from "@/i18n/t";

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
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [gpsSummary, setGpsSummary] = useState<GpsTripSummary | null>(null);

  const gps = useGpsTracker();
  const { data: projectOptions = [] } = useProjectOptions();
  const { vehicles } = useCompanyVehicles();
  const { users } = useCompanyUsers();

  const projectNames = Object.fromEntries(
    projectOptions.map((p) => [p.id, p.project_number ? `${p.project_number} – ${p.project_name}` : p.project_name])
  );
  const userNames = Object.fromEntries(
    users.map((u) => [u.id, `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Ansatt"])
  );

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
    // Vehicle filter (registreringsnummer)
    if (vehicleFilter !== "all" && (entry.vehicle_registration || "") !== vehicleFilter) return false;
    // Project filter
    if (projectFilter !== "all" && (entry.project_id || "") !== projectFilter) return false;
    // Employee filter
    if (employeeFilter !== "all" && entry.user_id !== employeeFilter) return false;
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
              <h1 className="text-3xl font-bold tracking-tight">{t("auto.kjoerebok")}</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-5 h-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("auto.kjoereboken_oppfyller_kravene_fra_skatte")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground mt-1">
              {t("auto.dokumenter_all_kjoering_i_henhold_til_sk")}
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
                    {t("auto.alle_aar_samlet")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {activeTrip ? (
            <Button onClick={() => setCompleteDialogOpen(true)} className="gap-2">
              <Play className="w-4 h-4" />
              {gps.isTracking ? "Stopp kjøretur" : t("auto.fullfoer_aktiv_tur")}
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
                  {t("auto.start_tur_fullfoer_senere")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFullDialogOpen(true)}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Registrer fullstendig tur
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTravelExpenseDialogOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  {t("auto.ny_reiseregning")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Active Trip */}
        {activeTrip && (
          <ActiveTripCard
            trip={activeTrip}
            gps={{
              isTracking: gps.isTracking && gps.trackedTripId === activeTrip.id,
              distanceKm: gps.distanceKm,
              durationMinutes: gps.durationMinutes,
              stops: gps.stops,
              signalLost: gps.signalLost,
              error: gps.error,
            }}
            onComplete={() => {
              if (gps.isTracking && gps.trackedTripId === activeTrip.id) {
                const summary = gps.stop();
                if (summary) {
                  setGpsSummary({
                    points: summary.points,
                    stops: summary.stops,
                    distanceKm: summary.distanceKm,
                    durationMinutes: summary.durationMinutes,
                    gpsLost: summary.gpsLost,
                  });
                }
              }
              setCompleteDialogOpen(true);
            }}
            onCancel={() => {
              if (confirm("Er du sikker på at du vil avbryte denne turen?")) {
                gps.stop();
                setGpsSummary(null);
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
                  <Briefcase className="w-4 h-4" /> {t("auto.yrkeskjoering")}
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

        {/* Travel Expense Reports */}
        <TravelExpenseList
          reports={reports.data || []}
          isLoading={reports.isLoading}
          onSubmit={(id) => submitReport.mutate(id)}
          onApprove={(id) => approveReport.mutate(id)}
          onReject={(data) => rejectReport.mutate(data)}
          onDelete={(id) => deleteReport.mutate(id)}
          isAdmin={isAdmin}
        />

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("auto.aar")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("auto.alle_aar")}</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={(v) => { setMonthFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("auto.maaned")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("auto.alle_maaneder")}</SelectItem>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tripTypeFilter} onValueChange={(v) => { setTripTypeFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("auto.turtype")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("auto.alle_turtyper")}</SelectItem>
              <SelectItem value="business">{t("auto.yrkeskjoering")}</SelectItem>
              <SelectItem value="commute">{t("auto.arbeidsreise")}</SelectItem>
              <SelectItem value="private">{t("auto.privat")}</SelectItem>
            </SelectContent>
          </Select>
          {vehicles.length > 0 && (
            <Select value={vehicleFilter} onValueChange={(v) => { setVehicleFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kjøretøy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kjøretøy</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.license_plate}>{v.license_plate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {projectOptions.length > 0 && (
            <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prosjekt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle prosjekter</SelectItem>
                {projectOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{projectNames[p.id]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isAdmin && users.length > 0 && (
            <Select value={employeeFilter} onValueChange={(v) => { setEmployeeFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ansatt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle ansatte</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{userNames[u.id]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={filteredEntries.length === 0}
            onClick={() => exportFilteredDrivingLog(filteredEntries, { title: "Kjorebok_rapport", userNames, projectNames })}
          >
            <Download className="w-3.5 h-3.5" />
            Last ned rapport (filtrert)
          </Button>
          <span className="text-sm text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? "tur" : "turer"}
          </span>
          {(yearFilter !== String(currentYear) || monthFilter !== "all" || tripTypeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => { setYearFilter(String(currentYear)); setMonthFilter("all"); setTripTypeFilter("all"); setVehicleFilter("all"); setProjectFilter("all"); setEmployeeFilter("all"); setSelectedIds(new Set()); }}
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
              {t("auto.slett_valgte")}
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
                <p className="font-medium">{t("auto.ingen_turer_registrert")}</p>
                <p className="text-sm mt-1">{t("auto.klikk_registrer_tur_for_aa_legge_til_din")}</p>
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
                          aria-label={t("auto.velg_alle")}
                        />
                      </TableHead>
                      <TableHead>{t("auto.dato")}</TableHead>
                      <TableHead>{t("auto.type")}</TableHead>
                      <TableHead>{t("auto.formaal")}</TableHead>
                      <TableHead>{t("auto.fra_til_3")}</TableHead>
                      <TableHead className="text-right">{t("auto.km_start")}</TableHead>
                      <TableHead className="text-right">{t("auto.km_slutt")}</TableHead>
                      <TableHead className="text-right">{t("auto.distanse")}</TableHead>
                      <TableHead>{t("auto.bil")}</TableHead>
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
                                title={t("auto.rediger_tur")}
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
                            <TableCell colSpan={10} className="bg-muted/30 p-4 space-y-4">
                              <TripRouteMap trip={entry} />
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
              {t("auto.krav_til_kjoerebok_skatteetaten")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>{t("auto.elektronisk_kjoerebok_skal_inneholde_dat")}</p>
            <p>{t("auto.yrkeskjoering_arbeidsreise_og_privat_kjo")}</p>
          </CardContent>
        </Card>
      </div>

      <StartTripDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onSubmit={(data, gpsStart) =>
          startTrip.mutate(data, {
            onSuccess: (entry: any) => {
              if (data.tracking_mode === "gps" && entry?.id) {
                gps.start(entry.id, gpsStart || undefined);
                setGpsSummary(null);
              }
            },
          })
        }
        isPending={startTrip.isPending}
        lastOdometerEnd={lastOdometerEnd}
      />

      {activeTrip && (
        <CompleteTripDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          onSubmit={(data) => completeTrip.mutate(data, { onSuccess: () => setGpsSummary(null) })}
          isPending={completeTrip.isPending}
          activeTrip={activeTrip}
          gpsSummary={gpsSummary}
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
            <AlertDialogTitle>{t("auto.slett_tur")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auto.er_du_sikker_paa_at_du_vil_slette_denne__2")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteEntry.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              {t("auto.slett")}
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
            <AlertDialogCancel disabled={bulkDeleting}>{t("auto.avbryt")}</AlertDialogCancel>
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

      <CreateTravelExpenseDialog
        open={travelExpenseDialogOpen}
        onOpenChange={setTravelExpenseDialogOpen}
        onSubmit={(data) => {
          createReport.mutate(data, {
            onSuccess: () => setTravelExpenseDialogOpen(false),
          });
        }}
        isPending={createReport.isPending}
        completedTrips={completedEntries}
      />
    </AppLayout>
  );
}
