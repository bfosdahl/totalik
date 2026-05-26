import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IkMatChatSetup } from "@/components/setup/IkMatChatSetup";
import { IkMatHandbookImportUploader } from "@/components/setup/IkMatHandbookImportUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyModules } from "@/hooks/useCompanyModules";

const IkMatOppsett = () => {
  const { profile, company, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading: modulesLoading } = useCompanyModules();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

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
      if (ikMatModule?.settings && (ikMatModule.settings as any).setupCompletedAt) {
        setSetupCompleted(true);
      }
    }
  }, [hasModule, isLoading, navigate, modules, isRestarting, company?.id]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laster...</p>
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
              Du må være tilknyttet en bedrift for å sette opp IK/MAT.
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">IK/MAT Oppsett</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sett opp ditt skreddersydde matsikkerhetssystem med AI
          </p>
        </div>

        {setupCompleted ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                IK/MAT oppsett er fullført! Ditt skreddersydde matsikkerhetssystem er klar til bruk.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Viktig informasjon</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-medium mb-1">✅ Dine data er trygge</p>
                  <p className="text-muted-foreground">
                    Hvis du kjører oppsettet på nytt, beholdes alle gjennomførte sjekklister, 
                    renholdsplaner, sporingsposter og tilpassede maler. Kun AI-genererte maler oppdateres.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">⏱️ Estimert tidsbruk</p>
                  <p className="text-muted-foreground">
                    Et komplett AI-oppsett tar normalt 5-10 minutter, avhengig av hvor detaljert 
                    du svarer på spørsmålene.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={() => navigate('/ik-mat/handbok')} className="w-full sm:w-auto">
                Se generert innhold
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
          <div className="space-y-6">
            <IkMatHandbookImportUploader
              companyId={company.id}
              onImportComplete={() => {
                // Reload page so chat veiviser kan bruke importert kontekst
                window.location.reload();
              }}
            />
            <IkMatChatSetup
              companyId={company.id}
              onComplete={() => {
                setSetupCompleted(true);
                setIsRestarting(false);
              }}
            />
          </div>

        <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Kjør oppsett på nytt?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Du er i ferd med å starte et nytt AI-oppsett. Dette vil ta 5-10 minutter å fullføre.
                </p>
                <p className="font-medium text-foreground">
                  ⚠️ Viktig: Ditt nåværende oppsett beholdes helt til det nye oppsettet er 100% fullført. 
                  Hvis du avbryter underveis, beholdes det opprinnelige oppsettet.
                </p>
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

export default IkMatOppsett;
