import { useState } from "react";
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
import { Plus, Calculator, Trash2, ArrowLeft, FileText, Clock, CheckCircle2, Pencil } from "lucide-react";
import { useKsCalculations, useKsCalculationItems, KsCalculation } from "@/hooks/useKsCalculations";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  hours: "Timer / Arbeid",
  materials: "Materialer",
  equipment: "Utstyr",
  other: "Annet",
};

const unitOptions = ["stk", "m", "m²", "m³", "kg", "liter", "timer", "rs", "pakke"];

export default function KsKalkyler() {
  const { calculations, isLoading, createCalculation, deleteCalculation, updateCalculation } = useKsCalculations();
  const [selectedCalc, setSelectedCalc] = useState<KsCalculation | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newClient, setNewClient] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createCalculation.mutate(
      { title: newTitle, description: newDesc, client_name: newClient },
      {
        onSuccess: (data) => {
          setIsNewOpen(false);
          setNewTitle("");
          setNewDesc("");
          setNewClient("");
          setSelectedCalc(data as KsCalculation);
        },
      }
    );
  };

  if (selectedCalc) {
    return <CalculationDetail calc={selectedCalc} onBack={() => setSelectedCalc(null)} onUpdate={updateCalculation} />;
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ny kalkyle</DialogTitle>
                <DialogDescription>Opprett en ny prosjektkalkyle</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tittel *</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="F.eks. Rehabilitering Storgata 5" />
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
                          {calc.client_name && <span>{calc.client_name}</span>}
                          <span>{format(new Date(calc.created_at), "d. MMM yyyy", { locale: nb })}</span>
                          <span>{calc.created_by_name}</span>
                        </div>
                      </div>
                    </div>
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

function CalculationDetail({ calc, onBack, onUpdate }: { calc: KsCalculation; onBack: () => void; onUpdate: any }) {
  const { items, isLoading, addItem, deleteItem } = useKsCalculationItems(calc.id);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("materials");
  const [newDesc, setNewDesc] = useState("");
  const [newUnit, setNewUnit] = useState("stk");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [markup, setMarkup] = useState(String(calc.markup_percent || 0));
  const [vat, setVat] = useState(String(calc.vat_percent || 25));

  const handleAddItem = () => {
    if (!newDesc.trim() || !newPrice) return;
    addItem.mutate(
      { category: newCategory, description: newDesc, unit: newUnit, quantity: parseFloat(newQty) || 1, unit_price: parseFloat(newPrice) || 0 },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setNewDesc("");
          setNewPrice("");
          setNewQty("1");
        },
      }
    );
  };

  const groupedItems = {
    hours: items.filter((i) => i.category === "hours"),
    materials: items.filter((i) => i.category === "materials"),
    equipment: items.filter((i) => i.category === "equipment"),
    other: items.filter((i) => i.category === "other"),
  };

  const subtotalByCategory = (cat: string) => items.filter((i) => i.category === cat).reduce((sum, i) => sum + (i.total_price || 0), 0);

  const netTotal = items.reduce((sum, i) => sum + (i.total_price || 0), 0);
  const markupAmount = netTotal * ((parseFloat(markup) || 0) / 100);
  const beforeVat = netTotal + markupAmount;
  const vatAmount = beforeVat * ((parseFloat(vat) || 25) / 100);
  const grandTotal = beforeVat + vatAmount;

  const handleMarkupBlur = () => {
    const val = parseFloat(markup) || 0;
    if (val !== calc.markup_percent) {
      onUpdate.mutate({ id: calc.id, markup_percent: val });
    }
  };

  const handleVatBlur = () => {
    const val = parseFloat(vat) || 25;
    if (val !== calc.vat_percent) {
      onUpdate.mutate({ id: calc.id, vat_percent: val });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">{calc.title}</h1>
                <Badge variant="outline" className="text-xs">{calc.calculation_number}</Badge>
              </div>
              {calc.client_name && <p className="text-muted-foreground text-sm">{calc.client_name}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={calc.status} />
            {calc.status === "draft" && (
              <Button size="sm" variant="outline" onClick={() => { onUpdate.mutate({ id: calc.id, status: "sent" }); toast.success("Kalkyle merket som sendt"); }}>
                Merk som sendt
              </Button>
            )}
          </div>
        </div>

        {calc.description && (
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{calc.description}</p></CardContent></Card>
        )}

        {/* Category sections */}
        {(["hours", "materials", "equipment", "other"] as const).map((cat) => (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{categoryLabels[cat]}</CardTitle>
                <span className="text-sm font-semibold">{subtotalByCategory(cat).toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span>
              </div>
            </CardHeader>
            <CardContent>
              {groupedItems[cat].length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Ingen poster</p>
              ) : (
                <div className="space-y-2">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-2">
                    <div className="col-span-5">Beskrivelse</div>
                    <div className="col-span-2">Enhet</div>
                    <div className="col-span-2 text-right">Mengde</div>
                    <div className="col-span-2 text-right">Pris</div>
                    <div className="col-span-1"></div>
                  </div>
                  {groupedItems[cat].map((item) => (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 border rounded-lg bg-muted/30">
                      <div className="sm:col-span-5 text-sm font-medium">{item.description}</div>
                      <div className="sm:col-span-2 text-sm text-muted-foreground">{item.unit}</div>
                      <div className="sm:col-span-2 text-sm text-right">{item.quantity}</div>
                      <div className="sm:col-span-2 text-sm text-right font-medium">{(item.total_price || 0).toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add item */}
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
              <div className="grid grid-cols-3 gap-3">
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Avbryt</Button>
              <Button onClick={handleAddItem} disabled={!newDesc.trim() || !newPrice || addItem.isPending}>Legg til</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Sammendrag</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Sum timer</span><span>{subtotalByCategory("hours").toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span></div>
            <div className="flex justify-between text-sm"><span>Sum materialer</span><span>{subtotalByCategory("materials").toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span></div>
            <div className="flex justify-between text-sm"><span>Sum utstyr</span><span>{subtotalByCategory("equipment").toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span></div>
            <div className="flex justify-between text-sm"><span>Sum annet</span><span>{subtotalByCategory("other").toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span></div>
            <div className="border-t pt-3 flex justify-between font-medium"><span>Netto sum</span><span>{netTotal.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span></div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Påslag</span>
                <Input type="number" className="w-20 h-8 text-right" value={markup} onChange={(e) => setMarkup(e.target.value)} onBlur={handleMarkupBlur} min="0" />
                <span>%</span>
              </div>
              <span>{markupAmount.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>MVA</span>
                <Input type="number" className="w-20 h-8 text-right" value={vat} onChange={(e) => setVat(e.target.value)} onBlur={handleVatBlur} min="0" />
                <span>%</span>
              </div>
              <span>{vatAmount.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Totalsum inkl. MVA</span><span>{grandTotal.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr</span></div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
