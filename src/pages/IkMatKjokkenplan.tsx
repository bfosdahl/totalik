import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus, Pencil, Save, Loader2 } from "lucide-react";
import { KitchenZoneEditor } from "@/components/ikmat/KitchenZoneEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IkMatKjokkenplan = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading: modulesLoading } = useCompanyModules();
  const [kitchenEditorOpen, setKitchenEditorOpen] = useState(false);
  const [kitchenZoneData, setKitchenZoneData] = useState<string | undefined>(undefined);
  const [kitchenZoneImage, setKitchenZoneImage] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
        if (manual.kitchenZoneData) setKitchenZoneData(manual.kitchenZoneData);
        if (manual.kitchenZoneImage) setKitchenZoneImage(manual.kitchenZoneImage);
      }
      setIsInitialized(true);
    }
  }, [hasModule, modulesLoading, navigate, modules, isInitialized]);

  const handleSaveKitchenZone = async (imageDataUrl: string, elementsJson: string) => {
    setKitchenZoneData(elementsJson);
    setKitchenZoneImage(imageDataUrl);
    setKitchenEditorOpen(false);
    setHasChanges(true);
    toast.success('Kjøkkenplanløsning lagret. Husk å lagre siden.');
  };

  const saveToDatabase = useCallback(async () => {
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
          kitchenZoneData,
          kitchenZoneImage,
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
      setHasChanges(false);
      toast.success('Kjøkkenplanløsning lagret');
    } catch (error) {
      console.error('Error saving kitchen plan:', error);
      toast.error('Kunne ikke lagre endringer');
    } finally {
      setIsSaving(false);
    }
  }, [company?.id, kitchenZoneData, kitchenZoneImage]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kjøkkenplanløsning – Ren/uren sone</h1>
            <p className="text-muted-foreground">
              Del opp kjøkkenet i soner for å skille rene og urene arbeidsoppgaver
            </p>
          </div>
          {hasChanges && (
            <Button onClick={saveToDatabase} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lagre
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Kjøkkenplanløsning
                </CardTitle>
                <CardDescription>
                  Del opp kjøkkenet i soner for å skille rene og urene arbeidsoppgaver,
                  i henhold til Næringsmiddelhygieneforskriften.
                </CardDescription>
              </div>
              <Button onClick={() => setKitchenEditorOpen(true)}>
                {kitchenZoneImage ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rediger tegning
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Tegn kjøkkenplan
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {kitchenZoneImage ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <img
                    src={kitchenZoneImage}
                    alt="Kjøkkenplanløsning"
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
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
                    <span className="text-muted-foreground">Kjøl/frys</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#a5f3fc", border: "1px solid #0891b2" }} />
                    <span className="text-muted-foreground">Vask/sanitær</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen kjøkkenplan tegnet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
                  Tegn opp kjøkkenet med soner for matlaging og oppvask.
                  Dette er et krav i henhold til Næringsmiddelhygieneforskriften for å sikre
                  at arbeidet foregår på en hygienisk måte.
                </p>
                <Button onClick={() => setKitchenEditorOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tegn kjøkkenplan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regulation info */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <LayoutGrid className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900">Krav om oppdeling av kjøkkenet</p>
                <p className="text-sm text-blue-800">
                  Du bør dele opp kjøkkenet i forskjellige områder for å skille rene og urene arbeidsoppgaver.
                  For eksempel bør det være et område til matlaging og et eget område til oppvask.
                  Da er det lettere å sikre at arbeidet foregår på en hygienisk måte.
                </p>
                <p className="text-sm text-blue-800">
                  Du kan også kompensere for små og trange lokaler ved å ha god struktur på arbeidet,
                  eller ved å bruke råvarer som er renset og klargjort på forhånd.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Kilde: Næringsmiddelhygieneforskriften, Kapittel I – Allmenne krav til lokaler som brukes til næringsmidler
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <KitchenZoneEditor
          open={kitchenEditorOpen}
          onOpenChange={setKitchenEditorOpen}
          initialData={kitchenZoneData}
          onSave={handleSaveKitchenZone}
        />
      </div>
    </AppLayout>
  );
};

export default IkMatKjokkenplan;
