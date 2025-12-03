import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Shield,
  FileDown,
} from "lucide-react";
import { useKsModule2Uk, KsModule2Uk } from "@/hooks/useKsModule2Uk";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadKsModule2UkPdf } from "@/utils/ksModule2UkPdf";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";

const CONTROL_AREAS = [
  { value: "konstruksjon", label: "Konstruksjonssikkerhet" },
  { value: "brannteknisk", label: "Brannteknisk prosjektering" },
  { value: "geoteknikk", label: "Geoteknikk" },
  { value: "bygningsfysikk", label: "Bygningsfysikk" },
  { value: "lydteknisk", label: "Lydtekniske forhold" },
  { value: "energi", label: "Energieffektivitet" },
  { value: "tilgjengelighet", label: "Tilgjengelighet" },
  { value: "annet", label: "Annet" },
];

const STATUSES = [
  { value: "pending", label: "Venter", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "Under kontroll", icon: Shield, color: "bg-blue-100 text-blue-800" },
  { value: "approved", label: "Godkjent", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Avvist", icon: XCircle, color: "bg-red-100 text-red-800" },
];

export default function Ks2UavhengigKontroll() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { ukList, isLoading, createUk, updateUk, deleteUk, approveUk, isCreating } = useKsModule2Uk(projectId || null);
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [project, setProject] = useState<KsModule2Project | null>(null);
  
  const [newUk, setNewUk] = useState({
    control_area: "konstruksjon",
    description: "",
    controller_name: "",
    controller_company: "",
    deadline: "",
  });

  useEffect(() => {
    if (projectId) {
      supabase
        .from("ks_module2_projects")
        .select("*")
        .eq("id", projectId)
        .single()
        .then(({ data }) => {
          if (data) setProject(data as KsModule2Project);
        });
    }
  }, [projectId]);

  const handleDownloadUkPdf = (uk: KsModule2Uk) => {
    if (!project || !company) return;
    downloadKsModule2UkPdf({
      uk: uk as any,
      project,
      company: {
        name: company.name,
        address: company.address,
        postal_code: company.postal_code,
        city: company.city,
        org_number: company.org_number,
        phone: company.phone,
        email: company.email,
      },
    });
    toast.success("PDF lastet ned");
  };

  const handleCreateUk = () => {
    if (!newUk.control_area || !projectId) return;
    
    createUk({
      project_id: projectId,
      control_area: newUk.control_area,
      description: newUk.description || null,
      controller_name: newUk.controller_name || null,
      controller_company: newUk.controller_company || null,
      status: "pending",
      control_date: null,
      deadline: newUk.deadline || null,
      comments: null,
      result: null,
      document_paths: null,
      created_by_name: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.email || "Ukjent",
    }, {
      onSuccess: () => {
        setNewUk({ control_area: "konstruksjon", description: "", controller_name: "", controller_company: "", deadline: "" });
        setIsNewDialogOpen(false);
      }
    });
  };

  const handleApproveUk = (uk: KsModule2Uk) => {
    const approvedByName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : profile?.email || "Ukjent";
    approveUk({ id: uk.id, approvedByName, result: "Godkjent uten anmerkninger" });
  };

  const handleDeleteUk = (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne kontrollen?")) {
      deleteUk(id);
    }
  };

  const filteredUk = ukList.filter(uk => {
    const matchesSearch = uk.control_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uk.uk_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (uk.controller_company?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" || uk.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = ukList.filter(u => u.status === "pending").length;
  const inProgressCount = ukList.filter(u => u.status === "in_progress").length;
  const approvedCount = ukList.filter(u => u.status === "approved").length;

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUSES.find(s => s.value === status);
    return <Badge className={statusInfo?.color || ""}>{statusInfo?.label || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster uavhengig kontroll...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Uavhengig kontroll</h1>
          <p className="text-muted-foreground">
            Administrer uavhengig kontroll (UK) for prosjektet
          </p>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ny UK
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrer ny uavhengig kontroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kontrollområde *</Label>
                <Select
                  value={newUk.control_area}
                  onValueChange={(v) => setNewUk(prev => ({ ...prev, control_area: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTROL_AREAS.map(area => (
                      <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={newUk.description}
                  onChange={(e) => setNewUk(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv hva som skal kontrolleres..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontrollør</Label>
                  <Input
                    value={newUk.controller_name}
                    onChange={(e) => setNewUk(prev => ({ ...prev, controller_name: e.target.value }))}
                    placeholder="Navn på kontrollør"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kontrollfirma</Label>
                  <Input
                    value={newUk.controller_company}
                    onChange={(e) => setNewUk(prev => ({ ...prev, controller_company: e.target.value }))}
                    placeholder="Firma som utfører kontrollen"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frist</Label>
                <Input
                  type="date"
                  value={newUk.deadline}
                  onChange={(e) => setNewUk(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateUk} disabled={isCreating || !newUk.control_area}>
                  {isCreating ? "Oppretter..." : "Opprett UK"}
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
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Venter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">Under kontroll</p>
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
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Godkjent</p>
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
            placeholder="Søk etter kontroll..."
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

      {/* UK List */}
      {filteredUk.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen uavhengig kontroll registrert</p>
            <p className="text-sm">Registrer en ny UK for å komme i gang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUk.map((uk) => (
            <Card key={uk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{uk.uk_number}</Badge>
                      {getStatusBadge(uk.status)}
                      <Badge variant="secondary">
                        {CONTROL_AREAS.find(c => c.value === uk.control_area)?.label || uk.control_area}
                      </Badge>
                    </div>
                    {uk.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{uk.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {uk.controller_company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {uk.controller_company}
                        </div>
                      )}
                      {uk.controller_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {uk.controller_name}
                        </div>
                      )}
                      {uk.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Frist: {format(new Date(uk.deadline), "d. MMM yyyy", { locale: nb })}
                        </div>
                      )}
                    </div>
                    {uk.result && (
                      <p className="text-sm text-green-600 font-medium">{uk.result}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownloadUkPdf(uk)}
                      title="Last ned PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    {uk.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUk({ id: uk.id, status: "in_progress" })}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Start kontroll
                      </Button>
                    )}
                    {uk.status === "in_progress" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveUk(uk)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Godkjenn
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteUk(uk.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
