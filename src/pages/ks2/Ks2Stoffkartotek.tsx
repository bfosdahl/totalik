import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  FlaskConical, 
  Plus, 
  Search,
  QrCode,
  FileText,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Trash2,
  Upload,
  Download,
  Eye,
  X
} from "lucide-react";
import { useKsModule2Stoffkartotek, KsModule2Stoffkartotek } from "@/hooks/useKsModule2Stoffkartotek";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const DANGER_CLASSES = [
  "Brannfarlig",
  "Etsende",
  "Helseskadelig",
  "Sensibiliserende",
  "Miljøfarlig",
  "Giftig",
  "Oksiderende",
  "Gass under trykk",
  "Eksplosjonsfarlig"
];

export default function Ks2Stoffkartotek() {
  const { projectId } = useParams();
  const { stoffkartotekList, isLoading, createStoffkartotek, updateStoffkartotek, deleteStoffkartotek, isCreating, isUpdating } = useKsModule2Stoffkartotek(projectId || null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<KsModule2Stoffkartotek | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    manufacturer: "",
    danger_classes: [] as string[],
    location: "",
    notes: "",
    sds_file: null as File | null
  });

  const getDangerBadge = (danger: string) => {
    switch (danger) {
      case "Brannfarlig":
        return <Badge variant="destructive" key={danger}>{danger}</Badge>;
      case "Etsende":
        return <Badge className="bg-amber-500" key={danger}>{danger}</Badge>;
      case "Helseskadelig":
        return <Badge className="bg-orange-500" key={danger}>{danger}</Badge>;
      case "Sensibiliserende":
        return <Badge className="bg-purple-500" key={danger}>{danger}</Badge>;
      case "Miljøfarlig":
        return <Badge className="bg-green-600" key={danger}>{danger}</Badge>;
      case "Giftig":
        return <Badge className="bg-red-700" key={danger}>{danger}</Badge>;
      default:
        return <Badge variant="secondary" key={danger}>{danger}</Badge>;
    }
  };

  const filteredProducts = stoffkartotekList.filter(
    (p) =>
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleDanger = (danger: string) => {
    setNewProduct(prev => ({
      ...prev,
      danger_classes: prev.danger_classes.includes(danger)
        ? prev.danger_classes.filter(d => d !== danger)
        : [...prev.danger_classes, danger]
    }));
  };

  const uploadSdsFile = async (file: File, productName: string): Promise<string | null> => {
    const sanitizedName = productName.replace(/[^a-zA-Z0-9æøåÆØÅ\s-]/g, "").replace(/\s+/g, "_");
    const fileName = `sds_${sanitizedName}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${projectId}/stoffkartotek/${fileName}`;

    const { error } = await supabase.storage
      .from("ks-module2-files")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    return filePath;
  };

  const handleCreate = async () => {
    if (!newProduct.product_name || !projectId) return;

    let sdsFilePath: string | null = null;

    if (newProduct.sds_file) {
      setIsUploading(true);
      sdsFilePath = await uploadSdsFile(newProduct.sds_file, newProduct.product_name);
      setIsUploading(false);
      
      if (!sdsFilePath) {
        toast.error("Kunne ikke laste opp SDS-fil");
        return;
      }
    }

    createStoffkartotek({
      project_id: projectId,
      product_name: newProduct.product_name,
      manufacturer: newProduct.manufacturer || null,
      danger_classes: newProduct.danger_classes,
      location: newProduct.location || null,
      notes: newProduct.notes || null,
      sds_file_path: sdsFilePath,
      last_updated: new Date().toISOString().split('T')[0]
    });

    setNewProduct({
      product_name: "",
      manufacturer: "",
      danger_classes: [],
      location: "",
      notes: "",
      sds_file: null
    });
    setIsDialogOpen(false);
  };

  const handleViewSds = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("ks-module2-files")
      .createSignedUrl(filePath, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Kunne ikke åpne SDS-fil");
    }
  };

  const handleDownloadSds = async (filePath: string, productName: string) => {
    const { data } = await supabase.storage
      .from("ks-module2-files")
      .createSignedUrl(filePath, 3600);

    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = `SDS_${productName}.pdf`;
      a.click();
    } else {
      toast.error("Kunne ikke laste ned SDS-fil");
    }
  };

  const handleUploadSdsForExisting = async (file: File, product: KsModule2Stoffkartotek) => {
    setIsUploading(true);
    const filePath = await uploadSdsFile(file, product.product_name);
    setIsUploading(false);

    if (filePath) {
      updateStoffkartotek({
        id: product.id,
        sds_file_path: filePath,
        last_updated: new Date().toISOString().split('T')[0]
      });
      setSelectedProduct(prev => prev ? { ...prev, sds_file_path: filePath } : null);
    } else {
      toast.error("Kunne ikke laste opp SDS-fil");
    }
  };

  const openDetail = (product: KsModule2Stoffkartotek) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FlaskConical className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Stoffkartotek</h2>
            <p className="text-muted-foreground">Oversikt over kjemikalier og stoffer i prosjektet</p>
          </div>
        </div>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til stoff
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Stoffkartotek er lovpålagt
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Alle kjemikalier og helsefarlige stoffer som brukes på byggeplassen må registreres med sikkerhetsdatablad (SDS).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter stoff eller produsent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:border-emerald-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.product_name}</CardTitle>
                    {product.manufacturer && (
                      <CardDescription>{product.manufacturer}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-500">
                      <QrCode className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteStoffkartotek(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.danger_classes && product.danger_classes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.danger_classes.map((danger) => getDangerBadge(danger))}
                    </div>
                  )}
                  
                  {product.location && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Plassering:</span> {product.location}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Oppdatert: {format(new Date(product.last_updated), "dd.MM.yyyy")}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => product.sds_file_path ? handleViewSds(product.sds_file_path) : openDetail(product)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {product.sds_file_path ? "Se SDS" : "Ingen SDS"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openDetail(product)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Detaljer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "Ingen treff" : "Ingen stoffer registrert"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery 
                ? "Ingen stoffer matcher søket ditt" 
                : "Legg til stoffer og kjemikalier som brukes i prosjektet"}
            </p>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til stoff
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Legg til stoff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Produktnavn *</Label>
              <Input
                placeholder="Navn på kjemikalie/stoff"
                value={newProduct.product_name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Produsent/Leverandør</Label>
              <Input
                placeholder="F.eks. Jotun, Mapei, Sika..."
                value={newProduct.manufacturer}
                onChange={(e) => setNewProduct(prev => ({ ...prev, manufacturer: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fareklasser</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DANGER_CLASSES.map(danger => (
                  <div key={danger} className="flex items-center space-x-2">
                    <Checkbox
                      id={danger}
                      checked={newProduct.danger_classes.includes(danger)}
                      onCheckedChange={() => handleToggleDanger(danger)}
                    />
                    <Label htmlFor={danger} className="cursor-pointer text-sm">
                      {danger}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Plassering</Label>
              <Input
                placeholder="Hvor oppbevares stoffet?"
                value={newProduct.location}
                onChange={(e) => setNewProduct(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <Label>Sikkerhetsdatablad (SDS)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewProduct(prev => ({ ...prev, sds_file: file }));
                    }
                  }}
                />
                {newProduct.sds_file ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm flex-1 truncate">{newProduct.sds_file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setNewProduct(prev => ({ ...prev, sds_file: null }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Last opp SDS-fil
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Notater</Label>
              <Textarea
                placeholder="Tilleggsinformasjon..."
                value={newProduct.notes}
                onChange={(e) => setNewProduct(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!newProduct.product_name || isCreating || isUploading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {(isCreating || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Legg til stoff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-500" />
              {selectedProduct?.product_name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              {selectedProduct.manufacturer && (
                <div>
                  <Label className="text-muted-foreground">Produsent/Leverandør</Label>
                  <p className="font-medium">{selectedProduct.manufacturer}</p>
                </div>
              )}

              {selectedProduct.danger_classes && selectedProduct.danger_classes.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Fareklasser</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProduct.danger_classes.map((danger) => getDangerBadge(danger))}
                  </div>
                </div>
              )}

              {selectedProduct.location && (
                <div>
                  <Label className="text-muted-foreground">Plassering</Label>
                  <p className="font-medium">{selectedProduct.location}</p>
                </div>
              )}

              {selectedProduct.notes && (
                <div>
                  <Label className="text-muted-foreground">Notater</Label>
                  <p className="text-sm">{selectedProduct.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Sikkerhetsdatablad (SDS)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    ref={detailFileInputRef}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedProduct) {
                        handleUploadSdsForExisting(file, selectedProduct);
                      }
                    }}
                  />
                  {selectedProduct.sds_file_path ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewSds(selectedProduct.sds_file_path!)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Se SDS
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownloadSds(selectedProduct.sds_file_path!, selectedProduct.product_name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Last ned
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => detailFileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => detailFileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Last opp SDS-fil
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Sist oppdatert:</span>
                  <span>{format(new Date(selectedProduct.last_updated), "dd.MM.yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Opprettet:</span>
                  <span>{format(new Date(selectedProduct.created_at), "dd.MM.yyyy")}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
