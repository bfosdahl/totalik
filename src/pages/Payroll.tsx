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
} from "@/utils/timeEntryExport";
import { Navigate } from "react-router-dom";

interface Row {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
  hour_type: string | null;
}

interface AllowanceRow {
  time_entry_id: string;
  amount: number | null;
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
  const [employeesMeta, setEmployeesMeta] = useState<Map<string, EmployeeMeta>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [startDay, setStartDay] = useState<number>(1);
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [savedStartDay, setSavedStartDay] = useState<number>(1);

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
    const { data } = await supabase
      .from("profiles")
      .select("user_id, email, hourly_rate, first_name, last_name, employee_number")
      .eq("company_id", profile.company_id);
    const map = new Map<string, EmployeeMeta>();
    (data || []).forEach((p: any) => {
      map.set(p.user_id, {
        user_id: p.user_id,
        email: p.email,
        hourly_rate: p.hourly_rate != null ? Number(p.hourly_rate) : null,
        employee_number: p.employee_number ?? null,
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
        .select("id, user_id, user_name, entry_date, hours, project_name, project_id, description, status, approved_by_name, approved_at, hour_type")
        .eq("company_id", profile.company_id)
        .eq("status", "approved")
        .gte("entry_date", fmt(period.start))
        .lte("entry_date", fmt(period.end))
        .order("entry_date", { ascending: true });
      if (error) {
        console.error(error);
        toast.error("Kunne ikke hente timer");
        setRows([]);
        setAllowanceMap(new Map());
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
          .select("time_entry_id, amount")
          .in("time_entry_id", ids);
        const map = new Map<string, number>();
        (allowData as AllowanceRow[] | null)?.forEach((a) => {
          const cur = map.get(a.time_entry_id) || 0;
          map.set(a.time_entry_id, cur + (Number(a.amount) || 0));
        });
        setAllowanceMap(map);
      } else {
        setAllowanceMap(new Map());
      }
      setIsLoading(false);
    })();
  }, [profile?.company_id, period.start.getTime(), period.end.getTime()]);

  // Filtered rows by project
  const filteredRows = useMemo(() => {
    if (projectFilter === "all") return rows;
    if (projectFilter === "_none") return rows.filter((r) => !r.project_name);
    return rows.filter((r) => r.project_name === projectFilter);
  }, [rows, projectFilter]);

  // Unique projects list
  const projects = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.project_name && set.add(r.project_name));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "nb"));
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
      if (r.hour_type && r.hour_type.startsWith("overtime")) {
        rec.overtime_hours = (rec.overtime_hours ?? 0) + h;
      }
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
    const totalOvertime = byEmployee.reduce((s, e) => s + (e.overtime_hours ?? 0), 0);
    const totalBase = byEmployee.reduce((s, e) => s + e.base_amount, 0);
    const totalAllow = byEmployee.reduce((s, e) => s + e.allowances_amount, 0);
    return {
      hours: totalHours,
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
        hourly_rate: employeesMeta.get(r.user_id)?.hourly_rate ?? null,
        allowances_amount: allowanceMap.get(r.id) || 0,
        is_overtime: !!(r.hour_type && r.hour_type.startsWith("overtime")),
      })),
    [filteredRows, employeesMeta, allowanceMap]
  );

  const handleExportGeneric = () => {
    exportPayrollGeneric(
      exportEntries,
      byEmployee.map(({ perProject, ...e }) => e),
      company?.name || "Bedrift",
      period.start,
      period.end
    );
    toast.success("Lønnsgrunnlag eksportert");
  };

  const handleExportTripletex = () => {
    const empMap: Record<string, { email?: string | null; employee_number?: string | null }> = {};
    employeesMeta.forEach((m, k) => {
      empMap[k] = { email: m.email, employee_number: m.employee_number };
    });
    exportPayrollTripletex(exportEntries, empMap, company?.name || "Bedrift", period.start, period.end);
    toast.success("Tripletex-eksport klar");
  };

  const handleSaveSettings = async () => {
    if (!company?.id) return;
    const { error } = await supabase
      .from("companies")
      .update({ payroll_period_start_day: startDay } as any)
      .eq("id", company.id);
    if (error) {
      toast.error("Kunne ikke lagre innstilling");
      return;
    }
    setSavedStartDay(startDay);
    toast.success("Lønnsperiode lagret");
    setSettingsOpen(false);
  };

  if (authLoading) return null;
  if (!isCompanyAdmin && !isSystemAdmin) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Lønnsgrunnlag</h1>
            <p className="text-sm text-muted-foreground">
              Godkjente timer per ansatt og prosjekt for valgt lønnsperiode.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setRatesOpen(true)}>
              Ansattnr & timesatser
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4 mr-1" /> Lønnsperiode
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={filteredRows.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> Last ned Excel
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportGeneric}>
                  Generisk lønnsgrunnlag (.xlsx)
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
                  Tilbake til lønnsperiode
                </Button>
              )}
            </div>

            <div>
              <Label className="text-xs">Prosjekt</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-9 w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle prosjekter</SelectItem>
                  <SelectItem value="_none">Uten prosjekt</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 ml-auto">
              <div>
                <Label className="text-xs">Fra</Label>
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
                <Label className="text-xs">Til</Label>
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
            <p className="text-xs text-muted-foreground">Timer (godkjent)</p>
            <p className="text-2xl font-bold">{totals.hours.toFixed(2)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Ansatte</p>
            <p className="text-2xl font-bold">{totals.employees}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Tillegg</p>
            <p className="text-2xl font-bold">{nok(totals.allow)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Sum lønn</p>
            <p className="text-2xl font-bold">{nok(totals.sum)}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">Per ansatt</TabsTrigger>
            <TabsTrigger value="projects">Per prosjekt</TabsTrigger>
            <TabsTrigger value="detail">Alle registreringer</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader><CardTitle className="text-base">Lønnsgrunnlag per ansatt</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Laster…</p>
                ) : byEmployee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen godkjente timer i perioden.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ansattnr</TableHead>
                          <TableHead>Ansatt</TableHead>
                          <TableHead className="text-right">Timer</TableHead>
                          <TableHead className="text-right">Herav overtid</TableHead>
                          <TableHead className="text-right">Timesats</TableHead>
                          <TableHead className="text-right">Grunnlønn</TableHead>
                          <TableHead className="text-right">Tillegg</TableHead>
                          <TableHead className="text-right">Sum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byEmployee.map((e) => (
                          <TableRow key={e.user_id}>
                            <TableCell className="text-xs text-muted-foreground">{e.employee_number || "-"}</TableCell>
                            <TableCell className="font-medium">
                              {e.user_name}
                              {e.hourly_rate == null && (
                                <Badge variant="outline" className="ml-2 text-xs">Mangler sats</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{e.total_hours.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {(e.overtime_hours ?? 0) > 0 ? (e.overtime_hours ?? 0).toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right">{e.hourly_rate != null ? nok(e.hourly_rate) : "-"}</TableCell>
                            <TableCell className="text-right">{nok(e.base_amount)}</TableCell>
                            <TableCell className="text-right">{nok(e.allowances_amount)}</TableCell>
                            <TableCell className="text-right font-semibold">{nok(e.total_amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>-</TableCell>
                          <TableCell>TOTALT</TableCell>
                          <TableCell className="text-right">{totals.hours.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{totals.overtime > 0 ? totals.overtime.toFixed(2) : "-"}</TableCell>
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
              <CardHeader><CardTitle className="text-base">Timer per prosjekt</CardTitle></CardHeader>
              <CardContent>
                {byProject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen godkjente timer i perioden.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prosjekt</TableHead>
                        <TableHead className="text-right">Timer</TableHead>
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
              <CardHeader><CardTitle className="text-base">Alle godkjente registreringer</CardTitle></CardHeader>
              <CardContent>
                {filteredRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen godkjente timer i perioden.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dato</TableHead>
                          <TableHead>Ansatt</TableHead>
                          <TableHead>Prosjekt</TableHead>
                          <TableHead>Beskrivelse</TableHead>
                          <TableHead className="text-right">Timer</TableHead>
                          <TableHead className="text-right">Tillegg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{format(parseISO(r.entry_date), "dd.MM.yyyy")}</TableCell>
                            <TableCell>{r.user_name}</TableCell>
                            <TableCell>{r.project_name || "-"}</TableCell>
                            <TableCell className="max-w-[280px] truncate">{r.description || "-"}</TableCell>
                            <TableCell className="text-right">{Number(r.hours).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{nok(allowanceMap.get(r.id) || 0)}</TableCell>
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
            <DialogTitle>Lønnsperiode</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Start-dag i måneden (1–28)</Label>
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
              Avbryt
            </Button>
            <Button onClick={handleSaveSettings}>Lagre</Button>
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
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, hourly_rate, employee_number")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("first_name", { ascending: true })
      .then(({ data }) => {
        setList(
          (data || []).map((p: any) => ({
            id: p.id,
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email,
            rate: p.hourly_rate != null ? String(p.hourly_rate) : "",
            employee_number: p.employee_number || "",
          }))
        );
        setLoading(false);
      });
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
        toast.error("Kunne ikke lagre: " + firstErr.error.message);
      } else {
        toast.success("Lagret");
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
          <DialogTitle>Ansattnummer og timesatser</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Laster…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen aktive ansatte.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 px-1 text-xs font-medium text-muted-foreground">
                <span className="flex-1">Ansatt</span>
                <span className="w-28">Ansattnr</span>
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
                    <span className="text-xs text-muted-foreground">kr/t</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Lagrer…" : "Lagre alle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
