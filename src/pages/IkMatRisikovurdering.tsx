import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Risk {
  hazard: string;
  consequence: number;
  probability: number;
  riskLevel: string;
  measures: string;
}

const IkMatRisikovurdering = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [risks, setRisks] = useState<Risk[]>([]);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent risikovurdering fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.risks) {
          setRisks(settings.generatedContent.risks);
        }
      }
    }
  }, [hasModule, isLoading, navigate, modules]);

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'høy':
      case 'kritisk':
        return 'destructive';
      case 'middels':
        return 'default';
      case 'lav':
        return 'secondary';
      default:
        return 'outline';
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Risikovurdering - Mat og servering</h1>
          <p className="text-muted-foreground">
            Generell risikovurdering for mat- og serveringsvirksomhet
          </p>
        </div>

        {risks.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ingen risikovurdering funnet. Kjør IK/MAT oppsettet først for å generere risikovurdering.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Risikovurdering for {company?.name}</CardTitle>
              <CardDescription>
                Identifiserte risikoer med konsekvens, sannsynlighet og tiltak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fare/risiko</TableHead>
                    <TableHead className="text-center">Konsekvens</TableHead>
                    <TableHead className="text-center">Sannsynlighet</TableHead>
                    <TableHead className="text-center">Risikonivå</TableHead>
                    <TableHead>Tiltak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{risk.hazard}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{risk.consequence}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{risk.probability}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getRiskColor(risk.riskLevel)}>
                          {risk.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {risk.measures}
                      </TableCell>
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

export default IkMatRisikovurdering;
