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

interface Allergen {
  name: string;
  present: boolean;
  controlMeasures: string;
}

const IkMatAllergener = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [allergens, setAllergens] = useState<Allergen[]>([]);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent generert allergen-informasjon fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.allergens) {
          setAllergens(settings.generatedContent.allergens);
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
          <h1 className="text-3xl font-bold mb-2">Allergener</h1>
          <p className="text-muted-foreground">
            Oversikt over allergener og kontrolltiltak
          </p>
        </div>

        {allergens.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ingen allergen-informasjon funnet. Kjør IK/MAT oppsettet først for å generere allergentabell.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Allergentabell for {company?.name}</CardTitle>
              <CardDescription>
                Oversikt over allergener i produksjonen og tilhørende kontrolltiltak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allergen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kontrolltiltak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allergens.map((allergen, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{allergen.name}</TableCell>
                      <TableCell>
                        {allergen.present ? (
                          <Badge variant="destructive">Tilstede</Badge>
                        ) : (
                          <Badge variant="outline">Ikke i bruk</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {allergen.controlMeasures || "Ingen spesifikke tiltak nødvendig"}
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

export default IkMatAllergener;
