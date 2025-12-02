import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, MapPin, Users, Calendar, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectWizard } from "@/components/ks/ProjectWizard";
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
import { useKsProjects, NewKsProjectInput, KsProjectResponsibility } from "@/hooks/useKsProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const sokerFunksjoner = [
  { value: "SØK", label: "SØK – Ansvarlig søker TK1–3" },
];

const projektorendeFunksjoner = [
  { value: "PRO-ARK", label: "a. Arkitektur" },
  { value: "PRO-VEG", label: "b. Veg, utearealer og landskapsutforming" },
  { value: "PRO-OPP", label: "c. Oppmålingsteknisk prosjektering" },
  { value: "PRO-BRA", label: "d. Brannkonsept" },
  { value: "PRO-GEO", label: "e. Geoteknikk" },
  { value: "PRO-KON", label: "f. Konstruksjonssikkerhet" },
  { value: "PRO-BYG", label: "g. Bygningsfysikk" },
  { value: "PRO-SAN", label: "h. Sanitærinstallasjoner" },
  { value: "PRO-VAR", label: "i. Varme- og kuldeinstallasjoner" },
  { value: "PRO-SLU", label: "j. Slukkeinstallasjoner" },
  { value: "PRO-VEN", label: "k. Ventilasjon- og klimainstallasjoner" },
  { value: "PRO-VAN", label: "l. Vannforsynings- og avløpsanlegg" },
  { value: "PRO-FJE", label: "m. Fjernvarmeanlegg" },
  { value: "PRO-LOF", label: "n. Løfteinnretninger" },
  { value: "PRO-LYD", label: "o. Lydforhold og vibrasjoner" },
  { value: "PRO-MIL", label: "p. Miljøsanering" },
  { value: "PRO-BRAL", label: "q. Brannalarmanlegg" },
  { value: "PRO-LED", label: "r. Ledesystem" },
];

const utforendeFunksjoner = [
  { value: "UTF-INM", label: "a. Innmåling og utstikking av tiltak" },
  { value: "UTF-VEG", label: "b. Veg- og grunnarbeider" },
  { value: "UTF-LAN", label: "c. Landskapsutforming" },
  { value: "UTF-VAN", label: "d. Vannforsynings- og avløpsanlegg" },
  { value: "UTF-FJE", label: "e. Fjernvarmeanlegg" },
  { value: "UTF-BET", label: "f. Plasstøpte betongkonstruksjoner" },
  { value: "UTF-TOM", label: "g. Tømrerarbeid og montering av trekonstruksjoner" },
  { value: "UTF-MUR", label: "h. Murarbeid" },
  { value: "UTF-MET", label: "i. Montering av bærende metall- eller betongkonstruksjoner" },
  { value: "UTF-GLA", label: "j. Montering av glasskonstruksjoner og fasadekledning" },
  { value: "UTF-TAK", label: "k. Taktekkingsarbeid" },
  { value: "UTF-BEV", label: "l. Arbeid på bevaringsverdige byggverk" },
  { value: "UTF-BRAL", label: "m. Installasjon av brannalarmanlegg" },
  { value: "UTF-LED", label: "n. Installasjon av ledesystem" },
  { value: "UTF-SAN", label: "o. Sanitærinstallasjoner" },
  { value: "UTF-VAR", label: "p. Varme- og kuldeinstallasjoner" },
  { value: "UTF-SLU", label: "q. Slukkeinstallasjoner" },
  { value: "UTF-VEN", label: "r. Ventilasjon- og klimainstallasjoner" },
  { value: "UTF-LOF", label: "s. Løfteinnretninger" },
  { value: "UTF-RIV", label: "t. Riving og miljøsanering" },
];

const kontrollendeFunksjoner = [
  { value: "KTR-OVE", label: "KTR – Overordnet ansvar for kontroll" },
  { value: "KTR-VAT", label: "KTR – Våtrom" },
  { value: "KTR-LUF", label: "KTR – Lufttetthet" },
  { value: "KTR-BYG", label: "KTR – Bygningsfysikk" },
  { value: "KTR-KON", label: "KTR – Konstruksjon" },
  { value: "KTR-GEO", label: "KTR – Geoteknikk" },
  { value: "KTR-BRA", label: "KTR – Brann" },
  { value: "KTR-ANN", label: "KTR – Annet" },
];

type RoleType = 'SØK' | 'PRO' | 'UTF' | 'KTR';

export default function KsProjects() {
  const navigate = useNavigate();
  const { projects, isLoading, deleteProject } = useKsProjects();
  const [showWizard, setShowWizard] = useState(false);

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
          <Button onClick={() => setShowWizard(true)}>
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
              <Button onClick={() => setShowWizard(true)}>
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {project.project_number}
                      </Badge>
                    </div>
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
                  {project.responsibilities && project.responsibilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {project.responsibilities.map((resp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {resp.role_type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectWizard open={showWizard} onOpenChange={setShowWizard} />
    </AppLayout>
  );
}

interface ResponsibilityFormProps {
  roleType: RoleType;
  label: string;
  funksjoner: { value: string; label: string }[];
  onAdd: (roleType: RoleType, funksjon: string, navn: string) => void;
}

function ResponsibilityForm({ roleType, label, funksjoner, onAdd }: ResponsibilityFormProps) {
  const [funksjon, setFunksjon] = useState('');
  const [navn, setNavn] = useState('');

  const handleAdd = () => {
    if (funksjon && navn) {
      onAdd(roleType, funksjon, navn);
      setFunksjon('');
      setNavn('');
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded-md">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="space-y-2">
        <Select value={funksjon} onValueChange={setFunksjon}>
          <SelectTrigger>
            <SelectValue placeholder="Velg funksjon" />
          </SelectTrigger>
          <SelectContent>
            {funksjoner.map(f => (
              <SelectItem key={f.value} value={f.label}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            placeholder="Navn på ansvarlig"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!funksjon || !navn}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
