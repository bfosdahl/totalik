import { useState } from "react";
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
  Trash2
} from "lucide-react";
import { useKsModule2Stoffkartotek } from "@/hooks/useKsModule2Stoffkartotek";
import { format } from "date-fns";

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
  const { stoffkartotekList, isLoading, createStoffkartotek, deleteStoffkartotek, isCreating } = useKsModule2Stoffkartotek(projectId || null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    manufacturer: "",
    danger_classes: [] as string[],
    location: "",
    notes: ""
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

  const handleCreate = () => {
    if (!newProduct.product_name || !projectId) return;

    createStoffkartotek({
      project_id: projectId,
      product_name: newProduct.product_name,
      manufacturer: newProduct.manufacturer || null,
      danger_classes: newProduct.danger_classes,
      location: newProduct.location || null,
      notes: newProduct.notes || null,
      sds_file_path: null,
      last_updated: new Date().toISOString().split('T')[0]
    });

    setNewProduct({
      product_name: "",
      manufacturer: "",
      danger_classes: [],
      location: "",
      notes: ""
    });
    setIsDialogOpen(false);
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
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      SDS
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
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
        <DialogContent className="max-w-lg">
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
              disabled={!newProduct.product_name || isCreating}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Legg til stoff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
