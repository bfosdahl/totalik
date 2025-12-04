import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FlaskConical, 
  Plus, 
  Search,
  QrCode,
  FileText,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

interface ChemicalProduct {
  id: string;
  name: string;
  manufacturer: string;
  dangerClass: string[];
  location: string;
  sdsUrl?: string;
  qrCode?: string;
  lastUpdated: string;
}

export default function Ks2Stoffkartotek() {
  const { projectId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [products] = useState<ChemicalProduct[]>([
    {
      id: "1",
      name: "Epoxy grunnmaling",
      manufacturer: "Jotun",
      dangerClass: ["Brannfarlig", "Helseskadelig"],
      location: "Lager A",
      lastUpdated: "2024-11-15",
    },
    {
      id: "2",
      name: "Betongherder",
      manufacturer: "Mapei",
      dangerClass: ["Etsende"],
      location: "Byggeplass",
      lastUpdated: "2024-10-20",
    },
    {
      id: "3",
      name: "Polyuretanskum",
      manufacturer: "Sika",
      dangerClass: ["Brannfarlig", "Helseskadelig", "Sensibiliserende"],
      location: "Lager B",
      lastUpdated: "2024-11-01",
    },
  ]);

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
      default:
        return <Badge variant="secondary" key={danger}>{danger}</Badge>;
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button className="bg-emerald-500 hover:bg-emerald-600">
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
      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:border-emerald-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.manufacturer}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-500">
                    <QrCode className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {product.dangerClass.map((danger) => getDangerBadge(danger))}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Plassering:</span> {product.location}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Oppdatert: {product.lastUpdated}
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
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Legg til stoff
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
