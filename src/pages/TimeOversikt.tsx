import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock, Download, Users, Filter, FileSpreadsheet } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminHoursSummary } from "@/hooks/useAdminHoursSummary";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  exportPayrollGeneric,
  type PayrollTimeEntry,
  type EmployeeSummary,
  type AllowanceDetailRow,
} from "@/utils/timeEntryExport";

type Preset = "this_week" | "last_week" | "this_month" | "last_month" | "custom";

function presetRange(p: Preset): { start: string; end: string } {
  const now = new Date();
  switch (p) {
    case "this_week":
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    case "last_week": {
      const lw = subWeeks(now, 1);
      return { start: format(startOfWeek(lw, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(lw, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    }
    case "last_month": {
      const lm = subMonths(now, 1);
      return { start: format(startOfMonth(lm), "yyyy-MM-dd"), end: format(endOfMonth(lm), "yyyy-MM-dd") };
    }
    case "this_month":
    default:
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
  }
}

export default function TimeOversikt() {
  const { isCompanyAdmin, isSystemAdmin, profile, company } = useAuth();
  const navigate = useNavigate();
  const [preset, setPreset] = useState<Preset>("this_month");
  const [{ start, end }, setRange] = useState(presetRange("this_month"));
  // Default til kun godkjente timer siden oversikten brukes til lønnsgrunnlag
  const [onlyApproved, setOnlyApproved] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useAdminHoursSummary({ startDate: start, endDate: end, onlyApproved });

  const canSee = isCompanyAdmin || isSystemAdmin;

  const rows = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.perPerson;
    const q = search.toLowerCase();
    return data.perPerson.filter((p) => p.user_name.toLowerCase().includes(q));
  }, [data, search]);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") setRange(presetRange(p));
  };

  const exportCsv = () => {
    if (!data) return;
    const header = ["Person", "Normal", "50% overtid", "100% overtid", "Totalt"];
    const lines = [header.join(";")];
    for (const r of rows) {
      lines.push([r.user_name, r.normal, r.overtime_50, r.overtime_100, r.total].join(";"));
    }
    lines.push(["TOTALT", data.totals.normal, data.totals.overtime_50, data.totals.overtime_100, data.totals.total].join(";"));
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timer_${start}_${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV lastet ned");
  };

  const exportXlsx = async () => {
    if (!profile?.company_id) return;
    setExporting(true);
    try {
      // Hent registreringer
      let q = supabase
        .from("time_entries")
        .select("id, user_id, user_name, entry_date, hours, start_time, end_time, project_name, description, status, approved_by_name, approved_at, hour_type, overtime_segments")
        .eq("company_id", profile.company_id)
        .gte("entry_date", start)
        .lte("entry_date", end);
      if (onlyApproved) q = q.eq("status", "approved");
      const { data: entries, error } = await q.order("entry_date", { ascending: true });
      if (error) throw error;

      const entryList = (entries || []) as any[];
      // Filtrer på søk hvis aktivt
      const filtered = search.trim()
        ? entryList.filter((e) => (e.user_name || "").toLowerCase().includes(search.toLowerCase()))
        : entryList;

      // Hent tillegg
      const ids = filtered.map((r) => r.id);
      const allowances: AllowanceDetailRow[] = [];
      const allowanceByEntry = new Map<string, number>();
      if (ids.length > 0) {
        const { data: allowData } = await supabase
          .from("time_entry_allowances")
          .select("time_entry_id, amount, type_name, unit, quantity, rate_snapshot, notes")
          .in("time_entry_id", ids);
        (allowData || []).forEach((a: any) => {
          const r = filtered.find((x) => x.id === a.time_entry_id);
          if (!r) return;
          allowanceByEntry.set(a.time_entry_id, (allowanceByEntry.get(a.time_entry_id) || 0) + Number(a.amount || 0));
          allowances.push({
            time_entry_id: a.time_entry_id,
            user_name: r.user_name,
            entry_date: r.entry_date,
            type_name: a.type_name || "(uten type)",
            unit: a.unit || "",
            quantity: Number(a.quantity) || 0,
            rate_snapshot: Number(a.rate_snapshot) || 0,
            amount: Number(a.amount) || 0,
            notes: a.notes,
          });
        });
      }

      // Hent timesatser + ansattnummer
      const userIds = Array.from(new Set(filtered.map((r) => r.user_id)));
      const empMeta = new Map<string, { rate: number | null; emp_no: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, hourly_rate, employee_number")
          .in("user_id", userIds);
        (profs || []).forEach((p: any) => {
          empMeta.set(p.user_id, {
            rate: p.hourly_rate != null ? Number(p.hourly_rate) : null,
            emp_no: p.employee_number ?? null,
          });
        });
      }

      // Bygg PayrollTimeEntry[] og EmployeeSummary[]
      const payrollEntries: PayrollTimeEntry[] = filtered.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.user_name,
        entry_date: r.entry_date,
        hours: Number(r.hours) || 0,
        start_time: r.start_time,
        end_time: r.end_time,
        project_name: r.project_name,
        description: r.description,
        status: r.status,
        approved_by_name: r.approved_by_name,
        approved_at: r.approved_at,
        hour_type: r.hour_type,
        overtime_segments: r.overtime_segments,
        hourly_rate: empMeta.get(r.user_id)?.rate ?? null,
        allowances_amount: allowanceByEntry.get(r.id) || 0,
        is_overtime: !!(r.hour_type && r.hour_type.startsWith("overtime")) || (Array.isArray(r.overtime_segments) && r.overtime_segments.length > 0),
      }));

      const sumMap = new Map<string, EmployeeSummary>();
      payrollEntries.forEach((e) => {
        if (!sumMap.has(e.user_id)) {
          const meta = empMeta.get(e.user_id);
          sumMap.set(e.user_id, {
            user_id: e.user_id,
            user_name: e.user_name,
            employee_number: meta?.emp_no ?? null,
            total_hours: 0,
            normal_hours: 0,
            overtime_50_hours: 0,
            overtime_100_hours: 0,
            overtime_hours: 0,
            hourly_rate: meta?.rate ?? null,
            base_amount: 0,
            allowances_amount: 0,
            total_amount: 0,
          });
        }
        const s = sumMap.get(e.user_id)!;
        const h = Number(e.hours) || 0;
        s.total_hours += h;
        const b = getHourBreakdown(e);
        s.normal_hours = (s.normal_hours || 0) + b.normal;
        s.overtime_50_hours = (s.overtime_50_hours || 0) + b.overtime_50;
        s.overtime_100_hours = (s.overtime_100_hours || 0) + b.overtime_100;
        s.overtime_hours = (s.overtime_hours || 0) + b.overtime_50 + b.overtime_100;
        s.allowances_amount += e.allowances_amount || 0;
      });
      sumMap.forEach((s) => {
        s.base_amount = s.hourly_rate != null ? s.total_hours * s.hourly_rate : 0;
        s.total_amount = s.base_amount + s.allowances_amount;
      });

      exportPayrollGeneric(
        payrollEntries,
        Array.from(sumMap.values()).sort((a, b) => a.user_name.localeCompare(b.user_name, "nb")),
        company?.name || "Bedrift",
        parseISO(start),
        parseISO(end),
        allowances
      );
      toast.success("Excel lastet ned");
    } catch (e: any) {
      console.error(e);
      toast.error("Kunne ikke laste ned Excel: " + (e?.message || "ukjent feil"));
    } finally {
      setExporting(false);
    }
  };

  if (!canSee) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Du har ikke tilgang til timeoversikten.
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Clock className="h-7 w-7 text-primary" />
              Timeoversikt
            </h1>
            <p className="text-muted-foreground mt-1">Alle timer på tvers av prosjekter — lønnsgrunnlag per person</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/time-registration")}>Til timeføring</Button>
            <Button variant="outline" onClick={exportCsv} disabled={!data || rows.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={exportXlsx} disabled={!data || rows.length === 0 || exporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(["this_week", "last_week", "this_month", "last_month", "custom"] as Preset[]).map((p) => (
                <Button
                  key={p}
                  variant={preset === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePreset(p)}
                >
                  {{ this_week: "Denne uken", last_week: "Forrige uke", this_month: "Denne måned", last_month: "Forrige måned", custom: "Egendefinert" }[p]}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Fra</Label>
                <Input type="date" value={start} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, start: e.target.value })); }} />
              </div>
              <div>
                <Label className="text-xs">Til</Label>
                <Input type="date" value={end} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, end: e.target.value })); }} />
              </div>
              <div>
                <Label className="text-xs">Søk person</Label>
                <Input placeholder="Navn..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="only-approved" checked={onlyApproved} onCheckedChange={setOnlyApproved} />
              <Label htmlFor="only-approved" className="text-sm cursor-pointer">Kun godkjente timer</Label>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Normaltimer" value={data?.totals.normal} loading={isLoading} />
          <SummaryCard label="50% overtid" value={data?.totals.overtime_50} loading={isLoading} tone="warning" />
          <SummaryCard label="100% overtid" value={data?.totals.overtime_100} loading={isLoading} tone="destructive" />
          <SummaryCard label="Totalt" value={data?.totals.total} loading={isLoading} bold />
        </div>

        {/* Per person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Per person ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : rows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Ingen timer registrert i valgt periode
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                      <th className="py-2 px-2">Person</th>
                      <th className="py-2 px-2 text-right">Normal</th>
                      <th className="py-2 px-2 text-right">50%</th>
                      <th className="py-2 px-2 text-right">100%</th>
                      <th className="py-2 px-2 text-right font-semibold">Totalt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.user_id} className="border-b hover:bg-muted/30">
                        <td className="py-2.5 px-2 font-medium">{r.user_name}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{r.normal.toFixed(1)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-orange-600">{r.overtime_50.toFixed(1)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-red-600">{r.overtime_100.toFixed(1)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-semibold">{r.total.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Periode: {format(new Date(start), "d. MMM yyyy", { locale: nb })} – {format(new Date(end), "d. MMM yyyy", { locale: nb })}
        </p>
      </div>
    </AppLayout>
  );
}

function SummaryCard({ label, value, loading, tone, bold }: { label: string; value?: number; loading: boolean; tone?: "warning" | "destructive"; bold?: boolean }) {
  const toneClass =
    tone === "warning" ? "text-orange-600" : tone === "destructive" ? "text-red-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-20 mt-1" />
        ) : (
          <p className={`text-2xl ${bold ? "font-extrabold" : "font-bold"} ${toneClass}`}>
            {(value ?? 0).toLocaleString("nb-NO", { maximumFractionDigits: 1 })}
            <span className="text-sm font-normal text-muted-foreground ml-1">t</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
