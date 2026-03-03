import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Receipt, Image, FileText, Download } from "lucide-react";
import { useTripExpenses, TripExpense } from "@/hooks/useTripExpenses";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const expenseCategories: Record<string, string> = {
  parking: "Parkering",
  toll: "Bom/Veiavgift",
  fuel: "Drivstoff",
  ferry: "Ferge",
  food: "Mat/Diett",
  accommodation: "Overnatting",
  other: "Annet",
};

interface TripExpensesProps {
  tripId: string;
}

export function TripExpenses({ tripId }: TripExpensesProps) {
  const { expenses, addExpense, deleteExpense, totalExpenses } = useTripExpenses(tripId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [category, setCategory] = useState("parking");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    addExpense.mutate({
      trip_id: tripId,
      category,
      description,
      amount: amt,
      receipt_file: receiptFile || undefined,
    });

    setDescription("");
    setAmount("");
    setReceiptFile(null);
    setCategory("parking");
    setAddDialogOpen(false);
  };

  const handleViewReceipt = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("driving-log-receipts")
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      toast.error("Kunne ikke åpne kvittering");
      return;
    }
    setViewingReceipt(data.signedUrl);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Utgifter
              {totalExpenses > 0 && (
                <Badge variant="secondary">{totalExpenses.toFixed(0)} kr</Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Legg til
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.isLoading ? (
            <p className="text-sm text-muted-foreground">Laster...</p>
          ) : !expenses.data?.length ? (
            <p className="text-sm text-muted-foreground">Ingen utgifter registrert</p>
          ) : (
            <div className="space-y-2">
              {expenses.data.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {expenseCategories[expense.category] || expense.category}
                    </Badge>
                    <span className="text-sm truncate">{expense.description}</span>
                    {expense.receipt_path && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleViewReceipt(expense.receipt_path!)}
                      >
                        <Image className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">{Number(expense.amount).toFixed(0)} kr</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteExpense.mutate(expense)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Legg til utgift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategories).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse *</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="F.eks. Parkering sentrum" required />
            </div>

            <div className="space-y-2">
              <Label>Beløp (kr) *</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="150" required />
            </div>

            <div className="space-y-2">
              <Label>Kvittering (bilde/PDF)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <FileText className="w-4 h-4 mr-1" />
                  {receiptFile ? receiptFile.name : "Velg fil"}
                </Button>
                {receiptFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptFile(null)}>Fjern</Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => setReceiptFile(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Avbryt</Button>
              <Button type="submit" disabled={addExpense.isPending || !description || !amount}>
                {addExpense.isPending ? "Lagrer..." : "Legg til"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Kvittering</DialogTitle>
          </DialogHeader>
          {viewingReceipt && (
            <div className="space-y-3">
              {viewingReceipt.match(/\.pdf/i) ? (
                <iframe src={viewingReceipt} className="w-full h-[70vh] rounded border" />
              ) : (
                <img src={viewingReceipt} alt="Kvittering" className="max-w-full max-h-[70vh] rounded object-contain mx-auto" />
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a href={viewingReceipt} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-1" />
                    Last ned
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
