import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { IkMatRisk, IkMatActionItem, getTrafficLight, getTrafficLightLabel, calculateRiskLevel } from "@/hooks/useIkMatContent";
import { ChevronDown, ChevronRight, Plus, Trash2, Calendar, ClipboardCheck, Shield, Target } from "lucide-react";

interface RiskDetailSheetProps {
  risk: IkMatRisk | null;
  actions: IkMatActionItem[];
  employees: Array<{ id: string; first_name?: string; last_name?: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRisk: (id: string, field: keyof IkMatRisk, value: any) => void;
  onDeleteRisk: (id: string) => void;
  onAddAction: (riskId: string) => void;
  onUpdateAction: (id: string, field: keyof IkMatActionItem, value: string) => void;
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
  const [actionsExpanded, setActionsExpanded] = useState(false);
  
  if (!risk) return null;
  
  const trafficLight = getTrafficLight(risk.riskLevel);
  const riskActions = actions.filter(a => a.riskId === risk.id);
  
  const getRiskLevelColor = () => {
    switch (trafficLight) {
      case 'green': return 'text-green-700 dark:text-green-400';
      case 'yellow': return 'text-yellow-700 dark:text-yellow-400';
      case 'red': return 'text-orange-700 dark:text-orange-400';
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : '';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold pr-8">
            {risk.hazard || 'Ikke navngitt risiko'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Section 1: Risk Analysis */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4" />
              Risikoanalyse
            </div>
            
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
                <Label className="text-sm">Sannsynlighet</Label>
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
                <Label className="text-sm">Konsekvens</Label>
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

            {/* Risk Level Display - clean, informative */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Risikonivå</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getRiskLevelColor()}`}>
                  {risk.riskLevel}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({getTrafficLightLabel(trafficLight)})
                </span>
              </div>
            </div>

            <div>
              <Label className="text-sm">Forebyggende tiltak</Label>
              <Textarea
                value={risk.measures}
                onChange={(e) => onUpdateRisk(risk.id, 'measures', e.target.value)}
                placeholder="Beskriv hvordan risikoen forebygges..."
                rows={2}
                className="mt-1.5 resize-none"
              />
            </div>
          </section>

          <Separator />

          {/* Section 2: HACCP / Control - Operational focus */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" />
              Kontroll & HACCP
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

            {risk.isHaccp && (
              <div className="p-3 border border-dashed rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground">
                  Som KKP må denne risikoen overvåkes etter HACCP-prinsippene.
                  Definer kritiske grenser og korrigerende tiltak i forebyggende tiltak-feltet ovenfor.
                </p>
              </div>
            )}
          </section>

          <Separator />

          {/* Section 3: Actions - Expandable, not dominant */}
          <Collapsible open={actionsExpanded} onOpenChange={setActionsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-2 text-left">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Tiltak
                  {riskActions.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {riskActions.length}
                    </Badge>
                  )}
                </div>
                {actionsExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {riskActions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Ingen tiltak opprettet for denne risikoen.
                </p>
              ) : (
                riskActions.map((action) => (
                  <div key={action.id} className="p-3 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        value={action.action}
                        onChange={(e) => onUpdateAction(action.id, 'action', e.target.value)}
                        placeholder="Beskriv tiltaket..."
                        className="text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => onDeleteAction(action.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={action.responsible}
                        onValueChange={(value) => onUpdateAction(action.id, 'responsible', value)}
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
                        onChange={(e) => onUpdateAction(action.id, 'deadline', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Select
                      value={action.status}
                      onValueChange={(value) => onUpdateAction(action.id, 'status', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onAddAction(risk.id)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Legg til tiltak
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Delete action */}
          <div className="pt-2">
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
