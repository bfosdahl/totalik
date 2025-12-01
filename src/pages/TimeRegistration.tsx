import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { nb } from "date-fns/locale";
import { Plus, Download, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
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
import { exportTimeEntriesToExcel } from "@/utils/timeEntryExport";

type DateFilter = "this-week" | "last-week" | "this-month" | "last-month" | "all";

export default function TimeRegistration() {
  const { isCompanyAdmin, company } = useAuth();
  const {
    entries,
    isLoading,
    createEntry,
    approveEntry,
    rejectEntry,
    deleteEntry,
  } = useTimeEntries();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("this-week");

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Timeregistrering</h1>
            <p className="text-muted-foreground">
              Registrer og administrer arbeidstimer
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Eksporter Excel
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrer timer
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Periode:</span>
          </div>
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[180px]">
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
            <span className="text-sm text-muted-foreground">
              {format(start, "d. MMM", { locale: nb })} - {format(end, "d. MMM yyyy", { locale: nb })}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt timer</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                i valgt periode
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Til godkjenning</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                venter på godkjenning
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Godkjent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">
                godkjente registreringer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        {isCompanyAdmin ? (
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
    </AppLayout>
  );
}
