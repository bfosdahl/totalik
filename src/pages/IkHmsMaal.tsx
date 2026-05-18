import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

interface CompanyGoal {
  id: string;
  goal_text: string;
  is_predefined: boolean;
  sort_order: number;
}

const IkHmsMaal = () => {
  const { profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const [goals, setGoals] = useState<CompanyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing goals
  useEffect(() => {
    const fetchGoals = async () => {
      if (!profile?.company_id) return;

      try {
        let q = supabase
          .from("company_goals")
          .select("*")
          .eq("company_id", profile.company_id);
        q = filterDepartmentId
          ? q.eq("department_id", filterDepartmentId)
          : q.is("department_id", null);
        const { data, error } = await q.order("sort_order", { ascending: true });

        if (error) throw error;
        setGoals(data || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast.error("Kunne ikke laste målsettinger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [profile?.company_id, filterDepartmentId]);

  const handleUpdateGoal = (id: string, text: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, goal_text: text } : g));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile?.company_id) return;
    
    setIsSaving(true);
    try {
      // Update each goal
      for (const goal of goals) {
        const { error } = await supabase
          .from("company_goals")
          .update({ goal_text: goal.goal_text })
          .eq("id", goal.id);

        if (error) throw error;
      }

      toast.success("Målsettinger lagret");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error("Kunne ikke lagre målsettinger");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
              Bedriftens HMS-målsetting
            </p>
          </div>
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

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Målsettingen beskriver bedriftens overordnede mål for helse, miljø og sikkerhet. 
            Den bør være konkret og målbar, og gjenspeile bedriftens verdier og ambisjoner.
          </AlertDescription>
        </Alert>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen målsettinger er definert ennå.</p>
              <p className="text-sm mt-2">
                Gå til <a href="/setup" className="text-primary hover:underline">Oppsett</a> for å sette opp målsettinger.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {goals.length > 1 ? `Mål ${index + 1}` : "Bedriftens målsetting"}
                  </CardTitle>
                  <CardDescription>
                    Rediger målsettingen under
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={goal.goal_text}
                    onChange={(e) => handleUpdateGoal(goal.id, e.target.value)}
                    placeholder="Beskriv bedriftens HMS-målsetting..."
                    rows={6}
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
            <CardTitle className="text-sm text-muted-foreground">Eksempel på HMS-målsetting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Eksempel 1:</strong> Vårt mål er å skape en trygg og helsefremmende arbeidsplass 
              der alle ansatte trives og kan utføre sitt arbeid uten risiko for skader eller sykdom.
            </p>
            <p>
              <strong>Eksempel 2:</strong> Vi skal ha null arbeidsulykker og arbeidsrelatert sykefravær. 
              Alle ansatte skal ha nødvendig opplæring og utstyr for å utføre arbeidet sikkert.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IkHmsMaal;
