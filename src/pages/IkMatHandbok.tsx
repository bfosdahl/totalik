import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download, AlertCircle, Thermometer, SprayCanIcon, CheckCircle2, XCircle, ClipboardCheck, Check, X, Minus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { generateIkMatHandbokPdf } from "@/utils/ikMatHandbokPdf";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { nb } from "date-fns/locale";

import { generateChecklistPdf } from "@/utils/ikMatChecklistPdf";

interface ChecklistResponseEntry {
  id: string;
  checklist_type: string;
  checklist_name: string;
  completed_by_name: string;
  completed_at: string;
  status: 'draft' | 'completed';
  responses: Array<{
    checkpoint: string;
    status: 'ok' | 'not_ok' | 'na';
    comment?: string;
  }>;
  notes: string | null;
}

interface TemperatureLogEntry {
  id: string;
  temperature: number;
  is_acceptable: boolean;
  measured_by_name: string;
  measured_at: string;
  notes: string | null;
  corrective_action: string | null;
  equipment: {
    name: string;
    equipment_type: string;
    min_temp: number | null;
    max_temp: number | null;
  } | null;
}

interface CleaningLogEntry {
  id: string;
  completed_by_name: string;
  completed_at: string | null;
  status: string;
  cleaning_records: Array<{
    area: string;
    completed: boolean;
    notes?: string;
  }>;
  notes: string | null;
  created_at: string;
}

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
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLogEntry[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLogEntry[]>([]);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponseEntry[]>([]);
  
  // Toggle states for including logs in view
  const [includeChecklists, setIncludeChecklists] = useState(true);
  const [includeTemperatureLogs, setIncludeTemperatureLogs] = useState(true);
  const [includeCleaningLogs, setIncludeCleaningLogs] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
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

        const settings = moduleData?.settings as any;
        const generatedContent: any = settings?.generatedContent || {};

        const pickArray = <T,>(...keys: string[]): T[] => {
          for (const key of keys) {
            const value = generatedContent?.[key];
            if (Array.isArray(value)) return value as T[];
          }
          return [];
        };

        setHandbokData({
          goals: pickArray<string>('goals', 'maal', 'målsettinger'),
          haccp: pickArray<HandbokData['haccp'][number]>('haccp', 'haccpPlan', 'kkp'),
          risks: pickArray<HandbokData['risks'][number]>('risks', 'riskAssessment', 'risikovurdering'),
          routines: pickArray<HandbokData['routines'][number]>('routines', 'rutiner'),
          checklists: pickArray<HandbokData['checklists'][number]>('checklists', 'sjekklister'),
          cleaningPlan: pickArray<HandbokData['cleaningPlan'][number]>('cleaningPlan', 'renholdsplan'),
          allergens: pickArray<HandbokData['allergens'][number]>('allergens', 'allergener'),
          contracts: pickArray<HandbokData['contracts'][number]>('contracts', 'avtaler'),
          setupAnswers: (settings?.setupAnswers || {}) as HandbokData['setupAnswers'],
        });

        // Fetch temperature logs (last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const { data: tempLogs, error: tempError } = await supabase
          .from('ik_mat_temperature_logs')
          .select('*, equipment:ik_mat_temperature_equipment(*)')
          .eq('company_id', company.id)
          .gte('measured_at', thirtyDaysAgo)
          .order('measured_at', { ascending: false })
          .limit(100);

        if (!tempError && tempLogs) {
          setTemperatureLogs(tempLogs as unknown as TemperatureLogEntry[]);
        }

        // Fetch cleaning logs (last 30 days)
        const { data: cleanLogs, error: cleanError } = await supabase
          .from('ik_mat_cleaning_plan_responses')
          .select('*')
          .eq('company_id', company.id)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!cleanError && cleanLogs) {
          setCleaningLogs(cleanLogs as unknown as CleaningLogEntry[]);
        }

        // Fetch completed checklist responses (last 30 days)
        const { data: checklistData, error: checklistError } = await supabase
          .from('ik_mat_checklist_responses')
          .select('*')
          .eq('company_id', company.id)
          .eq('status', 'completed')
          .gte('completed_at', thirtyDaysAgo)
          .order('completed_at', { ascending: false })
          .limit(50);

        if (!checklistError && checklistData) {
          setChecklistResponses(checklistData as unknown as ChecklistResponseEntry[]);
        }
      } catch (error) {
        console.error('Error fetching håndbok data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [company?.id]);

  const handleExportPdf = async () => {
    if (!handbokData || !company) {
      toast.error("Ingen data å eksportere");
      return;
    }

    try {
      const safeString = (value: unknown): string => {
        if (typeof value === 'string') return value;
        if (value === null || value === undefined) return '';
        return String(value);
      };

      // Pick first non-empty string from multiple possible field names
      const pickString = (obj: any, ...keys: string[]): string => {
        for (const key of keys) {
          const value = obj?.[key];
          if (typeof value === 'string' && value.trim()) return value;
          if (typeof value === 'number') return String(value);
        }
        return '';
      };

      const safeStringArray = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
        if (typeof value === 'string') {
          // Support both newline and comma separated inputs
          return value
            .split(/\r?\n|\s*,\s*/g)
            .map(s => s.trim())
            .filter(Boolean);
        }
        return [];
      };

      await generateIkMatHandbokPdf({
        companyName: company.name || 'Bedrift',
        companyInfo: {
          name: company.name,
          org_number: company.org_number || undefined,
          address: company.address || undefined,
          postal_code: company.postal_code || undefined,
          city: company.city || undefined,
          logo_url: company.logo_url || undefined,
        },
        businessType: handbokData.setupAnswers?.businessType,
        numberOfEmployees: handbokData.setupAnswers?.numberOfEmployees,
        hasCleanZone: handbokData.setupAnswers?.hasCleanZone,
        goals: safeStringArray(handbokData.goals),
        haccp: (Array.isArray(handbokData.haccp) ? handbokData.haccp : []).map((h) => ({
          step: pickString(h, 'step', 'trinn', 'prosess'),
          hazard: pickString(h, 'hazard', 'fare'),
          criticalLimit: pickString(h, 'criticalLimit', 'kritisk_grense', 'grense'),
          monitoring: pickString(h, 'monitoring', 'overvåking', 'kontroll'),
          correctiveAction: pickString(h, 'correctiveAction', 'korrigerende_tiltak', 'tiltak'),
          verification: pickString(h, 'verification', 'verifisering', 'kontroll_av'),
        })),
        risks: (Array.isArray(handbokData.risks) ? handbokData.risks : []).map((r) => ({
          hazard: pickString(r, 'hazard', 'fare', 'risiko'),
          consequence: pickString(r, 'consequence', 'konsekvens'),
          probability: pickString(r, 'probability', 'sannsynlighet'),
          riskLevel: pickString(r, 'riskLevel', 'risikonivå', 'nivå'),
          measures: pickString(r, 'measures', 'tiltak', 'forebyggende_tiltak'),
        })),
        routines: (Array.isArray(handbokData.routines) ? handbokData.routines : []).map((rt) => ({
          name: pickString(rt, 'name', 'routine_name', 'title', 'navn'),
          description: pickString(rt, 'description', 'procedure', 'purpose', 'beskrivelse', 'prosedyre'),
          frequency: pickString(rt, 'frequency', 'frekvens'),
          responsible: pickString(rt, 'responsible', 'responsibility', 'ansvarlig'),
        })),
        checklists: (Array.isArray(handbokData.checklists) ? handbokData.checklists : []).map((c) => ({
          name: pickString(c, 'name', 'checklist_name', 'title', 'navn'),
          description: pickString(c, 'description', 'beskrivelse'),
          checkpoints: safeStringArray((c as any)?.checkpoints || (c as any)?.items),
        })),
        cleaningPlan: (Array.isArray(handbokData.cleaningPlan) ? handbokData.cleaningPlan : []).map((t) => ({
          area: pickString(t, 'area', 'område'),
          frequency: pickString(t, 'frequency', 'frekvens'),
          method: pickString(t, 'method', 'metode'),
          responsible: pickString(t, 'responsible', 'ansvarlig'),
        })),
        allergens: (Array.isArray(handbokData.allergens) ? handbokData.allergens : []).map((a) => ({
          name: pickString(a, 'name', 'allergen', 'navn'),
          present: Boolean((a as any)?.present || (a as any)?.tilstede),
          controlMeasures: pickString(a, 'controlMeasures', 'control_measures', 'tiltak'),
        })),
        contracts: (Array.isArray(handbokData.contracts) ? handbokData.contracts : []).map((c) => ({
          supplier: pickString(c, 'supplier', 'leverandør'),
          type: pickString(c, 'type', 'tjeneste'),
          frequency: pickString(c, 'frequency', 'frekvens'),
          contact: pickString(c, 'contact', 'kontakt') || undefined,
          nextReview: pickString(c, 'nextReview', 'neste_revisjon') || undefined,
        })),
      });

      toast.success("IK-MAT håndbok lastet ned som PDF");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Kunne ikke generere PDF: ${errorMessage}`);
    }
  };

  const handleDownloadChecklistPdf = async (response: ChecklistResponseEntry) => {
    try {
      await generateChecklistPdf({
        checklistName: response.checklist_name,
        completedByName: response.completed_by_name,
        completedAt: response.completed_at,
        status: response.status,
        responses: response.responses,
        notes: response.notes,
        companyName: company?.name
      });
      toast.success("Sjekkliste lastet ned som PDF");
    } catch (error) {
      console.error('Error generating checklist PDF:', error);
      toast.error('Kunne ikke generere PDF');
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

        {/* Include options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Velg hva som skal inkluderes</CardTitle>
            <CardDescription>Slå av/på seksjoner for visning og PDF-eksport</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-checklists" className="text-sm font-medium cursor-pointer">
                    Utfylte sjekklister
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {checklistResponses.length} fra siste 30 dager
                  </p>
                </div>
                <Switch
                  id="include-checklists"
                  checked={includeChecklists}
                  onCheckedChange={setIncludeChecklists}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-temperature" className="text-sm font-medium cursor-pointer">
                    Temperaturlogg
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {temperatureLogs.length} målinger fra siste 30 dager
                  </p>
                </div>
                <Switch
                  id="include-temperature"
                  checked={includeTemperatureLogs}
                  onCheckedChange={setIncludeTemperatureLogs}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-cleaning" className="text-sm font-medium cursor-pointer">
                    Renholdslogg
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {cleaningLogs.length} fra siste 30 dager
                  </p>
                </div>
                <Switch
                  id="include-cleaning"
                  checked={includeCleaningLogs}
                  onCheckedChange={setIncludeCleaningLogs}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Completed Checklist Responses */}
        {includeChecklists && checklistResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Utfylte Sjekklister (siste 30 dager)
              </CardTitle>
              <CardDescription>Dokumenterte sjekklistegjennomføringer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklistResponses.map((response) => {
                  const okCount = response.responses.filter(r => r.status === 'ok').length;
                  const notOkCount = response.responses.filter(r => r.status === 'not_ok').length;
                  const naCount = response.responses.filter(r => r.status === 'na').length;
                  
                  return (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{response.checklist_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Utført av {response.completed_by_name} • {format(new Date(response.completed_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadChecklistPdf(response)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                      
                      <div className="flex gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" />
                          <span>{okCount} OK</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <X className="h-4 w-4" />
                          <span>{notOkCount} Avvik</span>
                        </div>
                        {naCount > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Minus className="h-4 w-4" />
                            <span>{naCount} N/A</span>
                          </div>
                        )}
                      </div>

                      {/* Show checkpoint details */}
                      <div className="grid gap-2">
                        {response.responses.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-start gap-2 text-sm p-2 rounded ${
                              item.status === 'ok' ? 'bg-green-50 dark:bg-green-950/30' : 
                              item.status === 'not_ok' ? 'bg-red-50 dark:bg-red-950/30' : 
                              'bg-muted'
                            }`}
                          >
                            {item.status === 'ok' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : item.status === 'not_ok' ? (
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <span className={item.status === 'na' ? 'text-muted-foreground' : ''}>
                                {item.checkpoint}
                              </span>
                              {item.comment && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Kommentar: {item.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {response.notes && (
                        <p className="mt-3 text-sm text-muted-foreground italic border-t pt-2">
                          Notater: {response.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Temperature Logs - Actual Records */}
        {includeTemperatureLogs && temperatureLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Temperaturlogg (siste 30 dager)
              </CardTitle>
              <CardDescription>Dokumenterte temperaturmålinger</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Dato</th>
                      <th className="text-left p-2 font-semibold">Utstyr</th>
                      <th className="text-left p-2 font-semibold">Temperatur</th>
                      <th className="text-left p-2 font-semibold">Status</th>
                      <th className="text-left p-2 font-semibold">Målt av</th>
                      <th className="text-left p-2 font-semibold">Notater</th>
                    </tr>
                  </thead>
                  <tbody>
                    {temperatureLogs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="p-2">
                          {format(new Date(log.measured_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                        </td>
                        <td className="p-2">{log.equipment?.name || 'Ukjent'}</td>
                        <td className="p-2">
                          <span className={log.is_acceptable ? 'text-green-600' : 'text-red-600 font-bold'}>
                            {log.temperature}°C
                          </span>
                        </td>
                        <td className="p-2">
                          {log.is_acceptable ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Avvik
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">{log.measured_by_name}</td>
                        <td className="p-2 text-muted-foreground">
                          {log.corrective_action || log.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cleaning Logs - Actual Records */}
        {includeCleaningLogs && cleaningLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SprayCanIcon className="h-5 w-5" />
                Renholdslogg (siste 30 dager)
              </CardTitle>
              <CardDescription>Dokumenterte renholdsgjennomføringer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cleaningLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">
                          {format(new Date(log.completed_at || log.created_at), 'EEEE dd. MMMM yyyy', { locale: nb })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Utført av: {log.completed_by_name}
                        </p>
                      </div>
                      <Badge variant={log.status === 'completed' ? 'secondary' : 'default'}>
                        {log.status === 'completed' ? 'Fullført' : 'Pågår'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {log.cleaning_records?.map((record, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 text-sm p-2 rounded ${
                            record.completed ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted'
                          }`}
                        >
                          {record.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={!record.completed ? 'text-muted-foreground' : ''}>
                            {record.area}
                          </span>
                        </div>
                      ))}
                    </div>
                    {log.notes && (
                      <p className="mt-3 text-sm text-muted-foreground italic">
                        Notater: {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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