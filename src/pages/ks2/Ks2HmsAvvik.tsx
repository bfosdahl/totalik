import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Plus, 
  Search,
  Calendar,
  User,
  MapPin,
  FileText,
  Loader2
} from "lucide-react";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const HMS_CATEGORIES = [
  "Personlig verneutstyr",
  "Fallsikring",
  "Orden og ryddighet",
  "Brannvern",
  "Elektrisk sikkerhet",
  "Kjemikalier og farlige stoffer",
  "Maskin og utstyr",
  "Ergonomi",
  "Støy og vibrasjoner",
  "Annet HMS"
];

export default function Ks2HmsAvvik() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const { avvikList, isLoading, createAvvik, isCreating } = useKsModule2Avvik(projectId || null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAvvik, setNewAvvik] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    severity: "medium",
    deadline: "",
    responsible_name: ""
  });

  // Filter only HMS-related avvik (categories in HMS_CATEGORIES)
  const hmsAvvik = avvikList.filter(a => HMS_CATEGORIES.includes(a.category));

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Kritisk</Badge>;
      case "high":
        return <Badge className="bg-red-500">Høy</Badge>;
      case "medium":
        return <Badge className="bg-amber-500">Middels</Badge>;
      case "low":
        return <Badge className="bg-emerald-500">Lav</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Åpen</Badge>;
      case "in_progress":
        return <Badge>Under behandling</Badge>;
      case "closed":
        return <Badge variant="secondary">Lukket</Badge>;
      default:
        return null;
    }
  };

  const filteredAvvik = hmsAvvik.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.avvik_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAvvik = hmsAvvik.filter(a => a.status === "open" || a.status === "in_progress");
  const closedAvvik = hmsAvvik.filter(a => a.status === "closed");

  const handleCreateAvvik = () => {
    if (!newAvvik.title || !newAvvik.category || !projectId) return;

    const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : "Ukjent";

    createAvvik({
      project_id: projectId,
      title: newAvvik.title,
      description: newAvvik.description || null,
      location: newAvvik.location || null,
      category: newAvvik.category,
      severity: newAvvik.severity,
      status: "open",
      discovered_date: new Date().toISOString().split('T')[0],
      deadline: newAvvik.deadline || null,
      responsible_name: newAvvik.responsible_name || null,
      responsible_user_id: null,
      reported_by_name: fullName,
      root_cause: null,
      corrective_action: null,
      preventive_action: null,
      photo_paths: null,
    });

    setNewAvvik({
      title: "",
      description: "",
      location: "",
      category: "",
      severity: "medium",
      deadline: "",
      responsible_name: ""
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <AlertTriangle className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">HMS-avvik & Uønskede hendelser</h2>
            <p className="text-muted-foreground">Registrer og følg opp HMS-avvik</p>
          </div>
        </div>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrer avvik
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totalt</CardDescription>
            <CardTitle className="text-2xl">{hmsAvvik.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne</CardDescription>
            <CardTitle className="text-2xl text-red-500">
              {hmsAvvik.filter(a => a.status === "open").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Under behandling</CardDescription>
            <CardTitle className="text-2xl text-amber-500">
              {hmsAvvik.filter(a => a.status === "in_progress").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lukket</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">
              {closedAvvik.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter avvik..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Åpne ({openAvvik.length})</TabsTrigger>
          <TabsTrigger value="closed">Lukket ({closedAvvik.length})</TabsTrigger>
          <TabsTrigger value="all">Alle ({hmsAvvik.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : openAvvik.length > 0 ? (
            openAvvik.map((a) => (
              <Card key={a.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{a.avvik_number}</span>
                        {getSeverityBadge(a.severity)}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      {a.location && (
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          {a.location}
                        </CardDescription>
                      )}
                    </div>
                    {getStatusBadge(a.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {a.description && (
                    <p className="text-sm text-muted-foreground mb-3">{a.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(a.discovered_date), "dd.MM.yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Rapportert av: {a.reported_by_name}</span>
                    </div>
                    {a.responsible_name && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Tildelt: {a.responsible_name}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    Vis detaljer
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen åpne HMS-avvik
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedAvvik.length > 0 ? (
            closedAvvik.map((a) => (
              <Card key={a.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{a.avvik_number}</span>
                        {getSeverityBadge(a.severity)}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </div>
                    {getStatusBadge(a.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    Vis detaljer
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen lukkede HMS-avvik
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredAvvik.length > 0 ? (
            filteredAvvik.map((a) => (
              <Card key={a.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{a.avvik_number}</span>
                        {getSeverityBadge(a.severity)}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </div>
                    {getStatusBadge(a.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    Vis detaljer
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen HMS-avvik funnet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrer HMS-avvik</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tittel *</Label>
              <Input
                placeholder="Kort beskrivelse av avviket"
                value={newAvvik.title}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Kategori *</Label>
              <Select 
                value={newAvvik.category} 
                onValueChange={(val) => setNewAvvik(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {HMS_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beskrivelse</Label>
              <Textarea
                placeholder="Detaljert beskrivelse..."
                value={newAvvik.description}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lokasjon</Label>
                <Input
                  placeholder="Hvor ble avviket oppdaget?"
                  value={newAvvik.location}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div>
                <Label>Alvorlighetsgrad</Label>
                <Select 
                  value={newAvvik.severity} 
                  onValueChange={(val) => setNewAvvik(prev => ({ ...prev, severity: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Lav</SelectItem>
                    <SelectItem value="medium">Middels</SelectItem>
                    <SelectItem value="high">Høy</SelectItem>
                    <SelectItem value="critical">Kritisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ansvarlig</Label>
                <Input
                  placeholder="Hvem skal følge opp?"
                  value={newAvvik.responsible_name}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, responsible_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Frist</Label>
                <Input
                  type="date"
                  value={newAvvik.deadline}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreateAvvik}
              disabled={!newAvvik.title || !newAvvik.category || isCreating}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrer avvik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
