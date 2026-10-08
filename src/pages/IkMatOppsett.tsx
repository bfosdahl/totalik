import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IkMatChatSetup, clearChatState, hasInProgressChatState } from "@/components/setup/IkMatChatSetup";
import { IkMatHandbookImportUploader } from "@/components/setup/IkMatHandbookImportUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { t } from "@/i18n/t";

const IkMatOppsett = () => {
  const { profile, company, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading: modulesLoading } = useCompanyModules();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [completionChecked, setCompletionChecked] = useState(false);

  // Combined loading state - wait for both auth and modules to load
  const isLoading = authLoading || modulesLoading;

  useEffect(() => {
    // Wait until everything is loaded AND we have a company before checking module access
    if (isLoading || !company?.id) {
      return;
    }

    // Now check if IK/MAT module is active
    if (!hasModule('IK_MAT')) {
      navigate('/');
      return;
    }

    // Check if setup is already completed (only if not restarting)
    if (modules.length > 0 && !isRestarting) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      const setupCompletedAt = (ikMatModule?.settings as any)?.setupCompletedAt as string | undefined;
      if (setupCompletedAt && !hasInProgressChatState(company.id, setupCompletedAt)) {
        setSetupCompleted(true);
      }
    }
    setCompletionChecked(true);
  }, [hasModule, isLoading, navigate, modules, isRestarting, company?.id]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("auto.laster")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!company?.id) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              {t("auto.du_maa_vaere_tilknyttet_en_bedrift_for_a")}
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("auto.ik_mat_oppsett")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("auto.sett_opp_ditt_skreddersydde_matsikkerhet")}
          </p>
        </div>

        {setupCompleted ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                {t("auto.ik_mat_oppsett_er_fullfoert_ditt_skredde")}
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">{t("auto.viktig_informasjon")}</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-medium mb-1">{t("auto.dine_data_er_trygge")}</p>
                  <p className="text-muted-foreground">
                    {t("auto.hvis_du_kjoerer_oppsettet_paa_nytt_behol")}
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
              <Button onClick={() => navigate('/ik-mat/handbok')} className="w-full sm:w-auto">
                {t("auto.se_generert_innhold")}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRestartDialog(true)}
                className="w-full sm:w-auto"
              >
                {t("auto.kjoer_oppsett_paa_nytt")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <IkMatHandbookImportUploader
              companyId={company.id}
              onImportComplete={() => {
                // Reload page so chat veiviser kan bruke importert kontekst
                window.location.reload();
              }}
            />
            <IkMatChatSetup
              key={restartKey}
              companyId={company.id}
              onComplete={() => {
                setSetupCompleted(true);
                setIsRestarting(false);
              }}
            />
          </div>
        )}


        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                {t("auto.kjoer_oppsett_paa_nytt")}
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
                clearChatState(company.id);
                setRestartKey((k) => k + 1);
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

export default IkMatOppsett;
