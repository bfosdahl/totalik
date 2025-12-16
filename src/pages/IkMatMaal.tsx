import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatGoal } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";

const IkMatMaal = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const [goals, setGoals] = useState<IkMatGoal[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content.goals) {
      setGoals(content.goals);
    }
  }, [isLoading, content.goals]);

  const handleAddGoal = () => {
    const newGoal: IkMatGoal = {
      id: `goal-${Date.now()}`,
      text: '',
    };
    setGoals([...goals, newGoal]);
    setHasChanges(true);
  };

  const handleUpdateGoal = (id: string, text: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, text } : g));
    setHasChanges(true);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveContent('goals', goals);
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
              <Target className="h-8 w-8 text-primary" />
              Målsetting
            </h1>
            <p className="text-muted-foreground mt-1">
              Bedriftens målsetting for matsikkerhet
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddGoal}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til mål
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

        {goals.length === 0 ? (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              Ingen målsettinger er definert ennå. Klikk "Legg til mål" for å komme i gang.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      Mål {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={goal.text}
                    onChange={(e) => handleUpdateGoal(goal.id, e.target.value)}
                    placeholder="Beskriv målsettingen..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Example text for reference */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Eksempel på målsetting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Bedriftens målsetting er å produsere og/eller servere ernæringsmessig og 
              hygienisk kvalitetsmat til våre kunder. All mat som blir servert skal serveres 
              i rett tid og ha riktig temperatur på leverings-/serveringstidspunktet.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IkMatMaal;
