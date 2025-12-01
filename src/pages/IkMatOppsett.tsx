import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IkMatChatSetup } from "@/components/setup/IkMatChatSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyModules } from "@/hooks/useCompanyModules";

const IkMatOppsett = () => {
  const { profile, company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    // Check if IK/MAT module is active
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Check if setup is already completed
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings && (ikMatModule.settings as any).setupCompletedAt) {
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
              Du må være tilknyttet en bedrift for å sette opp IK/MAT.
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
          <h1 className="text-3xl font-bold mb-2">IK/MAT Oppsett</h1>
          <p className="text-muted-foreground">
            Sett opp ditt skreddersydde matsikkerhetssystem med AI
          </p>
        </div>

        {setupCompleted ? (
          <div className="space-y-4">
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                IK/MAT oppsett er fullført! Ditt skreddersydde matsikkerhetssystem er klar til bruk.
              </AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/')}>
                Gå til dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSetupCompleted(false)}
              >
                Kjør oppsett på nytt
              </Button>
            </div>
          </div>
        ) : (
          <IkMatChatSetup
            companyId={company.id}
            onComplete={() => {
              setSetupCompleted(true);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatOppsett;
