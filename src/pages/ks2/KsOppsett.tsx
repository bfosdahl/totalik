import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { KsSetupChat, KsSetupResult } from "@/components/ks2/KsSetupChat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, LogOut, HardHat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiSetupValidation } from "@/hooks/useAiSetupValidation";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KsOppsett = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isValid, isLoading, error, companyId, retry } = useAiSetupValidation("IK_HMS");
  const { modules, isLoading: modulesLoading, refetch: refetchModules } = useCompanyModules(companyId || undefined);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate("/auth");
  };

  const previouslyCompleted = !isRestarting && modules.some(m =>
    m.module_type === 'IK_BYGG' &&
    (m.settings as any)?.ksSetupCompletedAt
  );

  const handleSetupComplete = async (result: KsSetupResult) => {
    if (!companyId) return;
    setIsSaving(true);

    try {
      // Save quality goals
      for (const goal of result.quality_goals) {
        await supabase
          .from("company_ks_goals")
          .insert({
            company_id: companyId,
            goal_text: goal.goal_text,
            description: goal.description || null,
          });
      }

      // Save system goals (company type info)
      await supabase
        .from("company_ks_system_goals")
        .insert({
          company_id: companyId,
          goal_text: `Bedriftstype: ${result.company_type_label}`,
          goal_type: "system",
          description: `KS-systemet er tilpasset for ${result.company_type_label}`,
        });

      // Save checklist templates
      for (const checklist of result.selected_checklists) {
        await supabase
          .from("company_ks_checklist_templates")
          .insert({
            company_id: companyId,
            template_name: checklist.name,
            category: checklist.category || "kvalitet",
            description: checklist.description || null,
            checkpoints: checklist.checkpoints.map((cp, idx) => ({
              id: crypto.randomUUID(),
              text: cp,
              sort_order: idx,
            })),
          });
      }

      // Save routines
      for (const routine of result.selected_routines) {
        await supabase
          .from("company_ks_routines")
          .insert({
            company_id: companyId,
            routine_name: routine.name,
            category: routine.category || "dokumentasjon",
            description: routine.description || null,
            content: routine.description || "",
          });
      }

      // Mark KS setup as completed in module settings
      const { data: existingModule } = await supabase
        .from("company_modules")
        .select("id, settings")
        .eq("company_id", companyId)
        .eq("module_type", "IK_BYGG")
        .maybeSingle();

      if (existingModule) {
        await supabase
          .from("company_modules")
          .update({
            settings: {
              ...(existingModule.settings as any || {}),
              ksSetupCompletedAt: new Date().toISOString(),
              companyType: result.company_type,
              companyTypeLabel: result.company_type_label,
            },
          })
          .eq("id", existingModule.id);
      } else {
        await supabase
          .from("company_modules")
          .insert({
            company_id: companyId,
            module_type: "IK_BYGG",
            is_active: true,
            settings: {
              ksSetupCompletedAt: new Date().toISOString(),
              companyType: result.company_type,
              companyTypeLabel: result.company_type_label,
            },
          });
      }

      toast.success("KS-systemet er satt opp!");
      setSetupCompleted(true);
      setIsRestarting(false);
      await refetchModules();
    } catch (err) {
      console.error("Error saving KS setup:", err);
      toast.error("Kunne ikke lagre oppsettet. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || modulesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Forbereder KS-oppsett...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !isValid) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto py-8 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="flex-1">{error || "Kunne ikke starte KS-oppsettet."}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={retry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Prøv igjen
                </Button>
                <Button variant="secondary" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                  Logg ut
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-3">
            <HardHat className="h-7 w-7 text-primary" />
            KS Oppsett-hjelperen
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tilpass kvalitetssikringssystemet for din bedrift
          </p>
        </div>

        {(setupCompleted || previouslyCompleted) ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                KS-systemet er satt opp! Sjekklister, rutiner og kvalitetsmål er klare til bruk.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3">
              <h3 className="font-semibold text-base sm:text-lg">Hva nå?</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ Sjekklister er lagt til i malsystemet</p>
                <p>✅ Rutiner er opprettet for din bedrift</p>
                <p>✅ Kvalitetsmål er definert</p>
                <p className="mt-2">Du kan tilpasse alt videre under KS Grunnlag i menyen.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/ks')} className="w-full sm:w-auto">
                Gå til Mine prosjekter
              </Button>
              <Button variant="outline" onClick={() => navigate('/ks/ik-ks/sjekklister')} className="w-full sm:w-auto">
                Se sjekklister
              </Button>
              <Button variant="outline" onClick={() => navigate('/ks/ik-ks/rutiner')} className="w-full sm:w-auto">
                Se rutiner
              </Button>
              <Button variant="ghost" onClick={() => setShowRestartDialog(true)} className="w-full sm:w-auto">
                Kjør oppsett på nytt
              </Button>
            </div>
          </div>
        ) : (
          isSaving ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Lagrer KS-oppsettet...</p>
              </div>
            </div>
          ) : (
            <KsSetupChat
              companyId={companyId!}
              onComplete={handleSetupComplete}
            />
          )
        )}

        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Kjør oppsett på nytt?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Dette vil starte et nytt KS-oppsett. Eksisterende sjekklister og rutiner beholdes.
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

export default KsOppsett;
