import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IkHmsChatSetup } from "@/components/setup/IkHmsChatSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyModules } from "@/hooks/useCompanyModules";

const IkHmsOppsett = () => {
  const { profile, company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);

  useEffect(() => {
    // Check if IK/HMS module is active
    if (!isLoading && !hasModule('IK_HMS')) {
      navigate('/');
    }

    // Check if setup is already completed
    if (!isLoading && modules.length > 0) {
      const ikHmsModule = modules.find(m => m.module_type === 'IK_HMS');
      if (ikHmsModule?.settings && (ikHmsModule.settings as any).setupCompletedAt) {
        setSetupCompleted(true);
      }
    }
  }, [hasModule, isLoading, navigate, modules]);

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
              Du må være tilknyttet en bedrift for å sette opp IK/HMS.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">IK/HMS Oppsett</h1>
          <p className="text-muted-foreground">
            Sett opp ditt skreddersydde HMS-system med AI
          </p>
        </div>

        {setupCompleted ? (
          <div className="space-y-6">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                IK/HMS oppsett er fullført! Ditt skreddersydde HMS-system er klar til bruk.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Viktig informasjon</h3>
              <div className="space-y-3 text-sm">
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

            <div className="flex gap-4">
              <Button onClick={() => navigate('/handbook')}>
                Se generert innhold
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRestartDialog(true)}
              >
                Kjør oppsett på nytt
              </Button>
            </div>
          </div>
        ) : (
          <IkHmsChatSetup
            companyId={company.id}
            onComplete={() => {
              setSetupCompleted(true);
            }}
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