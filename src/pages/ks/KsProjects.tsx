import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, MapPin, Users, Calendar, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKsProjects, NewKsProjectInput } from "@/hooks/useKsProjects";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planlagt: { label: "Planlagt", variant: "secondary" },
  pågår: { label: "Pågår", variant: "default" },
  ferdig: { label: "Ferdig", variant: "outline" },
  arkivert: { label: "Arkivert", variant: "destructive" },
};

const tiltaksklasseOptions = [
  { value: "1", label: "Tiltaksklasse 1" },
  { value: "2", label: "Tiltaksklasse 2" },
  { value: "3", label: "Tiltaksklasse 3" },
];

export default function KsProjects() {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, deleteProject, isSaving } = useKsProjects();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [formData, setFormData] = useState<NewKsProjectInput>({
    name: "",
    address: "",
    client_name: "",
    tiltaksklasse: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  const handleCreateProject = async () => {
    if (!formData.name || !formData.start_date) return;
    
    const result = await createProject(formData);
    if (result) {
      setShowNewDialog(false);
      setFormData({
        name: "",
        address: "",
        client_name: "",
        tiltaksklasse: "",
        start_date: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette prosjektet?")) {
      await deleteProject(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KS Prosjekter</h1>
            <p className="text-muted-foreground">
              Kvalitetssikring for bygg- og anleggsprosjekter
            </p>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nytt prosjekt
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen prosjekter enda</h3>
              <p className="text-muted-foreground text-center mb-4">
                Opprett ditt første KS-prosjekt for å komme i gang med kvalitetssikring.
              </p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Opprett prosjekt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/ks/projects/${project.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.client_name || "Ingen kunde"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ks/projects/${project.id}`);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Åpne
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Edit dialog
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Slett
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {project.address}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.start_date).toLocaleDateString("nb-NO")}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={statusConfig[project.status]?.variant || "secondary"}>
                      {statusConfig[project.status]?.label || project.status}
                    </Badge>
                    {project.tiltaksklasse && (
                      <span className="text-xs text-muted-foreground">
                        Tiltaksklasse {project.tiltaksklasse}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nytt KS-prosjekt</DialogTitle>
            <DialogDescription>
              Opprett et nytt kvalitetssikringsprosjekt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Prosjektnavn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="F.eks. Enebolig Kongsberg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Kunde / Byggherre</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="F.eks. Ola Nordmann"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="F.eks. Storgata 1, 3600 Kongsberg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiltaksklasse">Tiltaksklasse</Label>
              <Select
                value={formData.tiltaksklasse}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tiltaksklasse: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg tiltaksklasse" />
                </SelectTrigger>
                <SelectContent>
                  {tiltaksklasseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdato *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreateProject} 
              disabled={!formData.name || !formData.start_date || isSaving}
            >
              {isSaving ? "Oppretter..." : "Opprett prosjekt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}