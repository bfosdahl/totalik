import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowLeft, Trash2, MapPin, Shield, ArrowRight, FileCheck } from "lucide-react";
import { useKsModule2ShaPlan } from "@/hooks/useKsModule2ShaPlan";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKsRiggPlan, type RiggPlan } from "@/hooks/useKsRiggPlan";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { RiggPlanEditor } from "@/components/ks2/riggplan/RiggPlanEditor";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function Ks2RiggPlan() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { plans, isLoading, isSaving, createPlan, updatePlan, deletePlan } = useKsRiggPlan(projectId || "");
  const { projects } = useKsModule2Projects();
  const { shaPlan } = useKsModule2ShaPlan(projectId || "");
  const project = projects?.find((p) => p.id === projectId);

  const [activePlan, setActivePlan] = useState<RiggPlan | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("Hovedriggplan");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activePlan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActivePlan(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake til riggplaner
        </Button>
        <RiggPlanEditor
          plan={activePlan}
          projectName={project?.project_name || ""}
          projectNumber={project?.project_number || ""}
          isSaving={isSaving}
          onSave={async (canvas_data, name) => {
            const ok = await updatePlan(activePlan.id, { canvas_data, name });
            if (ok) setActivePlan({ ...activePlan, canvas_data, name });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Riggplan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visuell organisering av byggeplassen — brakkerigg, kran, lager, adkomst, rømning og mer.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ny riggplan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Ingen riggplaner enda</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Lag en visuell oversikt over byggeplassen med drag-and-drop symboler.
            </p>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Opprett første riggplan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="cursor-pointer hover:border-primary transition"
              onClick={() => setActivePlan(plan)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="truncate">{plan.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(plan.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {plan.canvas_data?.objects?.length || 0} objekter · v{plan.version}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Oppdatert {format(new Date(plan.updated_at), "d. MMM yyyy HH:mm", { locale: nb })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny riggplan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Navn</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="F.eks. Hovedriggplan, Fase 1, etc."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={async () => {
                const plan = await createPlan(newName);
                setNewOpen(false);
                setNewName("Hovedriggplan");
                if (plan) setActivePlan(plan);
              }}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slette riggplan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Handlingen kan ikke angres.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteId) await deletePlan(deleteId);
                setDeleteId(null);
              }}
            >
              Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
