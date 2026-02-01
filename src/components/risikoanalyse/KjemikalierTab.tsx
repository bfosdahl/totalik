import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Shield,
  ExternalLink,
  FileWarning,
} from "lucide-react";
import { useCompanyChemicalRiskAssessments, calculateChemicalRiskLevel } from "@/hooks/useChemicalRiskAssessment";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function KjemikalierTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: assessments = [], isLoading } = useCompanyChemicalRiskAssessments();
  const navigate = useNavigate();

  // Filter assessments by search query
  const filteredAssessments = assessments.filter((a: any) => {
    const chemical = a.company_chemical_entries?.global_chemicals;
    if (!chemical) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      chemical.product_name?.toLowerCase().includes(query) ||
      chemical.manufacturer?.toLowerCase().includes(query)
    );
  });

  // Statistics
  const totalCount = assessments.length;
  const completedCount = assessments.filter((a: any) => a.status === "completed").length;
  const inProgressCount = assessments.filter((a: any) => a.status === "in_progress").length;
  const highRiskCount = assessments.filter((a: any) => {
    const level = calculateChemicalRiskLevel(a.hazard_severity || 0, a.exposure_probability || 0);
    return level.score > 10;
  }).length;

  const getStatusBadge = (assessment: any) => {
    const riskLevel = calculateChemicalRiskLevel(
      assessment.hazard_severity || 0,
      assessment.exposure_probability || 0
    );

    if (assessment.status === "completed") {
      return (
        <Badge variant="outline" className={cn("gap-1", riskLevel.bg, riskLevel.color)}>
          <CheckCircle2 className="h-3 w-3" />
          Fullført
        </Badge>
      );
    }
    if (assessment.status === "in_progress") {
      return (
        <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3" />
          Fase {assessment.current_phase}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <FileWarning className="h-3 w-3" />
        Utkast
      </Badge>
    );
  };

  const getRiskBadge = (assessment: any) => {
    const riskLevel = calculateChemicalRiskLevel(
      assessment.hazard_severity || 0,
      assessment.exposure_probability || 0
    );

    if (riskLevel.score === 0) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    return (
      <Badge variant="outline" className={cn(riskLevel.bg, riskLevel.color)}>
        R{riskLevel.score} - {riskLevel.level}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Totalt vurdert</p>
              </div>
              <FlaskConical className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Fullført</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">Pågående</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{highRiskCount}</p>
                <p className="text-sm text-muted-foreground">Høy risiko</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Kjemikalierisikovurderinger
              </CardTitle>
              <CardDescription>
                Oversikt over alle kjemikalierisikovurderinger i bedriften
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/ks-modul2")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Gå til prosjekter
            </Button>
          </div>

          {assessments.length > 0 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter kjemikalie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen risikovurderinger ennå</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Risikovurderinger opprettes fra stoffkartoteket i hvert prosjekt
              </p>
              <Button onClick={() => navigate("/ks-modul2")}>
                Gå til prosjekter
              </Button>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Ingen vurderinger matcher "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kjemikalie</TableHead>
                    <TableHead>Produsent</TableHead>
                    <TableHead>Risikonivå</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sist oppdatert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment: any) => {
                    const chemical = assessment.company_chemical_entries?.global_chemicals;
                    if (!chemical) return null;

                    return (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{chemical.product_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {chemical.manufacturer || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{getRiskBadge(assessment)}</TableCell>
                        <TableCell>{getStatusBadge(assessment)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(assessment.updated_at), "d. MMM yyyy", { locale: nb })}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Om kjemikalierisikovurdering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Kjemikalierisikovurdering følger Arbeidstilsynets metodikk for kartlegging og vurdering 
            av eksponering i tre faser:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground mb-1">Fase 1: Innledende vurdering</h4>
              <p className="text-xs">
                Faglig vurdering basert på sikkerhetsdatablad, arbeidsoppgaver og eksponeringsforhold.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground mb-1">Fase 2: Forenklet undersøkelse</h4>
              <p className="text-xs">
                Yrkeshygienisk kartlegging med 3-5 målinger per eksponert gruppe.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground mb-1">Fase 3: Detaljert undersøkelse</h4>
              <p className="text-xs">
                Minimum 6 målinger med statistisk vurdering av resultatene.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
