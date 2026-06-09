import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { Plus, Download, Clock, CheckCircle, AlertCircle, Calendar, CalendarDays, List, Users, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { TimeEntryList } from "@/components/timeregistration/TimeEntryList";
import { WeeklyTimeView } from "@/components/timeregistration/WeeklyTimeView";
import { Ks2NewTimeEntryDialog } from "@/components/ks2/Ks2NewTimeEntryDialog";
import { exportTimeEntriesToExcel } from "@/utils/timeEntryExport";

type DateFilter = "this-week" | "last-week" | "this-month" | "last-month" | "payroll-21" | "custom" | "all";

export default function Ks2Timeregistrering() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, isCompanyAdmin, company } = useAuth();
  const { projects } = useKsModule2Projects();
  const project = projects.find((p) => p.id === projectId);
  
  const {
    entries,
    isLoading,
    createEntry,
    approveEntry,
    rejectEntry,
    deleteEntry,
  } = useTimeEntries();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("this-month");
  const [viewMode, setViewMode] = useState<"list" | "week">("list");
  const today = new Date();
  const defaultCustomFrom = format(new Date(today.getFullYear(), today.getMonth() - 1, 21), "yyyy-MM-dd");
  const defaultCustomTo = format(new Date(today.getFullYear(), today.getMonth(), 20), "yyyy-MM-dd");
  const [customFrom, setCustomFrom] = useState<string>(defaultCustomFrom);
  const [customTo, setCustomTo] = useState<string>(defaultCustomTo);

  // Filter entries for this project
  const projectEntries = entries.filter((e) => e.project_id === projectId);

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
      case "payroll-21": {
        // 21. forrige måned → 20. inneværende måned
        const d = now.getDate();
        const y = now.getFullYear();
        const m = now.getMonth();
        if (d >= 21) {
          return { start: new Date(y, m, 21), end: new Date(y, m + 1, 20) };
        }
        return { start: new Date(y, m - 1, 21), end: new Date(y, m, 20) };
      }
      case "custom":
        try {
          return { start: parseISO(customFrom), end: parseISO(customTo) };
        } catch {
          return { start: undefined, end: undefined };
        }
      default:
        return { start: undefined, end: undefined };
    }
  };

  const { start, end } = getDateRange(dateFilter);

  const filteredEntries = projectEntries.filter((entry) => {
    if (!start || !end) return true;
    const entryDate = new Date(entry.entry_date);
    return entryDate >= start && entryDate <= end;
  });

  // Stats
  const myEntries = filteredEntries.filter((e) => e.user_id === user?.id);
  const totalHours = filteredEntries.reduce((sum, e) => sum + Number(e.hours), 0);
  const pendingCount = filteredEntries.filter((e) => e.status === "submitted").length;
  const approvedCount = filteredEntries.filter((e) => e.status === "approved").length;
  const uniqueEmployees = new Set(filteredEntries.map((e) => e.user_id)).size;

  // Per-employee summary for this project in valgt periode
  const byEmployee = useMemo(() => {
    const map = new Map<string, { user_id: string; user_name: string; total: number; approved: number; pending: number }>();
    filteredEntries.forEach((e) => {
      const cur = map.get(e.user_id) || { user_id: e.user_id, user_name: e.user_name, total: 0, approved: 0, pending: 0 };
      const h = Number(e.hours) || 0;
      cur.total += h;
      if (e.status === "approved") cur.approved += h;
      if (e.status === "submitted") cur.pending += h;
      map.set(e.user_id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredEntries]);

  const projectName = project?.project_name || "Prosjekt";

  const handleExport = () => {
    exportTimeEntriesToExcel(
      filteredEntries,
      projectName || company?.name || "Prosjekt",
      start,
      end
    );
  };

  const handleCreateEntry = async (entry: Parameters<typeof createEntry>[0]) => {
    return createEntry({
      ...entry,
      project_id: projectId,
      ks_project_id: projectId,
      project_name: project ? `${project.project_number} - ${project.project_name}` : entry.project_name,
    });
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Prosjekt ikke funnet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timeregistrering</h1>
          <p className="text-muted-foreground">
            Timer registrert på {projectName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Eksporter</span>
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Registrer timer</span>
          </Button>
        </div>
      </div>

      {/* View mode toggle and filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" />
            Liste
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Uke
          </Button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground hidden sm:inline">Periode:</span>
          </div>
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[160px]">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt timer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">i valgt periode</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ansatte</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEmployees}</div>
            <p className="text-xs text-muted-foreground">har registrert timer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Til godkjenning</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">venter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Godkjent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">registreringer</p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view mode */}
      {viewMode === "week" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ukevisning</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyTimeView
              entries={projectEntries}
              onCreateEntry={handleCreateEntry}
              onDeleteEntry={deleteEntry}
              userId={user?.id || ""}
            />
          </CardContent>
        </Card>
      ) : isCompanyAdmin ? (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              <Users className="h-4 w-4 mr-1" />
              Alle
            </TabsTrigger>
            <TabsTrigger value="pending">Til godkjenning ({pendingCount})</TabsTrigger>
            <TabsTrigger value="mine">
              <User className="h-4 w-4 mr-1" />
              Mine
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Alle timeregistreringer</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen timer registrert for dette prosjektet i valgt periode</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Registrer første time
                    </Button>
                  </div>
                ) : (
                  <TimeEntryList
                    entries={filteredEntries}
                    onApprove={approveEntry}
                    onReject={rejectEntry}
                    onDelete={deleteEntry}
                    showEmployee
                  />
                )}
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
                <TimeEntryList entries={myEntries} onDelete={deleteEntry} />
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
            {myEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Du har ikke registrert timer på dette prosjektet ennå</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Registrer første time
                </Button>
              </div>
            ) : (
              <TimeEntryList entries={myEntries} onDelete={deleteEntry} />
            )}
          </CardContent>
        </Card>
      )}

      <Ks2NewTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateEntry}
        projectId={projectId!}
        projectName={projectName}
      />
    </div>
  );
}
