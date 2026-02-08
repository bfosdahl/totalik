import { useState } from "react";
import { AlertTriangle, Plus, Shield, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFdvRiskAssessments } from "@/hooks/useFdvRiskAssessments";
import { useFdvBuildings } from "@/hooks/useFdvBuildings";
import { FdvRiskDialog } from "@/components/fdv/FdvRiskDialog";
import { FdvRiskAssessment, FDV_RISK_CATEGORY_LABELS } from "@/types/fdv";

export default function FdvRisks() {
  const { risks, highRisks, mediumRisks, lowRisks, isLoading, createRisk, updateRisk, deleteRisk } = useFdvRiskAssessments();
  const { buildings } = useFdvBuildings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<FdvRiskAssessment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<FdvRiskAssessment | null>(null);

  const handleCreate = () => {
    setEditingRisk(null);
    setDialogOpen(true);
  };

  const handleEdit = (risk: FdvRiskAssessment) => {
    setEditingRisk(risk);
    setDialogOpen(true);
  };

  const handleDelete = (risk: FdvRiskAssessment) => {
    setRiskToDelete(risk);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (riskToDelete) {
      await deleteRisk(riskToDelete.id);
      setDeleteDialogOpen(false);
      setRiskToDelete(null);
    }
  };

  const handleSave = async (data: Partial<FdvRiskAssessment>) => {
    if (editingRisk) {
      await updateRisk(editingRisk.id, data);
    } else {
      await createRisk(data as Omit<FdvRiskAssessment, 'id' | 'created_at' | 'updated_at' | 'risk_score'>);
    }
    setDialogOpen(false);
  };

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || 'Ukjent bygg';
  };

  const getRiskColor = (score: number) => {
    if (score >= 15) return "bg-red-500";
    if (score >= 8) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskBadge = (score: number) => {
    if (score >= 15) return <Badge variant="destructive">Høy risiko</Badge>;
    if (score >= 8) return <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">Middels risiko</Badge>;
    return <Badge variant="outline" className="text-green-600">Lav risiko</Badge>;
  };

  const activeRisks = risks.filter(r => r.status === 'aktiv');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-primary" />
              Risikoanalyse – Bygg
            </h1>
            <p className="text-muted-foreground mt-1">
              Kartlegg risiko knyttet til bygningsmassen
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny risikovurdering
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activeRisks.length}</p>
                  <p className="text-sm text-muted-foreground">Aktive risikoer</p>
                </div>
                <Shield className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">{highRisks.length}</p>
                  <p className="text-sm text-muted-foreground">Høy risiko</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">{mediumRisks.length}</p>
                  <p className="text-sm text-muted-foreground">Middels risiko</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{lowRisks.length}</p>
                  <p className="text-sm text-muted-foreground">Lav risiko</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Laster risikovurderinger...</div>
        ) : risks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen risikovurderinger</h3>
              <p className="text-muted-foreground mb-4">Start med å kartlegge risiko for dine bygg</p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Ny risikovurdering
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {risks.map((risk) => (
              <Card key={risk.id} className={risk.status !== 'aktiv' ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(risk.risk_score)}`} />
                        <h3 className="font-medium">{risk.hazard_description}</h3>
                        {getRiskBadge(risk.risk_score)}
                        {risk.status !== 'aktiv' && (
                          <Badge variant="outline">{risk.status === 'lukket' ? 'Lukket' : 'Under behandling'}</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{FDV_RISK_CATEGORY_LABELS[risk.category]}</span>
                        <span>{getBuildingName(risk.building_id)}</span>
                        {risk.responsible_name && <span>Ansvarlig: {risk.responsible_name}</span>}
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Risikoscore:</span>
                          <div className="flex items-center gap-1">
                            <Progress value={(risk.risk_score / 25) * 100} className="w-20 h-2" />
                            <span className="text-sm font-medium">{risk.risk_score}/25</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          S: {risk.probability} × K: {risk.consequence}
                        </span>
                      </div>

                      {risk.actions && risk.actions.length > 0 && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {risk.actions.filter(a => a.status === 'fullfort').length}/{risk.actions.length} tiltak fullført
                          </Badge>
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(risk)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(risk)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FdvRiskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        risk={editingRisk}
        buildings={buildings}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett risikovurdering</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne risikovurderingen?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
