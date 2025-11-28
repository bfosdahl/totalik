import { useState } from "react";
import { Plus, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKsHazardousConditions } from "@/hooks/useKsHazardousConditions";
import { Skeleton } from "@/components/ui/skeleton";

interface KsHazardousConditionsProps {
  projectId: string;
}

type BadgeVariant = "accent" | "default" | "destructive" | "info" | "muted" | "outline" | "secondary" | "success" | "warning";

const severityConfig: Record<string, { label: string; variant: BadgeVariant; color: string }> = {
  low: { label: "Lav", variant: "secondary", color: "text-green-600" },
  medium: { label: "Middels", variant: "default", color: "text-yellow-600" },
  high: { label: "Høy", variant: "warning", color: "text-orange-600" },
  critical: { label: "Kritisk", variant: "destructive", color: "text-red-600" },
};

export function KsHazardousConditions({ projectId }: KsHazardousConditionsProps) {
  const { conditions, isLoading, createCondition, updateCondition } = useKsHazardousConditions(projectId);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [formData, setFormData] = useState({
    discovered_date: new Date().toISOString().split("T")[0],
    location: "",
    description: "",
    severity: "medium",
    measures_taken: "",
    responsible: "",
    deadline: "",
  });

  const handleCreate = async () => {
    if (!formData.location || !formData.description) return;

    const result = await createCondition({
      project_id: projectId,
      discovered_date: formData.discovered_date,
      location: formData.location,
      description: formData.description,
      severity: formData.severity,
      measures_taken: formData.measures_taken || null,
      responsible: formData.responsible || null,
      deadline: formData.deadline || null,
      status: "open",
      closed_date: null,
      photo_paths: null,
    });

    if (result) {
      setShowNewDialog(false);
      setFormData({
        discovered_date: new Date().toISOString().split("T")[0],
        location: "",
        description: "",
        severity: "medium",
        measures_taken: "",
        responsible: "",
        deadline: "",
      });
    }
  };

  const handleClose = async (id: string) => {
    await updateCondition(id, {
      status: "closed",
      closed_date: new Date().toISOString().split("T")[0],
    });
    if (selectedCondition?.id === id) {
      setSelectedCondition(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const openConditions = conditions.filter(c => c.status === "open");
  const closedConditions = conditions.filter(c => c.status === "closed");

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Farlige forhold</CardTitle>
            <CardDescription>
              {openConditions.length} åpne • {closedConditions.length} lukkede
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrer farlig forhold
          </Button>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Ingen farlige forhold registrert</p>
              <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrer første farlige forhold
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {openConditions.length > 0 && (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Åpne forhold</p>
                  {openConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCondition(condition)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className={`h-5 w-5 ${severityConfig[condition.severity as keyof typeof severityConfig].color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{condition.condition_number}</Badge>
                            <p className="font-medium">{condition.description}</p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{condition.location}</span>
                            <span>•</span>
                            <Badge variant={severityConfig[condition.severity as keyof typeof severityConfig].variant}>
                              {severityConfig[condition.severity as keyof typeof severityConfig].label}
                            </Badge>
                            {condition.deadline && (
                              <>
                                <span>•</span>
                                <span>Frist: {new Date(condition.deadline).toLocaleDateString("nb-NO")}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {closedConditions.length > 0 && (
                <>
                  <p className="text-sm font-medium text-muted-foreground mt-6">Lukkede forhold</p>
                  {closedConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors opacity-60"
                      onClick={() => setSelectedCondition(condition)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{condition.condition_number}</Badge>
                            <p className="font-medium">{condition.description}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {condition.location} • Lukket {condition.closed_date && new Date(condition.closed_date).toLocaleDateString("nb-NO")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrer farlig forhold</DialogTitle>
            <DialogDescription>Registrer farlige forhold som krever oppfølging</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discovered_date">Oppdaget dato *</Label>
                <Input
                  id="discovered_date"
                  type="date"
                  value={formData.discovered_date}
                  onChange={(e) => setFormData({ ...formData, discovered_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="severity">Alvorlighetsgrad *</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
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
            <div>
              <Label htmlFor="location">Sted/Lokasjon *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="F.eks. Stillas på 2. etasje"
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskriv det farlige forholdet..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="measures">Tiltak iverksatt</Label>
              <Textarea
                id="measures"
                value={formData.measures_taken}
                onChange={(e) => setFormData({ ...formData, measures_taken: e.target.value })}
                placeholder="Beskriv tiltak som er iverksatt..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsible">Ansvarlig</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Navn på ansvarlig"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Frist</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreate} disabled={!formData.location || !formData.description}>
              Registrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCondition} onOpenChange={(open) => !open && setSelectedCondition(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCondition?.condition_number}
              <Badge variant={selectedCondition?.severity ? severityConfig[selectedCondition.severity as keyof typeof severityConfig].variant : "secondary"}>
                {selectedCondition?.severity ? severityConfig[selectedCondition.severity as keyof typeof severityConfig].label : "Ukjent"}
              </Badge>
            </DialogTitle>
            <DialogDescription>Detaljer om farlig forhold</DialogDescription>
          </DialogHeader>
          {selectedCondition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Oppdaget dato</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selectedCondition.discovered_date).toLocaleDateString("nb-NO")}
                  </p>
                </div>
                <div>
                  <Label>Lokasjon</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedCondition.location}</p>
                </div>
              </div>
              <div>
                <Label>Beskrivelse</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedCondition.description}</p>
              </div>
              {selectedCondition.measures_taken && (
                <div>
                  <Label>Tiltak iverksatt</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedCondition.measures_taken}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedCondition.responsible && (
                  <div>
                    <Label>Ansvarlig</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedCondition.responsible}</p>
                  </div>
                )}
                {selectedCondition.deadline && (
                  <div>
                    <Label>Frist</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedCondition.deadline).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                )}
              </div>
              {selectedCondition.status === "open" && (
                <div className="pt-4 border-t">
                  <Button onClick={() => handleClose(selectedCondition.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marker som lukket
                  </Button>
                </div>
              )}
              {selectedCondition.status === "closed" && selectedCondition.closed_date && (
                <div className="pt-4 border-t">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Lukket {new Date(selectedCondition.closed_date).toLocaleDateString("nb-NO")}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}