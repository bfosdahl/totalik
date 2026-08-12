import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, Plus, Pencil, Save, Loader2, Trash2, MapPin, Download } from "lucide-react";
import { KitchenZoneEditor } from "@/components/ikmat/KitchenZoneEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { t } from "@/i18n/t";
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

interface KitchenRoom {
  id: string;
  name: string;
  data?: string;
  image?: string;
}

const IkMatKjokkenplan = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading: modulesLoading } = useCompanyModules();
  const [rooms, setRooms] = useState<KitchenRoom[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [kitchenEditorOpen, setKitchenEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [showNewRoomInput, setShowNewRoomInput] = useState(false);

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
      return;
    }

    if (!modulesLoading && modules.length > 0 && !isInitialized) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        const manual = settings.manualContent || {};
        
        // Migration: convert old single-room format to multi-room
        if (manual.kitchenRooms && Array.isArray(manual.kitchenRooms)) {
          setRooms(manual.kitchenRooms);
        } else if (manual.kitchenZoneData || manual.kitchenZoneImage) {
          // Migrate old single drawing to first room
          setRooms([{
            id: crypto.randomUUID(),
            name: "Kjøkken",
            data: manual.kitchenZoneData,
            image: manual.kitchenZoneImage,
          }]);
        }
      }
      setIsInitialized(true);
    }
  }, [hasModule, modulesLoading, navigate, modules, isInitialized]);

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    const newRoom: KitchenRoom = {
      id: crypto.randomUUID(),
      name: newRoomName.trim(),
    };
    const updated = [...rooms, newRoom];
    setRooms(updated);
    setNewRoomName("");
    setShowNewRoomInput(false);
    // Open editor immediately for the new room
    setEditingRoomId(newRoom.id);
    setKitchenEditorOpen(true);
    saveRoomsToDatabase(updated);
  };

  const handleSaveKitchenZone = async (imageDataUrl: string, elementsJson: string) => {
    if (!editingRoomId) return;
    const updated = rooms.map(r =>
      r.id === editingRoomId ? { ...r, data: elementsJson, image: imageDataUrl } : r
    );
    setRooms(updated);
    setKitchenEditorOpen(false);
    setEditingRoomId(null);
    await saveRoomsToDatabase(updated);
    toast.success('Tegning lagret');
  };

  const handleDeleteRoom = (roomId: string) => {
    const updated = rooms.filter(r => r.id !== roomId);
    setRooms(updated);
    setDeleteRoomId(null);
    saveRoomsToDatabase(updated);
    toast.success('Rom slettet');
  };

  const saveRoomsToDatabase = useCallback(async (roomsToSave: KitchenRoom[]) => {
    if (!company?.id) return;
    try {
      setIsSaving(true);
      const { data: current, error: fetchError } = await supabase
        .from('company_modules')
        .select('settings')
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT')
        .single();

      if (fetchError) throw fetchError;

      const settings = current?.settings as any || {};
      const manualContent = settings.manualContent || {};

      const updatedSettings = {
        ...settings,
        manualContent: {
          ...manualContent,
          kitchenRooms: roomsToSave,
          // Keep old fields for backward compat with PDF export etc
          kitchenZoneData: roomsToSave[0]?.data,
          kitchenZoneImage: roomsToSave[0]?.image,
        },
      };

      const { error: saveError } = await supabase
        .from('company_modules')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT');

      if (saveError) throw saveError;
    } catch (error) {
      console.error('Error saving kitchen plans:', error);
      toast.error('Kunne ikke lagre endringer');
    } finally {
      setIsSaving(false);
    }
  }, [company?.id]);

  const editingRoom = rooms.find(r => r.id === editingRoomId);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("auto.kjoekkenplanloesning_ren_uren_sone")}</h1>
            <p className="text-muted-foreground">
              {t("auto.del_opp_kjoekkenet_og_lokalet_i_soner_fo")}
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lagrer...
            </div>
          )}
        </div>

        {/* Room list */}
        {rooms.length > 0 && (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      {room.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRoomId(room.id);
                          setKitchenEditorOpen(true);
                        }}
                      >
                        {room.image ? (
                          <><Pencil className="mr-2 h-4 w-4" />Rediger</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" />Tegn</>
                        )}
                      </Button>
                      {room.image && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `${room.name.replace(/[^a-zA-Z0-9æøåÆØÅ\s-]/g, '')}_kjokkenplan.png`;
                            link.href = room.image!;
                            link.click();
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />Last ned
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteRoomId(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {room.image && (
                  <CardContent className="pt-0">
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-auto max-h-[400px] object-contain"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Add new room */}
        <Card>
          <CardContent className="pt-6">
            {showNewRoomInput ? (
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Navn på rom/område (f.eks. Kjøkken, Lager, 2. etasje...)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
                  autoFocus
                />
                <Button onClick={handleAddRoom} disabled={!newRoomName.trim()}>
                  {t("auto.opprett")}
                </Button>
                <Button variant="ghost" onClick={() => { setShowNewRoomInput(false); setNewRoomName(""); }}>
                  {t("auto.avbryt")}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                {rooms.length === 0 && (
                  <div className="mb-4">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">{t("auto.ingen_rom_omraader_lagt_til")}</h3>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                      {t("auto.legg_til_rom_og_omraader_i_lokalet_ditt_")}
                    </p>
                  </div>
                )}
                <Button onClick={() => setShowNewRoomInput(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til rom / område
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        {rooms.length > 0 && (
          <div className="flex flex-wrap gap-3 text-sm px-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#fef3c7", border: "1px solid #ca8a04" }} />
              <span className="text-muted-foreground">Ren sone (matlaging)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#e0e7ff", border: "1px solid #6366f1" }} />
              <span className="text-muted-foreground">Uren sone (oppvask)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#bae6fd", border: "1px solid #0284c7" }} />
              <span className="text-muted-foreground">{t("auto.kjoel_frys_2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#a5f3fc", border: "1px solid #0891b2" }} />
              <span className="text-muted-foreground">{t("auto.vask_sanitaer")}</span>
            </div>
          </div>
        )}

        {/* Regulation info */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <LayoutGrid className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900">{t("auto.krav_om_oppdeling_av_kjoekkenet")}</p>
                <p className="text-sm text-blue-800">
                  {t("auto.du_boer_dele_opp_kjoekkenet_i_forskjelli")}
                </p>
                <p className="text-sm text-blue-800">
                  {t("auto.du_kan_ogsaa_kompensere_for_smaa_og_tran")}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  {t("auto.kilde_naeringsmiddelhygieneforskriften_k")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <KitchenZoneEditor
          open={kitchenEditorOpen}
          onOpenChange={(open) => {
            setKitchenEditorOpen(open);
            if (!open) setEditingRoomId(null);
          }}
          initialData={editingRoom?.data}
          onSave={handleSaveKitchenZone}
        />

        <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("auto.slett_rom")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("auto.er_du_sikker_paa_at_du_vil_slette_dette_")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteRoomId && handleDeleteRoom(deleteRoomId)}
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default IkMatKjokkenplan;
