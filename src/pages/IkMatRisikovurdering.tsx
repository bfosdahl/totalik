import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, getRiskLevelLabel } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const IkMatRisikovurdering = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading: contentLoading } = useIkMatContent();

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  const getRiskBadgeColor = (level: number) => {
    if (level <= 4) return 'bg-green-500/20 text-green-700 border-green-500/30';
    if (level <= 9) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    if (level <= 15) return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  if (modulesLoading || contentLoading) {
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

  const risks = content.risks || [];

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Risikovurdering - Mat og servering</h1>
            <p className="text-muted-foreground">
              5×5 risikomatrise: Sannsynlighet × Konsekvens = Risikonivå (1-25)
            </p>
          </div>
          <Button asChild>
            <Link to="/ik-mat/risiko-haccp">
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Link>
          </Button>
        </div>

        {risks.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ingen risikovurdering funnet. <Link to="/ik-mat/risiko-haccp" className="underline font-medium">Legg til risikoer</Link> eller kjør IK/MAT oppsettet.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Risikovurdering for {company?.name}</CardTitle>
              <CardDescription>
                Identifiserte risikoer med 5×5 matrise (S × K = Risikonivå)
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fare/risiko</TableHead>
                    <TableHead className="text-center w-24">S (1-5)</TableHead>
                    <TableHead className="text-center w-24">K (1-5)</TableHead>
                    <TableHead className="text-center w-32">Risiko (S×K)</TableHead>
                    <TableHead className="text-center w-20">HACCP</TableHead>
                    <TableHead>Tiltak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk, idx) => (
                    <TableRow key={risk.id || idx}>
                      <TableCell className="font-medium">{risk.hazard}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{risk.probability}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{risk.consequence}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRiskBadgeColor(risk.riskLevel)}>
                          {risk.riskLevel} - {getRiskLevelLabel(risk.riskLevel)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {risk.isHaccp && <Badge variant="destructive">KKP</Badge>}
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
