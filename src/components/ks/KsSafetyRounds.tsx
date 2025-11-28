import { useState } from "react";
import { Plus, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useKsSafetyRounds } from "@/hooks/useKsSafetyRounds";
import { Skeleton } from "@/components/ui/skeleton";

interface KsSafetyRoundsProps {
  projectId: string;
}

export function KsSafetyRounds({ projectId }: KsSafetyRoundsProps) {
  const { safetyRounds, isLoading, createSafetyRound, updateSafetyRound } = useKsSafetyRounds(projectId);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [formData, setFormData] = useState({
    round_date: new Date().toISOString().split("T")[0],
    participants: "",
    findings: "",
    actions_required: "",
    responsible: "",
    deadline: "",
  });

  const handleCreate = async () => {
    if (!formData.round_date) return;

    const result = await createSafetyRound({
      project_id: projectId,
      round_date: formData.round_date,
      participants: formData.participants || null,
      findings: formData.findings || null,
      actions_required: formData.actions_required || null,
      responsible: formData.responsible || null,
      deadline: formData.deadline || null,
      status: "open",
      photo_paths: null,
    });

    if (result) {
      setShowNewDialog(false);
      setFormData({
        round_date: new Date().toISOString().split("T")[0],
        participants: "",
        findings: "",
        actions_required: "",
        responsible: "",
        deadline: "",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateSafetyRound(id, { status: newStatus });
    if (selectedRound?.id === id) {
      setSelectedRound({ ...selectedRound, status: newStatus });
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vernerunder</CardTitle>
            <CardDescription>{safetyRounds.length} gjennomført for dette prosjektet</CardDescription>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny vernerunde
          </Button>
        </CardHeader>
        <CardContent>
          {safetyRounds.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Ingen vernerunder registrert</p>
              <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrer første vernerunde
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {safetyRounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedRound(round)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Vernerunde {new Date(round.round_date).toLocaleDateString("nb-NO")}</p>
                        <Badge variant={round.status === "closed" ? "default" : "secondary"}>
                          {round.status === "closed" ? "Lukket" : "Åpen"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {round.participants && `Deltakere: ${round.participants}`}
                        {round.responsible && ` • Ansvarlig: ${round.responsible}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ny vernerunde</DialogTitle>
            <DialogDescription>Registrer gjennomført vernerunde</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="round_date">Dato *</Label>
                <Input
                  id="round_date"
                  type="date"
                  value={formData.round_date}
                  onChange={(e) => setFormData({ ...formData, round_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="participants">Deltakere</Label>
                <Input
                  id="participants"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  placeholder="Navn på deltakere"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="findings">Funn/Observasjoner</Label>
              <Textarea
                id="findings"
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                placeholder="Beskriv funn og observasjoner..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="actions">Nødvendige tiltak</Label>
              <Textarea
                id="actions"
                value={formData.actions_required}
                onChange={(e) => setFormData({ ...formData, actions_required: e.target.value })}
                placeholder="Beskriv nødvendige tiltak..."
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
            <Button onClick={handleCreate} disabled={!formData.round_date}>
              Registrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRound} onOpenChange={(open) => !open && setSelectedRound(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vernerunde {selectedRound && new Date(selectedRound.round_date).toLocaleDateString("nb-NO")}</DialogTitle>
            <DialogDescription>Detaljer om vernerunde</DialogDescription>
          </DialogHeader>
          {selectedRound && (
            <div className="space-y-4">
              <div>
                <Label>Deltakere</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRound.participants || "Ikke oppgitt"}</p>
              </div>
              {selectedRound.findings && (
                <div>
                  <Label>Funn/Observasjoner</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedRound.findings}</p>
                </div>
              )}
              {selectedRound.actions_required && (
                <div>
                  <Label>Nødvendige tiltak</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedRound.actions_required}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedRound.responsible && (
                  <div>
                    <Label>Ansvarlig</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRound.responsible}</p>
                  </div>
                )}
                {selectedRound.deadline && (
                  <div>
                    <Label>Frist</Label>
                    <p className="text-sm text-muted-foreground mt-1">{new Date(selectedRound.deadline).toLocaleDateString("nb-NO")}</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex gap-2">
                  {selectedRound.status === "open" ? (
                    <Button onClick={() => handleStatusChange(selectedRound.id, "closed")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marker som lukket
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => handleStatusChange(selectedRound.id, "open")}>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Åpne igjen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}