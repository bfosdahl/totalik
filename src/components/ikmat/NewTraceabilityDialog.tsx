import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ALLERGEN_OPTIONS } from "@/hooks/useIkMatTraceability";
import { Upload, Loader2, Camera, AlertTriangle, CheckCircle, XCircle, Building2, Sparkles } from "lucide-react";
import { useIkMatTraceability } from "@/hooks/useIkMatTraceability";
import { useIkMatSuppliers } from "@/hooks/useIkMatSuppliers";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLocalDateString } from "@/lib/dateUtils";

interface NewTraceabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProductType = "kjolevare" | "frysevare" | "torrvar";

interface TemperatureStatus {
  status: "green" | "yellow" | "red";
  message: string;
  action: string;
}

function getTemperatureStatus(temp: number | null, productTypes: ProductType[]): TemperatureStatus | null {
  if (temp === null) return null;
  
  // Check temperature for refrigerated items first, then frozen
  const hasKjolevare = productTypes.includes("kjolevare");
  const hasFrysevare = productTypes.includes("frysevare");
  
  // If both types, use the stricter requirements (frozen)
  if (hasFrysevare) {
    if (temp <= -18) {
      return { status: "green", message: "Riktig temperatur for frysevare", action: "AKSEPTER" };
    } else if (temp > -18 && temp <= -15) {
      return { status: "yellow", message: "Tillates ved transport kortere enn 2 t.", action: "Sett varer på fryserom til de er -18°C" };
    } else if (temp > -15) {
      return { status: "red", message: "Frysevarer for varme - tas ikke imot", action: "RETUR" };
    }
  } else if (hasKjolevare) {
    if (temp >= -1 && temp <= 4) {
      return { status: "green", message: "Riktig temperatur for kjølevare", action: "AKSEPTER" };
    } else if (temp > 4 && temp <= 7) {
      return { status: "yellow", message: "Tillates ved transport kortere enn 2 t.", action: "Sett varene på kjølerom" };
    } else if (temp > 7) {
      return { status: "red", message: "Kjølevarer for varme - tas ikke imot", action: "RETUR" };
    }
  }
  
  return null;
}

function TemperatureStatusIndicator({ temp, productTypes }: { temp: number | null; productTypes: ProductType[] }) {
  const status = getTemperatureStatus(temp, productTypes);
  
  // Don't show if only dry goods
  if (!status || (productTypes.length === 1 && productTypes[0] === "torrvar")) return null;
  
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };
  
  const bgColors = {
    green: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    yellow: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    red: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
  };
  
  const Icon = status.status === "green" ? CheckCircle : status.status === "yellow" ? AlertTriangle : XCircle;
  
  return (
    <div className={cn("p-3 rounded-lg border", bgColors[status.status])}>
      <div className="flex items-start gap-3">
        <div className={cn("w-4 h-4 rounded-full mt-0.5", colors[status.status])} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", 
              status.status === "green" ? "text-green-600" : 
              status.status === "yellow" ? "text-yellow-600" : "text-red-600"
            )} />
            <span className="font-medium text-sm">{status.message}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{status.action}</p>
        </div>
      </div>
    </div>
  );
}

export const NewTraceabilityDialog = ({ open, onOpenChange }: NewTraceabilityDialogProps) => {
  const { profile } = useAuth();
  const { createRecord, uploadDocument } = useIkMatTraceability(profile?.company_id);
  const { suppliers } = useIkMatSuppliers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [labelImageFile, setLabelImageFile] = useState<File | null>(null);
  const [labelImagePreview, setLabelImagePreview] = useState<string | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_id: "",
    product_name: "",
    batch_number: "",
    gtin: "",
    production_date: "",
    receipt_date: getLocalDateString(),
    expiry_date: "",
    expiry_type: "best_before" as "best_before" | "use_by",
    receipt_temperature: "",
    product_types: ["kjolevare"] as ProductType[],
    packaging_ok: true,
    temperature_ok: true,
    notes: "",
    allergens: [] as string[],
    is_internal_production: false,
    internal_shelf_life_days: "",
    produced_by: "",
  });

  const handleAllergenToggle = (allergen: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allergens: checked
        ? [...prev.allergens, allergen]
        : prev.allergens.filter(a => a !== allergen),
    }));
  };

  const handleInternalProductionToggle = (checked: boolean) => {
    setFormData(prev => {
      const next = { ...prev, is_internal_production: checked };
      if (checked) {
        next.supplier_name = next.supplier_name || "Egenprodusert";
        next.expiry_type = "use_by";
        next.receipt_date = getLocalDateString();
        next.production_date = next.production_date || getLocalDateString();
        // Auto-calculate expiry from shelf life days
        const days = parseInt(next.internal_shelf_life_days || "3");
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          next.expiry_date = d.toISOString().split("T")[0];
        }
      }
      return next;
    });
  };

  const handleShelfLifeChange = (value: string) => {
    setFormData(prev => {
      const next = { ...prev, internal_shelf_life_days: value };
      const days = parseInt(value);
      if (prev.is_internal_production && !isNaN(days) && days > 0) {
        const baseDate = prev.production_date ? new Date(prev.production_date) : new Date();
        baseDate.setDate(baseDate.getDate() + days);
        next.expiry_date = baseDate.toISOString().split("T")[0];
      }
      return next;
    });
  };

  const handleProductTypeChange = (type: ProductType, checked: boolean) => {
    setFormData(prev => {
      const newTypes = checked
        ? [...prev.product_types, type]
        : prev.product_types.filter(t => t !== type);
      
      // Ensure at least one type is selected
      if (newTypes.length === 0) {
        return prev;
      }
      
      return { ...prev, product_types: newTypes };
    });
  };

  const scanLabelImage = async (imageBase64: string) => {
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Du må være innlogget for å skanne bilder");
        return;
      }

      const response = await supabase.functions.invoke('scan-shipping-label', {
        body: { imageBase64 }
      });

      if (response.error) {
        console.error("Scan error:", response.error);
        toast.error("Kunne ikke skanne bildet");
        return;
      }

      const extracted = response.data;
      
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          batch_number: extracted.batch_number || prev.batch_number,
          gtin: extracted.gtin || prev.gtin,
          product_name: extracted.product_name || prev.product_name,
          expiry_date: extracted.expiry_date || prev.expiry_date,
          production_date: extracted.production_date || prev.production_date,
        }));
        
        toast.success("Informasjon hentet fra bildet!");
      }
    } catch (error) {
      console.error("Error scanning label:", error);
      toast.error("Feil ved skanning av bilde");
    } finally {
      setIsScanning(false);
    }
  };

  const handleLabelImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLabelImageFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setLabelImagePreview(base64);
        // Auto-scan the image
        await scanLabelImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSupplierChange = (value: string) => {
    if (value === "custom") {
      setFormData({ ...formData, supplier_id: "", supplier_name: "" });
    } else {
      const supplier = suppliers.find(s => s.id === value);
      if (supplier) {
        setFormData({ 
          ...formData, 
          supplier_id: supplier.id, 
          supplier_name: supplier.supplier_name 
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setIsSubmitting(true);
    try {
      const tempValue = formData.receipt_temperature ? parseFloat(formData.receipt_temperature) : null;
      const tempStatus = getTemperatureStatus(tempValue, formData.product_types);
      
      // Build notes with quality checks and temperature status
      let fullNotes = formData.notes || "";
      const qualityIssues: string[] = [];
      
      if (!formData.packaging_ok) {
        qualityIssues.push("Emballasje skadet");
      }
      if (!formData.temperature_ok) {
        qualityIssues.push("Temperaturavvik ved mottak");
      }
      if (tempStatus && tempStatus.status !== "green") {
        qualityIssues.push(`Trafikklys: ${tempStatus.action}`);
      }
      
      if (qualityIssues.length > 0) {
        fullNotes = `[AVVIK: ${qualityIssues.join(", ")}] ${fullNotes}`.trim();
      }
      
      if (formData.gtin) {
        fullNotes = `GTIN: ${formData.gtin}. ${fullNotes}`.trim();
      }
      
      // Add product types to notes
      const productTypeLabels = formData.product_types.map(t => 
        t === "kjolevare" ? "Kjølevare" : t === "frysevare" ? "Frysevare" : "Tørrvare"
      ).join(", ");
      fullNotes = `Produkttyper: ${productTypeLabels}. ${fullNotes}`.trim();

      // Create record first
      const recordData = {
        company_id: profile.company_id,
        supplier_name: formData.supplier_name,
        product_name: formData.product_name,
        batch_number: formData.batch_number || null,
        production_date: formData.production_date || null,
        receipt_date: formData.receipt_date,
        expiry_date: formData.expiry_date || null,
        receipt_temperature: tempValue,
        notes: fullNotes || null,
        document_path: null,
        allergens: formData.allergens,
        expiry_type: formData.expiry_type,
        is_internal_production: formData.is_internal_production,
        internal_shelf_life_days: formData.internal_shelf_life_days
          ? parseInt(formData.internal_shelf_life_days)
          : null,
        produced_by: formData.produced_by || null,
      };

      // Upload document if selected
      let documentPath = null;
      if (selectedFile && profile?.company_id) {
        const tempId = crypto.randomUUID();
        documentPath = await uploadDocument(selectedFile, profile.company_id, tempId);
      }
      
      // Upload label image if selected (as additional document)
      if (labelImageFile && profile?.company_id) {
        const labelId = crypto.randomUUID();
        const labelPath = await uploadDocument(labelImageFile, profile.company_id, `label-${labelId}`);
        // If no main document, use label as document
        if (!documentPath) {
          documentPath = labelPath;
        }
      }

      createRecord({ ...recordData, document_path: documentPath });

      // Reset form
      setFormData({
        supplier_name: "",
        supplier_id: "",
        product_name: "",
        batch_number: "",
        gtin: "",
        production_date: "",
        receipt_date: getLocalDateString(),
        expiry_date: "",
        expiry_type: "best_before",
        receipt_temperature: "",
        product_types: ["kjolevare"],
        packaging_ok: true,
        temperature_ok: true,
        notes: "",
        allergens: [],
        is_internal_production: false,
        internal_shelf_life_days: "",
        produced_by: "",
      });
      setSelectedFile(null);
      setLabelImageFile(null);
      setLabelImagePreview(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting traceability record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tempValue = formData.receipt_temperature ? parseFloat(formData.receipt_temperature) : null;
  const hasTemperatureSensitive = formData.product_types.some(t => t === "kjolevare" || t === "frysevare");

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
          {/* Label Image Upload with AI Scanning - MOVED TO TOP */}
          <div className="space-y-2 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Camera className="h-5 w-5 text-primary" />
              Skann fraktetikett
              <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" />
                AI-skanning
              </span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Ta bilde av frakteetiketten for automatisk utfylling av felt
            </p>
            <div className="flex flex-col gap-2">
              <input
                ref={labelInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleLabelImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant={labelImagePreview ? "outline" : "default"}
                onClick={() => labelInputRef.current?.click()}
                className="w-full justify-center gap-2"
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Skanner bilde...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    {labelImageFile ? "Velg nytt bilde" : "Ta bilde eller velg fil"}
                  </>
                )}
              </Button>
              {labelImagePreview && (
                <div className="relative mt-2">
                  <img 
                    src={labelImagePreview} 
                    alt="Fraktetikett" 
                    className="w-full max-h-48 object-contain rounded-lg border bg-white"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {!isScanning && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => scanLabelImage(labelImagePreview)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Skann på nytt
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setLabelImageFile(null);
                        setLabelImagePreview(null);
                      }}
                    >
                      Fjern
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label>Leverandør *</Label>
            {suppliers.length > 0 ? (
              <div className="space-y-2">
                <Select 
                  value={formData.supplier_id || "custom"} 
                  onValueChange={handleSupplierChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg leverandør" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {supplier.supplier_name}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="text-muted-foreground">+ Annen leverandør</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {(!formData.supplier_id || formData.supplier_id === "") && (
                  <Input
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    placeholder="Skriv inn leverandørnavn"
                    required
                  />
                )}
              </div>
            ) : (
              <Input
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
                placeholder="Navn på leverandør"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            
            {/* Product Types - Multi-select checkboxes */}
            <div className="space-y-2">
              <Label>Produkttype(r) *</Label>
              <div className="flex flex-wrap gap-4 pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type_kjolevare"
                    checked={formData.product_types.includes("kjolevare")}
                    onCheckedChange={(checked) => handleProductTypeChange("kjolevare", checked === true)}
                  />
                  <label htmlFor="type_kjolevare" className="text-sm cursor-pointer">
                    Kjølevare
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type_frysevare"
                    checked={formData.product_types.includes("frysevare")}
                    onCheckedChange={(checked) => handleProductTypeChange("frysevare", checked === true)}
                  />
                  <label htmlFor="type_frysevare" className="text-sm cursor-pointer">
                    Frysevare
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type_torrvar"
                    checked={formData.product_types.includes("torrvar")}
                    onCheckedChange={(checked) => handleProductTypeChange("torrvar", checked === true)}
                  />
                  <label htmlFor="type_torrvar" className="text-sm cursor-pointer">
                    Tørrvare
                  </label>
                </div>
              </div>
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
              <Label htmlFor="gtin">GTIN/Strekkode</Label>
              <Input
                id="gtin"
                value={formData.gtin}
                onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                placeholder="Eks: 07020009908407"
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
              <Label htmlFor="production_date">Produksjonsdato</Label>
              <Input
                id="production_date"
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
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

          {/* Temperature Traffic Light */}
          {hasTemperatureSensitive && tempValue !== null && (
            <TemperatureStatusIndicator temp={tempValue} productTypes={formData.product_types} />
          )}

          {/* Quality Checks */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Kvalitetskontroll</Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="packaging_ok"
                  checked={formData.packaging_ok}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, packaging_ok: checked === true })
                  }
                />
                <label htmlFor="packaging_ok" className="text-sm cursor-pointer">
                  Emballasje er uskadet
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temperature_ok"
                  checked={formData.temperature_ok}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, temperature_ok: checked === true })
                  }
                />
                <label htmlFor="temperature_ok" className="text-sm cursor-pointer">
                  Temperatur ved mottak er akseptabel
                </label>
              </div>
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
            <Button type="submit" disabled={isSubmitting || isScanning}>
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
