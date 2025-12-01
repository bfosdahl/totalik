import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Checklist {
  id: string;
  name: string;
  description: string;
  checkpoints: string[];
}

const IkMatSjekklister = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent genererte sjekklister fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.checklists) {
          setChecklists(settings.generatedContent.checklists);
        }
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

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">IK/MAT Sjekklister</h1>
          <p className="text-muted-foreground">
            Kontrollister for matsikkerhet og hygiene
          </p>
        </div>

        {checklists.length === 0 ? (
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
              Ingen sjekklister funnet. Kjør IK/MAT oppsettet først for å generere skreddersydde sjekklister.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {checklists.map((checklist) => (
              <Card key={checklist.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{checklist.name}</CardTitle>
                      <CardDescription className="mt-2">{checklist.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {checklist.checkpoints?.length || 0} punkter
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {checklist.checkpoints?.slice(0, 3).map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{point}</span>
                      </div>
                    ))}
                    {checklist.checkpoints?.length > 3 && (
                      <p className="text-sm text-muted-foreground italic">
                        ... og {checklist.checkpoints.length - 3} flere punkter
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatSjekklister;
