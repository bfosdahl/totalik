import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCcw, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface DeletedItem {
  id: string;
  table_name: string;
  record_id: string;
  old_data: any;
  company_id: string;
  created_at: string;
  changed_by: string;
}

const TABLE_LABELS: Record<string, string> = {
  company_ks_routines: "Rutine",
  deviations: "Avvik",
  company_action_plans: "Handlingsplan",
  company_goals: "Målsetting",
  company_modules: "Modul",
  company_ks_documents: "Dokument",
  ks_module2_projects: "Prosjekt",
  audits: "Revisjon",
  ik_hms_stoffkartotek: "Stoffkartotek",
};

function getItemName(item: DeletedItem): string {
  const data = item.old_data;
  if (!data) return "Ukjent";
  return data.title || data.routine_name || data.project_name || data.document_name || data.goal_text || data.product_name || data.module_type || "Ukjent";
}

export default function AdminTrashBin() {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [restoring, setRestoring] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("action", "SOFT_DELETE")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setDeletedItems((data || []) as DeletedItem[]);
    } catch (error) {
      console.error("Error fetching deleted items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    setRestoring(item.id);
    try {
      const { error } = await supabase
        .from(item.table_name as any)
        .update({ is_deleted: false, deleted_at: null, deleted_by: null })
        .eq("id", item.record_id);

      if (error) throw error;

      toast({ title: "Gjenopprettet", description: `${TABLE_LABELS[item.table_name] || item.table_name} ble gjenopprettet.` });
      setDeletedItems(prev => prev.filter(i => i.id !== item.id));
    } catch (error) {
      console.error("Error restoring item:", error);
      toast({ title: "Feil", description: "Kunne ikke gjenopprette elementet.", variant: "destructive" });
    } finally {
      setRestoring(null);
    }
  };

  const filtered = deletedItems.filter(item => {
    const matchesSearch = !search || getItemName(item).toLowerCase().includes(search.toLowerCase());
    const matchesTable = tableFilter === "all" || item.table_name === tableFilter;
    return matchesSearch && matchesTable;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trash2 className="w-6 h-6 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Papirkurv</h1>
          <p className="text-sm text-muted-foreground">Gjenopprett slettet innhold fra alle bedrifter</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Søk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alle typer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {Object.entries(TABLE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Laster...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Papirkurven er tom</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">{TABLE_LABELS[item.table_name] || item.table_name}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(item.created_at), "dd.MM.yyyy HH:mm", { locale: nb })}
                  </span>
                </div>
                <p className="font-medium truncate">{getItemName(item)}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(item)}
                disabled={restoring === item.id}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {restoring === item.id ? "Gjenoppretter..." : "Gjenopprett"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
