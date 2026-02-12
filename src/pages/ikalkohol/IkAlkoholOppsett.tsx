import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { IkAlkoholChatSetup } from "@/components/setup/IkAlkoholChatSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, LogOut, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiSetupValidation } from "@/hooks/useAiSetupValidation";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAuth } from "@/contexts/AuthContext";

const IkAlkoholOppsett = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isValid, isLoading, error, companyId, retry } = useAiSetupValidation("IK_ALKOHOL" as any);
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

  const previouslyCompleted = !isRestarting && modules.some(m => 
    m.module_type === 'IK_ALKOHOL' && 
    (m.settings as any)?.setupCompletedAt
  );

  if (isLoading || modulesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Forbereder AI-oppsett...</p>
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
              <span className="flex-1">{error || "Kunne ikke starte AI-oppsettet."}</span>
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

  const handleSetupComplete = async () => {
    setSetupCompleted(true);
    setIsRestarting(false);
    await refetchModules();
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-3">
            <Wine className="h-7 w-7 text-amber-500" />
            Oppsett-hjelperen
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Få hjelp til å sette opp internkontrollsystem etter alkoholloven
          </p>
        </div>

        {(setupCompleted || previouslyCompleted) ? (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-sm sm:text-base">
                IK-Alkohol oppsett er fullført! Ditt internkontrollsystem er klart til bruk.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Viktig informasjon</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="font-medium mb-1">✅ Dine data er trygge</p>
                  <p className="text-muted-foreground">
                    Hvis du kjører oppsettet på nytt, beholdes alle hendelser og manuelt opprettede data. 
                    Kun AI-generert grunnoppsett oppdateres.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">⏱️ Estimert tidsbruk</p>
                  <p className="text-muted-foreground">
                    Et komplett oppsett tar normalt 3-5 minutter.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={() => navigate('/ik-alkohol')} className="w-full sm:w-auto">
                Gå til IK-Alkohol
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
          <IkAlkoholChatSetup
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
                <p>Du er i ferd med å starte et nytt AI-oppsett for IK-Alkohol.</p>
                <p className="font-medium text-foreground">
                  ⚠️ Dine hendelser og manuelt opprettede data beholdes.
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

export default IkAlkoholOppsett;
