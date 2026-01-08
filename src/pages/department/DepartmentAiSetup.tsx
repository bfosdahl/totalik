import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { IkHmsChatSetup } from "@/components/setup/IkHmsChatSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, AlertTriangle, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { Department } from "@/hooks/useDepartments";
import { toast } from "sonner";

const DepartmentAiSetup = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { setSelectedDepartment } = useDepartmentContext();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);

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
        setCompanyId(deptData.company_id);

        // Check if department setup was completed
        const { data: moduleData } = await supabase
          .from("company_modules")
          .select("settings")
          .eq("company_id", deptData.company_id)
          .eq("module_type", "IK_HMS")
          .single();

        if (moduleData?.settings) {
          const settings = moduleData.settings as Record<string, any>;
          const deptSetup = settings.departmentData?.[departmentId];
          setPreviouslyCompleted(!!deptSetup?.setupCompletedAt);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Kunne ikke laste avdelingsdata");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [departmentId, setSelectedDepartment]);

  const handleSetupComplete = async () => {
    if (!department || !companyId) return;

    try {
      // Mark department setup as completed
      const { data: moduleData, error: fetchError } = await supabase
        .from("company_modules")
        .select("id, settings")
        .eq("company_id", companyId)
        .eq("module_type", "IK_HMS")
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (moduleData?.settings || {}) as Record<string, any>;
      const departmentData = currentSettings.departmentData || {};

      departmentData[departmentId!] = {
        ...(departmentData[departmentId!] || {}),
        setupCompletedAt: new Date().toISOString(),
      };

      await supabase
        .from("company_modules")
        .update({
          settings: { ...currentSettings, departmentData },
          updated_at: new Date().toISOString(),
        })
        .eq("id", moduleData.id);

      setSetupCompleted(true);
      setIsRestarting(false);
    } catch (error) {
      console.error("Error marking setup complete:", error);
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

  if (!department || !companyId) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Kunne ikke finne avdelingen.</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/avdeling/${departmentId}`)}
          className="gap-2 -ml-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til {department.name}
        </Button>

        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Oppsett-hjelper
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            AI-assistert HMS-oppsett for {department.name}
          </p>
        </div>

        {(setupCompleted || (previouslyCompleted && !isRestarting)) ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                HMS-oppsett for {department.name} er fullført!
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Viktig informasjon</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-medium mb-1">✅ Avdelingens data er trygg</p>
                  <p className="text-muted-foreground">
                    Hvis du kjører oppsettet på nytt, beholdes alle tilpassede data.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={() => navigate(`/avdeling/${departmentId}`)} className="w-full sm:w-auto">
                Gå til dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRestartDialog(true)}
                className="w-full sm:w-auto"
              >
                Kjør oppsett på nytt
              </Button>
            </div>
          </div>
        ) : (
          <IkHmsChatSetup
            companyId={companyId}
            departmentId={departmentId}
            onComplete={handleSetupComplete}
          />
        )}

        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Kjør oppsett på nytt?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Du er i ferd med å starte et nytt AI-oppsett for {department.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowRestartDialog(false);
                setIsRestarting(true);
                setSetupCompleted(false);
              }}>
                Start nytt oppsett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default DepartmentAiSetup;
