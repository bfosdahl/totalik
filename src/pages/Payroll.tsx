import { useEffect, useMemo, useState } from "react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { Download, Settings as SettingsIcon, ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  exportPayrollGeneric,
  exportPayrollTripletex,
  type PayrollTimeEntry,
  type EmployeeSummary,
  type AllowanceDetailRow,
} from "@/utils/timeEntryExport";
import { getHourBreakdown } from "@/utils/hourBreakdown";
import { Navigate } from "react-router-dom";
import { AdminEditTimeEntryDialog, type AdminEditableEntry } from "@/components/timeregistration/AdminEditTimeEntryDialog";
import { Pencil } from "lucide-react";
import { t } from "@/i18n/t";

interface Row {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  start_time: string | null;
  end_time: string | null;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
  hour_type: string | null;
  overtime_segments: any;
}

interface AllowanceRow {
  time_entry_id: string;
  amount: number | null;
  type_name?: string | null;
  unit?: string | null;
  quantity?: number | null;
  rate_snapshot?: number | null;
  notes?: string | null;
}

interface EmployeeMeta {
  user_id: string;
  email: string | null;
  hourly_rate: number | null;
  employee_number: string | null;
}

function computePeriod(startDay: number, anchor: Date) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const d = anchor.getDate();
  let start: Date;
  let end: Date;
  if (startDay <= 1) {
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0);
  } else if (d >= startDay) {
    start = new Date(y, m, startDay);
    end = new Date(y, m + 1, startDay - 1);
  } else {
    start = new Date(y, m - 1, startDay);
    end = new Date(y, m, startDay - 1);
  }
  return { start, end };
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const fmtNo = (d: Date) => format(d, "d. MMM yyyy", { locale: nb });
const nok = (n: number) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

export default function Payroll() {
  const { profile, company, isCompanyAdmin, isSystemAdmin, isLoading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [allowanceMap, setAllowanceMap] = useState<Map<string, number>>(new Map());
  const [allowanceDetailsList, setAllowanceDetailsList] = useState<AllowanceRow[]>([]);
  const [employeesMeta, setEmployeesMeta] = useState<Map<string, EmployeeMeta>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [startDay, setStartDay] = useState<number>(1);
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [savedStartDay, setSavedStartDay] = useState<number>(1);
  const [editEntry, setEditEntry] = useState<AdminEditableEntry | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Load company payroll setting + employees with hourly_rate
  useEffect(() => {
    if (!company?.id) return;
    supabase
      .from("companies")
      .select("payroll_period_start_day")
      .eq("id", company.id)
      .maybeSingle()
      .then(({ data }) => {
        const d = (data as any)?.payroll_period_start_day ?? 1;
        setStartDay(d);
        setSavedStartDay(d);
      });
  }, [company?.id]);

  const loadEmployees = async () => {
    if (!profile?.company_id) return;
    const [{ data: safe }, { data: sens }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, first_name, last_name").eq("company_id", profile.company_id),
      supabase.rpc("get_company_profiles_sensitive", { p_company_id: profile.company_id }),
    ]);
    const sensMap = new Map<string, any>();
    (sens || []).forEach((s: any) => sensMap.set(s.user_id, s));
    const map = new Map<string, EmployeeMeta>();
    (safe || []).forEach((p: any) => {
      const s = sensMap.get(p.user_id) || {};
      map.set(p.user_id, {
        user_id: p.user_id,
        email: p.email,
        hourly_rate: s.hourly_rate != null ? Number(s.hourly_rate) : null,
        employee_number: s.employee_number ?? null,
      });
    });
    setEmployeesMeta(map);
  };

  useEffect(() => {
    loadEmployees();
  }, [profile?.company_id]);

  const period = useMemo(() => {
    if (customRange) {
      return { start: parseISO(customRange.from), end: parseISO(customRange.to) };
    }
    return computePeriod(startDay, anchor);
  }, [customRange, startDay, anchor]);

  // Load time entries + allowances for period
  useEffect(() => {
    if (!profile?.company_id) return;
    setIsLoading(true);
    (async () => {
      const { data: entries, error } = await supabase
        .from("time_entries")
        .select("id, user_id, user_name, entry_date, hours, start_time, end_time, project_name, project_id, description, status, approved_by_name, approved_at, hour_type, overtime_segments")
        .eq("company_id", profile.company_id)
        .eq("status", "approved")
        .gte("entry_date", fmt(period.start))
        .lte("entry_date", fmt(period.end))
        .order("entry_date", { ascending: true });
      if (error) {
        console.error(error);
        toast.error(t("auto.kunne_ikke_hente_timer"));
        setRows([]);
        setAllowanceMap(new Map());
        setAllowanceDetailsList([]);
        setIsLoading(false);
        return;
      }
      const list = (entries as Row[]) || [];
      setRows(list);

      // Fetch allowances for these entries
      if (list.length > 0) {
        const ids = list.map((r) => r.id);
        const { data: allowData } = await supabase
          .from("time_entry_allowances")
          .select("time_entry_id, amount, type_name, unit, quantity, rate_snapshot, notes")
          .in("time_entry_id", ids);
        const map = new Map<string, number>();
        (allowData as AllowanceRow[] | null)?.forEach((a) => {
          const cur = map.get(a.time_entry_id) || 0;
          map.set(a.time_entry_id, cur + (Number(a.amount) || 0));
        });
        setAllowanceMap(map);
        setAllowanceDetailsList((allowData as AllowanceRow[] | null) || []);
      } else {
        setAllowanceMap(new Map());
        setAllowanceDetailsList([]);
      }
      setIsLoading(false);
    })();
  }, [profile?.company_id, period.start.getTime(), period.end.getTime(), reloadTick]);

  // Filtered rows by project + employee
  const filteredRows = useMemo(() => {
    let r = rows;
    if (projectFilter === "_none") r = r.filter((x) => !x.project_name);
    else if (projectFilter !== "all") r = r.filter((x) => x.project_name === projectFilter);
    if (employeeFilter !== "all") r = r.filter((x) => x.user_id === employeeFilter);
    return r;
  }, [rows, projectFilter, employeeFilter]);

  // Unique projects list
  const projects = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.project_name && set.add(r.project_name));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "nb"));
  }, [rows]);

  // Unique employees list (from actual entries in the period)
  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => { if (r.user_id) map.set(r.user_id, r.user_name || "Ukjent"); });
    return Array.from(map.entries())
      .map(([user_id, user_name]) => ({ user_id, user_name }))
      .sort((a, b) => a.user_name.localeCompare(b.user_name, "nb"));
  }, [rows]);


  // Aggregations
  const byEmployee = useMemo(() => {
    const map = new Map<string, EmployeeSummary & { perProject: Map<string, number> }>();
    filteredRows.forEach((r) => {
      if (!map.has(r.user_id)) {
        const meta = employeesMeta.get(r.user_id);
        map.set(r.user_id, {
          user_id: r.user_id,
          user_name: r.user_name,
          employee_number: meta?.employee_number ?? null,
          total_hours: 0,
          normal_hours: 0,
          overtime_50_hours: 0,
          overtime_100_hours: 0,
          overtime_hours: 0,
          hourly_rate: meta?.hourly_rate ?? null,
          base_amount: 0,
          allowances_amount: 0,
          total_amount: 0,
          perProject: new Map(),
        });
      }
      const rec = map.get(r.user_id)!;
      const h = Number(r.hours) || 0;
      rec.total_hours += h;
      const b = getHourBreakdown(r);
      rec.normal_hours = (rec.normal_hours ?? 0) + b.normal;
      rec.overtime_50_hours = (rec.overtime_50_hours ?? 0) + b.overtime_50;
      rec.overtime_100_hours = (rec.overtime_100_hours ?? 0) + b.overtime_100;
      rec.overtime_hours = (rec.overtime_hours ?? 0) + b.overtime_50 + b.overtime_100;
      rec.allowances_amount += allowanceMap.get(r.id) || 0;
      const proj = r.project_name || "Uten prosjekt";
      rec.perProject.set(proj, (rec.perProject.get(proj) || 0) + h);
    });
    // Compute base + total
    map.forEach((rec) => {
      rec.base_amount = rec.hourly_rate != null ? rec.total_hours * rec.hourly_rate : 0;
      rec.total_amount = rec.base_amount + rec.allowances_amount;
    });
    return Array.from(map.values()).sort((a, b) => a.user_name.localeCompare(b.user_name, "nb"));
  }, [filteredRows, employeesMeta, allowanceMap]);

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((r) => {
      const proj = r.project_name || "Uten prosjekt";
      map.set(proj, (map.get(proj) || 0) + (Number(r.hours) || 0));
    });
    return Array.from(map.entries())
      .map(([project, hours]) => ({ project, hours }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredRows]);

  const totals = useMemo(() => {
    const totalHours = byEmployee.reduce((s, e) => s + e.total_hours, 0);
    const totalNormal = byEmployee.reduce((s, e) => s + (e.normal_hours ?? 0), 0);
    const total50 = byEmployee.reduce((s, e) => s + (e.overtime_50_hours ?? 0), 0);
    const total100 = byEmployee.reduce((s, e) => s + (e.overtime_100_hours ?? 0), 0);
    const totalOvertime = total50 + total100;
    const totalBase = byEmployee.reduce((s, e) => s + e.base_amount, 0);
    const totalAllow = byEmployee.reduce((s, e) => s + e.allowances_amount, 0);
    return {
      hours: totalHours,
      normal: totalNormal,
      overtime_50: total50,
      overtime_100: total100,
      overtime: totalOvertime,
      base: totalBase,
      allow: totalAllow,
      sum: totalBase + totalAllow,
      employees: byEmployee.length,
      entries: filteredRows.length,
    };
  }, [byEmployee, filteredRows]);

  const exportEntries: PayrollTimeEntry[] = useMemo(
    () =>
      filteredRows.map((r) => ({
        ...r,
        hours: Number(r.hours),
        start_time: r.start_time,
        end_time: r.end_time,
        hour_type: r.hour_type,
        hourly_rate: employeesMeta.get(r.user_id)?.hourly_rate ?? null,
        allowances_amount: allowanceMap.get(r.id) || 0,
        is_overtime: !!(r.hour_type && r.hour_type.startsWith("overtime")),
      })),
    [filteredRows, employeesMeta, allowanceMap]
  );

  const exportAllowanceDetails: AllowanceDetailRow[] = useMemo(() => {
    const rowsById = new Map(filteredRows.map((r) => [r.id, r]));
    return allowanceDetailsList
      .filter((a) => rowsById.has(a.time_entry_id))
      .map((a) => {
        const r = rowsById.get(a.time_entry_id)!;
        return {
          time_entry_id: a.time_entry_id,
          user_name: r.user_name,
          entry_date: r.entry_date,
          type_name: a.type_name || "(uten type)",
          unit: a.unit || "",
          quantity: Number(a.quantity) || 0,
          rate_snapshot: Number(a.rate_snapshot) || 0,
          amount: Number(a.amount) || 0,
          notes: a.notes || null,
        };
      });
  }, [allowanceDetailsList, filteredRows]);

  const handleExportGeneric = () => {
    exportPayrollGeneric(
      exportEntries,
      byEmployee.map(({ perProject, ...e }) => e),
      company?.name || "Bedrift",
      period.start,
      period.end,
      exportAllowanceDetails
    );
    toast.success(t("auto.loennsgrunnlag_eksportert"));
  };

  const handleExportTripletex = () => {
    const empMap: Record<string, { email?: string | null; employee_number?: string | null }> = {};
    employeesMeta.forEach((m, k) => {
      empMap[k] = { email: m.email, employee_number: m.employee_number };
    });
    exportPayrollTripletex(exportEntries, empMap, company?.name || "Bedrift", period.start, period.end);
    toast.success(t("auto.tripletex_eksport_klar"));
  };

  const handleSaveSettings = async () => {
    if (!company?.id) return;
    const { error } = await supabase
      .from("companies")
      .update({ payroll_period_start_day: startDay } as any)
      .eq("id", company.id);
    if (error) {
      toast.error(t("auto.kunne_ikke_lagre_innstilling"));
      return;
    }
    setSavedStartDay(startDay);
    toast.success(t("auto.loennsperiode_lagret"));
    setSettingsOpen(false);
  };

  if (authLoading) return null;
  if (!isCompanyAdmin && !isSystemAdmin) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t("auto.loennsgrunnlag")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("auto.godkjente_timer_per_ansatt_og_prosjekt_f")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setRatesOpen(true)}>
              {t("auto.ansattnr_timesatser")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4 mr-1" /> {t("auto.loennsperiode")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={filteredRows.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> Last ned Excel
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportGeneric}>
                  {t("auto.generisk_loennsgrunnlag_xlsx")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTripletex}>
                  Tripletex-importmal (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Period + project filter */}
        <Card>
          <CardContent className="py-3 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={!!customRange}
                onClick={() => setAnchor((a) => subMonths(a, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1.5 rounded border bg-muted text-sm font-medium min-w-[240px] text-center">
                <CalIcon className="inline h-3.5 w-3.5 mr-1" />
                {fmtNo(period.start)} – {fmtNo(period.end)}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={!!customRange}
                onClick={() => setAnchor((a) => addMonths(a, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {customRange && (
                <Button variant="ghost" size="sm" onClick={() => setCustomRange(null)}>
                  {t("auto.tilbake_til_loennsperiode")}
                </Button>
              )}
            </div>

            <div className="w-full sm:w-auto">
              <Label className="text-xs">{t("auto.prosjekt")}</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("auto.alle_prosjekter")}</SelectItem>
                  <SelectItem value="_none">{t("auto.uten_prosjekt")}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Kun godkjente</SelectItem>
                  <SelectItem value="submitted">Til godkjenning</SelectItem>
                  <SelectItem value="all">Alle (inkl. ikke godkjente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Label className="text-xs">{t("auto.ansatt")}</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("auto.alle_ansatte")}</SelectItem>
                  {employeeOptions.map((e) => (
                    <SelectItem key={e.user_id} value={e.user_id}>{e.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            <div className="flex items-end gap-2 ml-auto">
              <div>
                <Label className="text-xs">{t("auto.fra")}</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={customRange?.from || fmt(period.start)}
                  onChange={(e) =>
                    setCustomRange({
                      from: e.target.value,
                      to: customRange?.to || fmt(period.end),
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">{t("auto.til")}</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={customRange?.to || fmt(period.end)}
                  onChange={(e) =>
                    setCustomRange({
                      from: customRange?.from || fmt(period.start),
                      to: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t("auto.timer_godkjent")}</p>
            <p className="text-2xl font-bold">{totals.hours.toFixed(2)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t("auto.ansatte")}</p>
            <p className="text-2xl font-bold">{totals.employees}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t("auto.tillegg")}</p>
            <p className="text-2xl font-bold">{nok(totals.allow)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t("auto.sum_loenn")}</p>
            <p className="text-2xl font-bold">{nok(totals.sum)}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">{t("auto.per_ansatt")}</TabsTrigger>
            <TabsTrigger value="projects">{t("auto.per_prosjekt")}</TabsTrigger>
            <TabsTrigger value="detail">{t("auto.alle_registreringer")}</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("auto.loennsgrunnlag_per_ansatt")}</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">{t("auto.laster_2")}</p>
                ) : byEmployee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("auto.ingen_godkjente_timer_i_perioden")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("auto.ansattnr")}</TableHead>
                          <TableHead>{t("auto.ansatt")}</TableHead>
                          <TableHead className="text-right">{t("auto.normaltimer")}</TableHead>
                          <TableHead className="text-right">{t("auto.50_overtid")}</TableHead>
                          <TableHead className="text-right">{t("auto.100_overtid")}</TableHead>
                          <TableHead className="text-right">{t("auto.timer_totalt")}</TableHead>
                          <TableHead className="text-right">{t("auto.timesats")}</TableHead>
                          <TableHead className="text-right">{t("auto.grunnloenn")}</TableHead>
                          <TableHead className="text-right">{t("auto.tillegg")}</TableHead>
                          <TableHead className="text-right">{t("auto.sum")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byEmployee.map((e) => (
                          <TableRow key={e.user_id}>
                            <TableCell className="text-xs text-muted-foreground">{e.employee_number || "-"}</TableCell>
                            <TableCell className="font-medium">
                              {e.user_name}
                              {e.hourly_rate == null && (
                                <Badge variant="outline" className="ml-2 text-xs">{t("auto.mangler_sats")}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{(e.normal_hours ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right text-orange-600">
                              {(e.overtime_50_hours ?? 0) > 0 ? (e.overtime_50_hours ?? 0).toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {(e.overtime_100_hours ?? 0) > 0 ? (e.overtime_100_hours ?? 0).toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium">{e.total_hours.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{e.hourly_rate != null ? nok(e.hourly_rate) : "-"}</TableCell>
                            <TableCell className="text-right">{nok(e.base_amount)}</TableCell>
                            <TableCell className="text-right">{nok(e.allowances_amount)}</TableCell>
                            <TableCell className="text-right font-semibold">{nok(e.total_amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>-</TableCell>
                          <TableCell>TOTALT</TableCell>
                          <TableCell className="text-right">{totals.normal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{totals.overtime_50 > 0 ? totals.overtime_50.toFixed(2) : "-"}</TableCell>
                          <TableCell className="text-right">{totals.overtime_100 > 0 ? totals.overtime_100.toFixed(2) : "-"}</TableCell>
                          <TableCell className="text-right">{totals.hours.toFixed(2)}</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">{nok(totals.base)}</TableCell>
                          <TableCell className="text-right">{nok(totals.allow)}</TableCell>
                          <TableCell className="text-right">{nok(totals.sum)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("auto.timer_per_prosjekt")}</CardTitle></CardHeader>
              <CardContent>
                {byProject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("auto.ingen_godkjente_timer_i_perioden")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("auto.prosjekt")}</TableHead>
                        <TableHead className="text-right">{t("auto.timer")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byProject.map((p) => (
                        <TableRow key={p.project}>
                          <TableCell>{p.project}</TableCell>
                          <TableCell className="text-right font-medium">{p.hours.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTALT</TableCell>
                        <TableCell className="text-right">{totals.hours.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detail">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("auto.alle_godkjente_registreringer")}</CardTitle></CardHeader>
              <CardContent>
                {filteredRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("auto.ingen_godkjente_timer_i_perioden")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("auto.dato")}</TableHead>
                          <TableHead>{t("auto.ansatt")}</TableHead>
                          <TableHead>{t("auto.fra_til_2")}</TableHead>
                          <TableHead>{t("auto.type")}</TableHead>
                          <TableHead>{t("auto.prosjekt")}</TableHead>
                          <TableHead>{t("auto.beskrivelse")}</TableHead>
                          <TableHead className="text-right">{t("auto.timer")}</TableHead>
                          <TableHead className="text-right">{t("auto.tillegg")}</TableHead>
                          <TableHead className="text-right">{t("auto.handling")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{format(parseISO(r.entry_date), "dd.MM.yyyy")}</TableCell>
                            <TableCell>{r.user_name}</TableCell>
                            <TableCell className="tabular-nums text-xs">
                              {r.start_time && r.end_time
                                ? `${r.start_time.substring(0, 5)}–${r.end_time.substring(0, 5)}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.hour_type === "overtime_50" ? (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">50%</Badge>
                              ) : r.hour_type === "overtime_100" ? (
                                <Badge variant="outline" className="text-red-600 border-red-300">100%</Badge>
                              ) : (
                                <span className="text-muted-foreground">{t("auto.normal")}</span>
                              )}
                            </TableCell>
                            <TableCell>{r.project_name || "-"}</TableCell>
                            <TableCell className="max-w-[240px] truncate">{r.description || "-"}</TableCell>
                            <TableCell className="text-right">{Number(r.hours).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{nok(allowanceMap.get(r.id) || 0)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setEditEntry({
                                    id: r.id,
                                    user_name: r.user_name,
                                    entry_date: r.entry_date,
                                    hours: Number(r.hours),
                                    start_time: r.start_time,
                                    end_time: r.end_time,
                                    description: r.description,
                                    hour_type: r.hour_type,
                                    project_name: r.project_name,
                                  })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Period settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auto.loennsperiode")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{t("auto.start_dag_i_maaneden_1_28")}</Label>
            <Input
              type="number"
              min={1}
              max={28}
              value={startDay}
              onChange={(e) => setStartDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
            />
            <p className="text-xs text-muted-foreground">
              {startDay === 1
                ? "Hele kalendermåneden (1.–siste dag)."
                : `Periode: ${startDay}. forrige måned – ${startDay - 1}. inneværende måned.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStartDay(savedStartDay); setSettingsOpen(false); }}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleSaveSettings}>{t("auto.lagre")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hourly rates dialog */}
      <HourlyRatesDialog
        open={ratesOpen}
        onOpenChange={setRatesOpen}
        companyId={profile?.company_id}
        onSaved={loadEmployees}
      />

      <AdminEditTimeEntryDialog
        open={!!editEntry}
        onOpenChange={(v) => { if (!v) setEditEntry(null); }}
        entry={editEntry}
        onSaved={() => {
          setEditEntry(null);
          setReloadTick((t) => t + 1);
        }}
      />
    </AppLayout>
  );
}

/* ---------------- Hourly rates editor ---------------- */
function HourlyRatesDialog({
  open,
  onOpenChange,
  companyId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId?: string | null;
  onSaved: () => void;
}) {
  const [list, setList] = useState<Array<{ id: string; name: string; rate: string; employee_number: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !companyId) return;
    setLoading(true);
    (async () => {
      const [{ data: safe }, { data: sens }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("first_name", { ascending: true }),
        supabase.rpc("get_company_profiles_sensitive", { p_company_id: companyId }),
      ]);
      const sensMap = new Map<string, any>();
      (sens || []).forEach((s: any) => sensMap.set(s.id, s));
      setList(
        (safe || []).map((p: any) => {
          const s = sensMap.get(p.id) || {};
          return {
            id: p.id,
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email,
            rate: s.hourly_rate != null ? String(s.hourly_rate) : "",
            employee_number: s.employee_number || "",
          };
        })
      );
      setLoading(false);
    })();
  }, [open, companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = list.map((item) =>
        supabase
          .from("profiles")
          .update({
            hourly_rate: item.rate === "" ? null : Number(item.rate),
            employee_number: item.employee_number.trim() === "" ? null : item.employee_number.trim(),
          } as any)
          .eq("id", item.id)
      );
      const results = await Promise.all(updates);
      const firstErr = results.find((r) => r.error);
      if (firstErr?.error) {
        toast.error(t("auto.kunne_ikke_lagre") + firstErr.error.message);
      } else {
        toast.success(t("auto.lagret"));
        onSaved();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("auto.ansattnummer_og_timesatser")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("auto.laster_2")}</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("auto.ingen_aktive_ansatte")}</p>
          ) : (
            <>
              <div className="flex items-center gap-3 px-1 text-xs font-medium text-muted-foreground">
                <span className="flex-1">{t("auto.ansatt")}</span>
                <span className="w-28">{t("auto.ansattnr")}</span>
                <span className="w-32 text-right">Timesats (kr/t)</span>
              </div>
              {list.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <Input
                    type="text"
                    className="h-9 w-28"
                    placeholder="—"
                    value={item.employee_number}
                    onChange={(e) => {
                      const v = e.target.value;
                      setList((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], employee_number: v };
                        return next;
                      });
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      className="h-9 w-28 text-right"
                      placeholder="0"
                      value={item.rate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setList((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], rate: v };
                          return next;
                        });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{t("auto.kr_t")}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("auto.avbryt")}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Lagrer…" : "Lagre alle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
