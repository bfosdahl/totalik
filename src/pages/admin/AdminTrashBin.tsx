import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCcw, Search, Calendar, History, Eye, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface AuditItem {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: any;
  new_data: any;
  company_id: string | null;
  created_at: string;
  changed_by: string | null;
}

interface SnapshotItem {
  id: string;
  table_name: string;
  record_id: string;
  snapshot_data: any;
  company_id: string | null;
  created_at: string;
  created_by: string | null;
  reason: string | null;
}

const TABLE_LABELS: Record<string, string> = {
  company_routines: "HMS-rutine",
  customer_routine_instances: "Kunde-rutine",
  company_ks_routines: "KS-rutine",
  ks_module2_routines: "Prosjekt-rutine",
  ik_alkohol_routines: "Alkohol-rutine",
  deviations: "Avvik",
  ks_module2_avvik: "Prosjekt-avvik",
  company_action_plans: "Handlingsplan",
  company_goals: "Mål",
  company_modules: "Modul",
  company_ks_documents: "KS-dokument",
  company_module_documents: "Modul-dokument",
  ik_hms_company_documents: "HMS-dokument",
  ks_module2_projects: "KS-Prosjekt",
  audits: "Revisjon",
  audit_form_responses: "Revisjon-svar",
  ik_hms_stoffkartotek: "Stoffkartotek",
  company_chemical_entries: "Kjemikalium",
  hms_sja: "SJA",
  hms_sja_templates: "SJA-mal",
  hms_forsvarlighetsvurderinger: "Forsvarlighetsvurdering",
  hms_self_declarations: "Egenerklæring",
  ks_module2_sja: "Prosjekt-SJA",
  ks_module2_meetings: "Møte",
  ks_module2_change_orders: "Endringsmelding",
  ks_module2_claims: "Reklamasjon",
  ks_daily_reports: "Dagsrapport",
  ks_change_orders: "Endringsordre",
  ks_calculations: "Kalkyle",
  fdv_buildings: "FDV-bygg",
  fdv_controls: "FDV-kontroll",
  fdv_documents: "FDV-dokument",
  fdv_floor_plans: "FDV-tegning",
  employee_documents: "Ansatt-dok",
  employee_courses: "Kurs",
  employee_meetings: "Medarbeidersamtale",
  hr_meetings: "HR-møte",
  hms_card_requests: "HMS-kort søknad",
  driving_log_entries: "Kjørebok",
  company_departments: "Avdeling",
  company_organization: "Organisasjon",
  company_ks_organization: "KS-organisasjon",
  ik_alkohol_organization: "Alkohol-organisasjon",
  ik_alkohol_controls: "Alkohol-kontroll",
  ik_alkohol_incidents: "Alkohol-hendelse",
  ik_alkohol_training_records: "Alkohol-opplæring",
  ik_mat_custom_checklists: "MAT-sjekkliste",
  ik_mat_scheduled_tasks: "MAT-oppgave",
  ik_mat_temperature_logs: "Temperaturlogg",
  ik_mat_suppliers: "Leverandør",
};

function getItemName(data: any): string {
  if (!data) return "Ukjent";
  return (
    data.title || data.name || data.routine_name || data.project_name ||
    data.document_name || data.goal_text || data.product_name || data.module_type ||
    data.subject || data.description?.slice(0, 60) || data.deviation_number ||
    data.audit_number || data.report_number || data.template_name || data.id?.slice(0, 8) || "Ukjent"
  );
}

const ACTION_LABEL: Record<string, { label: string; variant: any }> = {
  DELETE: { label: "Slettet", variant: "destructive" },
  SOFT_DELETE: { label: "Slettet (mykt)", variant: "destructive" },
};

export default function AdminTrashBin() {
  const [tab, setTab] = useState("deleted");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [restores, setRestores] = useState<AuditItem[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState("90");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => {
      setCompanies((data as any) || []);
    });
  }, []);

  useEffect(() => {
    fetchData();
    setSelected(new Set());
  }, [tab, daysFilter, companyFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const since = new Date(Date.now() - parseInt(daysFilter) * 86400000).toISOString();
      if (tab === "deleted") {
        let q = supabase.from("audit_log").select("*").in("action", ["DELETE", "SOFT_DELETE"])
          .gte("created_at", since).order("created_at", { ascending: false }).limit(500);
        if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
        const { data, error } = await q;
        if (error) throw error;
        setItems((data || []) as AuditItem[]);
      } else if (tab === "snapshots") {
        let q = supabase.from("content_snapshots").select("*")
          .gte("created_at", since).order("created_at", { ascending: false }).limit(500);
        if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
        const { data, error } = await q;
        if (error) throw error;
        setSnapshots((data || []) as SnapshotItem[]);
      } else {
        let q = supabase.from("audit_log").select("*").in("action", ["RESTORE", "RESTORE_SNAPSHOT"])
          .gte("created_at", since).order("created_at", { ascending: false }).limit(200);
        if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
        const { data, error } = await q;
        if (error) throw error;
        setRestores((data || []) as AuditItem[]);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Feil ved henting", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreOne = async (item: AuditItem): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc("restore_deleted_record" as any, { p_audit_log_id: item.id });
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error(e);
      toast({ title: `Feil: ${TABLE_LABELS[item.table_name] || item.table_name}`, description: e.message, variant: "destructive" });
      return false;
    }
  };

  const restoreSnapshot = async (snap: SnapshotItem): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc("restore_snapshot" as any, { p_snapshot_id: snap.id });
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error(e);
      toast({ title: "Feil ved gjenoppretting", description: e.message, variant: "destructive" });
      return false;
    }
  };

  const handleBulkRestore = async () => {
    setBusy(true);
    let ok = 0, fail = 0;
    if (tab === "deleted") {
      for (const item of items.filter(i => selected.has(i.id))) {
        (await restoreOne(item)) ? ok++ : fail++;
      }
    } else if (tab === "snapshots") {
      for (const snap of snapshots.filter(s => selected.has(s.id))) {
        (await restoreSnapshot(snap)) ? ok++ : fail++;
      }
    }
    setBusy(false);
    toast({ title: "Gjenoppretting fullført", description: `${ok} OK · ${fail} feilet` });
    setSelected(new Set());
    fetchData();
  };

  const filteredItems = useMemo(() => items.filter(item => {
    const matchSearch = !search || JSON.stringify(item.old_data || {}).toLowerCase().includes(search.toLowerCase());
    const matchTable = tableFilter === "all" || item.table_name === tableFilter;
    return matchSearch && matchTable;
  }), [items, search, tableFilter]);

  const filteredSnaps = useMemo(() => snapshots.filter(s => {
    const matchSearch = !search || JSON.stringify(s.snapshot_data || {}).toLowerCase().includes(search.toLowerCase());
    const matchTable = tableFilter === "all" || s.table_name === tableFilter;
    return matchSearch && matchTable;
  }), [snapshots, search, tableFilter]);

  const allTables = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => set.add(i.table_name));
    snapshots.forEach(s => set.add(s.table_name));
    return Array.from(set).sort();
  }, [items, snapshots]);

  const companyName = (id: string | null) => companies.find(c => c.id === id)?.name || (id ? id.slice(0, 8) : "—");

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const visible = tab === "deleted" ? filteredItems : tab === "snapshots" ? filteredSnaps : restores;
  const toggleAll = () => {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map(v => v.id)));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Trash2 className="w-6 h-6 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Papirkurv</h1>
          <p className="text-sm text-muted-foreground">Gjenopprett slettet eller endret innhold fra alle bedrifter (siste 90 dager)</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="deleted"><Trash2 className="w-4 h-4 mr-1" />Slettede rader</TabsTrigger>
          <TabsTrigger value="snapshots"><History className="w-4 h-4 mr-1" />Tidligere versjoner</TabsTrigger>
          <TabsTrigger value="history"><RotateCcw className="w-4 h-4 mr-1" />Gjenopprettings-historikk</TabsTrigger>
        </TabsList>

        <div className="flex gap-3 flex-wrap mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Søk i innhold..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Alle typer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              {allTables.map(t => (
                <SelectItem key={t} value={t}>{TABLE_LABELS[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Alle bedrifter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle bedrifter</SelectItem>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Siste døgn</SelectItem>
              <SelectItem value="7">Siste 7 dager</SelectItem>
              <SelectItem value="30">Siste 30 dager</SelectItem>
              <SelectItem value="90">Siste 90 dager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tab !== "history" && selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 mt-3">
            <span className="text-sm">{selected.size} valgt</span>
            <Button size="sm" onClick={handleBulkRestore} disabled={busy}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Gjenopprett valgte
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Avbryt</Button>
          </div>
        )}

        <TabsContent value="deleted" className="mt-4">
          <ItemList
            isLoading={isLoading}
            items={filteredItems.map(i => ({
              id: i.id, table_name: i.table_name, data: i.old_data,
              created_at: i.created_at, company_id: i.company_id, action: i.action,
            }))}
            selected={selected}
            onToggle={toggleSelect}
            onToggleAll={toggleAll}
            onPreview={d => setPreview(d)}
            onRestore={async id => { const it = items.find(x => x.id === id); if (it && await restoreOne(it)) { toast({ title: "Gjenopprettet" }); fetchData(); } }}
            companyName={companyName}
            busy={busy}
            emptyText="Ingen slettede rader"
          />
        </TabsContent>

        <TabsContent value="snapshots" className="mt-4">
          <ItemList
            isLoading={isLoading}
            items={filteredSnaps.map(s => ({
              id: s.id, table_name: s.table_name, data: s.snapshot_data,
              created_at: s.created_at, company_id: s.company_id, action: "SNAPSHOT",
            }))}
            selected={selected}
            onToggle={toggleSelect}
            onToggleAll={toggleAll}
            onPreview={d => setPreview(d)}
            onRestore={async id => { const s = snapshots.find(x => x.id === id); if (s && await restoreSnapshot(s)) { toast({ title: "Versjon gjenopprettet" }); fetchData(); } }}
            companyName={companyName}
            busy={busy}
            emptyText="Ingen tidligere versjoner"
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {isLoading ? <p className="text-center py-8 text-muted-foreground">Laster...</p> :
           restores.length === 0 ? <p className="text-center py-8 text-muted-foreground">Ingen gjenopprettinger ennå</p> : (
            <div className="space-y-2">
              {restores.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">{r.action === "RESTORE_SNAPSHOT" ? "Versjon" : "Slettet rad"}</Badge>
                      <Badge variant="secondary">{TABLE_LABELS[r.table_name] || r.table_name}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{format(new Date(r.created_at), "dd.MM.yyyy HH:mm", { locale: nb })}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />{companyName(r.company_id)}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{getItemName(r.new_data)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Forhåndsvisning</DialogTitle>
            <DialogDescription>Innhold som ligger lagret</DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(preview, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ListProps {
  isLoading: boolean;
  items: Array<{ id: string; table_name: string; data: any; created_at: string; company_id: string | null; action: string }>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onPreview: (d: any) => void;
  onRestore: (id: string) => void;
  companyName: (id: string | null) => string;
  busy: boolean;
  emptyText: string;
}

function ItemList({ isLoading, items, selected, onToggle, onToggleAll, onPreview, onRestore, companyName, busy, emptyText }: ListProps) {
  if (isLoading) return <p className="text-center py-8 text-muted-foreground">Laster...</p>;
  if (items.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>{emptyText}</p>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
        <Checkbox checked={selected.size > 0 && selected.size === items.length} onCheckedChange={onToggleAll} />
        <span>Velg alle ({items.length})</span>
      </div>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Checkbox checked={selected.has(item.id)} onCheckedChange={() => onToggle(item.id)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">{TABLE_LABELS[item.table_name] || item.table_name}</Badge>
              {item.action === "DELETE" && <Badge variant="destructive" className="text-xs">Hard slettet</Badge>}
              {item.action === "SOFT_DELETE" && <Badge variant="outline" className="text-xs">Mykt slettet</Badge>}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />{format(new Date(item.created_at), "dd.MM.yyyy HH:mm", { locale: nb })}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />{companyName(item.company_id)}
              </span>
            </div>
            <p className="font-medium truncate">{getItemName(item.data)}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onPreview(item.data)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onRestore(item.id)} disabled={busy}>
            <RotateCcw className="w-4 h-4 mr-1" />Gjenopprett
          </Button>
        </div>
      ))}
    </div>
  );
}
