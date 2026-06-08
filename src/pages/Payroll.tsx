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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { exportTimeEntriesToExcel } from "@/utils/timeEntryExport";
import { Navigate } from "react-router-dom";

interface Row {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  description: string | null;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
}

function computePeriod(startDay: number, anchor: Date) {
  // The period that contains `anchor` based on monthly cycle starting at `startDay`.
  // E.g. startDay=21 → period is 21.prev → 20.current
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

export default function Payroll() {
  const { profile, company, isCompanyAdmin, isSystemAdmin, isLoading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDay, setStartDay] = useState<number>(1);
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedStartDay, setSavedStartDay] = useState<number>(1);

  // Load company payroll setting
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

  const period = useMemo(() => {
    if (customRange) {
      return { start: parseISO(customRange.from), end: parseISO(customRange.to) };
    }
    return computePeriod(startDay, anchor);
  }, [customRange, startDay, anchor]);

  // Load time entries for period
  useEffect(() => {
    if (!profile?.company_id) return;
    setIsLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("id, user_id, user_name, entry_date, hours, project_name, description, status, approved_by_name, approved_at")
        .eq("company_id", profile.company_id)
        .gte("entry_date", fmt(period.start))
        .lte("entry_date", fmt(period.end))
        .order("entry_date", { ascending: true });
      if (error) {
        console.error(error);
        toast.error("Kunne ikke hente timer");
        setRows([]);
      } else {
        setRows((data as Row[]) || []);
      }
      setIsLoading(false);
    })();
  }, [profile?.company_id, period.start.getTime(), period.end.getTime()]);

  // Aggregations
  const byEmployee = useMemo(() => {
    const map = new Map<string, { user_id: string; user_name: string; total: number; perProject: Map<string, number> }>();
    rows.forEach((r) => {
      const key = r.user_id;
      if (!map.has(key)) map.set(key, { user_id: r.user_id, user_name: r.user_name, total: 0, perProject: new Map() });
      const rec = map.get(key)!;
      const h = Number(r.hours) || 0;
      rec.total += h;
      const proj = r.project_name || "Uten prosjekt";
      rec.perProject.set(proj, (rec.perProject.get(proj) || 0) + h);
    });
    return Array.from(map.values()).sort((a, b) => a.user_name.localeCompare(b.user_name, "nb"));
  }, [rows]);

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const proj = r.project_name || "Uten prosjekt";
      map.set(proj, (map.get(proj) || 0) + (Number(r.hours) || 0));
    });
    return Array.from(map.entries())
      .map(([project, hours]) => ({ project, hours }))
      .sort((a, b) => b.hours - a.hours);
  }, [rows]);

  const totalHours = rows.reduce((s, r) => s + (Number(r.hours) || 0), 0);
  const employeeCount = byEmployee.length;

  const handleExport = () => {
    exportTimeEntriesToExcel(
      rows.map((r) => ({ ...r, hours: Number(r.hours) })) as any,
      company?.name || "Bedrift",
      period.start,
      period.end
    );
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
              Timer per ansatt og prosjekt for valgt lønnsperiode.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4 mr-1" /> Lønnsperiode
            </Button>
            <Button size="sm" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Last ned Excel
            </Button>
          </div>
        </div>

        {/* Period selector */}
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Totale timer</p>
            <p className="text-2xl font-bold">{totalHours.toFixed(2)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Ansatte</p>
            <p className="text-2xl font-bold">{employeeCount}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Registreringer</p>
            <p className="text-2xl font-bold">{rows.length}</p>
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
              <CardHeader><CardTitle className="text-base">Timer per ansatt og prosjekt</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Laster…</p>
                ) : byEmployee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen timer i perioden.</p>
                ) : (
                  <div className="space-y-4">
                    {byEmployee.map((e) => (
                      <div key={e.user_id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{e.user_name}</p>
                          <Badge variant="secondary">{e.total.toFixed(2)} t</Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Prosjekt</TableHead>
                              <TableHead className="text-right">Timer</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.from(e.perProject.entries())
                              .sort((a, b) => b[1] - a[1])
                              .map(([proj, h]) => (
                                <TableRow key={proj}>
                                  <TableCell>{proj}</TableCell>
                                  <TableCell className="text-right">{h.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader><CardTitle className="text-base">Totalt timer per prosjekt</CardTitle></CardHeader>
              <CardContent>
                {byProject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen timer i perioden.</p>
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
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detail">
            <Card>
              <CardHeader><CardTitle className="text-base">Alle registreringer</CardTitle></CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen timer i perioden.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dato</TableHead>
                        <TableHead>Ansatt</TableHead>
                        <TableHead>Prosjekt</TableHead>
                        <TableHead>Beskrivelse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Timer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{format(parseISO(r.entry_date), "dd.MM.yyyy")}</TableCell>
                          <TableCell>{r.user_name}</TableCell>
                          <TableCell>{r.project_name || "-"}</TableCell>
                          <TableCell className="max-w-[280px] truncate">{r.description || "-"}</TableCell>
                          <TableCell>{r.status}</TableCell>
                          <TableCell className="text-right">{Number(r.hours).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
                : `Periode: ${startDay}. forrige måned – ${startDay - 1}. inneværende måned. Brukes til å beregne lønn utbetalt den 1.`}
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
    </AppLayout>
  );
}
