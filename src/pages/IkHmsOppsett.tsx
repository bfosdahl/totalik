import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { IkHmsChatSetup } from "@/components/setup/IkHmsChatSetup";
import { HandbookImportUploader } from "@/components/setup/HandbookImportUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, AlertTriangle, RefreshCw, Loader2, LogOut, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiSetupValidation } from "@/hooks/useAiSetupValidation";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/i18n/t";

const IkHmsOppsett = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isValid, isLoading, error, companyId, retry } = useAiSetupValidation("IK_HMS");
  const { modules, isLoading: modulesLoading, refetch: refetchModules } = useCompanyModules(companyId || undefined);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate("/auth");
  };

  // Check if setup was previously completed
  const previouslyCompleted = !isRestarting && modules.some(m => 
    m.module_type === 'IK_HMS' && 
    (m.settings as any)?.setupCompletedAt
  );

  // Show loader while validating
  if (isLoading || modulesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t("auto.forbereder_ai_oppsett")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show error state with retry option
  if (error || !isValid) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto py-8 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="flex-1">{error || "Kunne ikke starte AI-oppsettet."}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={retry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Prøv igjen
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Logg ut
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            {t("auto.hvis_problemet_vedvarer_proev_aa_logge_u")}
          </p>
        </div>
      </AppLayout>
    );
  }

  // At this point we know companyId is valid
  const handleSetupComplete = async () => {
    setSetupCompleted(true);
    setIsRestarting(false);
    // Refetch modules to update the state
    await refetchModules();
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("auto.oppsett_hjelperen")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("auto.faa_hjelp_til_aa_sette_opp_hms_systemet_")}
          </p>
        </div>

        {(setupCompleted || previouslyCompleted) ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                {t("auto.ik_hms_oppsett_er_fullfoert_ditt_skredde")}
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">{t("auto.viktig_informasjon")}</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-medium mb-1">{t("auto.dine_data_er_trygge")}</p>
                  <p className="text-muted-foreground">
                    {t("auto.hvis_du_kjoerer_oppsettet_paa_nytt_behol_2")}
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">{t("auto.estimert_tidsbruk")}</p>
                  <p className="text-muted-foreground">
                    {t("auto.et_komplett_ai_oppsett_tar_normalt_5_10_")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={() => navigate('/handbook')} className="w-full sm:w-auto">
                {t("auto.se_generert_innhold")}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRestartDialog(true)}
                className="w-full sm:w-auto"
              >
                Kjør oppsett på nytt
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-2">{t("auto.importer_fra_eksisterende_haandbok")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("auto.har_du_en_eksisterende_hms_haandbok_last")}
              </p>
              <HandbookImportUploader
                companyId={companyId!}
                onImportComplete={async () => {
                  await handleSetupComplete();
                }}
              />
            </div>
          </div>
        ) : (
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-oppsett
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importer håndbok
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ai">
              <IkHmsChatSetup
                companyId={companyId!}
                onComplete={handleSetupComplete}
              />
            </TabsContent>
            <TabsContent value="import">
              <HandbookImportUploader
                companyId={companyId!}
                onImportComplete={async () => {
                  await handleSetupComplete();
                }}
              />
            </TabsContent>
          </Tabs>
        )}

        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Kjør oppsett på nytt?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  {t("auto.du_er_i_ferd_med_aa_starte_et_nytt_ai_op")}
                </p>
                <p className="font-medium text-foreground">
                  {t("auto.viktig_ditt_naavaerende_oppsett_beholdes")}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowRestartDialog(false);
                setIsRestarting(true);
                setSetupCompleted(false);
              }}>
                {t("auto.start_nytt_oppsett")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default IkHmsOppsett;
