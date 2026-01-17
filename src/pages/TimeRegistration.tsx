import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { nb } from "date-fns/locale";
import { Plus, Download, Clock, CheckCircle, AlertCircle, Calendar, CalendarDays, List, QrCode, CalendarCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useAuth } from "@/contexts/AuthContext";
import { NewTimeEntryDialog } from "@/components/timeregistration/NewTimeEntryDialog";
import { TimeEntryList } from "@/components/timeregistration/TimeEntryList";
import { WeeklyTimeView } from "@/components/timeregistration/WeeklyTimeView";
import { TimeClockQrDialog } from "@/components/timeregistration/TimeClockQrDialog";
import { MyShiftsPanel } from "@/components/work-schedule/MyShiftsPanel";
import { exportTimeEntriesToExcel } from "@/utils/timeEntryExport";

type DateFilter = "this-week" | "last-week" | "this-month" | "last-month" | "all";

export default function TimeRegistration() {
  const { user, isCompanyAdmin, company } = useAuth();
  const {
    entries,
    isLoading,
    createEntry,
    approveEntry,
    rejectEntry,
    deleteEntry,
    confirmScheduleEntry,
  } = useTimeEntries();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("this-week");
  const [viewMode, setViewMode] = useState<"list" | "week" | "shifts">("week");

  const getDateRange = (filter: DateFilter) => {
    const now = new Date();
    switch (filter) {
      case "this-week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "last-week":
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      case "this-month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case "last-month":
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      default:
        return { start: undefined, end: undefined };
    }
  };

  const { start, end } = getDateRange(dateFilter);

  const filteredEntries = entries.filter((entry) => {
    if (!start || !end) return true;
    const entryDate = new Date(entry.entry_date);
    return entryDate >= start && entryDate <= end;
  });

  // Stats
  const myEntries = filteredEntries.filter((e) => e.user_id === entries[0]?.user_id);
  const totalHours = filteredEntries.reduce((sum, e) => sum + Number(e.hours), 0);
  const pendingCount = filteredEntries.filter((e) => e.status === "submitted").length;
  const approvedCount = filteredEntries.filter((e) => e.status === "approved").length;

  const handleExport = () => {
    exportTimeEntriesToExcel(
      filteredEntries,
      company?.name || "Bedrift",
      start,
      end
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Compact on mobile */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Timeregistrering</h1>
            <p className="text-sm text-muted-foreground">
              Registrer og administrer arbeidstimer
            </p>
          </div>
          
          {/* Action buttons - horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {isCompanyAdmin && (
              <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)} className="shrink-0">
                <QrCode className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">QR-stempling</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} className="shrink-0">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Eksporter</span>
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="sm:hidden">Timer</span>
              <span className="hidden sm:inline">Registrer timer</span>
            </Button>
          </div>
        </div>

        {/* View mode toggle - compact on mobile */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto overflow-x-auto">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="flex-1 sm:flex-none"
            >
              <CalendarDays className="h-4 w-4 sm:mr-1" />
              <span className="hidden xs:inline">Uke</span>
            </Button>
            <Button
              variant={viewMode === "shifts" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("shifts")}
              className="flex-1 sm:flex-none"
            >
              <CalendarCheck className="h-4 w-4 sm:mr-1" />
              <span className="hidden xs:inline">Mine vakter</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex-1 sm:flex-none"
            >
              <List className="h-4 w-4 sm:mr-1" />
              <span className="hidden xs:inline">Liste</span>
            </Button>
          </div>

          {viewMode === "list" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">Denne uken</SelectItem>
                  <SelectItem value="last-week">Forrige uke</SelectItem>
                  <SelectItem value="this-month">Denne måneden</SelectItem>
                  <SelectItem value="last-month">Forrige måned</SelectItem>
                  <SelectItem value="all">Alle</SelectItem>
                </SelectContent>
              </Select>
              {start && end && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {format(start, "d. MMM", { locale: nb })} - {format(end, "d. MMM yyyy", { locale: nb })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats - Horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:mx-0 sm:px-0 scrollbar-hide">
          <Card className="min-w-[140px] sm:min-w-0 shrink-0 sm:shrink">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Totalt timer</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                i valgt periode
              </p>
            </CardContent>
          </Card>
          <Card className="min-w-[140px] sm:min-w-0 shrink-0 sm:shrink">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Til godkjenning</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{pendingCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                venter på godkjenning
              </p>
            </CardContent>
          </Card>
          <Card className="min-w-[140px] sm:min-w-0 shrink-0 sm:shrink">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Godkjent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{approvedCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                godkjente registreringer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content based on view mode */}
        {viewMode === "shifts" ? (
          <MyShiftsPanel />
        ) : viewMode === "week" ? (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Ukevisning</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <WeeklyTimeView
                entries={entries}
                onCreateEntry={createEntry}
                onDeleteEntry={deleteEntry}
                userId={user?.id || ""}
              />
            </CardContent>
          </Card>
        ) : isCompanyAdmin ? (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Alle ansatte</TabsTrigger>
              <TabsTrigger value="pending">Til godkjenning ({pendingCount})</TabsTrigger>
              <TabsTrigger value="mine">Mine timer</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Alle timeregistreringer</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeEntryList
                    entries={filteredEntries}
                    onApprove={approveEntry}
                    onReject={rejectEntry}
                    onDelete={deleteEntry}
                    onConfirmSchedule={confirmScheduleEntry}
                    showEmployee
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Til godkjenning</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeEntryList
                    entries={filteredEntries.filter((e) => e.status === "submitted")}
                    onApprove={approveEntry}
                    onReject={rejectEntry}
                    showEmployee
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="mine">
              <Card>
                <CardHeader>
                  <CardTitle>Mine timeregistreringer</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeEntryList
                    entries={myEntries}
                    onDelete={deleteEntry}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Mine timeregistreringer</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeEntryList entries={filteredEntries} onDelete={deleteEntry} />
            </CardContent>
          </Card>
        )}
      </div>

      <NewTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createEntry}
      />

      <TimeClockQrDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
      />
    </AppLayout>
  );
}
