import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ClipboardCheck, 
  Plus, 
  Search,
  Calendar,
  User,
  MapPin,
  FileText,
  Download,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useKsModule2Sja, CreateSjaInput } from "@/hooks/useKsModule2Sja";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function Ks2Sja() {
  const { projectId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateSjaInput>>({
    title: "",
    work_description: "",
    location: "",
    planned_date: format(new Date(), "yyyy-MM-dd"),
    responsible_name: "",
    participants: [],
    overall_risk_level: "medium",
  });

  const { sjaList, isLoading, createSja, deleteSja } = useKsModule2Sja(projectId);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">Høy risiko</Badge>;
      case "medium":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Middels risiko</Badge>;
      case "low":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Lav risiko</Badge>;
      default:
        return <Badge variant="secondary">Ikke vurdert</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Fullført</Badge>;
      case "active":
        return <Badge>Aktiv</Badge>;
      case "draft":
        return <Badge variant="secondary">Utkast</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRecords = sjaList.filter(
    (sja) =>
      sja.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sja.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sja.sja_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!projectId || !formData.title || !formData.responsible_name || !formData.planned_date) {
      return;
    }

    await createSja.mutateAsync({
      project_id: projectId,
      title: formData.title,
      work_description: formData.work_description,
      location: formData.location,
      planned_date: formData.planned_date,
      responsible_name: formData.responsible_name,
      participants: formData.participants,
      overall_risk_level: formData.overall_risk_level,
    });

    setShowNewDialog(false);
    setFormData({
      title: "",
      work_description: "",
      location: "",
      planned_date: format(new Date(), "yyyy-MM-dd"),
      responsible_name: "",
      participants: [],
      overall_risk_level: "medium",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne SJA-en?")) {
      await deleteSja.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setShowNewDialog(true)}
        >
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
            <Card key={sja.id} className="hover:border-emerald-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{sja.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">({sja.sja_number})</span>
                    </div>
                    {sja.location && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {sja.location}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(sja.status)}
                    {getRiskBadge(sja.overall_risk_level)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sja.work_description && (
                  <p className="text-sm text-muted-foreground mb-3">{sja.work_description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(sja.planned_date), "d. MMMM yyyy", { locale: nb })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Ansvarlig: {sja.responsible_name}</span>
                  </div>
                  {sja.participants && sja.participants.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{sja.participants.length + 1} deltakere</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Vis detaljer
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Last ned PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(sja.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny SJA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New SJA Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ny Sikker Jobb Analyse
            </DialogTitle>
            <DialogDescription>
              Opprett en ny SJA for å vurdere risiko før arbeid starter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tittel / Arbeidsoppgave *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="F.eks. Arbeid i høyden - Tak"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_description">Beskrivelse av arbeidet</Label>
              <Textarea
                id="work_description"
                value={formData.work_description}
                onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                placeholder="Beskriv arbeidet som skal utføres..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Lokasjon</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="F.eks. Tak, 3. etasje"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="planned_date">Planlagt dato *</Label>
                <Input
                  id="planned_date"
                  type="date"
                  value={formData.planned_date}
                  onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_name">Ansvarlig *</Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                placeholder="Navn på ansvarlig person"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_level">Risikonivå</Label>
              <select
                id="risk_level"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.overall_risk_level}
                onChange={(e) => setFormData({ ...formData, overall_risk_level: e.target.value })}
              >
                <option value="low">Lav risiko</option>
                <option value="medium">Middels risiko</option>
                <option value="high">Høy risiko</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleCreate}
              disabled={!formData.title || !formData.responsible_name || !formData.planned_date || createSja.isPending}
            >
              {createSja.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Oppretter...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett SJA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
