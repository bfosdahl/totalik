import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { FileText, Filter, Users, Download, ExternalLink, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ReportRow {
  id: string;
  report_number: string;
  report_date: string;
  project_id: string | null;
  project_name: string;
  user_id: string;
  user_name: string;
  status: string;
  submitted_at: string | null;
  work_description: string | null;
  own_crew_count: number | null;
}

export default function Ks2DagsrapportOversikt() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const navigate = useNavigate();
  const canSee = isCompanyAdmin || isSystemAdmin;
  const companyId = profile?.company_id;

  const [preset, setPreset] = useState<Preset>("this_month");
  const [{ start, end }, setRange] = useState(presetRange("this_month"));
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") setRange(presetRange(p));
  };

  const { data, isLoading } = useQuery({
    queryKey: ["ks-daily-reports-overview", companyId, start, end],
    enabled: !!companyId && canSee,
    queryFn: async (): Promise<ReportRow[]> => {
      const { data: reports, error } = await supabase
        .from("ks_daily_reports" as any)
        .select("id, report_number, report_date, project_id, user_id, user_name, status, submitted_at, work_description, own_crew_count")
        .eq("company_id", companyId)
        .gte("report_date", start)
        .lte("report_date", end)
        .order("report_date", { ascending: false });
      if (error) throw error;
      const list = (reports || []) as any[];

      const projectIds = Array.from(new Set(list.map((r) => r.project_id).filter(Boolean)));
      const projMap = new Map<string, string>();
      if (projectIds.length > 0) {
        const { data: projs } = await supabase
          .from("ks_module2_projects")
          .select("id, project_name, project_number")
          .in("id", projectIds);
        (projs || []).forEach((p: any) => {
          projMap.set(p.id, p.project_name || p.project_number || "Ukjent prosjekt");
        });
      }

      return list.map((r) => ({
        ...r,
        project_name: r.project_id ? (projMap.get(r.project_id) || "Ukjent prosjekt") : "(uten prosjekt)",
      })) as ReportRow[];
    },
  });

  const rows = data || [];

  const projects = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => { if (r.project_id) m.set(r.project_id, r.project_name); });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1], "nb"));
  }, [rows]);

  const users = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.user_id, r.user_name || "Ukjent"));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1], "nb"));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (projectFilter !== "all" && r.project_id !== projectFilter) return false;
      if (userFilter !== "all" && r.user_id !== userFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!(
          r.user_name?.toLowerCase().includes(q) ||
          r.project_name?.toLowerCase().includes(q) ||
          r.report_number?.toLowerCase().includes(q) ||
          r.work_description?.toLowerCase().includes(q)
        )) return false;
      }
      return true;
    });
  }, [rows, projectFilter, userFilter, statusFilter, search]);

  const totals = useMemo(() => {
    const submitted = filtered.filter((r) => r.status === "submitted").length;
    const draft = filtered.filter((r) => r.status === "draft").length;
    return { total: filtered.length, submitted, draft };
  }, [filtered]);

  const perUser = useMemo(() => {
    const m = new Map<string, { user_name: string; total: number; submitted: number; draft: number; last: string | null }>();
    for (const r of filtered) {
      const cur = m.get(r.user_id) || { user_name: r.user_name || "Ukjent", total: 0, submitted: 0, draft: 0, last: null };
      cur.total += 1;
      if (r.status === "submitted") cur.submitted += 1;
      else if (r.status === "draft") cur.draft += 1;
      if (!cur.last || r.report_date > cur.last) cur.last = r.report_date;
      m.set(r.user_id, cur);
    }
    return Array.from(m.entries())
      .map(([user_id, v]) => ({ user_id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const perProject = useMemo(() => {
    const m = new Map<string, { project_name: string; total: number; submitted: number; draft: number }>();
    for (const r of filtered) {
      const key = r.project_id || "_none";
      const cur = m.get(key) || { project_name: r.project_name, total: 0, submitted: 0, draft: 0 };
      cur.total += 1;
      if (r.status === "submitted") cur.submitted += 1;
      else if (r.status === "draft") cur.draft += 1;
      m.set(key, cur);
    }
    return Array.from(m.entries())
      .map(([project_id, v]) => ({ project_id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const exportCsv = () => {
    const header = ["Dato", "Rapport", "Prosjekt", "Person", "Status", "Innsendt", "Egne ansatte", "Beskrivelse"];
    const lines = [header.join(";")];
    for (const r of filtered) {
      lines.push([
        r.report_date,
        r.report_number,
        (r.project_name || "").replace(/;/g, ","),
        (r.user_name || "").replace(/;/g, ","),
        r.status,
        r.submitted_at ? format(new Date(r.submitted_at), "yyyy-MM-dd HH:mm") : "",
        r.own_crew_count ?? "",
        (r.work_description || "").replace(/;/g, ",").replace(/\n/g, " "),
      ].join(";"));
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dagsrapporter_${start}_${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV lastet ned");
  };

  if (!canSee) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Du har ikke tilgang til dagsrapport-oversikten.
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
              <FileText className="h-7 w-7 text-primary" />
              Dagsrapporter — oversikt
            </h1>
            <p className="text-muted-foreground mt-1">
              Alle dagsrapporter på tvers av prosjekter. Følg opp hvem som har skrevet — og hvem som mangler.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" /> CSV
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
                <Button key={p} variant={preset === p ? "default" : "outline"} size="sm" onClick={() => handlePreset(p)}>
                  {{ this_week: "Denne uken", last_week: "Forrige uke", this_month: "Denne måned", last_month: "Forrige måned", custom: "Egendefinert" }[p]}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Fra</Label>
                <Input type="date" value={start} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, start: e.target.value })); }} />
              </div>
              <div>
                <Label className="text-xs">Til</Label>
                <Input type="date" value={end} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, end: e.target.value })); }} />
              </div>
              <div>
                <Label className="text-xs">Prosjekt</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle prosjekter</SelectItem>
                    {projects.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Person</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle personer</SelectItem>
                    {users.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statuser</SelectItem>
                    <SelectItem value="submitted">Innsendt</SelectItem>
                    <SelectItem value="draft">Utkast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Søk</Label>
                <Input placeholder="Prosjekt, person, rapportnr..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SummaryCard label="Rapporter totalt" value={totals.total} loading={isLoading} icon={<FileText className="h-4 w-4" />} />
          <SummaryCard label="Innsendt" value={totals.submitted} loading={isLoading} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
          <SummaryCard label="Utkast" value={totals.draft} loading={isLoading} tone="warning" icon={<Clock className="h-4 w-4" />} />
        </div>

        {/* Per person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Per person ({perUser.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : perUser.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">Ingen rapporter i perioden</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                      <th className="py-2 px-2">Person</th>
                      <th className="py-2 px-2 text-right">Totalt</th>
                      <th className="py-2 px-2 text-right">Innsendt</th>
                      <th className="py-2 px-2 text-right">Utkast</th>
                      <th className="py-2 px-2">Siste rapport</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perUser.map((p) => (
                      <tr key={p.user_id} className="border-b hover:bg-muted/30">
                        <td className="py-2.5 px-2 font-medium">{p.user_name}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-semibold">{p.total}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-emerald-600">{p.submitted}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-orange-600">{p.draft}</td>
                        <td className="py-2.5 px-2 text-muted-foreground">
                          {p.last ? format(parseISO(p.last), "d. MMM yyyy", { locale: nb }) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Per prosjekt ({perProject.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : perProject.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">Ingen rapporter i perioden</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                      <th className="py-2 px-2">Prosjekt</th>
                      <th className="py-2 px-2 text-right">Totalt</th>
                      <th className="py-2 px-2 text-right">Innsendt</th>
                      <th className="py-2 px-2 text-right">Utkast</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {perProject.map((p) => (
                      <tr key={p.project_id} className="border-b hover:bg-muted/30">
                        <td className="py-2.5 px-2 font-medium">{p.project_name}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-semibold">{p.total}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-emerald-600">{p.submitted}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-orange-600">{p.draft}</td>
                        <td className="py-2.5 px-2 text-right">
                          {p.project_id !== "_none" && (
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/ks/project/${p.project_id}/dagsrapport`)}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All reports table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Alle rapporter ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/60" />
                Ingen rapporter matcher filtrene
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                      <th className="py-2 px-2">Dato</th>
                      <th className="py-2 px-2">Rapport</th>
                      <th className="py-2 px-2">Prosjekt</th>
                      <th className="py-2 px-2">Person</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="py-2.5 px-2 whitespace-nowrap">{format(parseISO(r.report_date), "d. MMM", { locale: nb })}</td>
                        <td className="py-2.5 px-2 font-mono text-xs">{r.report_number}</td>
                        <td className="py-2.5 px-2">{r.project_name}</td>
                        <td className="py-2.5 px-2">{r.user_name}</td>
                        <td className="py-2.5 px-2">
                          {r.status === "submitted" ? (
                            <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Innsendt</Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Utkast</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {r.project_id && (
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/ks/project/${r.project_id}/dagsrapport`)}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
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

function SummaryCard({
  label,
  value,
  loading,
  tone,
  icon,
}: {
  label: string;
  value?: number;
  loading: boolean;
  tone?: "success" | "warning";
  icon?: React.ReactNode;
}) {
  const toneClass = tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-orange-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-16 mt-1" />
        ) : (
          <p className={`text-2xl font-bold ${toneClass}`}>{(value ?? 0).toLocaleString("nb-NO")}</p>
        )}
      </CardContent>
    </Card>
  );
}
