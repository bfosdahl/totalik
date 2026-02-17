import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Calculator, Trash2, ArrowLeft, Clock, CheckCircle2, Pencil, FolderOpen, Copy, Percent } from "lucide-react";
import { useKsCalculations, useKsCalculationItems, KsCalculation, KsCalculationItem } from "@/hooks/useKsCalculations";
import { useSimpleProjects } from "@/hooks/useSimpleProjects";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const categoryLabels: Record<string, string> = {
  hours: "Timer / Arbeid",
  materials: "Materialer",
  equipment: "Utstyr",
  other: "Annet",
};

const categoryIcons: Record<string, string> = {
  hours: "🕐",
  materials: "🧱",
  equipment: "🔧",
  other: "📦",
};

const unitOptions = ["stk", "m", "m²", "m³", "kg", "liter", "timer", "rs", "pakke"];

export default function KsKalkyler() {
  const { calculations, isLoading, createCalculation, deleteCalculation, updateCalculation, duplicateCalculation } = useKsCalculations();
  const { projects: simpleProjects } = useSimpleProjects();
  const { projects: fullProjects } = useKsModule2Projects();
  const allProjects = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string; number: string; client: string | null }[] = [];
    for (const p of [...fullProjects, ...simpleProjects]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        result.push({ id: p.id, name: p.project_name, number: p.project_number, client: p.client_name });
      }
    }
    return result;
  }, [simpleProjects, fullProjects]);
  const [selectedCalc, setSelectedCalc] = useState<KsCalculation | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createCalculation.mutate(
      { title: newTitle, description: newDesc, client_name: newClient, project_id: newProjectId || undefined },
      {
        onSuccess: (data) => {
          setIsNewOpen(false);
          setNewTitle("");
          setNewDesc("");
          setNewClient("");
          setNewProjectId("");
          setSelectedCalc(data as KsCalculation);
        },
      }
    );
  };

  const handleDuplicate = (calcId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateCalculation.mutate(calcId, {
      onSuccess: (data) => {
        setSelectedCalc(data as KsCalculation);
      },
    });
  };

  if (selectedCalc) {
    return <CalculationDetail calc={selectedCalc} onBack={() => setSelectedCalc(null)} onUpdate={updateCalculation} allProjects={allProjects} />;
  }

  const drafts = calculations.filter((c) => c.status === "draft");
  const sent = calculations.filter((c) => c.status === "sent");
  const accepted = calculations.filter((c) => c.status === "accepted");

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kalkyler</h1>
            <p className="text-muted-foreground">Opprett og administrer prosjektkalkyler</p>
          </div>
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Ny kalkyle</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Ny kalkyle</DialogTitle>
                <DialogDescription>Opprett en ny prosjektkalkyle</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Tittel *</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="F.eks. Rehabilitering Storgata 5" />
                </div>
                <div className="space-y-2">
                  <Label>Koble til prosjekt</Label>
                  <Select value={newProjectId} onValueChange={(val) => {
                    setNewProjectId(val === "__none__" ? "" : val);
                    if (val !== "__none__") {
                      const proj = allProjects.find(p => p.id === val);
                      if (proj?.client && !newClient) setNewClient(proj.client);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prosjekt (valgfritt)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ingen prosjekt</SelectItem>
                      {allProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.number} – {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kunde</Label>
                  <Input value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Kundenavn" />
                </div>
                <div className="space-y-2">
                  <Label>Beskrivelse</Label>
                  <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Kort beskrivelse..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewOpen(false)}>Avbryt</Button>
                <Button onClick={handleCreate} disabled={!newTitle.trim() || createCalculation.isPending}>
                  {createCalculation.isPending ? "Oppretter..." : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><Pencil className="w-5 h-5 text-amber-500" /></div>
                <div><p className="text-2xl font-bold">{drafts.length}</p><p className="text-sm text-muted-foreground">Utkast</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><Clock className="w-5 h-5 text-blue-500" /></div>
                <div><p className="text-2xl font-bold">{sent.length}</p><p className="text-sm text-muted-foreground">Sendt</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
                <div><p className="text-2xl font-bold">{accepted.length}</p><p className="text-sm text-muted-foreground">Akseptert</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <Card>
          <CardHeader><CardTitle>Alle kalkyler</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Laster...</p>
            ) : calculations.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen kalkyler ennå</h3>
                <p className="text-muted-foreground mb-4">Opprett din første kalkyle for å komme i gang</p>
                <Button onClick={() => setIsNewOpen(true)}><Plus className="w-4 h-4 mr-2" />Ny kalkyle</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {calculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCalc(calc)}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10"><Calculator className="w-5 h-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{calc.title}</span>
                          <Badge variant="outline" className="text-xs">{calc.calculation_number}</Badge>
                          <StatusBadge status={calc.status} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                          {calc.project_id && (() => {
                            const proj = allProjects.find(p => p.id === calc.project_id);
                            return proj ? <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{proj.name}</span> : null;
                          })()}
                          {calc.client_name && <span>{calc.client_name}</span>}
                          <span>{format(new Date(calc.created_at), "d. MMM yyyy", { locale: nb })}</span>
                          <span>{calc.created_by_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => handleDuplicate(calc.id, e)} title="Dupliser kalkyle">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett kalkyle?</AlertDialogTitle>
                            <AlertDialogDescription>Alle poster i kalkylen vil bli slettet permanent.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteCalculation.mutate(calc.id)}>Slett</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "draft": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Utkast</Badge>;
    case "sent": return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Sendt</Badge>;
    case "accepted": return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Akseptert</Badge>;
    case "rejected": return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Avslått</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

// Helper to compute line total with discount
function lineTotal(qty: number, price: number, discountPct: number): number {
  const gross = qty * price;
  return gross - gross * (discountPct / 100);
}

const fmt = (n: number) => n.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DetailProps {
  calc: KsCalculation;
  onBack: () => void;
  onUpdate: any;
  allProjects: { id: string; name: string; number: string; client: string | null }[];
}

function CalculationDetail({ calc, onBack, onUpdate, allProjects }: DetailProps) {
  const { items, isLoading, addItem, deleteItem, updateItem } = useKsCalculationItems(calc.id);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(calc.title);
  const [editClient, setEditClient] = useState(calc.client_name || "");
  const [editDesc, setEditDesc] = useState(calc.description || "");
  const [newCategory, setNewCategory] = useState("materials");
  const [newDesc, setNewDesc] = useState("");
  const [newUnit, setNewUnit] = useState("stk");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [newDiscount, setNewDiscount] = useState("0");
  const [markup, setMarkup] = useState(String(calc.markup_percent || 0));
  const [vat, setVat] = useState(String(calc.vat_percent || 25));

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{
    description: string; unit: string; quantity: string; unit_price: string; discount_percent: string;
  }>({ description: "", unit: "", quantity: "", unit_price: "", discount_percent: "" });

  const handleAddItem = () => {
    if (!newDesc.trim() || !newPrice) return;
    const qty = parseFloat(newQty) || 1;
    const price = parseFloat(newPrice) || 0;
    const disc = parseFloat(newDiscount) || 0;
    addItem.mutate(
      {
        category: newCategory,
        description: newDesc,
        unit: newUnit,
        quantity: qty,
        unit_price: price,
        discount_percent: disc,
        total_price: lineTotal(qty, price, disc),
      } as any,
      {
        onSuccess: () => {
          setNewDesc("");
          setNewPrice("");
          setNewQty("1");
          setNewDiscount("0");
          // Keep dialog open for rapid entry
        },
      }
    );
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate.mutate({
      id: calc.id,
      title: editTitle,
      client_name: editClient || null,
      description: editDesc || null,
    });
    setIsEditOpen(false);
    toast.success("Kalkyle oppdatert");
  };

  const startEditItem = (item: KsCalculationItem) => {
    setEditingItemId(item.id);
    setEditFields({
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
      discount_percent: String(item.discount_percent || 0),
    });
  };

  const saveEditItem = (itemId: string) => {
    const qty = parseFloat(editFields.quantity) || 0;
    const price = parseFloat(editFields.unit_price) || 0;
    const disc = parseFloat(editFields.discount_percent) || 0;
    updateItem.mutate({
      id: itemId,
      description: editFields.description,
      unit: editFields.unit,
      quantity: qty,
      unit_price: price,
      discount_percent: disc,
      total_price: lineTotal(qty, price, disc),
    });
    setEditingItemId(null);
  };

  const cancelEditItem = () => setEditingItemId(null);

  const groupedItems: Record<string, KsCalculationItem[]> = {
    hours: items.filter((i) => i.category === "hours"),
    materials: items.filter((i) => i.category === "materials"),
    equipment: items.filter((i) => i.category === "equipment"),
    other: items.filter((i) => i.category === "other"),
  };

  const subtotalByCategory = (cat: string) =>
    items.filter((i) => i.category === cat).reduce((sum, i) => {
      const disc = i.discount_percent || 0;
      return sum + lineTotal(i.quantity, i.unit_price, disc);
    }, 0);

  const netTotal = items.reduce((sum, i) => sum + lineTotal(i.quantity, i.unit_price, i.discount_percent || 0), 0);
  const markupVal = parseFloat(markup) || 0;
  const vatVal = parseFloat(vat) || 25;
  const markupAmount = netTotal * (markupVal / 100);
  const beforeVat = netTotal + markupAmount;
  const vatAmount = beforeVat * (vatVal / 100);
  const grandTotal = beforeVat + vatAmount;

  const handleMarkupBlur = () => {
    const val = parseFloat(markup) || 0;
    if (val !== calc.markup_percent) onUpdate.mutate({ id: calc.id, markup_percent: val });
  };
  const handleVatBlur = () => {
    const val = parseFloat(vat) || 25;
    if (val !== calc.vat_percent) onUpdate.mutate({ id: calc.id, vat_percent: val });
  };

  const projName = calc.project_id ? allProjects.find(p => p.id === calc.project_id)?.name : null;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">{calc.title}</h1>
                <Badge variant="outline" className="text-xs">{calc.calculation_number}</Badge>
                <StatusBadge status={calc.status} />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
                {calc.client_name && <span>Kunde: {calc.client_name}</span>}
                {projName && <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{projName}</span>}
                <span>{format(new Date(calc.created_at), "d. MMM yyyy", { locale: nb })}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
              <Pencil className="w-4 h-4 mr-1" />Rediger
            </Button>
            {calc.status === "draft" && (
              <Button size="sm" variant="outline" onClick={() => { onUpdate.mutate({ id: calc.id, status: "sent" }); toast.success("Kalkyle merket som sendt"); }}>
                Merk som sendt
              </Button>
            )}
          </div>
        </div>

        {/* Edit dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Rediger kalkyle</DialogTitle>
              <DialogDescription>Endre informasjon om kalkylen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 flex-1 overflow-y-auto">
              <div className="space-y-2"><Label>Tittel *</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Kunde</Label><Input value={editClient} onChange={(e) => setEditClient(e.target.value)} placeholder="Kundenavn" /></div>
              <div className="space-y-2"><Label>Beskrivelse</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Avbryt</Button>
              <Button onClick={handleSaveEdit} disabled={!editTitle.trim()}>Lagre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {calc.description && (
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{calc.description}</p></CardContent></Card>
        )}

        {/* Category sections with full table */}
        {(["hours", "materials", "equipment", "other"] as const).map((cat) => {
          const catItems = groupedItems[cat];
          const catSubtotal = subtotalByCategory(cat);
          return (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{categoryIcons[cat]}</span>
                    {categoryLabels[cat]}
                    {catItems.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{catItems.length}</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">{fmt(catSubtotal)} kr</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setNewCategory(cat); setIsAddOpen(true); }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {catItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">Ingen poster – klikk + for å legge til</p>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Beskrivelse</TableHead>
                          <TableHead className="w-[80px]">Enhet</TableHead>
                          <TableHead className="w-[80px] text-right">Mengde</TableHead>
                          <TableHead className="w-[100px] text-right">Enhetspris</TableHead>
                          <TableHead className="w-[80px] text-right">Rabatt %</TableHead>
                          <TableHead className="w-[110px] text-right">Sum</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catItems.map((item) => {
                          const isEditing = editingItemId === item.id;
                          const itemTotal = isEditing
                            ? lineTotal(parseFloat(editFields.quantity) || 0, parseFloat(editFields.unit_price) || 0, parseFloat(editFields.discount_percent) || 0)
                            : lineTotal(item.quantity, item.unit_price, item.discount_percent || 0);

                          return (
                            <TableRow key={item.id} className={isEditing ? "bg-primary/5" : "hover:bg-muted/50"}>
                              <TableCell>
                                {isEditing ? (
                                  <Input className="h-8 text-sm" value={editFields.description} onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))} />
                                ) : (
                                  <span className="text-sm font-medium">{item.description}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Select value={editFields.unit} onValueChange={(v) => setEditFields(f => ({ ...f, unit: v }))}>
                                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>{unitOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{item.unit}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input type="number" className="h-8 text-sm text-right" value={editFields.quantity} onChange={(e) => setEditFields(f => ({ ...f, quantity: e.target.value }))} min="0" step="0.5" />
                                ) : (
                                  <span className="text-sm tabular-nums">{item.quantity}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input type="number" className="h-8 text-sm text-right" value={editFields.unit_price} onChange={(e) => setEditFields(f => ({ ...f, unit_price: e.target.value }))} min="0" />
                                ) : (
                                  <span className="text-sm tabular-nums">{fmt(item.unit_price)}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input type="number" className="h-8 text-sm text-right" value={editFields.discount_percent} onChange={(e) => setEditFields(f => ({ ...f, discount_percent: e.target.value }))} min="0" max="100" />
                                ) : (
                                  <span className="text-sm tabular-nums">{(item.discount_percent || 0) > 0 ? `${item.discount_percent}%` : "–"}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm font-medium tabular-nums">{fmt(itemTotal)} kr</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-0.5">
                                  {isEditing ? (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => saveEditItem(item.id)}>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditItem}>
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditItem(item)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Quick add item dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full"><Plus className="w-4 h-4 mr-2" />Legg til post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til post</DialogTitle>
              <DialogDescription>Legg til en ny post i kalkylen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse *</Label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="F.eks. Tømrerarbeid, Gipsplater..." />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Enhet</Label>
                  <Select value={newUnit} onValueChange={setNewUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mengde</Label>
                  <Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} min="0" step="0.5" />
                </div>
                <div className="space-y-2">
                  <Label>Enhetspris</Label>
                  <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} min="0" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">Rabatt <Percent className="w-3 h-3" /></Label>
                  <Input type="number" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)} min="0" max="100" placeholder="0" />
                </div>
              </div>
              {/* Live preview */}
              {newPrice && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Linje-sum: </span>
                  <span className="font-semibold tabular-nums">
                    {fmt(lineTotal(parseFloat(newQty) || 1, parseFloat(newPrice) || 0, parseFloat(newDiscount) || 0))} kr
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Lukk</Button>
              <Button onClick={handleAddItem} disabled={!newDesc.trim() || !newPrice || addItem.isPending}>
                {addItem.isPending ? "Legger til..." : "Legg til"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Summary Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Sammendrag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Category subtotals */}
              {(["hours", "materials", "equipment", "other"] as const).map((cat) => {
                const sub = subtotalByCategory(cat);
                if (sub === 0) return null;
                return (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{categoryIcons[cat]} {categoryLabels[cat]}</span>
                    <span className="tabular-nums">{fmt(sub)} kr</span>
                  </div>
                );
              })}

              <div className="border-t pt-3 mt-3 flex justify-between font-medium">
                <span>Netto sum</span>
                <span className="tabular-nums">{fmt(netTotal)} kr</span>
              </div>

              {/* Markup */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Påslag</span>
                  <Input type="number" className="w-20 h-8 text-right text-sm" value={markup} onChange={(e) => setMarkup(e.target.value)} onBlur={handleMarkupBlur} min="0" />
                  <span className="text-muted-foreground">%</span>
                </div>
                <span className="tabular-nums">{fmt(markupAmount)} kr</span>
              </div>

              <div className="flex justify-between text-sm font-medium">
                <span>Sum før MVA</span>
                <span className="tabular-nums">{fmt(beforeVat)} kr</span>
              </div>

              {/* VAT */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">MVA</span>
                  <Input type="number" className="w-20 h-8 text-right text-sm" value={vat} onChange={(e) => setVat(e.target.value)} onBlur={handleVatBlur} min="0" />
                  <span className="text-muted-foreground">%</span>
                </div>
                <span className="tabular-nums">{fmt(vatAmount)} kr</span>
              </div>

              {/* Grand total */}
              <div className="border-t-2 border-primary/30 pt-4 mt-3 flex justify-between items-center">
                <span className="text-lg font-bold">Totalsum inkl. MVA</span>
                <span className="text-2xl font-bold text-primary tabular-nums">{fmt(grandTotal)} kr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
