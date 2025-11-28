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
import { Plus, Shield, Edit2, Trash2 } from "lucide-react";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useKsSafetyRounds, type KsSafetyRound } from "@/hooks/useKsSafetyRounds";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Planlagt", variant: "secondary" },
  completed: { label: "Gjennomført", variant: "default" },
  cancelled: { label: "Kansellert", variant: "destructive" },
};

export default function KsVernerunder() {
  const { projects } = useKsProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { safetyRounds, isLoading, createSafetyRound, updateSafetyRound, deleteSafetyRound } = useKsSafetyRounds(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRound, setEditingRound] = useState<KsSafetyRound | null>(null);
  const [formData, setFormData] = useState<{
    project_id: string;
    round_date: string;
    participants: string;
    findings: string;
    actions_required: string;
    responsible: string;
    deadline: string;
    status: "pending" | "completed" | "cancelled";
  }>({
    project_id: "",
    round_date: new Date().toISOString().split("T")[0],
    participants: "",
    findings: "",
    actions_required: "",
    responsible: "",
    deadline: "",
    status: "pending",
  });

  const filteredRounds = selectedProjectId
    ? safetyRounds.filter((r) => r.project_id === selectedProjectId)
    : safetyRounds;

  const resetForm = () => {
    setFormData({
      project_id: "",
      round_date: new Date().toISOString().split("T")[0],
      participants: "",
      findings: "",
      actions_required: "",
      responsible: "",
      deadline: "",
      status: "pending",
    });
    setEditingRound(null);
  };

  const handleSubmit = async () => {
    if (!formData.project_id || !formData.round_date) {
      return;
    }

    if (editingRound) {
      await updateSafetyRound(editingRound.id, formData);
    } else {
      await createSafetyRound({
        ...formData,
        photo_paths: null,
      });
    }

    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (round: KsSafetyRound) => {
    setEditingRound(round);
    setFormData({
      project_id: round.project_id,
      round_date: round.round_date,
      participants: round.participants || "",
      findings: round.findings || "",
      actions_required: round.actions_required || "",
      responsible: round.responsible || "",
      deadline: round.deadline || "",
      status: round.status as "pending" | "completed" | "cancelled",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne vernerunden?")) {
      await deleteSafetyRound(id);
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
            <h1 className="text-2xl font-bold text-foreground">Vernerunder</h1>
            <p className="text-muted-foreground">
              Planlegg og dokumenter vernerunder på prosjektene
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ny vernerunde
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtrer</CardTitle>
            <CardDescription>Vis vernerunder for et spesifikt prosjekt</CardDescription>
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
        ) : filteredRounds.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen vernerunder</h3>
              <p className="text-muted-foreground text-center mb-4">
                {selectedProjectId ? "Ingen vernerunder for valgt prosjekt" : "Opprett din første vernerunde"}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ny vernerunde
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRounds.map((round) => (
              <Card key={round.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getProjectInfo(round.project_id)}</Badge>
                        <Badge variant={statusConfig[round.status]?.variant || "secondary"}>
                          {statusConfig[round.status]?.label || round.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">
                        Vernerunde {format(new Date(round.round_date), "d. MMMM yyyy", { locale: nb })}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(round)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(round.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {round.participants && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Deltakere</p>
                      <p className="text-sm">{round.participants}</p>
                    </div>
                  )}
                  {round.findings && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Funn</p>
                      <p className="text-sm">{round.findings}</p>
                    </div>
                  )}
                  {round.actions_required && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Tiltak påkrevd</p>
                      <p className="text-sm">{round.actions_required}</p>
                    </div>
                  )}
                  {round.responsible && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Ansvarlig</p>
                      <p className="text-sm">
                        {round.responsible}
                        {round.deadline && ` • Frist: ${format(new Date(round.deadline), "d. MMM yyyy", { locale: nb })}`}
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
              <DialogTitle>{editingRound ? "Rediger vernerunde" : "Ny vernerunde"}</DialogTitle>
              <DialogDescription>
                Dokumenter gjennomført vernerunde på prosjekt
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
                  <Label htmlFor="round_date">Dato *</Label>
                  <Input
                    type="date"
                    id="round_date"
                    value={formData.round_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, round_date: e.target.value }))}
                  />
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
                      <SelectItem value="pending">Planlagt</SelectItem>
                      <SelectItem value="completed">Gjennomført</SelectItem>
                      <SelectItem value="cancelled">Kansellert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">Deltakere</Label>
                <Input
                  id="participants"
                  value={formData.participants}
                  onChange={(e) => setFormData((prev) => ({ ...prev, participants: e.target.value }))}
                  placeholder="Navn på deltakere"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="findings">Funn</Label>
                <Textarea
                  id="findings"
                  value={formData.findings}
                  onChange={(e) => setFormData((prev) => ({ ...prev, findings: e.target.value }))}
                  placeholder="Beskriv funn fra vernerunden..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actions_required">Tiltak påkrevd</Label>
                <Textarea
                  id="actions_required"
                  value={formData.actions_required}
                  onChange={(e) => setFormData((prev) => ({ ...prev, actions_required: e.target.value }))}
                  placeholder="Beskriv nødvendige tiltak..."
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
              <Button onClick={handleSubmit} disabled={!formData.project_id || !formData.round_date}>
                {editingRound ? "Lagre endringer" : "Opprett vernerunde"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
