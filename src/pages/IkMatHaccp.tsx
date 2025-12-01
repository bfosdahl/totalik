import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CriticalControlPoint {
  step: string;
  hazard: string;
  criticalLimit: string;
  monitoring: string;
  correctiveAction: string;
  verification: string;
}

const IkMatHaccp = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [ccps, setCcps] = useState<CriticalControlPoint[]>([]);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent HACCP/KKP fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.haccp) {
          setCcps(settings.generatedContent.haccp);
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
      <div className="container max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HACCP - Kritiske Kontrollpunkter</h1>
          <p className="text-muted-foreground">
            Hazard Analysis and Critical Control Points (KKP) for matsikkerhet
          </p>
        </div>

        {ccps.length === 0 ? (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Ingen kritiske kontrollpunkter funnet. Kjør IK/MAT oppsettet først for å generere HACCP-analyse.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Kritiske Kontrollpunkter (KKP) for {company?.name}</CardTitle>
              <CardDescription>
                HACCP-basert analyse av kritiske punkter i matproduksjonskjeden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {ccps.map((ccp, idx) => (
                  <Card key={idx} className="border-l-4 border-l-destructive">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">KKP {idx + 1}: {ccp.step}</CardTitle>
                          <Badge variant="destructive" className="mt-2">Kritisk kontrollpunkt</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableHead className="w-1/4">Fare</TableHead>
                            <TableCell className="font-medium">{ccp.hazard}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead>Kritisk grense</TableHead>
                            <TableCell className="font-medium text-destructive">{ccp.criticalLimit}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead>Overvåking</TableHead>
                            <TableCell>{ccp.monitoring}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead>Korrigerende tiltak</TableHead>
                            <TableCell>{ccp.correctiveAction}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead>Verifisering</TableHead>
                            <TableCell>{ccp.verification}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatHaccp;
