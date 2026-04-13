import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Trash2, Save, Loader2, UtensilsCrossed, Check, Edit2, LayoutGrid, Image, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AllergenPosterDialog } from "@/components/ikmat/AllergenPosterDialog";
import { KitchenZoneEditor } from "@/components/ikmat/KitchenZoneEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface MenuItem {
  id: string;
  name: string;
  allergenIds: string[];
}

// De 14 merkepliktige allergenene i Norge (EU)
const EU_ALLERGENS = [
  { id: "gluten", name: "Gluten", icon: "🌾" },
  { id: "krepsdyr", name: "Krepsdyr", icon: "🦐" },
  { id: "egg", name: "Egg", icon: "🥚" },
  { id: "fisk", name: "Fisk", icon: "🐟" },
  { id: "peanotter", name: "Peanøtter", icon: "🥜" },
  { id: "soya", name: "Soya", icon: "🫘" },
  { id: "melk", name: "Melk", icon: "🥛" },
  { id: "notter", name: "Nøtter", icon: "🌰" },
  { id: "selleri", name: "Selleri", icon: "🥬" },
  { id: "sennep", name: "Sennep", icon: "🟡" },
  { id: "sesamfro", name: "Sesamfrø", icon: "⚪" },
  { id: "sulfitter", name: "Svoveldioksid/sulfitter", icon: "🍷" },
  { id: "lupin", name: "Lupin", icon: "🌸" },
  { id: "blotdyr", name: "Bløtdyr", icon: "🐚" },
];

const IkMatAllergener = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading: modulesLoading } = useCompanyModules();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [kitchenEditorOpen, setKitchenEditorOpen] = useState(false);
  const [kitchenZoneData, setKitchenZoneData] = useState<string | undefined>(undefined);
  const [kitchenZoneImage, setKitchenZoneImage] = useState<string | undefined>(undefined);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);

  // Load data from database
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
        
        // Load menu items
        if (manual.menuItems) {
          setMenuItems(manual.menuItems);
        }
      }
      setIsInitialized(true);
    }
  }, [hasModule, modulesLoading, navigate, modules, isInitialized]);

  // Save to database
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
          menuItems,
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
      toast.success('Endringer lagret');
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Kunne ikke lagre endringer');
    } finally {
      setIsSaving(false);
    }
  }, [company?.id, menuItems]);

  // Toggle allergen selection
  const toggleAllergen = (id: string) => {
    setSelectedAllergenIds(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  // Add or update menu item
  const saveMenuItem = () => {
    if (!newItemName.trim()) {
      toast.error('Skriv inn navn på retten');
      return;
    }

    if (editingItem) {
      // Update existing
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, name: newItemName.trim(), allergenIds: selectedAllergenIds }
          : item
      ));
      toast.success(`"${newItemName}" oppdatert`);
    } else {
      // Add new
      const newItem: MenuItem = {
        id: `menu-${Date.now()}`,
        name: newItemName.trim(),
        allergenIds: selectedAllergenIds,
      };
      setMenuItems(prev => [...prev, newItem]);
      toast.success(`"${newItem.name}" lagt til`);
    }

    resetDialog();
    setHasChanges(true);
  };

  // Remove menu item
  const removeMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    setHasChanges(true);
  };

  // Edit menu item
  const startEditing = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setSelectedAllergenIds(item.allergenIds);
    setAddDialogOpen(true);
  };

  // Reset dialog state
  const resetDialog = () => {
    setNewItemName('');
    setSelectedAllergenIds([]);
    setEditingItem(null);
    setAddDialogOpen(false);
  };

  // Add example menu
  const addExampleMenu = () => {
    const exampleItems = [
      { name: "Pasta Carbonara", allergenIds: ["gluten", "egg", "melk"] },
      { name: "Grillet Laks", allergenIds: ["fisk"] },
      { name: "Caesar Salat", allergenIds: ["gluten", "egg", "fisk", "melk"] },
      { name: "Sjokoladekake", allergenIds: ["gluten", "egg", "melk", "soya"] },
      { name: "Thai Reker", allergenIds: ["krepsdyr", "soya", "peanotter", "sesamfro"] },
      { name: "Vegetar Burger", allergenIds: ["gluten", "soya", "selleri", "sennep"] },
      { name: "Hummus", allergenIds: ["sesamfro"] },
      { name: "Blåskjell i Hvitvin", allergenIds: ["blotdyr", "selleri", "sulfitter"] },
    ];

    const newMenuItems: MenuItem[] = exampleItems.map((item, idx) => ({
      id: `menu-${Date.now()}-${idx}`,
      name: item.name,
      allergenIds: item.allergenIds,
    }));

    setMenuItems(prev => [...prev, ...newMenuItems]);
    setHasChanges(true);
    toast.success(`${exampleItems.length} eksempelretter lagt til`);
  };

  // Get allergen info by id
  const getAllergenById = (id: string) => EU_ALLERGENS.find(a => a.id === id);

  if (modulesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Convert menu items to allergen format for poster dialog
  const allergensForPoster = EU_ALLERGENS.map(a => ({
    id: a.id,
    name: a.name,
    present: menuItems.some(m => m.allergenIds.includes(a.id)),
    controlMeasures: '',
  }));

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meny & Allergener</h1>
            <p className="text-muted-foreground">
              Legg til retter og marker hvilke av de 14 allergenene de inneholder
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {menuItems.length > 0 && (
              <AllergenPosterDialog 
                allergens={allergensForPoster}
                menuItems={menuItems}
                companyName={company?.name || 'Bedrift'} 
              />
            )}
            <Button 
              onClick={saveToDatabase} 
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lagre
            </Button>
          </div>
        </div>

        {hasChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Du har ulagrede endringer. Husk å lagre før du forlater siden.
            </AlertDescription>
          </Alert>
        )}

        {/* Info about allergens */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-amber-900">14 merkepliktige allergener</p>
                <p className="text-sm text-amber-800">
                  Alle ferdigpakket mat og serveringssteder må merke tydelig de 14 mest utbredte allergenene 
                  i henhold til EU-forordning 1169/2011. Opp mot 25% av befolkningen har en eller annen form 
                  for allergisk reaksjon på enkelte matvarer.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {EU_ALLERGENS.map(allergen => (
                    <Badge 
                      key={allergen.id} 
                      variant="outline" 
                      className="bg-white border-amber-300 text-amber-900"
                    >
                      <span className="mr-1">{allergen.icon}</span>
                      {allergen.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  Din meny
                </CardTitle>
                <CardDescription>
                  Legg til retter og velg hvilke allergener de inneholder
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {menuItems.length === 0 && (
                  <Button variant="outline" onClick={addExampleMenu}>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Last inn eksempel-meny
                  </Button>
                )}
                <Dialog open={addDialogOpen} onOpenChange={(open) => {
                  if (!open) resetDialog();
                  else setAddDialogOpen(true);
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til rett
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Rediger rett' : 'Legg til ny rett'}
                      </DialogTitle>
                      <DialogDescription>
                        Skriv inn navnet på retten og velg hvilke allergener den inneholder
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="itemName">Navn på rett</Label>
                        <Input
                          id="itemName"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="F.eks. Pasta Carbonara"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Velg allergener (14 merkepliktige)</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {EU_ALLERGENS.map((allergen) => (
                            <div
                              key={allergen.id}
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedAllergenIds.includes(allergen.id)
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                              }`}
                              onClick={() => toggleAllergen(allergen.id)}
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                                selectedAllergenIds.includes(allergen.id)
                                  ? 'bg-red-500 text-white'
                                  : 'bg-muted'
                              }`}>
                                {selectedAllergenIds.includes(allergen.id) ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <span className="text-sm">{allergen.icon}</span>
                                )}
                              </div>
                              <span className="text-sm font-medium">{allergen.name}</span>
                            </div>
                          ))}
                        </div>
                        {selectedAllergenIds.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {selectedAllergenIds.length} allergen{selectedAllergenIds.length !== 1 ? 'er' : ''} valgt
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetDialog}>
                        Avbryt
                      </Button>
                      <Button onClick={saveMenuItem}>
                        {editingItem ? 'Lagre endringer' : 'Legg til'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {menuItems.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen retter lagt til</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start med å legge til retter fra menyen din og marker hvilke allergener de inneholder.
                  Du kan også laste inn en eksempel-meny for å komme raskt i gang.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={addExampleMenu}>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Last inn eksempel-meny
                  </Button>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Legg til rett
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => {
                  const itemAllergens = item.allergenIds
                    .map(id => getAllergenById(id))
                    .filter(Boolean);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        {itemAllergens.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">Inneholder:</span>
                            {itemAllergens.map((allergen) => (
                              <Badge 
                                key={allergen!.id} 
                                variant="destructive" 
                                className="text-sm"
                              >
                                <span className="mr-1">{allergen!.icon}</span>
                                {allergen!.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Ingen allergener registrert
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 sm:flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMenuItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {menuItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oppsummering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold">{menuItems.length}</p>
                  <p className="text-sm text-muted-foreground">Retter i menyen</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold">
                    {new Set(menuItems.flatMap(m => m.allergenIds)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Unike allergener</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg sm:col-span-2 lg:col-span-1">
                  <p className="text-3xl font-bold">
                    {menuItems.filter(m => m.allergenIds.length === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Allergenfrie retter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatAllergener;
