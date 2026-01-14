import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { IkMatRisk, IkMatActionItem, getTrafficLight, getTrafficLightLabel, calculateRiskLevel, getActionPlanStatus } from "@/hooks/useIkMatContent";
import { 
  ChevronDown, ChevronRight, Plus, Trash2, Calendar, ClipboardCheck, 
  Shield, Target, ArrowRight, CheckCircle2, AlertCircle, Lock
} from "lucide-react";

interface RiskDetailSheetProps {
  risk: IkMatRisk | null;
  actions: IkMatActionItem[];
  employees: Array<{ id: string; first_name?: string; last_name?: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRisk: (id: string, field: keyof IkMatRisk, value: any) => void;
  onDeleteRisk: (id: string) => void;
  onAddAction: (riskId: string, actionType: 'preventive' | 'corrective') => void;
  onUpdateAction: (id: string, field: keyof IkMatActionItem, value: any) => void;
  onDeleteAction: (id: string) => void;
}

const SCALE_OPTIONS = [
  { value: 1, label: '1 - Svært lav' },
  { value: 2, label: '2 - Lav' },
  { value: 3, label: '3 - Middels' },
  { value: 4, label: '4 - Høy' },
  { value: 5, label: '5 - Svært høy' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daglig' },
  { value: 'weekly', label: 'Ukentlig' },
  { value: 'monthly', label: 'Månedlig' },
  { value: 'quarterly', label: 'Kvartalsvis' },
  { value: 'biannually', label: 'Halvårlig' },
  { value: 'yearly', label: 'Årlig' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Ikke startet' },
  { value: 'in_progress', label: 'Pågår' },
  { value: 'completed', label: 'Fullført' },
];

export const RiskDetailSheet = ({
  risk,
  actions,
  employees,
  open,
  onOpenChange,
  onUpdateRisk,
  onDeleteRisk,
  onAddAction,
  onUpdateAction,
  onDeleteAction,
}: RiskDetailSheetProps) => {
  const [activeTab, setActiveTab] = useState("analysis");
  const [showResidualRisk, setShowResidualRisk] = useState(false);
  
  if (!risk) return null;
  
  const trafficLight = getTrafficLight(risk.riskLevel);
  const riskActions = actions.filter(a => a.riskId === risk.id);
  const preventiveActions = riskActions.filter(a => a.actionType === 'preventive');
  const correctiveActions = riskActions.filter(a => a.actionType === 'corrective');
  const actionStatus = getActionPlanStatus(actions, risk.id);
  const completedActions = riskActions.filter(a => a.status === 'completed').length;
  
  const residualTrafficLight = risk.residualRiskLevel 
    ? getTrafficLight(risk.residualRiskLevel) 
    : null;
  
  const canClose = actionStatus === 'completed' && 
    risk.residualRiskLevel !== undefined && 
    getTrafficLight(risk.residualRiskLevel) === 'green';
  
  const getRiskLevelColor = (light: 'green' | 'yellow' | 'red') => {
    switch (light) {
      case 'green': return 'text-green-700 dark:text-green-400';
      case 'yellow': return 'text-yellow-700 dark:text-yellow-400';
      case 'red': return 'text-orange-700 dark:text-orange-400';
    }
  };

  const handleCloseRisk = () => {
    onUpdateRisk(risk.id, 'status', 'closed');
    onUpdateRisk(risk.id, 'closedAt', new Date().toISOString());
  };

  const handleReopenRisk = () => {
    onUpdateRisk(risk.id, 'status', 'open');
    onUpdateRisk(risk.id, 'closedAt', undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            {risk.status === 'closed' && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Lukket
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg font-semibold pr-8">
            {risk.hazard || 'Ikke navngitt risiko'}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="text-xs">
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="haccp" className="text-xs" disabled={!risk.isHaccp}>
              <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
              HACCP
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Tiltak
              {riskActions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {riskActions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Risk Analysis */}
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div>
              <Label>Farekilde / Risiko</Label>
              <Input
                value={risk.hazard}
                onChange={(e) => onUpdateRisk(risk.id, 'hazard', e.target.value)}
                placeholder="Beskriv faren eller risikoen..."
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Sannsynlighet (S)</Label>
                <Select
                  value={String(risk.probability)}
                  onValueChange={(value) => onUpdateRisk(risk.id, 'probability', Number(value))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Konsekvens (K)</Label>
                <Select
                  value={String(risk.consequence)}
                  onValueChange={(value) => onUpdateRisk(risk.id, 'consequence', Number(value))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Risk Level Display */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Risikonivå (S×K)</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getRiskLevelColor(trafficLight)}`}>
                  {risk.probability}×{risk.consequence} = {risk.riskLevel}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    trafficLight === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    trafficLight === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}
                >
                  {getTrafficLightLabel(trafficLight)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Acceptance criteria */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <Label htmlFor={`acceptable-${risk.id}`} className="text-sm cursor-pointer">
                Er risikoen akseptabel?
              </Label>
              <Switch
                id={`acceptable-${risk.id}`}
                checked={risk.isAcceptable ?? (trafficLight === 'green')}
                onCheckedChange={(checked) => onUpdateRisk(risk.id, 'isAcceptable', checked)}
              />
            </div>

            <div>
              <Label className="text-sm">Begrunnelse / Vurdering</Label>
              <Textarea
                value={risk.justification || ''}
                onChange={(e) => onUpdateRisk(risk.id, 'justification', e.target.value)}
                placeholder="Begrunn risikovurderingen..."
                rows={2}
                className="mt-1.5 resize-none"
              />
            </div>

            <div>
              <Label className="text-sm">Forebyggende tiltak (rutiner)</Label>
              <Textarea
                value={risk.measures}
                onChange={(e) => onUpdateRisk(risk.id, 'measures', e.target.value)}
                placeholder="Beskriv hvordan risikoen forebygges i daglig drift..."
                rows={2}
                className="mt-1.5 resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <Label htmlFor={`haccp-${risk.id}`} className="text-sm cursor-pointer">
                Kritisk kontrollpunkt (KKP)
              </Label>
              <Switch
                id={`haccp-${risk.id}`}
                checked={risk.isHaccp}
                onCheckedChange={(checked) => onUpdateRisk(risk.id, 'isHaccp', checked)}
              />
            </div>
          </TabsContent>

          {/* Tab 2: HACCP / Control */}
          <TabsContent value="haccp" className="space-y-4 mt-4">
            {!risk.isHaccp ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">HACCP er ikke aktivert for denne risikoen.</p>
                <p className="text-xs mt-1">Aktiver KKP i Analyse-fanen for å definere kontrollrutiner.</p>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm">Kritisk grense</Label>
                  <Input
                    value={risk.criticalLimit || ''}
                    onChange={(e) => onUpdateRisk(risk.id, 'criticalLimit', e.target.value)}
                    placeholder="F.eks. ≤4°C for kjøleskap, ≥75°C for varmebehandling..."
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Verdien som ikke må overskrides for å sikre matsikkerhet
                  </p>
                </div>

                <div>
                  <Label className="text-sm">Kontrollmetode</Label>
                  <Input
                    value={risk.controlMethod || ''}
                    onChange={(e) => onUpdateRisk(risk.id, 'controlMethod', e.target.value)}
                    placeholder="F.eks. temperaturmåling med termometer..."
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Neste kontroll
                    </Label>
                    <Input
                      type="date"
                      value={risk.controlDate || ''}
                      onChange={(e) => onUpdateRisk(risk.id, 'controlDate', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Hyppighet</Label>
                    <Select
                      value={risk.frequency || ''}
                      onValueChange={(value) => onUpdateRisk(risk.id, 'frequency', value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Velg..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 border border-dashed rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    💡 Kontroller for denne KKP vil vises i Kontrollplan-oversikten, 
                    der du kan loggføre målinger og dokumentere avvik for Mattilsynet.
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 3: Action Plan */}
          <TabsContent value="actions" className="space-y-4 mt-4">
            {/* Action summary */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Status handlingsplan</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    actionStatus === 'none' ? '' :
                    actionStatus === 'completed' ? 'border-green-200 text-green-700' :
                    actionStatus === 'overdue' ? 'border-red-300 text-red-700' :
                    'border-blue-200 text-blue-700'
                  }`}
                >
                  {completedActions}/{riskActions.length} fullført
                </Badge>
              </div>
            </div>

            {/* Preventive actions (routines) */}
            <Collapsible defaultOpen={preventiveActions.length > 0}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-sm font-medium">Forebyggende tiltak (rutiner)</span>
                <Badge variant="secondary" className="text-xs">{preventiveActions.length}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {preventiveActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Ingen forebyggende tiltak definert.
                  </p>
                ) : (
                  preventiveActions.map((action) => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      employees={employees}
                      onUpdate={onUpdateAction}
                      onDelete={onDeleteAction}
                    />
                  ))
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onAddAction(risk.id, 'preventive')}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Legg til forebyggende tiltak
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Corrective actions */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-sm font-medium">Korrigerende tiltak (handlingsplan)</span>
                <Badge variant="secondary" className="text-xs">{correctiveActions.length}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {correctiveActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Ingen korrigerende tiltak i handlingsplanen.
                  </p>
                ) : (
                  correctiveActions.map((action) => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      employees={employees}
                      onUpdate={onUpdateAction}
                      onDelete={onDeleteAction}
                      showEffect
                    />
                  ))
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onAddAction(risk.id, 'corrective')}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Legg til korrigerende tiltak
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Residual risk assessment */}
            <Collapsible open={showResidualRisk} onOpenChange={setShowResidualRisk}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-sm font-medium">Rest-risiko (etter tiltak)</span>
                {showResidualRisk ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  Vurder risikoen på nytt etter at tiltak er iverksatt for å dokumentere effekt.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Ny sannsynlighet</Label>
                    <Select
                      value={String(risk.residualProbability || '')}
                      onValueChange={(value) => {
                        onUpdateRisk(risk.id, 'residualProbability', Number(value));
                        const newLevel = calculateRiskLevel(
                          Number(value), 
                          risk.residualConsequence || risk.consequence
                        );
                        onUpdateRisk(risk.id, 'residualRiskLevel', newLevel);
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Velg..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Ny konsekvens</Label>
                    <Select
                      value={String(risk.residualConsequence || '')}
                      onValueChange={(value) => {
                        onUpdateRisk(risk.id, 'residualConsequence', Number(value));
                        const newLevel = calculateRiskLevel(
                          risk.residualProbability || risk.probability,
                          Number(value)
                        );
                        onUpdateRisk(risk.id, 'residualRiskLevel', newLevel);
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Velg..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Before/After comparison */}
                {risk.residualRiskLevel && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Før tiltak</p>
                        <span className={`font-semibold ${getRiskLevelColor(trafficLight)}`}>
                          {risk.probability}×{risk.consequence} = {risk.riskLevel}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Etter tiltak</p>
                        <span className={`font-semibold ${getRiskLevelColor(residualTrafficLight!)}`}>
                          {risk.residualProbability}×{risk.residualConsequence} = {risk.residualRiskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Close/Reopen risk */}
            {risk.status === 'closed' ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleReopenRisk}
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Gjenåpne risiko
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                disabled={!canClose}
                onClick={handleCloseRisk}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Lukk risiko
              </Button>
            )}
            {!canClose && risk.status !== 'closed' && (
              <p className="text-xs text-center text-muted-foreground">
                Alle tiltak må være fullført og rest-risiko må være akseptabel for å lukke.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Delete action */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              onDeleteRisk(risk.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Slett risiko
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Action card component
interface ActionCardProps {
  action: IkMatActionItem;
  employees: Array<{ id: string; first_name?: string; last_name?: string }>;
  onUpdate: (id: string, field: keyof IkMatActionItem, value: any) => void;
  onDelete: (id: string) => void;
  showEffect?: boolean;
}

const ActionCard = ({ action, employees, onUpdate, onDelete, showEffect }: ActionCardProps) => {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = action.status !== 'completed' && action.deadline && action.deadline < today;

  return (
    <div className={`p-3 border rounded-lg space-y-3 ${isOverdue ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <Input
          value={action.action}
          onChange={(e) => onUpdate(action.id, 'action', e.target.value)}
          placeholder="Beskriv tiltaket..."
          className="text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => onDelete(action.id)}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={action.responsible}
          onValueChange={(value) => onUpdate(action.id, 'responsible', value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Ansvarlig" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={action.deadline}
          onChange={(e) => onUpdate(action.id, 'deadline', e.target.value)}
          className={`h-8 text-xs ${isOverdue ? 'border-red-300' : ''}`}
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={action.status}
          onValueChange={(value) => onUpdate(action.id, 'status', value)}
        >
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Ikke startet</SelectItem>
            <SelectItem value="in_progress">Pågår</SelectItem>
            <SelectItem value="completed">Fullført</SelectItem>
          </SelectContent>
        </Select>
        {isOverdue && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertCircle className="h-3 w-3" />
            Forfalt
          </Badge>
        )}
      </div>
      
      {showEffect && (
        <div className="flex items-center gap-4 pt-2 border-t">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={action.effectOnProbability || false}
              onChange={(e) => onUpdate(action.id, 'effectOnProbability', e.target.checked)}
              className="h-3 w-3"
            />
            Reduserer S
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={action.effectOnConsequence || false}
              onChange={(e) => onUpdate(action.id, 'effectOnConsequence', e.target.checked)}
              className="h-3 w-3"
            />
            Reduserer K
          </label>
        </div>
      )}
    </div>
  );
};
