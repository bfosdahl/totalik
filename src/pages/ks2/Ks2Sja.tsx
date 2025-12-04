import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ClipboardCheck, 
  Plus, 
  Search,
  Calendar,
  User,
  MapPin,
  FileText,
  Download
} from "lucide-react";

interface SjaRecord {
  id: string;
  title: string;
  location: string;
  date: string;
  responsible: string;
  participants: string[];
  status: "draft" | "active" | "completed";
  riskLevel: "low" | "medium" | "high";
}

export default function Ks2Sja() {
  const { projectId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [sjaRecords] = useState<SjaRecord[]>([
    {
      id: "1",
      title: "Arbeid i høyden - Tak",
      location: "Tak, 3. etasje",
      date: "2024-12-02",
      responsible: "Ola Nordmann",
      participants: ["Kari Hansen", "Per Olsen"],
      status: "completed",
      riskLevel: "high",
    },
    {
      id: "2",
      title: "Varmt arbeid - Sveising",
      location: "Verksted",
      date: "2024-11-28",
      responsible: "Per Olsen",
      participants: ["Ola Nordmann"],
      status: "completed",
      riskLevel: "medium",
    },
    {
      id: "3",
      title: "Graving nær kabler",
      location: "Utomhus, sør",
      date: "2024-12-05",
      responsible: "Kari Hansen",
      participants: ["Lars Berg"],
      status: "active",
      riskLevel: "high",
    },
  ]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">Høy risiko</Badge>;
      case "medium":
        return <Badge className="bg-amber-500">Middels risiko</Badge>;
      case "low":
        return <Badge className="bg-emerald-500">Lav risiko</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500">Fullført</Badge>;
      case "active":
        return <Badge>Aktiv</Badge>;
      case "draft":
        return <Badge variant="secondary">Utkast</Badge>;
      default:
        return null;
    }
  };

  const filteredRecords = sjaRecords.filter(
    (sja) =>
      sja.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sja.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <ClipboardCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">SJA - Sikker Jobb Analyse</h2>
            <p className="text-muted-foreground">Risikovurdering før arbeid starter</p>
          </div>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Ny SJA
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter SJA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* SJA List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((sja) => (
            <Card key={sja.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{sja.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {sja.location}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(sja.status)}
                    {getRiskBadge(sja.riskLevel)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{sja.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Ansvarlig: {sja.responsible}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{sja.participants.length + 1} deltakere</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    Vis detaljer
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Last ned
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen SJA funnet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Ingen treff på søket ditt" : "Opprett din første SJA for dette prosjektet"}
            </p>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Ny SJA
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
