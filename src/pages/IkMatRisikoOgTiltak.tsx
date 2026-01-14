import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatRisk, IkMatActionItem, calculateRiskLevel } from "@/hooks/useIkMatContent";
import { useEmployees } from "@/hooks/useEmployees";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Save, Loader2, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { RiskListItem } from "@/components/ikmat/RiskListItem";
import { RiskDetailSheet } from "@/components/ikmat/RiskDetailSheet";
import { RiskSummaryCard } from "@/components/ikmat/RiskSummaryCard";

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

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading) {
      setRisks(content.risks || []);
      setActionPlan(content.actionPlan || []);
    }
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

  const handleAddAction = (riskId: string) => {
    const risk = risks.find(r => r.id === riskId);
    const newAction: IkMatActionItem = {
      id: `action-${Date.now()}`,
      riskId,
      action: risk ? `Tiltak for: ${risk.hazard}` : '',
      responsible: '',
      deadline: '',
      status: 'pending',
    };
    setActionPlan([...actionPlan, newAction]);
    setHasChanges(true);
  };

  const handleUpdateAction = (id: string, field: keyof IkMatActionItem, value: string) => {
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
      <div className="container max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Risikovurdering
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              HACCP-basert fareanalyse og kontrollpunkter
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
        {risks.length > 0 && <RiskSummaryCard risks={risks} />}

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
