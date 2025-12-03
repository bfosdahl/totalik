import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  User,
  MapPin,
  FileText,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import { useKsModule2Avvik, KsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const CATEGORIES = [
  { value: "kvalitet", label: "Kvalitetsavvik" },
  { value: "hms", label: "HMS-avvik" },
  { value: "ks", label: "KS-avvik" },
  { value: "tegning", label: "Tegningsavvik" },
  { value: "material", label: "Materialavvik" },
  { value: "annet", label: "Annet" },
];

const SEVERITIES = [
  { value: "low", label: "Lav", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Høy", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Kritisk", color: "bg-red-100 text-red-800" },
];

const STATUSES = [
  { value: "open", label: "Åpen", icon: AlertTriangle, color: "text-yellow-600" },
  { value: "in_progress", label: "Under arbeid", icon: Clock, color: "text-blue-600" },
  { value: "closed", label: "Lukket", icon: CheckCircle2, color: "text-green-600" },
];

export default function Ks2Avvik() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const { avvikList, isLoading, createAvvik, updateAvvik, deleteAvvik, closeAvvik, isCreating } = useKsModule2Avvik(projectId || null);
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedAvvik, setSelectedAvvik] = useState<KsModule2Avvik | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [newAvvik, setNewAvvik] = useState({
    title: "",
    description: "",
    category: "kvalitet",
    severity: "medium",
    location: "",
    deadline: "",
    responsible_name: "",
  });

  const handleCreateAvvik = () => {
    if (!newAvvik.title || !projectId) return;
    
    createAvvik({
      project_id: projectId,
      title: newAvvik.title,
      description: newAvvik.description || null,
      category: newAvvik.category,
      severity: newAvvik.severity,
      status: "open",
      location: newAvvik.location || null,
      discovered_date: new Date().toISOString().split("T")[0],
      deadline: newAvvik.deadline || null,
      responsible_name: newAvvik.responsible_name || null,
      responsible_user_id: null,
      reported_by_name: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.email || "Ukjent",
      root_cause: null,
      corrective_action: null,
      preventive_action: null,
      photo_paths: null,
    }, {
      onSuccess: () => {
        setNewAvvik({ title: "", description: "", category: "kvalitet", severity: "medium", location: "", deadline: "", responsible_name: "" });
        setIsNewDialogOpen(false);
      }
    });
  };

  const handleCloseAvvik = (avvik: KsModule2Avvik) => {
    const closedByName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : profile?.email || "Ukjent";
    closeAvvik({ id: avvik.id, closedByName });
  };

  const handleDeleteAvvik = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette avviket?")) {
      deleteAvvik(id);
    }
  };

  const filteredAvvik = avvikList.filter(avvik => {
    const matchesSearch = avvik.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avvik.avvik_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || avvik.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCount = avvikList.filter(a => a.status === "open").length;
  const inProgressCount = avvikList.filter(a => a.status === "in_progress").length;
  const closedCount = avvikList.filter(a => a.status === "closed").length;

  const getSeverityBadge = (severity: string) => {
    const sev = SEVERITIES.find(s => s.value === severity);
    return <Badge className={sev?.color || ""}>{sev?.label || severity}</Badge>;
  };

  const getStatusInfo = (status: string) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster avvik...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avvik fra KS</h1>
          <p className="text-muted-foreground">
            Registrer og følg opp avvik i prosjektet
          </p>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nytt avvik
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrer nytt avvik</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tittel *</Label>
                <Input
                  value={newAvvik.title}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Kort beskrivelse av avviket"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={newAvvik.category}
                    onValueChange={(v) => setNewAvvik(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alvorlighetsgrad</Label>
                  <Select
                    value={newAvvik.severity}
                    onValueChange={(v) => setNewAvvik(prev => ({ ...prev, severity: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map(sev => (
                        <SelectItem key={sev.value} value={sev.value}>{sev.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={newAvvik.description}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detaljert beskrivelse av avviket..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lokasjon</Label>
                  <Input
                    value={newAvvik.location}
                    onChange={(e) => setNewAvvik(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Hvor ble det oppdaget?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frist</Label>
                  <Input
                    type="date"
                    value={newAvvik.deadline}
                    onChange={(e) => setNewAvvik(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ansvarlig</Label>
                <Input
                  value={newAvvik.responsible_name}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, responsible_name: e.target.value }))}
                  placeholder="Hvem er ansvarlig for å lukke avviket?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateAvvik} disabled={isCreating || !newAvvik.title}>
                  {isCreating ? "Oppretter..." : "Opprett avvik"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-muted-foreground">Åpne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">Under arbeid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedCount}</p>
                <p className="text-sm text-muted-foreground">Lukket</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter avvik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Avvik List */}
      {filteredAvvik.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen avvik funnet</p>
            <p className="text-sm">Registrer et nytt avvik for å komme i gang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAvvik.map((avvik) => {
            const statusInfo = getStatusInfo(avvik.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={avvik.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        <Badge variant="outline">{avvik.avvik_number}</Badge>
                        {getSeverityBadge(avvik.severity)}
                        <Badge variant="secondary">
                          {CATEGORIES.find(c => c.value === avvik.category)?.label || avvik.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{avvik.title}</h3>
                      {avvik.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{avvik.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {avvik.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {avvik.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(avvik.discovered_date), "d. MMM yyyy", { locale: nb })}
                        </div>
                        {avvik.responsible_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {avvik.responsible_name}
                          </div>
                        )}
                        {avvik.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Frist: {format(new Date(avvik.deadline), "d. MMM yyyy", { locale: nb })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {avvik.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseAvvik(avvik)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Lukk
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteAvvik(avvik.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
