import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface IkHmsStoffkartotek {
  id: string;
  company_id: string;
  product_name: string;
  manufacturer: string | null;
  danger_classes: string[];
  location: string | null;
  sds_file_path: string | null;
  notes: string | null;
  last_updated: string;
  created_at: string;
}

interface EditIkHmsChemicalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

const DANGER_CLASSES = [
  "Brannfarlig",
  "Oksiderende",
  "Eksplosiv",
  "Giftig",
  "Etsende",
  "Irriterende",
  "Helseskadelig",
  "Miljøskadelig",
  "Gass under trykk",
];

export function EditIkHmsChemicalDialog({
  open,
  onOpenChange,
  productId,
  companyId,
}: EditIkHmsChemicalDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    manufacturer: "",
    danger_classes: [] as string[],
    location: "",
    notes: "",
  });

  // Load existing product data
  useEffect(() => {
    if (open && productId) {
      loadProduct();
    }
  }, [open, productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ik_hms_stoffkartotek" as any)
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;

      const product = data as unknown as IkHmsStoffkartotek;
      setFormData({
        product_name: product.product_name || "",
        manufacturer: product.manufacturer || "",
        danger_classes: product.danger_classes || [],
        location: product.location || "",
        notes: product.notes || "",
      });
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Kunne ikke laste stoffinformasjon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.product_name.trim()) {
      toast.error("Produktnavn er påkrevd");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ik_hms_stoffkartotek" as any)
        .update({
          product_name: formData.product_name,
          manufacturer: formData.manufacturer || null,
          danger_classes: formData.danger_classes,
          location: formData.location || null,
          notes: formData.notes || null,
          last_updated: new Date().toISOString(),
        } as any)
        .eq("id", productId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["ik-hms-stoffkartotek", companyId] });
      toast.success("Stoff oppdatert");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Kunne ikke oppdatere stoff");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDangerClass = (dangerClass: string) => {
    setFormData((prev) => ({
      ...prev,
      danger_classes: prev.danger_classes.includes(dangerClass)
        ? prev.danger_classes.filter((d) => d !== dangerClass)
        : [...prev.danger_classes, dangerClass],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger stoff</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit_product_name">Produktnavn *</Label>
              <Input
                id="edit_product_name"
                value={formData.product_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, product_name: e.target.value }))
                }
                placeholder="F.eks. Aceton"
              />
            </div>
            <div>
              <Label htmlFor="edit_manufacturer">Produsent/leverandør</Label>
              <Input
                id="edit_manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))
                }
                placeholder="F.eks. Jotun"
              />
            </div>
            <div>
              <Label>Fareklasser</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DANGER_CLASSES.map((dc) => (
                  <Badge
                    key={dc}
                    variant={formData.danger_classes.includes(dc) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDangerClass(dc)}
                  >
                    {dc}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit_location">Lagringssted</Label>
              <Input
                id="edit_location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="F.eks. Kjemikalieskap A"
              />
            </div>
            <div>
              <Label htmlFor="edit_notes">Notater</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Tilleggsinformasjon..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  "Lagre endringer"
                )}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
