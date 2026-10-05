import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Shirt, Wrench, HardHat, Package, Loader2, Undo2, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { getLocalDateString } from "@/lib/dateUtils";
import { safeFormatDate } from "@/utils/safeFormatDate";
import { toast } from "sonner";

type Category = "clothing" | "ppe" | "tool" | "other";
const CATS: Record<Category, { label: string; icon: typeof Shirt }> = {
  clothing: { label: "Klær", icon: Shirt },
  ppe: { label: "Verneutstyr", icon: HardHat },
  tool: { label: "Verktøy", icon: Wrench },
  other: { label: "Annet", icon: Package },
};

interface Item {
  id: string;
  employee_id: string;
  category: Category;
  item_name: string;
  quantity: number;
  size: string | null;
  serial_number: string | null;
  issued_date: string;
  returned_date: string | null;
  notes: string | null;
}

const emptyForm = () => ({
  category: "clothing" as Category,
  item_name: "",
  quantity: 1,
  size: "",
  serial_number: "",
  issued_date: getLocalDateString(),
  notes: "",
});

export default function HrEquipment() {
  const { profile, user } = useAuth();
  const companyId = profile?.company_id;
  const qc = useQueryClient();
  const { users, getUserDisplayName } = useCompanyUsers();
  const [employeeId, setEmployeeId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [showReturned, setShowReturned] = useState(false);

  const key = ["employee-equipment", companyId, employeeId];
  const { data: items = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!companyId && !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employee_equipment")
        .select("id, employee_id, category, item_name, quantity, size, serial_number, issued_date, returned_date, notes")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("is_deleted", false)
        .order("issued_date", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        category: form.category,
        item_name: form.item_name.trim(),
        quantity: Math.max(1, Number(form.quantity) || 1),
        size: form.size.trim() || null,
        serial_number: form.serial_number.trim() || null,
        issued_date: form.issued_date,
        notes: form.notes.trim() || null,
      };
      const q = editing
        ? (supabase as any).from("employee_equipment").update(payload).eq("id", editing.id)
        : (supabase as any).from("employee_equipment").insert({ ...payload, company_id: companyId, employee_id: employeeId, created_by: user?.id });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success(editing ? "Oppdatert" : "Lagt til");
      setOpen(false);
    },
    onError: (e: any) => toast.error("Kunne ikke lagre: " + e.message),
  });

  const exportList = async (scope: "one" | "all", fmt: "pdf" | "xlsx") => {
    try {
      let q = (supabase as any)
        .from("employee_equipment")
        .select("employee_id, category, item_name, quantity, size, serial_number, issued_date, returned_date, notes")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("issued_date", { ascending: false });
      if (scope === "one") q = q.eq("employee_id", employeeId);
      const { data, error } = await q;
      if (error) throw error;
      const nameOf = (id: string) => {
        const u = users.find((x) => x.id === id);
        return u ? getUserDisplayName(u) : "Ukjent";
      };
      const rows = ((data || []) as Item[])
        .map((i) => ({
          Ansatt: nameOf(i.employee_id),
          Type: CATS[i.category]?.label ?? i.category,
          Utstyr: i.item_name,
          Antall: i.quantity,
          Størrelse: i.size || "",
          Serienr: i.serial_number || "",
          Utdelt: safeFormatDate(i.issued_date, "dd.MM.yyyy"),
          Status: i.returned_date ? `Levert ${safeFormatDate(i.returned_date, "dd.MM.yyyy")}` : "Hos ansatt",
          Notat: i.notes || "",
        }))
        .sort((a, b) => a.Ansatt.localeCompare(b.Ansatt, "nb"));
      if (!rows.length) { toast.info("Ingen utstyr å laste ned"); return; }
      const base = scope === "one" ? `utstyr-${nameOf(employeeId)}` : "utstyr-alle-ansatte";
      const file = `${base.replace(/[^a-zA-Z0-9æøåÆØÅ-]+/g, "_")}-${getLocalDateString()}`;
      if (fmt === "xlsx") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Utstyr");
        XLSX.writeFile(wb, `${file}.xlsx`);
      } else {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(16);
        doc.text(scope === "one" ? `Utstyr og klær – ${nameOf(employeeId)}` : "Utstyr og klær – alle ansatte", 14, 16);
        doc.setFontSize(9);
        doc.text(`Utskrevet ${safeFormatDate(getLocalDateString(), "dd.MM.yyyy")}`, 14, 22);
        const cols = Object.keys(rows[0]).filter((c) => scope === "all" || c !== "Ansatt");
        autoTable(doc, {
          startY: 27,
          head: [cols],
          body: rows.map((r) => cols.map((c) => String((r as any)[c]))),
          styles: { fontSize: 8 },
        });
        doc.save(`${file}.pdf`);
      }
    } catch (e: any) {
      toast.error("Kunne ikke laste ned: " + e.message);
    }
  };

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await (supabase as any).from("employee_equipment").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const active = items.filter((i) => !i.returned_date);
  const returned = items.filter((i) => i.returned_date);
  const summary = useMemo(() => {
    const s: Record<Category, number> = { clothing: 0, ppe: 0, tool: 0, other: 0 };
    active.forEach((i) => (s[i.category] += i.quantity));
    return s;
  }, [active]);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (i: Item) => {
    setEditing(i);
    setForm({
      category: i.category, item_name: i.item_name, quantity: i.quantity,
      size: i.size || "", serial_number: i.serial_number || "",
      issued_date: i.issued_date, notes: i.notes || "",
    });
    setOpen(true);
  };

  const renderRow = (i: Item) => {
    const Icon = CATS[i.category]?.icon || Package;
    return (
      <div key={i.id} className="flex items-start gap-3 py-3 border-b last:border-0">
        <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium break-words">
            {i.quantity > 1 && <span className="text-muted-foreground">{i.quantity} × </span>}
            {i.item_name}
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
            <span>Utdelt {safeFormatDate(i.issued_date)}</span>
            {i.size && <span>Str. {i.size}</span>}
            {i.serial_number && <span>Serienr. {i.serial_number}</span>}
            {i.returned_date && <span>Levert tilbake {safeFormatDate(i.returned_date)}</span>}
          </div>
          {i.notes && <div className="text-xs text-muted-foreground mt-1">{i.notes}</div>}
        </div>
        <div className="flex shrink-0">
          {!i.returned_date ? (
            <Button variant="ghost" size="icon" title="Levert tilbake"
              onClick={() => patch.mutate({ id: i.id, values: { returned_date: getLocalDateString() } })}>
              <Undo2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" title="Angre retur"
              onClick={() => patch.mutate({ id: i.id, values: { returned_date: null } })}>
              <Undo2 className="h-4 w-4 rotate-180" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => {
            if (confirm(`Slette «${i.item_name}»?`))
              patch.mutate({ id: i.id, values: { is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id } });
          }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <HardHat className="h-7 w-7 text-primary" /> Utstyr og klær
          </h1>
          <p className="text-muted-foreground mt-1">Oversikt over klær, verneutstyr og verktøy hver ansatt har fått utdelt.</p>
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row gap-3">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Velg ansatt" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{getUserDisplayName(u)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openNew} disabled={!employeeId} className="gap-2">
              <Plus className="h-4 w-4" /> Legg til utstyr
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Last ned</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={!employeeId} onClick={() => exportList("one", "pdf")}>Valgt ansatt – PDF</DropdownMenuItem>
                <DropdownMenuItem disabled={!employeeId} onClick={() => exportList("one", "xlsx")}>Valgt ansatt – Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportList("all", "pdf")}>Alle ansatte – PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportList("all", "xlsx")}>Alle ansatte – Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {employeeId && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(CATS) as Category[]).map((c) => {
                const Icon = CATS[c].icon;
                return (
                  <Card key={c}><CardContent className="p-4 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div><div className="text-xl font-bold">{summary[c]}</div>
                      <div className="text-xs text-muted-foreground">{CATS[c].label}</div></div>
                  </CardContent></Card>
                );
              })}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Utdelt nå ({active.length})</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  : active.length === 0 ? <p className="text-sm text-muted-foreground">Ingenting registrert ennå.</p>
                  : (Object.keys(CATS) as Category[]).map((c) => {
                      const list = active.filter((i) => i.category === c);
                      if (!list.length) return null;
                      return (
                        <div key={c} className="mb-4">
                          <Badge variant="secondary" className="mb-1">{CATS[c].label}</Badge>
                          {list.map(renderRow)}
                        </div>
                      );
                    })}
              </CardContent>
            </Card>

            {returned.length > 0 && (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Levert tilbake ({returned.length})</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowReturned((v) => !v)}>
                    {showReturned ? "Skjul" : "Vis"}
                  </Button>
                </CardHeader>
                {showReturned && <CardContent>{returned.map(renderRow)}</CardContent>}
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>{editing ? "Rediger utstyr" : "Legg til utstyr"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATS) as Category[]).map((c) => <SelectItem key={c} value={c}>{CATS[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hva er utdelt *</Label>
              <Input value={form.item_name} placeholder={form.category === "tool" ? "F.eks. Vinkelsliper Milwaukee" : "F.eks. Regnjakke HH med bukse"}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Antall</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div><Label>Dato utdelt</Label>
                <Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
            </div>
            {form.category === "tool" ? (
              <div><Label>Serienummer</Label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
            ) : (
              <div><Label>Størrelse</Label>
                <Input value={form.size} placeholder="F.eks. L" onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
            )}
            <div><Label>Notat</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={() => save.mutate()} disabled={!form.item_name.trim() || save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
