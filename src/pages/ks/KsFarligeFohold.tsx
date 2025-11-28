import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useKsHazardousConditions, type KsHazardousCondition } from "@/hooks/useKsHazardousConditions";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  open: { label: "Åpen", variant: "destructive" },
  in_progress: { label: "Under arbeid", variant: "default" },
  closed: { label: "Lukket", variant: "secondary" },
};

const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "Lav", variant: "secondary" },
  medium: { label: "Middels", variant: "default" },
  high: { label: "Høy", variant: "destructive" },
};

export default function KsFarligeFohold() {
  const { projects } = useKsProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { conditions, isLoading, createCondition, updateCondition, deleteCondition } = useKsHazardousConditions(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCondition, setEditingCondition] = useState<KsHazardousCondition | null>(null);
  const [formData, setFormData] = useState<{
    project_id: string;
    discovered_date: string;
    location: string;
    description: string;
    severity: "low" | "medium" | "high";
    measures_taken: string;
    responsible: string;
    deadline: string;
    status: "open" | "in_progress" | "closed";
  }>({
    project_id: "",
    discovered_date: new Date().toISOString().split("T")[0],
    location: "",
    description: "",
    severity: "medium",
    measures_taken: "",
    responsible: "",
    deadline: "",
    status: "open",
  });

  const filteredConditions = selectedProjectId
    ? conditions.filter((c) => c.project_id === selectedProjectId)
    : conditions;

  const resetForm = () => {
    setFormData({
      project_id: "",
      discovered_date: new Date().toISOString().split("T")[0],
      location: "",
      description: "",
      severity: "medium",
      measures_taken: "",
      responsible: "",
      deadline: "",
      status: "open",
    });
    setEditingCondition(null);
  };

  const handleSubmit = async () => {
    if (!formData.project_id || !formData.description || !formData.location) {
      return;
    }

    if (editingCondition) {
      await updateCondition(editingCondition.id, formData);
    } else {
      await createCondition({
        ...formData,
        closed_date: null,
        photo_paths: null,
      });
    }

    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (condition: KsHazardousCondition) => {
    setEditingCondition(condition);
    setFormData({
      project_id: condition.project_id,
      discovered_date: condition.discovered_date,
      location: condition.location,
      description: condition.description,
      severity: condition.severity as "low" | "medium" | "high",
      measures_taken: condition.measures_taken || "",
      responsible: condition.responsible || "",
      deadline: condition.deadline || "",
      status: condition.status as "open" | "in_progress" | "closed",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette farlige forholdet?")) {
      await deleteCondition(id);
    }
  };

  const getProjectInfo = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? `${project.project_number} - ${project.name}` : "Ukjent prosjekt";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Farlige forhold</h1>
            <p className="text-muted-foreground">
              Registrer og følg opp farlige forhold på prosjektene
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nytt farlig forhold
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtrer</CardTitle>
            <CardDescription>Vis farlige forhold for et spesifikt prosjekt</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId || "all"}
              onValueChange={(value) => setSelectedProjectId(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle prosjekter" />
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
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Laster...</p>
          </div>
        ) : filteredConditions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen farlige forhold</h3>
              <p className="text-muted-foreground text-center mb-4">
                {selectedProjectId ? "Ingen farlige forhold for valgt prosjekt" : "Registrer ditt første farlige forhold"}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nytt farlig forhold
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredConditions.map((condition) => (
              <Card key={condition.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getProjectInfo(condition.project_id)}</Badge>
                        <Badge variant="outline">{condition.condition_number}</Badge>
                        <Badge variant={statusConfig[condition.status]?.variant || "secondary"}>
                          {statusConfig[condition.status]?.label || condition.status}
                        </Badge>
                        <Badge variant={severityConfig[condition.severity]?.variant || "default"}>
                          {severityConfig[condition.severity]?.label || condition.severity}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">
                        {condition.location} • {format(new Date(condition.discovered_date), "d. MMM yyyy", { locale: nb })}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(condition)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(condition.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Beskrivelse</p>
                    <p className="text-sm">{condition.description}</p>
                  </div>
                  {condition.measures_taken && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Tiltak iverksatt</p>
                      <p className="text-sm">{condition.measures_taken}</p>
                    </div>
                  )}
                  {condition.responsible && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Ansvarlig</p>
                      <p className="text-sm">
                        {condition.responsible}
                        {condition.deadline && ` • Frist: ${format(new Date(condition.deadline), "d. MMM yyyy", { locale: nb })}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCondition ? "Rediger farlig forhold" : "Nytt farlig forhold"}</DialogTitle>
              <DialogDescription>
                Dokumenter og følg opp farlige forhold på prosjekt
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Prosjekt *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: value }))}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discovered_date">Oppdaget dato *</Label>
                  <Input
                    type="date"
                    id="discovered_date"
                    value={formData.discovered_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discovered_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Sted *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="F.eks. 2. etasje, ved trapp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv det farlige forholdet..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="severity">Alvorlighetsgrad *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lav</SelectItem>
                      <SelectItem value="medium">Middels</SelectItem>
                      <SelectItem value="high">Høy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Åpen</SelectItem>
                      <SelectItem value="in_progress">Under arbeid</SelectItem>
                      <SelectItem value="closed">Lukket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="measures_taken">Tiltak iverksatt</Label>
                <Textarea
                  id="measures_taken"
                  value={formData.measures_taken}
                  onChange={(e) => setFormData((prev) => ({ ...prev, measures_taken: e.target.value }))}
                  placeholder="Beskriv tiltak som er iverksatt..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Ansvarlig</Label>
                  <Input
                    id="responsible"
                    value={formData.responsible}
                    onChange={(e) => setFormData((prev) => ({ ...prev, responsible: e.target.value }))}
                    placeholder="Navn på ansvarlig"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Frist</Label>
                  <Input
                    type="date"
                    id="deadline"
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.project_id || !formData.description || !formData.location}
              >
                {editingCondition ? "Lagre endringer" : "Registrer forhold"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
