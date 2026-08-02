import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatRisk, IkMatActionItem, calculateRiskLevel } from "@/hooks/useIkMatContent";
import { useEmployees } from "@/hooks/useEmployees";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Save, Loader2, ShieldCheck, Info, ClipboardList, Calendar } from "lucide-react";
import { toast } from "sonner";
import { RiskListItem } from "@/components/ikmat/RiskListItem";
import { RiskDetailSheet } from "@/components/ikmat/RiskDetailSheet";
import { RiskSummaryCard } from "@/components/ikmat/RiskSummaryCard";
import { ActionPlanOverview } from "@/components/ikmat/ActionPlanOverview";
import { ControlPlanOverview } from "@/components/ikmat/ControlPlanOverview";
import { getLocalDateString } from "@/lib/dateUtils";

const IkMatRisikoOgTiltak = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const { employees } = useEmployees();
  
  const [risks, setRisks] = useState<IkMatRisk[]>([]);
  const [actionPlan, setActionPlan] = useState<IkMatActionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<IkMatRisk | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("risks");

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  // Example risks for demonstration
  const exampleRisks: IkMatRisk[] = [
    {
      id: 'example-1',
      hazard: 'Kylling ikke gjennomstekt',
      consequence: 5,
      probability: 3,
      riskLevel: 15,
      measures: 'Bruk steketermometer, sjekk at kjernetemperatur er minst 75°C',
      isHaccp: true,
      frequency: 'daily',
      criticalLimit: '≥75°C kjernetemperatur',
      controlMethod: 'Steketermometer ved hver tilberedning',
      justification: 'Rå kylling kan inneholde Salmonella og Campylobacter som gir alvorlig matforgiftning',
      status: 'open',
    },
    {
      id: 'example-2',
      hazard: 'Kjøletemperatur over 4°C',
      consequence: 4,
      probability: 2,
      riskLevel: 8,
      measures: 'Daglig temperaturlogging, alarm ved avvik',
      isHaccp: true,
      frequency: 'daily',
      criticalLimit: '≤4°C',
      controlMethod: 'Temperaturlogg morgen og kveld',
      justification: 'For høy temperatur gir bakterievekst i lett bedervelige matvarer',
      status: 'open',
    },
    {
      id: 'example-3',
      hazard: 'Allergenkryssforurensning',
      consequence: 5,
      probability: 2,
      riskLevel: 10,
      measures: 'Separate redskaper, merking, opplæring av ansatte',
      isHaccp: false,
      justification: 'Allergisk reaksjon kan være livstruende for sensitive gjester',
      status: 'open',
    },
    {
      id: 'example-4',
      hazard: 'Varmholdt mat under 60°C',
      consequence: 4,
      probability: 3,
      riskLevel: 12,
      measures: 'Bruk av varmebad, temperaturkontroll hver time',
      isHaccp: true,
      frequency: 'daily',
      criticalLimit: '≥60°C varmholding',
      controlMethod: 'Temperaturmåling hver time under service',
      justification: 'Farlig temperaturområde 4-60°C tillater rask bakterievekst',
      status: 'open',
    },
  ];

  const exampleActions: IkMatActionItem[] = [
    {
      id: 'example-action-1',
      riskId: 'example-1',
      action: 'Innkjøp av digitale steketermometre til alle arbeidsstasjoner',
      responsible: '',
      deadline: getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      status: 'pending',
      actionType: 'preventive',
    },
    {
      id: 'example-action-2',
      riskId: 'example-2',
      action: 'Installere temperaturalarm med varsling til mobil',
      responsible: '',
      deadline: getLocalDateString(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: 'in_progress',
      actionType: 'preventive',
    },
    {
      id: 'example-action-3',
      riskId: 'example-3',
      action: 'Gjennomføre allergenopplæring for alle kjøkkenansatte',
      responsible: '',
      deadline: getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      status: 'pending',
      actionType: 'preventive',
    },
  ];

  useEffect(() => {
    if (isLoading) return;
    if ((content.risks || []).length > 0) {
      setRisks(content.risks);
      setActionPlan(content.actionPlan || []);
      return;
    }
    // Forhåndsutfyll eksempler kun én gang per økt – aldri på nytt etter at
    // brukeren selv har slettet alle risikoer.
    if (examplesSeededRef.current) return;
    examplesSeededRef.current = true;
    setRisks(exampleRisks);
    setActionPlan(exampleActions);
    void saveContent('risks', exampleRisks)
      .then(() => saveContent('actionPlan', exampleActions))
      .catch((err) => console.error('Kunne ikke lagre eksempeldata for risiko:', err));
  }, [isLoading, content.risks, content.actionPlan]);

  const handleAddRisk = () => {
    const newRisk: IkMatRisk = {
      id: `risk-${Date.now()}`,
      hazard: '',
      consequence: 3,
      probability: 3,
      riskLevel: 9,
      measures: '',
      isHaccp: false,
      status: 'open',
    };
    setRisks([...risks, newRisk]);
    setSelectedRisk(newRisk);
    setSheetOpen(true);
    setHasChanges(true);
  };

  const handleUpdateRisk = (id: string, field: keyof IkMatRisk, value: any) => {
    setRisks(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'probability' || field === 'consequence') {
        updated.riskLevel = calculateRiskLevel(
          field === 'probability' ? value : r.probability,
          field === 'consequence' ? value : r.consequence
        );
      }
      // Also update selectedRisk if it's the same
      if (selectedRisk?.id === id) {
        setSelectedRisk(updated);
      }
      return updated;
    }));
    setHasChanges(true);
  };

  const handleDeleteRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
    // Also remove any actions linked to this risk
    setActionPlan(prev => prev.filter(a => a.riskId !== id));
    setHasChanges(true);
  };

  const handleAddAction = (riskId: string, actionType: 'preventive' | 'corrective' = 'corrective') => {
    const risk = risks.find(r => r.id === riskId);
    const newAction: IkMatActionItem = {
      id: `action-${Date.now()}`,
      riskId,
      action: '',
      responsible: '',
      deadline: '',
      status: 'pending',
      actionType,
    };
    setActionPlan([...actionPlan, newAction]);
    setHasChanges(true);
  };

  const handleUpdateAction = (id: string, field: keyof IkMatActionItem, value: any) => {
    setActionPlan(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
    setHasChanges(true);
  };

  const handleDeleteAction = (id: string) => {
    setActionPlan(prev => prev.filter(a => a.id !== id));
    setHasChanges(true);
  };

  const handleOpenRisk = (risk: IkMatRisk) => {
    setSelectedRisk(risk);
    setSheetOpen(true);
  };

  const handleOpenRiskById = (riskId: string) => {
    const risk = risks.find(r => r.id === riskId);
    if (risk) {
      setSelectedRisk(risk);
      setSheetOpen(true);
    }
  };

  const handleSave = async () => {
    await saveContent('risks', risks);
    await saveContent('actionPlan', actionPlan);
    setHasChanges(false);
  };

  if (modulesLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Risikovurdering & Tiltak
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              HACCP-basert fareanalyse med handlingsplan
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lagre
          </Button>
        </div>

        {/* Summary */}
        {risks.length > 0 && <RiskSummaryCard risks={risks} actions={actionPlan} />}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="risks" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Risikoer
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Handlingsplan
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2">
              <Calendar className="h-4 w-4" />
              Kontrollplan
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Risks */}
          <TabsContent value="risks" className="space-y-4 mt-4">
            {/* Add button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleAddRisk}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til risiko
              </Button>
            </div>

            {/* Risk list */}
            {risks.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  Ingen risikoer definert
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start med å identifisere farer i din matproduksjon
                </p>
                <Button onClick={handleAddRisk}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til første risiko
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {risks.map((risk) => (
                  <RiskListItem
                    key={risk.id}
                    risk={risk}
                    actions={actionPlan}
                    onClick={() => handleOpenRisk(risk)}
                  />
                ))}
              </div>
            )}

            {/* Info footer */}
            {risks.length > 0 && (
              <Alert className="bg-muted/50 border-muted">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs text-muted-foreground">
                  Klikk på en risiko for å se detaljer, redigere og legge til tiltak. 
                  Risikoer merket som KKP krever systematisk overvåking etter HACCP-prinsippene.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab 2: Action Plan */}
          <TabsContent value="actions" className="mt-4">
            <ActionPlanOverview
              actions={actionPlan}
              risks={risks}
              employees={employees || []}
              onUpdateAction={handleUpdateAction}
              onOpenRisk={handleOpenRiskById}
            />
          </TabsContent>

          {/* Tab 3: Control Plan */}
          <TabsContent value="controls" className="mt-4">
            <ControlPlanOverview
              risks={risks.filter(r => r.isHaccp)}
              onOpenRisk={handleOpenRiskById}
            />
          </TabsContent>
        </Tabs>

        {/* Detail sheet */}
        <RiskDetailSheet
          risk={selectedRisk}
          actions={actionPlan}
          employees={employees || []}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onUpdateRisk={handleUpdateRisk}
          onDeleteRisk={handleDeleteRisk}
          onAddAction={handleAddAction}
          onUpdateAction={handleUpdateAction}
          onDeleteAction={handleDeleteAction}
        />
      </div>
    </AppLayout>
  );
};

export default IkMatRisikoOgTiltak;
