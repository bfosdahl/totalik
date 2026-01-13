import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle,
  Plus,
  Edit,
  Search,
  Filter,
  Calendar
} from "lucide-react";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkAlkohol, AlkoholIncident } from "@/hooks/useIkAlkohol";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const INCIDENT_TYPES = [
  { value: "nekting", label: "Nekting av salg/skjenking" },
  { value: "bortvisning", label: "Bortvisning" },
  { value: "falsk_id", label: "Falsk ID" },
  { value: "ruspavirket", label: "Ruspåvirket gjest" },
  { value: "konflikt", label: "Konflikt/Bråk" },
  { value: "annet", label: "Annet" },
];

const SEVERITY_OPTIONS = [
  { value: "Lav", label: "Lav", color: "bg-yellow-100 text-yellow-800" },
  { value: "Medium", label: "Medium", color: "bg-orange-100 text-orange-800" },
  { value: "Høy", label: "Høy", color: "bg-red-100 text-red-800" },
];

const STATUS_OPTIONS = [
  { value: "Ny", label: "Ny", color: "bg-blue-100 text-blue-800" },
  { value: "Under behandling", label: "Under behandling", color: "bg-yellow-100 text-yellow-800" },
  { value: "Lukket", label: "Lukket", color: "bg-green-100 text-green-800" },
];

export default function IkAlkoholHendelser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { company, isLoading: authLoading, profile } = useAuth();
  const { incidents, createIncident, updateIncident } = useIkAlkohol();

  const [showDialog, setShowDialog] = useState(searchParams.get("new") === "true");
  const [editingIncident, setEditingIncident] = useState<Partial<AlkoholIncident> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isLoading = modulesLoading || authLoading;

  // Redirect if module not active
  useEffect(() => {
    if (!isLoading && !hasModule("IK_ALKOHOL")) {
      navigate("/");
    }
  }, [hasModule, isLoading, navigate]);

  // Open new dialog from URL param
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditingIncident({
        incident_date: format(new Date(), "yyyy-MM-dd"),
        incident_type: "",
        description: "",
        status: "Ny",
        severity: "Lav",
        reported_by_name: profile?.name || "",
        reported_by_id: profile?.id,
      });
      setShowDialog(true);
    }
  }, [searchParams, profile]);

  const handleSaveIncident = () => {
    if (!editingIncident) return;
    
    if (editingIncident.id) {
      updateIncident.mutate(editingIncident as AlkoholIncident);
    } else {
      createIncident.mutate(editingIncident);
    }
    setEditingIncident(null);
    setShowDialog(false);
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !searchQuery || 
      incident.incident_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <AlertTriangle className="h-7 w-7 text-orange-500" />
              Hendelseslogg
            </h1>
            <p className="text-muted-foreground mt-1">
              Registrer og følg opp hendelser knyttet til alkoholhåndtering
            </p>
          </div>
          <Button onClick={() => {
            setEditingIncident({
              incident_date: format(new Date(), "yyyy-MM-dd"),
              incident_type: "",
              description: "",
              status: "Ny",
              severity: "Lav",
              reported_by_name: profile?.name || "",
              reported_by_id: profile?.id,
            });
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Ny hendelse
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i hendelser..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <Card>
          <CardHeader>
            <CardTitle>Hendelser ({filteredIncidents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredIncidents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {incidents.length === 0 
                  ? "Ingen hendelser registrert ennå" 
                  : "Ingen hendelser matcher filteret"
                }
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nr.</TableHead>
                      <TableHead>Dato</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Beskrivelse</TableHead>
                      <TableHead>Alvorlighet</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-mono text-sm">
                          {incident.incident_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(incident.incident_date), "d. MMM yyyy", { locale: nb })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {INCIDENT_TYPES.find(t => t.value === incident.incident_type)?.label || incident.incident_type}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                          {incident.description}
                        </TableCell>
                        <TableCell>
                          <Badge className={SEVERITY_OPTIONS.find(s => s.value === incident.severity)?.color}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_OPTIONS.find(s => s.value === incident.status)?.color}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingIncident(incident);
                              setShowDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incident Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) setEditingIncident(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIncident?.id ? `Rediger ${editingIncident.incident_number}` : "Registrer ny hendelse"}
            </DialogTitle>
          </DialogHeader>
          {editingIncident && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dato *</Label>
                  <Input
                    type="date"
                    value={editingIncident.incident_date || ""}
                    onChange={(e) => setEditingIncident({ ...editingIncident, incident_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Klokkeslett</Label>
                  <Input
                    type="time"
                    value={editingIncident.incident_time || ""}
                    onChange={(e) => setEditingIncident({ ...editingIncident, incident_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type hendelse *</Label>
                  <Select
                    value={editingIncident.incident_type || ""}
                    onValueChange={(value) => setEditingIncident({ ...editingIncident, incident_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alvorlighetsgrad</Label>
                  <Select
                    value={editingIncident.severity || "Lav"}
                    onValueChange={(value) => setEditingIncident({ ...editingIncident, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((sev) => (
                        <SelectItem key={sev.value} value={sev.value}>
                          {sev.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hva skjedde? *</Label>
                <Textarea
                  value={editingIncident.description || ""}
                  onChange={(e) => setEditingIncident({ ...editingIncident, description: e.target.value })}
                  placeholder="Beskriv hendelsen..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Hvordan ble det håndtert?</Label>
                <Textarea
                  value={editingIncident.handling || ""}
                  onChange={(e) => setEditingIncident({ ...editingIncident, handling: e.target.value })}
                  placeholder="Beskriv håndteringen..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Hvem var involvert?</Label>
                <Input
                  value={editingIncident.involved_parties || ""}
                  onChange={(e) => setEditingIncident({ ...editingIncident, involved_parties: e.target.value })}
                  placeholder="Ansatte, gjester, vakter..."
                />
              </div>

              <div className="space-y-2">
                <Label>Læring/forbedring</Label>
                <Textarea
                  value={editingIncident.learning_improvement || ""}
                  onChange={(e) => setEditingIncident({ ...editingIncident, learning_improvement: e.target.value })}
                  placeholder="Hva kan vi lære av dette? Tiltak for å unngå lignende hendelser..."
                  rows={2}
                />
              </div>

              {editingIncident.id && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingIncident.status || "Ny"}
                    onValueChange={(value) => setEditingIncident({ ...editingIncident, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Rapportert av</Label>
                <Input
                  value={editingIncident.reported_by_name || ""}
                  onChange={(e) => setEditingIncident({ ...editingIncident, reported_by_name: e.target.value })}
                  placeholder="Navn"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDialog(false);
              setEditingIncident(null);
            }}>
              Avbryt
            </Button>
            <Button 
              onClick={handleSaveIncident} 
              disabled={!editingIncident?.incident_date || !editingIncident?.incident_type || !editingIncident?.description}
            >
              {editingIncident?.id ? "Oppdater" : "Registrer hendelse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
