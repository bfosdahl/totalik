import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Trash2, Save, Loader2, UtensilsCrossed, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AllergenPosterDialog } from "@/components/ikmat/AllergenPosterDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Allergen {
  id: string;
  name: string;
  present: boolean;
  controlMeasures: string;
  menuItems?: string[]; // Retter som inneholder dette allergenet
}

interface MenuItem {
  id: string;
  name: string;
  allergenIds: string[];
}

// Standard EU-allergener (14 hovedallergener)
const EU_ALLERGENS = [
  "Gluten",
  "Krepsdyr",
  "Egg",
  "Fisk",
  "Peanøtter",
  "Soya",
  "Melk",
  "Nøtter",
  "Selleri",
  "Sennep",
  "Sesamfrø",
  "Sulfitter",
  "Lupin",
  "Bløtdyr",
];

const IkMatAllergener = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading: modulesLoading } = useCompanyModules();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Dialog states
  const [addMenuDialogOpen, setAddMenuDialogOpen] = useState(false);
  const [newMenuItemName, setNewMenuItemName] = useState("");
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
        const generated = settings.generatedContent || {};
        
        // Load allergens - prioritize manual, fallback to generated
        if (manual.allergens?.length > 0) {
          setAllergens(manual.allergens);
        } else if (generated.allergens?.length > 0) {
          // Convert generated allergens to editable format
          setAllergens(generated.allergens.map((a: any, idx: number) => ({
            id: `allergen-${idx}`,
            name: a.name,
            present: a.present,
            controlMeasures: a.controlMeasures || '',
            menuItems: [],
          })));
        } else {
          // Initialize with EU allergens if nothing exists
          setAllergens(EU_ALLERGENS.map((name, idx) => ({
            id: `allergen-${idx}`,
            name,
            present: false,
            controlMeasures: '',
            menuItems: [],
          })));
        }
        
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

      // Get current settings
      const { data: current, error: fetchError } = await supabase
        .from('company_modules')
        .select('settings')
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT')
        .single();

      if (fetchError) throw fetchError;

      const settings = current?.settings as any || {};
      const manualContent = settings.manualContent || {};

      // Update allergens and menu items
      const updatedSettings = {
        ...settings,
        manualContent: {
          ...manualContent,
          allergens,
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
      console.error('Error saving allergens:', error);
      toast.error('Kunne ikke lagre endringer');
    } finally {
      setIsSaving(false);
    }
  }, [company?.id, allergens, menuItems]);

  // Toggle allergen presence
  const toggleAllergenPresence = (id: string) => {
    setAllergens(prev => prev.map(a => 
      a.id === id ? { ...a, present: !a.present } : a
    ));
    setHasChanges(true);
  };

  // Update control measures
  const updateControlMeasures = (id: string, measures: string) => {
    setAllergens(prev => prev.map(a => 
      a.id === id ? { ...a, controlMeasures: measures } : a
    ));
    setHasChanges(true);
  };

  // Add custom allergen
  const addCustomAllergen = () => {
    const newAllergen: Allergen = {
      id: `custom-${Date.now()}`,
      name: 'Nytt allergen',
      present: false,
      controlMeasures: '',
      menuItems: [],
    };
    setAllergens(prev => [...prev, newAllergen]);
    setHasChanges(true);
  };

  // Remove allergen
  const removeAllergen = (id: string) => {
    setAllergens(prev => prev.filter(a => a.id !== id));
    setHasChanges(true);
  };

  // Update allergen name
  const updateAllergenName = (id: string, name: string) => {
    setAllergens(prev => prev.map(a => 
      a.id === id ? { ...a, name } : a
    ));
    setHasChanges(true);
  };

  // Add menu item
  const addMenuItem = () => {
    if (!newMenuItemName.trim()) {
      toast.error('Skriv inn navn på retten');
      return;
    }

    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name: newMenuItemName.trim(),
      allergenIds: selectedAllergenIds,
    };

    setMenuItems(prev => [...prev, newItem]);
    
    // Update allergens with menu item reference
    setAllergens(prev => prev.map(a => {
      if (selectedAllergenIds.includes(a.id)) {
        return {
          ...a,
          present: true,
          menuItems: [...(a.menuItems || []), newItem.name],
        };
      }
      return a;
    }));

    setNewMenuItemName('');
    setSelectedAllergenIds([]);
    setAddMenuDialogOpen(false);
    setHasChanges(true);
    toast.success(`"${newItem.name}" lagt til i menyen`);
  };

  // Remove menu item
  const removeMenuItem = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return;

    setMenuItems(prev => prev.filter(m => m.id !== id));
    
    // Update allergens - remove menu item reference
    setAllergens(prev => prev.map(a => ({
      ...a,
      menuItems: (a.menuItems || []).filter(m => m !== item.name),
    })));
    
    setHasChanges(true);
  };

  // Toggle allergen selection for new menu item
  const toggleAllergenSelection = (id: string) => {
    setSelectedAllergenIds(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

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

  const presentAllergens = allergens.filter(a => a.present);

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Allergener</h1>
            <p className="text-muted-foreground">
              Administrer allergener og koble til menyretter
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {presentAllergens.length > 0 && (
              <AllergenPosterDialog 
                allergens={allergens} 
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

        <Tabs defaultValue="allergens" className="space-y-4">
          <TabsList>
            <TabsTrigger value="allergens">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Allergentabell
            </TabsTrigger>
            <TabsTrigger value="menu">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Meny ({menuItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Allergen Table Tab */}
          <TabsContent value="allergens" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Allergentabell</CardTitle>
                    <CardDescription>
                      Marker hvilke allergener som finnes i din virksomhet
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addCustomAllergen}>
                    <Plus className="mr-2 h-4 w-4" />
                    Legg til allergen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Allergen</TableHead>
                          <TableHead className="w-[120px]">Tilstede</TableHead>
                          <TableHead>Kontrolltiltak</TableHead>
                          <TableHead className="w-[150px]">Retter</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allergens.map((allergen) => (
                          <TableRow key={allergen.id}>
                            <TableCell>
                              <Input
                                value={allergen.name}
                                onChange={(e) => updateAllergenName(allergen.id, e.target.value)}
                                className="font-medium"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={allergen.present}
                                  onCheckedChange={() => toggleAllergenPresence(allergen.id)}
                                />
                                {allergen.present ? (
                                  <Badge variant="destructive" className="text-xs">Ja</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Nei</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={allergen.controlMeasures}
                                onChange={(e) => updateControlMeasures(allergen.id, e.target.value)}
                                placeholder="F.eks. separate redskaper, merking..."
                                className="text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              {allergen.menuItems && allergen.menuItems.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {allergen.menuItems.slice(0, 2).map((item, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {item}
                                    </Badge>
                                  ))}
                                  {allergen.menuItems.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{allergen.menuItems.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {!EU_ALLERGENS.includes(allergen.name) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAllergen(allergen.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {allergens.map((allergen) => (
                      <Card key={allergen.id} className={allergen.present ? 'border-red-200 bg-red-50/50' : ''}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Input
                              value={allergen.name}
                              onChange={(e) => updateAllergenName(allergen.id, e.target.value)}
                              className="font-medium max-w-[180px]"
                            />
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={allergen.present}
                                onCheckedChange={() => toggleAllergenPresence(allergen.id)}
                              />
                              {!EU_ALLERGENS.includes(allergen.name) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAllergen(allergen.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <Input
                            value={allergen.controlMeasures}
                            onChange={(e) => updateControlMeasures(allergen.id, e.target.value)}
                            placeholder="Kontrolltiltak..."
                            className="text-sm"
                          />
                          {allergen.menuItems && allergen.menuItems.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {allergen.menuItems.map((item, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meny</CardTitle>
                    <CardDescription>
                      Legg til retter og marker hvilke allergener de inneholder
                    </CardDescription>
                  </div>
                  <Dialog open={addMenuDialogOpen} onOpenChange={setAddMenuDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Legg til rett
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Legg til menyrett</DialogTitle>
                        <DialogDescription>
                          Skriv inn navnet på retten og velg hvilke allergener den inneholder
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="menuItemName">Navn på rett</Label>
                          <Input
                            id="menuItemName"
                            value={newMenuItemName}
                            onChange={(e) => setNewMenuItemName(e.target.value)}
                            placeholder="F.eks. Pasta Carbonara"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Allergener i retten</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                            {allergens.map((allergen) => (
                              <div
                                key={allergen.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                  selectedAllergenIds.includes(allergen.id)
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => toggleAllergenSelection(allergen.id)}
                              >
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                  selectedAllergenIds.includes(allergen.id)
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100'
                                }`}>
                                  {selectedAllergenIds.includes(allergen.id) && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                                <span className="text-sm">{allergen.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddMenuDialogOpen(false)}>
                          Avbryt
                        </Button>
                        <Button onClick={addMenuItem}>
                          Legg til
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ingen retter lagt til</h3>
                    <p className="text-muted-foreground mb-4">
                      Legg til retter fra menyen din for å koble dem til allergener
                    </p>
                    <Button onClick={() => setAddMenuDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til første rett
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {menuItems.map((item) => {
                      const itemAllergens = allergens.filter(a => item.allergenIds.includes(a.id));
                      return (
                        <Card key={item.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium">{item.name}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => removeMenuItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            {itemAllergens.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {itemAllergens.map((allergen) => (
                                  <Badge key={allergen.id} variant="destructive" className="text-xs">
                                    {allergen.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Ingen allergener
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default IkMatAllergener;
