import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useIkMatTraceability } from "@/hooks/useIkMatTraceability";
import { useAuth } from "@/contexts/AuthContext";

interface NewTraceabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewTraceabilityDialog = ({ open, onOpenChange }: NewTraceabilityDialogProps) => {
  const { profile } = useAuth();
  const { createRecord, uploadDocument } = useIkMatTraceability(profile?.company_id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    supplier_name: "",
    product_name: "",
    batch_number: "",
    production_date: "",
    receipt_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    receipt_temperature: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setIsSubmitting(true);
    try {
      // Create record first
      const recordData = {
        company_id: profile.company_id,
        supplier_name: formData.supplier_name,
        product_name: formData.product_name,
        batch_number: formData.batch_number || null,
        production_date: formData.production_date || null,
        receipt_date: formData.receipt_date,
        expiry_date: formData.expiry_date || null,
        receipt_temperature: formData.receipt_temperature ? parseFloat(formData.receipt_temperature) : null,
        notes: formData.notes || null,
        document_path: null,
      };

      // Upload document if selected
      let documentPath = null;
      if (selectedFile && profile?.company_id) {
        const tempId = crypto.randomUUID();
        documentPath = await uploadDocument(selectedFile, profile.company_id, tempId);
      }

      createRecord({ ...recordData, document_path: documentPath });

      // Reset form
      setFormData({
        supplier_name: "",
        product_name: "",
        batch_number: "",
        production_date: "",
        receipt_date: new Date().toISOString().split('T')[0],
        expiry_date: "",
        receipt_temperature: "",
        notes: "",
      });
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting traceability record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrer varemottak</DialogTitle>
          <DialogDescription>
            Registrer informasjon om mottatt vare for sporbarhet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Leverandør *</Label>
              <Input
                id="supplier"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
                placeholder="Navn på leverandør"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Produktnavn *</Label>
              <Input
                id="product"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
                placeholder="Navn på varen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch/partinummer</Label>
              <Input
                id="batch"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="Eks: LOT-12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="production_date">Produksjonsdato</Label>
              <Input
                id="production_date"
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_date">Mottaksdato *</Label>
              <Input
                id="receipt_date"
                type="date"
                value={formData.receipt_date}
                onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Holdbarhetsdato</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatur ved mottak (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.receipt_temperature}
                onChange={(e) => setFormData({ ...formData, receipt_temperature: e.target.value })}
                placeholder="Eks: 4.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Følgeseddel/faktura</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Fjern
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPG eller PNG
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Merknader</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Eventuell tilleggsinformasjon..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Registrer mottak
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
