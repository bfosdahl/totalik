import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PenTool, Plus, Building2, Image, MoreHorizontal, Pencil, Trash2, Download, Eye } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
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
import { AppLayout } from "@/components/layout/AppLayout";
import { useFdvBuildings } from "@/hooks/useFdvBuildings";
import { FdvFloorPlanEditor } from "@/components/fdv/FdvFloorPlanEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface FloorPlan {
  id: string;
  building_id: string;
  company_id: string;
  floor_name: string;
  image_url: string | null;
  elements_json: string | null;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

export default function FdvFloorPlans() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { buildings, activeBuildings, isLoading: buildingsLoading } = useFdvBuildings();
  
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [editingPlan, setEditingPlan] = useState<FloorPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<FloorPlan | null>(null);
  const [previewPlan, setPreviewPlan] = useState<FloorPlan | null>(null);
  const [selectBuildingOpen, setSelectBuildingOpen] = useState(false);

  const companyId = profile?.company_id;

  // Helper to get a signed URL for a storage path
  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("fdv-documents")
      .createSignedUrl(storagePath, 3600);
    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    return data.signedUrl;
  };

  // Extract storage path from a stored value (handles both old public URLs and new paths)
  const extractStoragePath = (imageUrl: string): string => {
    // If it's a full URL (old format), extract the path after the bucket name
    if (imageUrl.startsWith("http")) {
      const marker = "/fdv-documents/";
      const idx = imageUrl.indexOf(marker);
      if (idx !== -1) {
        return decodeURIComponent(imageUrl.substring(idx + marker.length));
      }
    }
    return imageUrl;
  };

  // Fetch floor plans
  const fetchFloorPlans = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("fdv_floor_plans")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Generate signed URLs for all plans that have images
      const plans = (data as FloorPlan[]) || [];
      const plansWithSignedUrls = await Promise.all(
        plans.map(async (plan) => {
          if (plan.image_url) {
            const storagePath = extractStoragePath(plan.image_url);
            const signedUrl = await getSignedUrl(storagePath);
            return { ...plan, image_url: signedUrl };
          }
          return plan;
        })
      );

      setFloorPlans(plansWithSignedUrls);
    } catch (error) {
      console.error("Error fetching floor plans:", error);
      toast.error("Kunne ikke hente etasjeplaner");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorPlans();
  }, [companyId]);

  const handleNewPlan = () => {
    if (activeBuildings.length === 0) {
      toast.error("Du må opprette et bygg først");
      navigate("/fdv/bygg");
      return;
    }
    
    if (activeBuildings.length === 1) {
      setSelectedBuilding(activeBuildings[0].id);
      setEditingPlan(null);
      setEditorOpen(true);
    } else {
      setSelectBuildingOpen(true);
    }
  };

  const handleSelectBuilding = () => {
    if (!selectedBuilding) {
      toast.error("Velg et bygg");
      return;
    }
    setSelectBuildingOpen(false);
    setEditingPlan(null);
    setEditorOpen(true);
  };

  const handleEditPlan = (plan: FloorPlan) => {
    setSelectedBuilding(plan.building_id);
    setEditingPlan(plan);
    setEditorOpen(true);
  };

  const handleDeletePlan = (plan: FloorPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      // Delete image from storage if exists
      if (planToDelete.image_url) {
        const path = planToDelete.image_url.split("/").pop();
        if (path) {
          await supabase.storage.from("fdv-documents").remove([`${companyId}/floor-plans/${path}`]);
        }
      }

      const { error } = await supabase
        .from("fdv_floor_plans")
        .delete()
        .eq("id", planToDelete.id);

      if (error) throw error;

      toast.success("Etasjeplan slettet");
      await fetchFloorPlans();
    } catch (error) {
      console.error("Error deleting floor plan:", error);
      toast.error("Kunne ikke slette etasjeplan");
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleSavePlan = async (imageDataUrl: string, elementsJson: string) => {
    if (!companyId || !profile || !selectedBuilding) return;

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Generate filename
      const filename = `floor-plan-${Date.now()}.png`;
      const storagePath = `${companyId}/floor-plans/${filename}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("fdv-documents")
        .upload(storagePath, blob, { contentType: "image/png", upsert: true });

      if (uploadError) throw uploadError;

      // Store the storage path (not public URL) since bucket is private
      const parsed = JSON.parse(elementsJson);
      const floorName = parsed.floorName || "Etasje";

      if (editingPlan) {
        // Update existing
        const { error } = await supabase
          .from("fdv_floor_plans")
          .update({
            floor_name: floorName,
            image_url: storagePath,
            elements_json: elementsJson,
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast.success("Etasjeplan oppdatert");
      } else {
        // Create new
        const { error } = await supabase
          .from("fdv_floor_plans")
          .insert({
            building_id: selectedBuilding,
            company_id: companyId,
            floor_name: floorName,
            image_url: storagePath,
            elements_json: elementsJson,
            created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          });

        if (error) throw error;
        toast.success("Etasjeplan lagret");
      }

      setEditorOpen(false);
      setEditingPlan(null);
      await fetchFloorPlans();
    } catch (error) {
      console.error("Error saving floor plan:", error);
      toast.error("Kunne ikke lagre etasjeplan");
    }
  };

  const downloadPlan = async (plan: FloorPlan) => {
    if (!plan.image_url) return;
    
    // image_url at this point is already a signed URL from fetchFloorPlans
    try {
      const response = await fetch(plan.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${plan.floor_name}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading plan:", error);
      toast.error("Kunne ikke laste ned etasjeplan");
    }
  };

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || "Ukjent bygg";
  };

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PenTool className="h-7 w-7 text-primary" />
              Etasjeplaner
            </h1>
            <p className="text-muted-foreground mt-1">
              Tegn enkle skisser av byggets etasjer med nødutganger, rom og utstyr
            </p>
          </div>
          <Button onClick={handleNewPlan} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny etasjeplan
          </Button>
        </div>

        {/* Floor Plans Grid */}
        {isLoading || buildingsLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laster etasjeplaner...</div>
        ) : floorPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PenTool className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen etasjeplaner</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Lag enkle skisser av byggets etasjer med nødutganger, toaletter, kontorer og sikkerhetsutstyr
              </p>
              <Button onClick={handleNewPlan} className="gap-2">
                <Plus className="h-4 w-4" />
                Tegn ny etasjeplan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorPlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="aspect-video bg-muted relative cursor-pointer"
                  onClick={() => setPreviewPlan(plan)}
                >
                  {plan.image_url ? (
                    <img 
                      src={plan.image_url} 
                      alt={plan.floor_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{plan.floor_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {getBuildingName(plan.building_id)}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadPlan(plan)}>
                          <Download className="h-4 w-4 mr-2" />
                          Last ned
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeletePlan(plan)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Av {plan.created_by_name}</span>
                    <span>{format(new Date(plan.created_at), "d. MMM yyyy", { locale: nb })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Select Building Dialog */}
      <Dialog open={selectBuildingOpen} onOpenChange={setSelectBuildingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Velg bygg</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger>
                <SelectValue placeholder="Velg et bygg" />
              </SelectTrigger>
              <SelectContent>
                {activeBuildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectBuildingOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSelectBuilding} disabled={!selectedBuilding}>
                Fortsett
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floor Plan Editor */}
      {editorOpen && selectedBuildingData && (
        <FdvFloorPlanEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          buildingName={selectedBuildingData.name}
          initialData={editingPlan?.elements_json || undefined}
          onSave={handleSavePlan}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPlan} onOpenChange={() => setPreviewPlan(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewPlan?.floor_name}</DialogTitle>
          </DialogHeader>
          {previewPlan?.image_url && (
            <div className="bg-muted rounded-lg overflow-hidden">
              <img 
                src={previewPlan.image_url} 
                alt={previewPlan.floor_name}
                className="w-full h-auto"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => previewPlan && downloadPlan(previewPlan)}>
              <Download className="h-4 w-4 mr-2" />
              Last ned
            </Button>
            <Button onClick={() => { setPreviewPlan(null); previewPlan && handleEditPlan(previewPlan); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Rediger
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett etasjeplan</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{planToDelete?.floor_name}"?
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
