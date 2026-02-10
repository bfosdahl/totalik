import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatRoutine } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { RoutineLibraryDialog } from "@/components/routines/RoutineLibraryDialog";

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
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleAddRoutine = () => {
    const newRoutine: IkMatRoutine = {
      id: `routine-${Date.now()}`,
      name: '',
      description: '',
      frequency: 'Daglig',
      responsible: '',
    };
    setRoutines([...routines, newRoutine]);
    setHasChanges(true);
  };

  const handleUpdateRoutine = (id: string, field: keyof IkMatRoutine, value: string) => {
    setRoutines(routines.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
    setHasChanges(true);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveContent('routines', routines);
    setHasChanges(false);
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
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              Rutiner
            </h1>
            <p className="text-muted-foreground mt-1">
              Rutiner og prosedyrer for matsikkerhet
            </p>
          </div>
          <div className="flex gap-2">
            <RoutineLibraryDialog module="ik_mat" />
            <Button variant="outline" onClick={handleAddRoutine}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til rutine
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lagre
            </Button>
          </div>
        </div>

        {routines.length === 0 ? (
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              Ingen rutiner er definert ennå. Klikk "Legg til rutine" for å komme i gang.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Card key={routine.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={routine.name}
                      onChange={(e) => handleUpdateRoutine(routine.id, 'name', e.target.value)}
                      placeholder="Navn på rutine"
                      className="font-semibold text-lg border-none px-0 focus-visible:ring-0 max-w-md"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRoutine(routine.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Beskrivelse</Label>
                    <Textarea
                      value={routine.description}
                      onChange={(e) => handleUpdateRoutine(routine.id, 'description', e.target.value)}
                      placeholder="Detaljert beskrivelse av rutinen..."
                      rows={4}
                      className="resize-none mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frekvens</Label>
                      <Select
                        value={routine.frequency}
                        onValueChange={(value) => handleUpdateRoutine(routine.id, 'frequency', value)}
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
                        value={routine.responsible}
                        onChange={(e) => handleUpdateRoutine(routine.id, 'responsible', e.target.value)}
                        placeholder="F.eks. Kjøkkensjef"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatRutiner;
