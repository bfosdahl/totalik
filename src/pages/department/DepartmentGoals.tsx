import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Save, Loader2, Info, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { Department } from "@/hooks/useDepartments";

interface DepartmentGoal {
  id: string;
  goal_text: string;
  sort_order: number;
}

const DepartmentGoals = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { setSelectedDepartment } = useDepartmentContext();
  const [department, setDepartment] = useState<Department | null>(null);
  const [goals, setGoals] = useState<DepartmentGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch department and goals
  useEffect(() => {
    const fetchData = async () => {
      if (!departmentId) return;

      try {
        // Fetch department
        const { data: deptData, error: deptError } = await supabase
          .from("company_departments")
          .select("*")
          .eq("id", departmentId)
          .single();

        if (deptError) throw deptError;
        setDepartment(deptData as Department);
        setSelectedDepartment(deptData as Department);

        // Fetch department-specific goals from company_modules settings
        const { data: moduleData, error: moduleError } = await supabase
          .from("company_modules")
          .select("settings")
          .eq("company_id", deptData.company_id)
          .eq("module_type", "IK_HMS")
          .single();

        if (moduleError && moduleError.code !== "PGRST116") throw moduleError;

        if (moduleData?.settings) {
          const settings = moduleData.settings as Record<string, any>;
          const deptGoals = settings.departmentData?.[departmentId]?.goals || [];
          setGoals(deptGoals);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Kunne ikke laste data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [departmentId, setSelectedDepartment]);

  const handleAddGoal = () => {
    const newGoal: DepartmentGoal = {
      id: `goal-${Date.now()}`,
      goal_text: "",
      sort_order: goals.length,
    };
    setGoals([...goals, newGoal]);
    setHasChanges(true);
  };

  const handleUpdateGoal = (id: string, text: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, goal_text: text } : g));
    setHasChanges(true);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!department) return;
    
    setIsSaving(true);
    try {
      // Get current module settings
      const { data: moduleData, error: fetchError } = await supabase
        .from("company_modules")
        .select("id, settings")
        .eq("company_id", department.company_id)
        .eq("module_type", "IK_HMS")
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (moduleData?.settings || {}) as Record<string, any>;
      const departmentData = currentSettings.departmentData || {};

      // Update department-specific goals
      departmentData[departmentId!] = {
        ...(departmentData[departmentId!] || {}),
        goals: goals,
        goalsUpdatedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("company_modules")
        .update({
          settings: { ...currentSettings, departmentData },
          updated_at: new Date().toISOString(),
        })
        .eq("id", moduleData.id);

      if (updateError) throw updateError;

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/avdeling/${departmentId}`)}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til {department?.name}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Målsetting
            </h1>
            <p className="text-muted-foreground mt-1">
              HMS-målsetting for {department?.name}
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
            Målsettingen beskriver avdelingens overordnede mål for helse, miljø og sikkerhet. 
            Den bør være konkret og målbar, og gjenspeile avdelingens spesifikke behov.
          </AlertDescription>
        </Alert>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen målsettinger er definert for denne avdelingen.</p>
              <Button onClick={handleAddGoal} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Legg til målsetting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {goals.length > 1 ? `Mål ${index + 1}` : "Avdelingens målsetting"}
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
                    value={goal.goal_text}
                    onChange={(e) => handleUpdateGoal(goal.id, e.target.value)}
                    placeholder="Beskriv avdelingens HMS-målsetting..."
                    rows={6}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={handleAddGoal} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Legg til flere mål
            </Button>
          </div>
        )}

        {/* Example text */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Eksempel på HMS-målsetting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Eksempel:</strong> Vårt mål er å skape en trygg og helsefremmende arbeidsplass 
              der alle ansatte trives og kan utføre sitt arbeid uten risiko for skader eller sykdom.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DepartmentGoals;
