import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, FileText, ChevronDown, Edit, Trash2, Loader2, Sparkles, Check } from "lucide-react";
import { useIkAlkoholRoutines, ROUTINE_CATEGORIES, VENUE_TYPES } from "@/hooks/useIkAlkoholRoutines";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const IkAlkoholRutiner = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { modules, isLoading: modulesLoading } = useCompanyModules();
  const { routines, isLoading, createRoutine, updateRoutine, deleteRoutine, initializeDefaultRoutines } = useIkAlkoholRoutines();
  
  const [activeCategory, setActiveCategory] = useState('alderskontroll');
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [expandedRoutines, setExpandedRoutines] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    routine_name: '',
    description: '',
    content: '',
    category: 'alderskontroll',
    venue_type: '',
    is_mandatory: false,
  });

  const hasIkAlkohol = modules?.some(m => m.module_type === 'IK_ALKOHOL' && m.is_active);
  
  if (modulesLoading) {
    return <AppLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!hasIkAlkohol) {
    navigate('/');
    return null;
  }

  const filteredRoutines = routines.filter(r => r.category === activeCategory);

  const handleSave = async () => {
    if (!formData.routine_name || !formData.content) return;
    
    if (editingRoutine) {
      await updateRoutine.mutateAsync({ id: editingRoutine.id, ...formData });
    } else {
      await createRoutine.mutateAsync({
        ...formData,
        company_id: profile!.company_id!,
        venue_type: formData.venue_type || null,
      });
    }
    setShowDialog(false);
    setEditingRoutine(null);
    setFormData({ routine_name: '', description: '', content: '', category: 'alderskontroll', venue_type: '', is_mandatory: false });
  };

  const openEdit = (routine: any) => {
    setEditingRoutine(routine);
    setFormData({
      routine_name: routine.routine_name,
      description: routine.description || '',
      content: routine.content,
      category: routine.category,
      venue_type: routine.venue_type || '',
      is_mandatory: routine.is_mandatory,
    });
    setShowDialog(true);
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rutiner</h1>
            <p className="text-muted-foreground">Rutinebibliotek for alkoholkontroll</p>
          </div>
          <div className="flex gap-2">
            {routines.length === 0 && (
              <Button variant="outline" onClick={() => initializeDefaultRoutines.mutate()} disabled={initializeDefaultRoutines.isPending}>
                <Sparkles className="h-4 w-4 mr-2" />
                Legg til standardrutiner
              </Button>
            )}
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny rutine
            </Button>
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            {ROUTINE_CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ROUTINE_CATEGORIES.map(cat => (
            <TabsContent key={cat.value} value={cat.value}>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filteredRoutines.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen rutiner i denne kategorien
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredRoutines.map(routine => (
                    <Collapsible 
                      key={routine.id}
                      open={expandedRoutines.includes(routine.id)}
                      onOpenChange={(open) => {
                        setExpandedRoutines(open 
                          ? [...expandedRoutines, routine.id]
                          : expandedRoutines.filter(id => id !== routine.id)
                        );
                      }}
                    >
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="flex flex-row items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-amber-600" />
                              <div className="text-left">
                                <CardTitle className="text-base">{routine.routine_name}</CardTitle>
                                {routine.description && (
                                  <CardDescription className="text-sm">{routine.description}</CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {routine.is_mandatory && <Badge variant="secondary">Obligatorisk</Badge>}
                              {routine.venue_type && <Badge variant="outline">{VENUE_TYPES.find(v => v.value === routine.venue_type)?.label}</Badge>}
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4">
                            <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                              {routine.content}
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <div className="text-xs text-muted-foreground">
                                {routine.last_reviewed_at ? (
                                  <>Sist gjennomgått: {format(new Date(routine.last_reviewed_at), 'dd.MM.yyyy', { locale: nb })}</>
                                ) : (
                                  <>Opprettet: {format(new Date(routine.created_at), 'dd.MM.yyyy', { locale: nb })}</>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => updateRoutine.mutate({ id: routine.id, last_reviewed_at: new Date().toISOString(), reviewed_by_name: `${profile?.first_name} ${profile?.last_name}` })}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Marker gjennomgått
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEdit(routine)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteRoutine.mutate(routine.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoutine ? 'Rediger rutine' : 'Ny rutine'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROUTINE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Stedstype (valgfritt)</label>
                  <Select value={formData.venue_type} onValueChange={(v) => setFormData({ ...formData, venue_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Alle stedstyper" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle stedstyper</SelectItem>
                      {VENUE_TYPES.map(v => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Rutinenavn *</label>
                <Input value={formData.routine_name} onChange={(e) => setFormData({ ...formData, routine_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Kort beskrivelse</label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Innhold *</label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={12} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
              <Button onClick={handleSave} disabled={createRoutine.isPending || updateRoutine.isPending}>Lagre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default IkAlkoholRutiner;
