import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKsInspections, InspectionType, InspectionStatus } from "@/hooks/useKsInspections";
import { useKsProjects } from "@/hooks/useKsProjects";
import { Calendar, MapPin, Plus, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const inspectionTypeLabels: Record<InspectionType, string> = {
  ferdigbefaring: "Ferdigbefaring",
  forhåndsbefaring: "Forhåndsbefaring",
  hms: "HMS",
  sluttbefaring: "Sluttbefaring",
  vernerunde: "Vernerunde",
  befaring: "Befaring",
};

const statusLabels: Record<InspectionStatus, string> = {
  planlagt: "Planlagt",
  ikke_startet: "Ikke startet",
  pågår: "Pågår",
  ferdig: "Ferdig",
  aktiv: "Aktiv",
  tilbud_opprettet: "Tilbud opprettet",
  faktura_opprettet: "Faktura opprettet",
  fakturert: "Fakturert",
  utløpt: "Utløpt",
};

export default function KsInspeksjoner() {
  const { inspections, isLoading, createInspection } = useKsInspections();
  const { projects } = useKsProjects();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterScope, setFilterScope] = useState<"all" | "project">("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("alle");
  const [filterInspectionType, setFilterInspectionType] = useState<string>("alle");
  
  const [formData, setFormData] = useState({
    project_id: "",
    inspection_date: format(new Date(), "yyyy-MM-dd"),
    inspection_type: "vernerunde" as InspectionType,
    tittel: "",
    område: "",
    tidspunkt: "",
    planlagt_start: "",
    beskrivelse: "",
    status: "planlagt" as InspectionStatus,
  });

  // Filter inspections
  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    // Filter by scope
    if (filterScope === "project" && filterProject !== "all") {
      filtered = filtered.filter((i) => i.project_id === filterProject);
    }

    // Filter by status
    if (filterStatus !== "alle") {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    // Filter by inspection type
    if (filterInspectionType !== "alle") {
      filtered = filtered.filter((i) => i.inspection_type === filterInspectionType);
    }

    return filtered;
  }, [inspections, filterScope, filterProject, filterStatus, filterInspectionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInspection({
      project_id: formData.project_id,
      inspection_date: formData.inspection_date,
      inspection_type: formData.inspection_type,
      tittel: formData.tittel || null,
      område: formData.område || null,
      tidspunkt: formData.tidspunkt || null,
      planlagt_start: formData.planlagt_start || null,
      startdato: null,
      sluttdato: null,
      beskrivelse: formData.beskrivelse || null,
      adresse: null,
      postal_code: null,
      city: null,
      kunde_navn: null,
      gyldig_til: null,
      status: formData.status,
      pris: null,
      template_id: null,
      results: [],
      opprettet_av_user_id: null,
      opprettet_av_navn: null,
    });
    setShowNewDialog(false);
    setFormData({
      project_id: "",
      inspection_date: format(new Date(), "yyyy-MM-dd"),
      inspection_type: "vernerunde",
      tittel: "",
      område: "",
      tidspunkt: "",
      planlagt_start: "",
      beskrivelse: "",
      status: "planlagt",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Laster inspeksjoner...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inspeksjoner</h1>
            <p className="text-muted-foreground">
              Alle typer inspeksjoner samlet på ett sted
            </p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Opprett inspeksjon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ny inspeksjon</DialogTitle>
                <DialogDescription>
                  Opprett en ny inspeksjon knyttet til et prosjekt
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="project_id">Prosjekt *</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, project_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg prosjekt" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.project_number} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="inspection_type">Inspeksjonstype *</Label>
                    <Select
                      value={formData.inspection_type}
                      onValueChange={(value: InspectionType) =>
                        setFormData({ ...formData, inspection_type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ferdigbefaring">Ferdigbefaring</SelectItem>
                        <SelectItem value="forhåndsbefaring">Forhåndsbefaring</SelectItem>
                        <SelectItem value="hms">HMS</SelectItem>
                        <SelectItem value="sluttbefaring">Sluttbefaring</SelectItem>
                        <SelectItem value="vernerunde">Vernerunde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="tittel">Tittel *</Label>
                    <Input
                      id="tittel"
                      value={formData.tittel}
                      onChange={(e) =>
                        setFormData({ ...formData, tittel: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="inspection_date">Dato *</Label>
                    <Input
                      id="inspection_date"
                      type="date"
                      value={formData.inspection_date}
                      onChange={(e) =>
                        setFormData({ ...formData, inspection_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tidspunkt">Tidspunkt</Label>
                    <Input
                      id="tidspunkt"
                      placeholder="09:00 - 12:00"
                      value={formData.tidspunkt}
                      onChange={(e) =>
                        setFormData({ ...formData, tidspunkt: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="område">Område</Label>
                    <Input
                      id="område"
                      value={formData.område}
                      onChange={(e) =>
                        setFormData({ ...formData, område: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="planlagt_start">Planlagt start</Label>
                    <Input
                      id="planlagt_start"
                      type="datetime-local"
                      value={formData.planlagt_start}
                      onChange={(e) =>
                        setFormData({ ...formData, planlagt_start: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="beskrivelse">Beskrivelse</Label>
                    <Textarea
                      id="beskrivelse"
                      value={formData.beskrivelse}
                      onChange={(e) =>
                        setFormData({ ...formData, beskrivelse: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: InspectionStatus) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planlagt">Planlagt</SelectItem>
                        <SelectItem value="ikke_startet">Ikke startet</SelectItem>
                        <SelectItem value="pågår">Pågår</SelectItem>
                        <SelectItem value="ferdig">Ferdig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">Opprett inspeksjon</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Område</Label>
                <RadioGroup
                  value={filterScope}
                  onValueChange={(value: "all" | "project") => setFilterScope(value)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="scope-all" />
                    <Label htmlFor="scope-all" className="cursor-pointer">Alt</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="project" id="scope-project" />
                    <Label htmlFor="scope-project" className="cursor-pointer">Prosjekt</Label>
                  </div>
                </RadioGroup>
              </div>

              {filterScope === "project" && (
                <div>
                  <Label>Velg prosjekt</Label>
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle prosjekter</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_number} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle</SelectItem>
                    <SelectItem value="planlagt">Planlagt</SelectItem>
                    <SelectItem value="ikke_startet">Ikke startet</SelectItem>
                    <SelectItem value="pågår">Pågår</SelectItem>
                    <SelectItem value="ferdig">Ferdig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Inspeksjonstype</Label>
                <Select value={filterInspectionType} onValueChange={setFilterInspectionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle</SelectItem>
                    <SelectItem value="ferdigbefaring">Ferdigbefaring</SelectItem>
                    <SelectItem value="forhåndsbefaring">Forhåndsbefaring</SelectItem>
                    <SelectItem value="hms">HMS</SelectItem>
                    <SelectItem value="sluttbefaring">Sluttbefaring</SelectItem>
                    <SelectItem value="vernerunde">Vernerunde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inspeksjoner ({filteredInspections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInspections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen inspeksjoner funnet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tittel</TableHead>
                      <TableHead>Inspeksjonstype</TableHead>
                      <TableHead>Område</TableHead>
                      <TableHead>Tidspunkt</TableHead>
                      <TableHead>Planlagt start</TableHead>
                      <TableHead>Startdato</TableHead>
                      <TableHead>Sluttdato</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-medium">
                          {inspection.tittel || "Uten tittel"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inspectionTypeLabels[inspection.inspection_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inspection.område ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{inspection.område}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{inspection.tidspunkt || "-"}</TableCell>
                        <TableCell>
                          {inspection.planlagt_start
                            ? format(new Date(inspection.planlagt_start), "dd.MM.yyyy HH:mm", {
                                locale: nb,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {inspection.startdato
                            ? format(new Date(inspection.startdato), "dd.MM.yyyy HH:mm", {
                                locale: nb,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {inspection.sluttdato
                            ? format(new Date(inspection.sluttdato), "dd.MM.yyyy HH:mm", {
                                locale: nb,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inspection.status === "ferdig"
                                ? "default"
                                : inspection.status === "pågår"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {statusLabels[inspection.status]}
                          </Badge>
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
    </AppLayout>
  );
}
