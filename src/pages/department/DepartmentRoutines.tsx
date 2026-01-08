import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Save, Loader2, Info, ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { Department } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Routine {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  is_expanded?: boolean;
}

const DepartmentRoutines = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { setSelectedDepartment } = useDepartmentContext();
  const [department, setDepartment] = useState<Department | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!departmentId) return;

      try {
        const { data: deptData, error: deptError } = await supabase
          .from("company_departments")
          .select("*")
          .eq("id", departmentId)
          .single();

        if (deptError) throw deptError;
        setDepartment(deptData as Department);
        setSelectedDepartment(deptData as Department);

        const { data: moduleData, error: moduleError } = await supabase
          .from("company_modules")
          .select("settings")
          .eq("company_id", deptData.company_id)
          .eq("module_type", "IK_HMS")
          .single();

        if (moduleError && moduleError.code !== "PGRST116") throw moduleError;

        if (moduleData?.settings) {
          const settings = moduleData.settings as Record<string, any>;
          const deptRoutines = settings.departmentData?.[departmentId]?.routines || [];
          setRoutines(deptRoutines);
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

  const handleAddRoutine = () => {
    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      routine_number: `R-${String(routines.length + 1).padStart(3, '0')}`,
      routine_name: "",
      category: "Generell",
      purpose: "",
      responsibility: "",
      procedure: "",
      is_expanded: true,
    };
    setRoutines([...routines, newRoutine]);
    setHasChanges(true);
  };

  const handleUpdateRoutine = (id: string, field: keyof Routine, value: string) => {
    setRoutines(routines.map(r => r.id === id ? { ...r, [field]: value } : r));
    setHasChanges(true);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const toggleExpand = (id: string) => {
    setRoutines(routines.map(r => r.id === id ? { ...r, is_expanded: !r.is_expanded } : r));
  };

  const handleSave = async () => {
    if (!department) return;
    
    setIsSaving(true);
    try {
      const { data: moduleData, error: fetchError } = await supabase
        .from("company_modules")
        .select("id, settings")
        .eq("company_id", department.company_id)
        .eq("module_type", "IK_HMS")
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (moduleData?.settings || {}) as Record<string, any>;
      const departmentData = currentSettings.departmentData || {};

      departmentData[departmentId!] = {
        ...(departmentData[departmentId!] || {}),
        routines: routines.map(({ is_expanded, ...r }) => r),
        routinesUpdatedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("company_modules")
        .update({
          settings: { ...currentSettings, departmentData },
          updated_at: new Date().toISOString(),
        })
        .eq("id", moduleData.id);

      if (updateError) throw updateError;

      toast.success("Rutiner lagret");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving routines:", error);
      toast.error("Kunne ikke lagre rutiner");
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
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/avdeling/${departmentId}`)}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til {department?.name}
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Rutiner
            </h1>
            <p className="text-muted-foreground mt-1">
              HMS-rutiner for {department?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddRoutine}>
              <Plus className="h-4 w-4 mr-2" />
              Ny rutine
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lagre
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Rutinene beskriver hvordan avdelingen håndterer ulike HMS-relaterte aktiviteter og situasjoner.
          </AlertDescription>
        </Alert>

        {routines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen rutiner er definert for denne avdelingen.</p>
              <Button onClick={handleAddRoutine} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Legg til første rutine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Collapsible key={routine.id} open={routine.is_expanded}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {routine.is_expanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-base">
                              {routine.routine_number}: {routine.routine_name || "Ny rutine"}
                            </CardTitle>
                            <CardDescription>{routine.category}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDeleteRoutine(routine.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rutinens navn</label>
                          <Input
                            value={routine.routine_name}
                            onChange={(e) => handleUpdateRoutine(routine.id, "routine_name", e.target.value)}
                            placeholder="Navn på rutinen"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Kategori</label>
                          <Input
                            value={routine.category}
                            onChange={(e) => handleUpdateRoutine(routine.id, "category", e.target.value)}
                            placeholder="F.eks. Sikkerhet, Helse, Miljø"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Formål</label>
                        <Textarea
                          value={routine.purpose}
                          onChange={(e) => handleUpdateRoutine(routine.id, "purpose", e.target.value)}
                          placeholder="Hva er formålet med denne rutinen?"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ansvar</label>
                        <Input
                          value={routine.responsibility}
                          onChange={(e) => handleUpdateRoutine(routine.id, "responsibility", e.target.value)}
                          placeholder="Hvem er ansvarlig for denne rutinen?"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Prosedyre</label>
                        <Textarea
                          value={routine.procedure}
                          onChange={(e) => handleUpdateRoutine(routine.id, "procedure", e.target.value)}
                          placeholder="Beskriv trinnvis hvordan rutinen utføres..."
                          rows={6}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DepartmentRoutines;
