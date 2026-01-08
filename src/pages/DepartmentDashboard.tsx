import { motion } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Building2,
  Users,
  FileText,
  Settings,
  ArrowLeft,
  MapPin,
  Sparkles,
  Rocket,
  Target,
  ShieldCheck
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { useDepartmentDashboardStats } from "@/hooks/useDepartmentDashboardStats";
import { supabase } from "@/integrations/supabase/client";
import { Department } from "@/hooks/useDepartments";
import { AnonymousMessageButton } from "@/components/anonymous/AnonymousMessageButton";

const DepartmentDashboard = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { setSelectedDepartment, userDepartments } = useDepartmentContext();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);

  // Fetch department details
  useEffect(() => {
    const fetchDepartment = async () => {
      if (!departmentId) return;

      try {
        const { data: deptData, error: deptError } = await supabase
          .from("company_departments")
          .select("*")
          .eq("id", departmentId)
          .single();

        if (deptError) throw deptError;
        setDepartment(deptData as Department);

        // Set this department as selected in context
        if (deptData) {
          setSelectedDepartment(deptData as Department);
        }

        // Fetch employee count for this department
        const { count } = await supabase
          .from("user_departments")
          .select("*", { count: "exact", head: true })
          .eq("department_id", departmentId);

        setEmployeeCount(count || 0);

        // Check if department has completed setup (check company_modules for department-specific settings)
        const { data: moduleData } = await supabase
          .from("company_modules")
          .select("settings")
          .eq("company_id", deptData.company_id)
          .eq("module_type", "IK_HMS")
          .single();

        if (moduleData?.settings) {
          const settings = moduleData.settings as Record<string, any>;
          const departmentSetup = settings.departmentSetup?.[departmentId];
          setIsSetupCompleted(!!departmentSetup?.setupCompletedAt);
        }
      } catch (error) {
        console.error("Error fetching department:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartment();
  }, [departmentId, setSelectedDepartment]);

  // Use department-specific dashboard stats (isolated from main company)
  const { 
    compliancePercent, 
    openDeviations, 
    completedActions, 
    dueSoon, 
    isLoading: statsLoading,
    goalsCount,
    routinesCount,
    hasOrganization
  } = useDepartmentDashboardStats(departmentId);

  const handleBackToMain = () => {
    setSelectedDepartment(null);
    navigate("/");
  };

  if (isLoading || !department) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Laster avdeling...</div>
        </div>
      </AppLayout>
    );
  }

  const showSetupBanner = !isSetupCompleted;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Back button and department header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMain}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake til hovedbedrift
          </Button>

          {/* Department info card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl md:text-2xl font-bold">{department.name}</h1>
                      <Badge variant="secondary">Avdeling</Badge>
                    </div>
                    {department.city && (
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{department.address && `${department.address}, `}{department.postal_code} {department.city}</span>
                      </div>
                    )}
                    {department.description && (
                      <p className="text-sm text-muted-foreground mt-2">{department.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/employees")} className="gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Ansatte</span>
                    <Badge variant="secondary" className="ml-1">{employeeCount}</Badge>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings?tab=departments")} className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Innstillinger</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Setup banner for department */}
        {showSetupBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 md:p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex-shrink-0 p-3 md:p-4 rounded-2xl bg-gradient-primary shadow-md">
                <Rocket className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold">Sett opp HMS for {department.name} 🎉</h2>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Denne avdelingen trenger sitt eget HMS-oppsett. Start AI-veilederen for å få skreddersydd 
                  risikovurdering, rutiner og handlingsplan for avdelingen.
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={() => navigate(`/avdeling/${departmentId}/oppsett/ai`)}
                className="w-full md:w-auto gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <Sparkles className="w-4 h-4" />
                Start oppsett
              </Button>
            </div>
          </motion.div>
        )}

        {/* Department HMS Setup Links */}
        {!showSetupBanner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  HMS-oppsett for {department.name}
                </CardTitle>
                <CardDescription>
                  Administrer avdelingens egne HMS-dokumenter og innstillinger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => navigate(`/avdeling/${departmentId}/maal`)}
                  >
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-sm">Målsetting</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => navigate(`/avdeling/${departmentId}/organisering`)}
                  >
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm">Organisering</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => navigate(`/avdeling/${departmentId}/rutiner`)}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">Rutiner</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => navigate(`/avdeling/${departmentId}/oppsett/ai`)}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm">AI-oppsett</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Samsvarsstatus"
            value={statsLoading ? "..." : `${compliancePercent}%`}
            description="Oppfyller krav"
            icon={Shield}
            variant="success"
            delay={0}
            onClick={() => navigate("/setup")}
          />
          <StatsCard
            title="Åpne avvik"
            value={statsLoading ? "..." : openDeviations}
            description="Krever handling"
            icon={AlertTriangle}
            variant="warning"
            delay={0.1}
            onClick={() => navigate("/deviations")}
          />
          <StatsCard
            title="Fullførte tiltak"
            value={statsLoading ? "..." : completedActions}
            description="Totalt"
            icon={CheckCircle2}
            variant="success"
            delay={0.2}
            onClick={() => navigate("/setup?step=3")}
          />
          <StatsCard
            title="Forfallende"
            value={statsLoading ? "..." : dueSoon}
            description="Neste 7 dager"
            icon={Clock}
            variant="destructive"
            delay={0.3}
            onClick={() => navigate("/deviations")}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left column - Department setup progress */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Oppsett-fremgang for {department.name}</CardTitle>
                <CardDescription>
                  {goalsCount + (hasOrganization ? 1 : 0) + (routinesCount > 0 ? 1 : 0)} av 4 steg fullført
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {goalsCount > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <p className="font-medium">Mål for internkontroll</p>
                      <p className="text-sm text-muted-foreground">
                        {goalsCount > 0 ? `${goalsCount} mål definert` : "Ikke satt opp"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/avdeling/${departmentId}/maal`)}
                  >
                    {goalsCount > 0 ? "Rediger" : "Sett opp"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {hasOrganization ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <p className="font-medium">Organisering</p>
                      <p className="text-sm text-muted-foreground">
                        {hasOrganization ? "Dokumentert" : "Ikke satt opp"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/avdeling/${departmentId}/organisering`)}
                  >
                    {hasOrganization ? "Rediger" : "Sett opp"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {routinesCount > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <p className="font-medium">Rutiner</p>
                      <p className="text-sm text-muted-foreground">
                        {routinesCount > 0 ? `${routinesCount} rutiner etablert` : "Ikke satt opp"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/avdeling/${departmentId}/rutiner`)}
                  >
                    {routinesCount > 0 ? "Rediger" : "Sett opp"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    <div>
                      <p className="font-medium">Risikovurdering</p>
                      <p className="text-sm text-muted-foreground">Ikke satt opp</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/avdeling/${departmentId}/oppsett/ai`)}
                  >
                    Sett opp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4 md:space-y-6">
            {/* Quick actions for department */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hurtighandlinger</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => navigate("/deviations")}
                >
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-xs">Registrer avvik</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => navigate(`/avdeling/${departmentId}/oppsett/ai`)}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-xs">AI-oppsett</span>
                </Button>
              </CardContent>
            </Card>
            
            {/* Anonymous message card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-3">
                <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-semibold">Anonym varsling</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Send en anonym melding til ledelsen om bekymringer, uønskede hendelser eller forbedringsforslag.
              </p>
              <AnonymousMessageButton className="w-full" />
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DepartmentDashboard;
