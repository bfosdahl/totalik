import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateIkMatHandbokPdf } from "@/utils/ikMatHandbokPdf";
import { toast } from "sonner";

interface HandbokData {
  goals: string[];
  haccp: Array<{
    step: string;
    hazard: string;
    criticalLimit: string;
    monitoring: string;
    correctiveAction: string;
    verification: string;
  }>;
  risks: Array<{
    hazard: string;
    consequence: string;
    probability: string;
    riskLevel: string;
    measures: string;
  }>;
  routines: Array<{
    name: string;
    description: string;
    frequency: string;
    responsible: string;
  }>;
  checklists: Array<{
    name: string;
    description: string;
    checkpoints: string[];
  }>;
  cleaningPlan: Array<{
    area: string;
    frequency: string;
    method: string;
    responsible: string;
  }>;
  allergens: Array<{
    name: string;
    present: boolean;
    controlMeasures: string;
  }>;
  contracts: Array<{
    supplier: string;
    type: string;
    frequency: string;
    contact?: string;
    nextReview?: string;
  }>;
  setupAnswers: {
    businessType?: string;
    numberOfEmployees?: string;
    hasCleanZone?: boolean;
  };
}

const IkMatHandbok = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [handbokData, setHandbokData] = useState<HandbokData | null>(null);

  useEffect(() => {
    const fetchHandbokData = async () => {
      if (!company?.id) return;

      try {
        setIsLoading(true);

        // Fetch IK_MAT module settings with all generated content
        const { data: moduleData, error: moduleError } = await supabase
          .from('company_modules')
          .select('settings')
          .eq('company_id', company.id)
          .eq('module_type', 'IK_MAT')
          .single();

        if (moduleError) throw moduleError;

        const settings = moduleData?.settings as { 
          generatedContent?: Partial<Omit<HandbokData, "setupAnswers">>;
          setupAnswers?: HandbokData["setupAnswers"];
        };
        const generatedContent = settings?.generatedContent || {};

        setHandbokData({
          goals: generatedContent.goals || [],
          haccp: generatedContent.haccp || [],
          risks: generatedContent.risks || [],
          routines: generatedContent.routines || [],
          checklists: generatedContent.checklists || [],
          cleaningPlan: generatedContent.cleaningPlan || [],
          allergens: generatedContent.allergens || [],
          contracts: generatedContent.contracts || [],
          setupAnswers: settings?.setupAnswers || {} as HandbokData["setupAnswers"],
        });
      } catch (error) {
        console.error('Error fetching håndbok data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHandbokData();
  }, [company?.id]);

  const handleExportPdf = async () => {
    if (!handbokData || !company) {
      toast.error("Ingen data å eksportere");
      return;
    }

    try {
      // Ensure arrays are valid before passing to PDF generator
      const ensureArray = (value: unknown): unknown[] => {
        if (Array.isArray(value)) return value;
        return [];
      };

      await generateIkMatHandbokPdf({
        companyName: company.name || 'Bedrift',
        businessType: handbokData.setupAnswers?.businessType,
        numberOfEmployees: handbokData.setupAnswers?.numberOfEmployees,
        hasCleanZone: handbokData.setupAnswers?.hasCleanZone,
        goals: ensureArray(handbokData.goals) as string[],
        haccp: ensureArray(handbokData.haccp) as HandbokData['haccp'],
        risks: ensureArray(handbokData.risks) as HandbokData['risks'],
        routines: ensureArray(handbokData.routines) as HandbokData['routines'],
        checklists: ensureArray(handbokData.checklists) as HandbokData['checklists'],
        cleaningPlan: ensureArray(handbokData.cleaningPlan) as HandbokData['cleaningPlan'],
        allergens: ensureArray(handbokData.allergens) as HandbokData['allergens'],
        contracts: ensureArray(handbokData.contracts) as HandbokData['contracts'],
      });
      toast.success("IK-MAT håndbok lastet ned som PDF");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Kunne ikke generere PDF: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!handbokData || handbokData.goals.length === 0) {
    return (
      <AppLayout>
        <div className="container max-w-6xl mx-auto py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ingen IK-MAT innhold funnet. Vennligst fullfør oppsettet først.
              <Button 
                variant="link" 
                className="ml-2 p-0 h-auto"
                onClick={() => navigate('/ik-mat/oppsett')}
              >
                Gå til oppsett
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">IK-MAT Håndbok</h1>
            <p className="text-muted-foreground mt-1">
              Komplett dokumentasjon for visning til Mattilsynet
            </p>
          </div>
          <Button onClick={handleExportPdf}>
            <Download className="mr-2 h-4 w-4" />
            Eksporter PDF
          </Button>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Bedriftsinformasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bedriftsnavn</p>
                <p className="font-medium">{company?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Virksomhetstype</p>
                <p className="font-medium capitalize">{handbokData.setupAnswers.businessType || 'Ikke oppgitt'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Antall ansatte</p>
                <p className="font-medium">{handbokData.setupAnswers.numberOfEmployees || 'Ikke oppgitt'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ren/uren sone</p>
                <p className="font-medium">{handbokData.setupAnswers.hasCleanZone ? 'Ja' : 'Nei'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Målsettinger
            </CardTitle>
            <CardDescription>Virksomhetens mål for matsikkerhet</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {handbokData.goals.map((goal, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-semibold text-primary">{index + 1}.</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* HACCP / KKP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              HACCP - Kritiske Kontrollpunkter (KKP)
            </CardTitle>
            <CardDescription>Kritiske kontrollpunkter i produksjonskjeden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {handbokData.haccp.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">{item.step}</h4>
                    <Badge variant="destructive">KKP</Badge>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fare</p>
                      <p>{item.hazard}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kritisk grense</p>
                      <p>{item.criticalLimit}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overvåking</p>
                      <p>{item.monitoring}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Korrigerende tiltak</p>
                      <p>{item.correctiveAction}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Verifisering</p>
                      <p>{item.verification}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* General Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generell Risikovurdering
            </CardTitle>
            <CardDescription>Risikovurdering for mat og servering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {handbokData.risks.map((risk, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{risk.hazard}</h4>
                    <Badge 
                      variant={
                        risk.riskLevel === 'Kritisk' ? 'destructive' :
                        risk.riskLevel === 'Høy' ? 'destructive' :
                        risk.riskLevel === 'Middels' ? 'default' : 'secondary'
                      }
                    >
                      {risk.riskLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Konsekvens: </span>
                      <span className="font-medium">{risk.consequence}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sannsynlighet: </span>
                      <span className="font-medium">{risk.probability}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Tiltak</p>
                    <p className="text-sm">{risk.measures}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Routines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rutiner og Prosedyrer
            </CardTitle>
            <CardDescription>Detaljerte rutiner for matsikkerhet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {handbokData.routines.map((routine, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-4" />}
                  <h4 className="font-semibold text-lg mb-3">{routine.name}</h4>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Beskrivelse</p>
                      <p className="whitespace-pre-wrap">{routine.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Frekvens</p>
                      <p>{routine.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ansvarlig</p>
                      <p>{routine.responsible}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Checklists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sjekklister
            </CardTitle>
            <CardDescription>Kontrollskjemaer for daglig bruk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {handbokData.checklists.map((checklist, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-4" />}
                  <h4 className="font-semibold text-lg mb-2">{checklist.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{checklist.description}</p>
                  <ul className="space-y-2">
                    {checklist.checkpoints?.map((point, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="text-primary">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cleaning Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Renholdsplan
            </CardTitle>
            <CardDescription>Systematisk renhold og hygiene</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Område</th>
                    <th className="text-left p-2 font-semibold">Frekvens</th>
                    <th className="text-left p-2 font-semibold">Metode</th>
                    <th className="text-left p-2 font-semibold">Ansvarlig</th>
                  </tr>
                </thead>
                <tbody>
                  {handbokData.cleaningPlan.map((task, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{task.area}</td>
                      <td className="p-2">{task.frequency}</td>
                      <td className="p-2">{task.method}</td>
                      <td className="p-2">{task.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Allergens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Allergener
            </CardTitle>
            <CardDescription>Oversikt og håndtering av allergener</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {handbokData.allergens.map((allergen, index) => (
                <div key={index} className="flex items-start gap-3 border rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{allergen.name}</p>
                    <p className="text-sm text-muted-foreground">{allergen.controlMeasures}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fixed Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Faste Avtaler
            </CardTitle>
            <CardDescription>Oversikt over faste leverandører og serviceavtaler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Leverandør</th>
                    <th className="text-left p-2 font-semibold">Type tjeneste</th>
                    <th className="text-left p-2 font-semibold">Frekvens</th>
                    <th className="text-left p-2 font-semibold">Neste revisjon</th>
                  </tr>
                </thead>
                <tbody>
                  {handbokData.contracts.map((contract, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{contract.supplier}</td>
                      <td className="p-2">{contract.type}</td>
                      <td className="p-2">{contract.frequency}</td>
                      <td className="p-2">{contract.nextReview}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IkMatHandbok;