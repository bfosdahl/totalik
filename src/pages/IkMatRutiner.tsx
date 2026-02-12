import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatRoutine } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, Plus, Trash2, Loader2, Edit, FileText, ChevronDown } from "lucide-react";
import { RoutineLibraryDialog } from "@/components/routines/RoutineLibraryDialog";
import { RoutineTemplate } from "@/hooks/useRoutineLibrary";

const FREQUENCY_OPTIONS = [
  'Daglig',
  'Ukentlig',
  'Månedlig',
  'Kvartalsvis',
  'Årlig',
  'Ved behov',
  'Ved mottak',
  'Ved avvik',
];

const IkMatRutiner = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const [routines, setRoutines] = useState<IkMatRoutine[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<IkMatRoutine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'Daglig',
    responsible: '',
  });

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content.routines) {
      setRoutines(content.routines);
    }
  }, [isLoading, content.routines]);

  const handleAdoptFromLibrary = async (template: RoutineTemplate) => {
    const steps = Array.isArray(template.steps) ? template.steps : [];
    const description = steps.map((s: any) => typeof s === "string" ? s : s.text || s.label || "").join("\n");
    
    const newRoutine: IkMatRoutine = {
      id: `routine-${Date.now()}`,
      name: template.title,
      description: description || template.purpose || template.description || "",
      frequency: template.frequency === 'daglig' ? 'Daglig' 
        : template.frequency === 'ukentlig' ? 'Ukentlig'
        : template.frequency === 'maanedlig' ? 'Månedlig'
        : template.frequency === 'aarlig' ? 'Årlig'
        : template.frequency === 'ved_behov' ? 'Ved behov'
        : 'Ved behov',
      responsible: (template.target_roles && template.target_roles[0]) || '',
    };
    
    const updated = [...routines, newRoutine];
    setRoutines(updated);
    await saveContent('routines', updated);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    let updated: IkMatRoutine[];
    if (editingRoutine) {
      updated = routines.map(r => r.id === editingRoutine.id ? { ...r, ...formData } : r);
    } else {
      const newRoutine: IkMatRoutine = {
        id: `routine-${Date.now()}`,
        ...formData,
      };
      updated = [...routines, newRoutine];
    }
    
    setRoutines(updated);
    await saveContent('routines', updated);
    setShowDialog(false);
    setEditingRoutine(null);
    setFormData({ name: '', description: '', frequency: 'Daglig', responsible: '' });
  };

  const handleDelete = async (id: string) => {
    const updated = routines.filter(r => r.id !== id);
    setRoutines(updated);
    await saveContent('routines', updated);
  };

  const openEdit = (routine: IkMatRoutine) => {
    setEditingRoutine(routine);
    setFormData({
      name: routine.name,
      description: routine.description,
      frequency: routine.frequency,
      responsible: routine.responsible,
    });
    setShowDialog(true);
  };

  if (modulesLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-primary" />
              Rutiner
            </h1>
            <p className="text-muted-foreground mt-1">
              Rutiner og prosedyrer for matsikkerhet
            </p>
          </div>
          <div className="flex gap-2">
            <RoutineLibraryDialog 
              module="ik_mat" 
              onAdopt={handleAdoptFromLibrary}
            />
            <Button onClick={() => {
              setEditingRoutine(null);
              setFormData({ name: '', description: '', frequency: 'Daglig', responsible: '' });
              setShowDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Ny rutine
            </Button>
          </div>
        </div>

        {routines.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Ingen rutiner ennå. Bruk Rutinebiblioteket for å hente standardrutiner eller opprett egne.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {routines.map((routine) => (
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
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="text-left">
                          <CardTitle className="text-base">{routine.name}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {routine.frequency && (
                          <Badge variant="outline" className="text-xs">{routine.frequency}</Badge>
                        )}
                        {routine.responsible && (
                          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{routine.responsible}</Badge>
                        )}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      {routine.description && (
                        <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                          {routine.description}
                        </div>
                      )}
                      {routine.responsible && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Ansvarlig:</span> {routine.responsible}
                        </p>
                      )}
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button size="sm" variant="outline" onClick={() => openEdit(routine)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(routine.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoutine ? 'Rediger rutine' : 'Ny rutine'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rutinenavn *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Navn på rutine"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljert beskrivelse av rutinen..."
                  rows={6}
                  className="resize-none mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frekvens</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(freq => (
                        <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ansvarlig</Label>
                  <Input
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="F.eks. Kjøkkensjef"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
              <Button onClick={handleSave} disabled={!formData.name || isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Lagre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default IkMatRutiner;
