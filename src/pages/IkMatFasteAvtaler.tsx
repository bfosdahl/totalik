import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Contract {
  supplier: string;
  type: string;
  frequency: string;
  contact: string;
  nextReview: string;
}

const IkMatFasteAvtaler = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent genererte faste avtaler fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.contracts) {
          setContracts(settings.generatedContent.contracts);
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
          <h1 className="text-3xl font-bold mb-2">Faste avtaler</h1>
          <p className="text-muted-foreground">
            Oversikt over leverandører og serviceavtaler
          </p>
        </div>

        {contracts.length === 0 ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Ingen faste avtaler funnet. Kjør IK/MAT oppsettet først for å generere anbefalte leverandøravtaler.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Faste avtaler for {company?.name}</CardTitle>
              <CardDescription>
                Leverandører og serviceavtaler for matsikkerhet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leverandør</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frekvens</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Neste gjennomgang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{contract.supplier}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contract.frequency}</TableCell>
                      <TableCell className="text-sm">{contract.contact}</TableCell>
                      <TableCell className="text-sm">{contract.nextReview}</TableCell>
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

export default IkMatFasteAvtaler;
