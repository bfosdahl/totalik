import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { IkHmsChatSetup } from "@/components/setup/IkHmsChatSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiSetupValidation } from "@/hooks/useAiSetupValidation";
import { useCompanyModules } from "@/hooks/useCompanyModules";

const IkHmsOppsett = () => {
  const navigate = useNavigate();
  const { isValid, isLoading, error, companyId, retry } = useAiSetupValidation("IK_HMS");
  const { modules, isLoading: modulesLoading, refetch: refetchModules } = useCompanyModules(companyId || undefined);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

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
            <p className="text-muted-foreground">Forbereder AI-oppsett...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show error state with retry option
  if (error || !isValid) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error || "Kunne ikke starte AI-oppsettet."}</span>
              <Button variant="outline" size="sm" onClick={retry} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Prøv igjen
              </Button>
            </AlertDescription>
          </Alert>
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Oppsett-hjelperen</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Få hjelp til å sette opp HMS-systemet for bedriften din
          </p>
        </div>

        {(setupCompleted || previouslyCompleted) ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                IK/HMS oppsett er fullført! Ditt skreddersydde HMS-system er klar til bruk.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Viktig informasjon</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-medium mb-1">✅ Dine data er trygge</p>
                  <p className="text-muted-foreground">
                    Hvis du kjører oppsettet på nytt, beholdes alle revisjoner, avvik og 
                    tilpassede data. Kun AI-generert grunnoppsett oppdateres.
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
              <Button onClick={() => navigate('/handbook')} className="w-full sm:w-auto">
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
          <IkHmsChatSetup
            companyId={companyId!}
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

export default IkHmsOppsett;
