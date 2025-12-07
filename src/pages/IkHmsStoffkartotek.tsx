import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FlaskConical, AlertTriangle, FileText, Download, Eye, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const getDangerClassColor = (dangerClass: string) => {
  const colors: Record<string, string> = {
    "Brannfarlig": "bg-red-500/20 text-red-700 dark:text-red-400",
    "Oksiderende": "bg-orange-500/20 text-orange-700 dark:text-orange-400",
    "Eksplosiv": "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    "Giftig": "bg-purple-500/20 text-purple-700 dark:text-purple-400",
    "Etsende": "bg-pink-500/20 text-pink-700 dark:text-pink-400",
    "Irriterende": "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    "Helseskadelig": "bg-rose-500/20 text-rose-700 dark:text-rose-400",
    "Miljøskadelig": "bg-green-500/20 text-green-700 dark:text-green-400",
    "Gass under trykk": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  };
  return colors[dangerClass] || "bg-muted text-muted-foreground";
};

export default function IkHmsStoffkartotek() {
  const { company } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IkHmsStoffkartotek | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_name: "",
    manufacturer: "",
    danger_classes: [] as string[],
    location: "",
    notes: "",
  });
  const [sdsFile, setSdsFile] = useState<File | null>(null);

  // Fetch stoffkartotek
  const { data: stoffkartotekList = [], isLoading } = useQuery({
    queryKey: ["ik-hms-stoffkartotek", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("ik_hms_stoffkartotek" as any)
        .select("*")
        .eq("company_id", company.id)
        .order("product_name", { ascending: true });

      if (error) throw error;
      return (data as unknown) as IkHmsStoffkartotek[];
    },
    enabled: !!company?.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (input: typeof formData & { sds_file_path?: string }) => {
      if (!company?.id) throw new Error("Ingen bedrift funnet");
      const { data, error } = await supabase
        .from("ik_hms_stoffkartotek" as any)
        .insert({
          company_id: company.id,
          product_name: input.product_name,
          manufacturer: input.manufacturer || null,
          danger_classes: input.danger_classes,
          location: input.location || null,
          sds_file_path: input.sds_file_path || null,
          notes: input.notes || null,
          last_updated: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-hms-stoffkartotek", company?.id] });
      toast.success("Stoff lagt til i stoffkartoteket");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Kunne ikke legge til stoff");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IkHmsStoffkartotek> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_hms_stoffkartotek" as any)
        .update({ ...updates, last_updated: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-hms-stoffkartotek", company?.id] });
      toast.success("Stoff oppdatert");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere stoff");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_hms_stoffkartotek" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-hms-stoffkartotek", company?.id] });
      toast.success("Stoff slettet");
      setIsDetailOpen(false);
      setSelectedProduct(null);
    },
    onError: () => {
      toast.error("Kunne ikke slette stoff");
    },
  });

  const resetForm = () => {
    setFormData({
      product_name: "",
      manufacturer: "",
      danger_classes: [],
      location: "",
      notes: "",
    });
    setSdsFile(null);
    setIsParsing(false);
  };

  // Parse PDF using AI
  const handleParsePdf = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Velg en PDF-fil");
      return;
    }

    setIsParsing(true);
    setSdsFile(file);

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-sds-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            pdfBase64: base64,
            fileName: file.name,
          }),
        }
      );

      if (response.status === 429) {
        toast.error("For mange forespørsler. Vennligst vent litt og prøv igjen.");
        setIsParsing(false);
        return;
      }

      if (response.status === 402) {
        toast.error("AI-kreditter oppbrukt. Kontakt administrator.");
        setIsParsing(false);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Kunne ikke lese PDF. Fyll ut manuelt.");
        setIsParsing(false);
        return;
      }

      // Auto-fill form with parsed data
      setFormData((prev) => ({
        ...prev,
        product_name: result.data.product_name || prev.product_name,
        manufacturer: result.data.manufacturer || prev.manufacturer,
        danger_classes: result.data.danger_classes?.length > 0 
          ? result.data.danger_classes.filter((dc: string) => DANGER_CLASSES.includes(dc))
          : prev.danger_classes,
        notes: result.data.notes || prev.notes,
      }));

      toast.success("PDF analysert! Sjekk og juster informasjonen før du lagrer.");
    } catch (error) {
      console.error("Error parsing PDF:", error);
      toast.error("Kunne ikke lese PDF. Fyll ut manuelt.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.product_name.trim()) {
      toast.error("Produktnavn er påkrevd");
      return;
    }

    let sdsFilePath: string | undefined;

    if (sdsFile && company?.id) {
      setIsUploading(true);
      const fileExt = sdsFile.name.split(".").pop();
      const fileName = `${company.id}/ik-hms-sds/${Date.now()}-${sdsFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("ik-hms-sds")
        .upload(fileName, sdsFile);

      setIsUploading(false);

      if (uploadError) {
        toast.error("Kunne ikke laste opp SDS-fil");
        return;
      }

      sdsFilePath = fileName;
    }

    createMutation.mutate({ ...formData, sds_file_path: sdsFilePath });
  };

  const handleViewSds = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("ik-hms-sds")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      toast.error("Kunne ikke åpne SDS-fil");
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const handleDownloadSds = async (filePath: string, productName: string) => {
    const { data, error } = await supabase.storage
      .from("ik-hms-sds")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      toast.error("Kunne ikke laste ned SDS-fil");
      return;
    }

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = `SDS-${productName}.pdf`;
    link.click();
  };

  const handleUploadSdsForExisting = async (productId: string, file: File) => {
    if (!company?.id) return;

    setIsUploading(true);
    const fileName = `${company.id}/ik-hms-sds/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("ik-hms-sds")
      .upload(fileName, file);

    setIsUploading(false);

    if (uploadError) {
      toast.error("Kunne ikke laste opp SDS-fil");
      return;
    }

    updateMutation.mutate({ id: productId, sds_file_path: fileName });
    if (selectedProduct) {
      setSelectedProduct({ ...selectedProduct, sds_file_path: fileName });
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

  const filteredList = stoffkartotekList.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Stoffkartotek</h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over kjemikalier og farlige stoffer
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Legg til stoff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Legg til nytt stoff</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="product_name">Produktnavn *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, product_name: e.target.value }))
                    }
                    placeholder="F.eks. Aceton"
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Produsent/leverandør</Label>
                  <Input
                    id="manufacturer"
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
                  <Label htmlFor="location">Lagringssted</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="F.eks. Kjemikalieskap A"
                  />
                </div>
                <div>
                  <Label htmlFor="sds_file">Sikkerhetsdatablad (SDS)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Last opp PDF for å automatisk fylle ut skjemaet med AI
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="sds_file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleParsePdf(file);
                        }
                      }}
                      className="flex-1"
                      disabled={isParsing}
                    />
                    {isParsing && (
                      <div className="flex items-center gap-2 text-primary text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Leser PDF...
                      </div>
                    )}
                  </div>
                  {sdsFile && !isParsing && (
                    <p className="text-xs text-success mt-1">✓ {sdsFile.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">Notater</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Tilleggsinformasjon..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Laster opp...
                    </>
                  ) : createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    "Legg til stoff"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter stoff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">Ingen stoffer registrert</h3>
              <p className="text-muted-foreground text-center mt-1">
                {searchQuery
                  ? "Ingen stoffer matcher søket ditt"
                  : "Legg til ditt første stoff i stoffkartoteket"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredList.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedProduct(item);
                  setIsDetailOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{item.product_name}</CardTitle>
                    {item.danger_classes.length > 0 && (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  {item.manufacturer && (
                    <p className="text-sm text-muted-foreground">{item.manufacturer}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {item.danger_classes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.danger_classes.slice(0, 3).map((dc) => (
                          <Badge key={dc} className={getDangerClassColor(dc)} variant="secondary">
                            {dc}
                          </Badge>
                        ))}
                        {item.danger_classes.length > 3 && (
                          <Badge variant="outline">+{item.danger_classes.length - 3}</Badge>
                        )}
                      </div>
                    )}
                    {item.location && (
                      <p className="text-sm text-muted-foreground">📍 {item.location}</p>
                    )}
                    {item.sds_file_path && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <FileText className="w-4 h-4" />
                        SDS tilgjengelig
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.product_name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4 pt-4">
                {selectedProduct.manufacturer && (
                  <div>
                    <Label className="text-muted-foreground">Produsent/leverandør</Label>
                    <p className="font-medium">{selectedProduct.manufacturer}</p>
                  </div>
                )}
                {selectedProduct.danger_classes.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Fareklasser</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedProduct.danger_classes.map((dc) => (
                        <Badge key={dc} className={getDangerClassColor(dc)} variant="secondary">
                          {dc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProduct.location && (
                  <div>
                    <Label className="text-muted-foreground">Lagringssted</Label>
                    <p className="font-medium">{selectedProduct.location}</p>
                  </div>
                )}
                {selectedProduct.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notater</Label>
                    <p className="whitespace-pre-wrap">{selectedProduct.notes}</p>
                  </div>
                )}

                {/* SDS Section */}
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Sikkerhetsdatablad (SDS)</Label>
                  {selectedProduct.sds_file_path ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSds(selectedProduct.sds_file_path!)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Se SDS
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadSds(
                            selectedProduct.sds_file_path!,
                            selectedProduct.product_name
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Last ned
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Ingen SDS lastet opp</p>
                      <Label htmlFor="upload-sds" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Upload className="w-4 h-4" />
                          Last opp SDS-fil
                        </div>
                        <Input
                          id="upload-sds"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadSdsForExisting(selectedProduct.id, file);
                            }
                          }}
                        />
                      </Label>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(selectedProduct.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Sletter..." : "Slett"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Lukk
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
