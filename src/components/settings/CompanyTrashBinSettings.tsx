import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trash2,
  RotateCcw,
  Search,
  Calendar,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface TrashItem {
  table_name: string;
  record_id: string;
  company_id: string | null;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_name: string | null;
  display_label: string;
  raw_data: any;
}

const TABLE_LABELS: Record<string, string> = {
  admin_checklist_templates: "Sjekklistemal",
  admin_routine_templates_v2: "Rutinemal",
  company_ks_checklist_templates: "KS-sjekklistemal",
  company_routines: "HMS-rutine",
  ks_module2_routines: "Prosjekt-rutine",
  ks_module2_checklists: "Prosjekt-sjekkliste",
  ks_module2_sja: "Prosjekt-SJA",
  ks_module2_meetings: "Møte",
  ks_module2_change_orders: "Endringsmelding",
  ks_daily_reports: "Dagsrapport",
  hms_sja: "SJA",
  ks_module2_avvik: "Prosjekt-avvik",
  admin_documents: "Admin-dokument",
  company_module_documents: "Modul-dokument",
  audits: "Revisjon",
  company_action_plans: "Handlingsplan",
  company_goals: "Mål",
  company_ks_documents: "KS-dokument",
  company_ks_routines: "KS-rutine",
  company_modules: "Modul",
  company_vehicles: "Kjøretøy",
  deviations: "Avvik",
  ik_hms_stoffkartotek: "Stoffkartotek",
  ks_module2_projects: "Prosjekt",
};

interface Props {
  onBack: () => void;
}

export function CompanyTrashBinSettings({ onBack }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<TrashItem | null>(null);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_trash_items" as any, {
        p_company_id: profile.company_id,
      });
      if (error) throw error;
      const sorted = ((data || []) as TrashItem[]).sort(
        (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
      );
      setItems(sorted);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Kunne ikke laste papirkurv",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.company_id]);

  const handleRestore = async (item: TrashItem) => {
    setBusyId(item.record_id);
    try {
      const { error } = await supabase.rpc("restore_soft_deleted" as any, {
        p_table_name: item.table_name,
        p_record_id: item.record_id,
      });
      if (error) throw error;
      toast({ title: "Gjenopprettet", description: item.display_label });
      setItems((prev) => prev.filter((i) => i.record_id !== item.record_id));
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Kunne ikke gjenopprette",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const allTables = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.table_name));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const matchSearch =
          !search ||
          i.display_label.toLowerCase().includes(search.toLowerCase()) ||
          JSON.stringify(i.raw_data || {})
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchTable = tableFilter === "all" || i.table_name === tableFilter;
        return matchSearch && matchTable;
      }),
    [items, search, tableFilter]
  );

  const daysLeft = (deletedAt: string) => {
    const diff = 90 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Tilbake
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Trash2 className="w-6 h-6 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Papirkurv</h1>
          <p className="text-muted-foreground text-sm">
            Slettet innhold beholdes i 90 dager og kan gjenopprettes
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Alle typer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer ({items.length})</SelectItem>
            {allTables.map((t) => (
              <SelectItem key={t} value={t}>
                {TABLE_LABELS[t] || t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-muted-foreground">Laster...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
          <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Papirkurven er tom</p>
          <p className="text-sm">Ingen slettede elementer akkurat nå</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={`${item.table_name}-${item.record_id}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {TABLE_LABELS[item.table_name] || item.table_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(item.deleted_at), "dd.MM.yyyy HH:mm", {
                      locale: nb,
                    })}
                  </span>
                  {item.deleted_by_name && (
                    <span className="text-xs text-muted-foreground">
                      av {item.deleted_by_name}
                    </span>
                  )}
                  <Badge
                    variant={daysLeft(item.deleted_at) < 14 ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {daysLeft(item.deleted_at)} dager igjen
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">{item.display_label}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreview(item)}
                title="Forhåndsvis"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleRestore(item)}
                disabled={busyId === item.record_id}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Gjenopprett
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{preview?.display_label}</DialogTitle>
            <DialogDescription>
              {preview && TABLE_LABELS[preview.table_name]} – innhold som ligger lagret
            </DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(preview?.raw_data, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
