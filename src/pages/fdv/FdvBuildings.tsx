import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, MapPin, Users, Layers, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useFdvBuildings } from "@/hooks/useFdvBuildings";
import { FdvBuildingDialog } from "@/components/fdv/FdvBuildingDialog";
import { FdvBuilding, FDV_BUILDING_TYPE_LABELS, FDV_OWNER_TYPE_LABELS, FDV_USAGE_TYPE_LABELS } from "@/types/fdv";

export default function FdvBuildings() {
  const navigate = useNavigate();
  const { buildings, isLoading, createBuilding, updateBuilding, deleteBuilding } = useFdvBuildings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<FdvBuilding | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<FdvBuilding | null>(null);

  const handleCreate = () => {
    setEditingBuilding(null);
    setDialogOpen(true);
  };

  const handleEdit = (building: FdvBuilding) => {
    setEditingBuilding(building);
    setDialogOpen(true);
  };

  const handleDelete = (building: FdvBuilding) => {
    setBuildingToDelete(building);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (buildingToDelete) {
      await deleteBuilding(buildingToDelete.id);
      setDeleteDialogOpen(false);
      setBuildingToDelete(null);
    }
  };

  const handleSave = async (data: Partial<FdvBuilding>) => {
    if (editingBuilding) {
      await updateBuilding(editingBuilding.id, data);
    } else {
      await createBuilding(data as Omit<FdvBuilding, 'id' | 'created_at' | 'updated_at'>);
    }
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Byggoversikt
            </h1>
            <p className="text-muted-foreground mt-1">
              Administrer bygg og lokasjoner
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nytt bygg
          </Button>
        </div>

        {/* Buildings Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laster bygg...</div>
        ) : buildings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen bygg registrert</h3>
              <p className="text-muted-foreground mb-4">Kom i gang ved å legge til ditt første bygg</p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Legg til bygg
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <Card 
                key={building.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${building.status === 'inaktiv' ? 'opacity-60' : ''}`}
                onClick={() => navigate(`/fdv/bygg/${building.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{building.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {building.address || 'Ingen adresse'}
                        {building.city && `, ${building.city}`}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(building); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDelete(building); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{FDV_BUILDING_TYPE_LABELS[building.building_type]}</Badge>
                      <Badge variant="secondary">{FDV_OWNER_TYPE_LABELS[building.owner_type]}</Badge>
                      {building.status === 'inaktiv' && (
                        <Badge variant="destructive">Inaktiv</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {building.area_sqm && (
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {building.area_sqm} m²
                        </div>
                      )}
                      {building.floors && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {building.floors} etasje{building.floors > 1 ? 'r' : ''}
                        </div>
                      )}
                      <div className="flex items-center gap-1 col-span-2">
                        <Users className="h-3 w-3" />
                        {FDV_USAGE_TYPE_LABELS[building.usage_type]}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FdvBuildingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        building={editingBuilding}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett bygg</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{buildingToDelete?.name}"? 
              Dette vil også slette alle tilknyttede kontroller, risikovurderinger og dokumenter.
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
