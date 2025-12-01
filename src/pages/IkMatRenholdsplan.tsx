import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CleaningTask {
  area: string;
  frequency: string;
  method: string;
  responsible: string;
}

const IkMatRenholdsplan = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [cleaningPlan, setCleaningPlan] = useState<CleaningTask[]>([]);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent generert renholdsplan fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.cleaningPlan) {
          setCleaningPlan(settings.generatedContent.cleaningPlan);
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
          <h1 className="text-3xl font-bold mb-2">Renholdsplan</h1>
          <p className="text-muted-foreground">
            Systematisk renhold og hygiene for matsikkerhet
          </p>
        </div>

        {cleaningPlan.length === 0 ? (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Ingen renholdsplan funnet. Kjør IK/MAT oppsettet først for å generere en skreddersydd renholdsplan.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Renholdsplan for {company?.name}</CardTitle>
              <CardDescription>
                Oversikt over alle renholdsoppgaver og ansvar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Område</TableHead>
                    <TableHead>Frekvens</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Ansvarlig</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaningPlan.map((task, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{task.area}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.frequency}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.method}</TableCell>
                      <TableCell>{task.responsible}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatRenholdsplan;
