import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  Save, 
  ClipboardList, 
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Circle,
  Link2,
  Filter,
  ArrowUpDown,
  X
} from "lucide-react";
import { toast } from "sonner";

export interface ActionPlanStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

export interface ActionItem {
  id: string;
  risk_id: string | null;
  risk_description: string;
  action_description: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
  priority: "lav" | "medium" | "høy" | "kritisk";
  comments: string;
}

export interface ActionPlanData {
  actions: ActionItem[];
}

interface RiskItem {
  id: string;
  category: string;
  description: string;
  probability: number;
  consequence: number;
  risk_value: number;
  measures: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
}

interface ActionPlanStepProps {
  existingData: ActionPlanData | null;
  risks: RiskItem[];
  onSave: (data: ActionPlanData) => Promise<void>;
  isSaving: boolean;
}

type StatusFilter = "alle" | "ikke_startet" | "pågår" | "fullført";
type PriorityFilter = "alle" | "lav" | "medium" | "høy" | "kritisk";
type SortOption = "none" | "deadline_asc" | "deadline_desc" | "priority_asc" | "priority_desc" | "status";

const statusConfig = {
  ikke_startet: { label: "Ikke startet", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
  pågår: { label: "Pågår", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  fullført: { label: "Fullført", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
};

const priorityConfig = {
  lav: { label: "Lav", color: "bg-green-500/10 text-green-700 border-green-200" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  høy: { label: "Høy", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  kritisk: { label: "Kritisk", color: "bg-red-500/10 text-red-700 border-red-200" },
};

const priorityOrder = { kritisk: 4, høy: 3, medium: 2, lav: 1 };
const statusOrder = { ikke_startet: 1, pågår: 2, fullført: 3 };

export const ActionPlanStep = forwardRef<ActionPlanStepRef, ActionPlanStepProps>(
  function ActionPlanStep({ existingData, risks, onSave, isSaving }, ref) {
    const [actions, setActions] = useState<ActionItem[]>(existingData?.actions || []);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("alle");
    const [sortOption, setSortOption] = useState<SortOption>("none");

    useEffect(() => {
      if (existingData?.actions) {
        // Transform AI-generated actions to manual format if needed
        const transformedActions = existingData.actions.map((action: any) => {
          // Check if this is an AI-generated action (has 'description' instead of 'action_description')
          if ('description' in action && !('action_description' in action)) {
            return {
              id: action.id || crypto.randomUUID(),
              risk_id: action.linked_risk_ids?.[0] || null,
              risk_description: action.linked_risk_ids?.length ? `Koblet til risiko: ${action.linked_risk_ids.join(', ')}` : '',
              action_description: action.description || '',
              responsible: action.responsible || '',
              deadline: action.deadline || '',
              status: action.status === 'pending' ? 'ikke_startet' : 
                      action.status === 'in_progress' ? 'pågår' : 
                      action.status === 'completed' ? 'fullført' : 'ikke_startet',
              priority: action.priority === 'high' ? 'høy' : 
                        action.priority === 'low' ? 'lav' : 
                        action.priority === 'critical' ? 'kritisk' : 'medium',
              comments: '',
            } as ActionItem;
          }
          return action as ActionItem;
        });
        setActions(transformedActions);
      }
    }, [existingData]);

  const filteredAndSortedActions = useMemo(() => {
    let result = [...actions];

    // Apply status filter
    if (statusFilter !== "alle") {
      result = result.filter(a => a.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "alle") {
      result = result.filter(a => a.priority === priorityFilter);
    }

    // Apply sorting
    switch (sortOption) {
      case "deadline_asc":
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
      case "deadline_desc":
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        });
        break;
      case "priority_asc":
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case "priority_desc":
        result.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case "status":
        result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
    }

    return result;
  }, [actions, statusFilter, priorityFilter, sortOption]);

  const hasActiveFilters = statusFilter !== "alle" || priorityFilter !== "alle" || sortOption !== "none";

  const clearFilters = () => {
    setStatusFilter("alle");
    setPriorityFilter("alle");
    setSortOption("none");
  };

  const createEmptyAction = (): ActionItem => ({
    id: crypto.randomUUID(),
    risk_id: null,
    risk_description: "",
    action_description: "",
    responsible: "",
    deadline: "",
    status: "ikke_startet",
    priority: "medium",
    comments: "",
  });

  const addAction = () => {
    const newAction = createEmptyAction();
    setActions([...actions, newAction]);
    setEditingId(newAction.id);
  };

  const addActionFromRisk = (risk: RiskItem) => {
    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      risk_id: risk.id,
      risk_description: `${risk.category}: ${risk.description}`,
      action_description: risk.measures || "",
      responsible: risk.responsible || "",
      deadline: risk.deadline || "",
      status: risk.status || "ikke_startet",
      priority: risk.risk_value >= 16 ? "kritisk" : risk.risk_value >= 10 ? "høy" : risk.risk_value >= 5 ? "medium" : "lav",
      comments: "",
    };
    setActions([...actions, newAction]);
    setEditingId(newAction.id);
    toast.success("Tiltak opprettet fra risiko");
  };

  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    ));
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
    if (editingId === id) setEditingId(null);
    toast.success("Tiltak fjernet");
  };

  const handleSave = async () => {
    try {
      await onSave({ actions });
      toast.success("Handlingsplan lagret!");
    } catch (error) {
      toast.error("Kunne ikke lagre handlingsplan");
    }
  };

  // Expose save method to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    hasData: () => true, // Action plan can be empty
  }));

  const getUnlinkedRisks = () => {
    const linkedRiskIds = actions.map(a => a.risk_id).filter(Boolean);
    return risks.filter(r => !linkedRiskIds.includes(r.id));
  };

  const unlinkedRisks = getUnlinkedRisks();
  const highRisks = unlinkedRisks.filter(r => r.risk_value >= 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Handlingsplan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Definer konkrete tiltak med ansvarlige og frister basert på risikovurderingen
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Lagrer..." : "Lagre"}
        </Button>
      </div>

      {/* High Risk Warning */}
      {highRisks.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              Høyrisiko uten tiltak ({highRisks.length})
            </CardTitle>
            <CardDescription>
              Følgende risikoer har høy eller kritisk risikoverdi og mangler tiltak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highRisks.slice(0, 5).map(risk => (
                <div 
                  key={risk.id} 
                  className="flex items-center justify-between p-2 rounded-md bg-background border"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{risk.category}</span>
                    <p className="text-xs text-muted-foreground truncate">{risk.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      risk.risk_value >= 16 ? "bg-red-500/10 text-red-700" : "bg-orange-500/10 text-orange-700"
                    }>
                      R: {risk.risk_value}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => addActionFromRisk(risk)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Opprett tiltak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link from Risk Section */}
      {unlinkedRisks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Koble tiltak til risikoer
            </CardTitle>
            <CardDescription>
              Velg en risiko for å opprette et tiltak knyttet til den
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(riskId) => {
              const risk = risks.find(r => r.id === riskId);
              if (risk) addActionFromRisk(risk);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Velg risiko å koble tiltak til..." />
              </SelectTrigger>
              <SelectContent>
                {unlinkedRisks.map(risk => (
                  <SelectItem key={risk.id} value={risk.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">R: {risk.risk_value}</Badge>
                      {risk.category}: {risk.description ? risk.description.substring(0, 40) : "Ingen beskrivelse"}...
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Actions List */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Tiltak ({actions.length})</h3>
            <Button variant="outline" onClick={addAction}>
              <Plus className="w-4 h-4 mr-2" />
              Legg til tiltak
            </Button>
          </div>

          {/* Filter and Sort Controls */}
          {actions.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle statuser</SelectItem>
                        <SelectItem value="ikke_startet">Ikke startet</SelectItem>
                        <SelectItem value="pågår">Pågår</SelectItem>
                        <SelectItem value="fullført">Fullført</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={(v: PriorityFilter) => setPriorityFilter(v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Prioritet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle prioriteter</SelectItem>
                        <SelectItem value="kritisk">Kritisk</SelectItem>
                        <SelectItem value="høy">Høy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="lav">Lav</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <Select value={sortOption} onValueChange={(v: SortOption) => setSortOption(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sortering" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ingen sortering</SelectItem>
                        <SelectItem value="deadline_asc">Frist (tidligst først)</SelectItem>
                        <SelectItem value="deadline_desc">Frist (senest først)</SelectItem>
                        <SelectItem value="priority_desc">Prioritet (høyest først)</SelectItem>
                        <SelectItem value="priority_asc">Prioritet (lavest først)</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1" />
                        Nullstill
                      </Button>
                    )}
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Viser {filteredAndSortedActions.length} av {actions.length} tiltak
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {actions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Ingen tiltak registrert ennå</p>
              <p className="text-sm text-muted-foreground mt-1">
                Legg til tiltak manuelt eller koble dem til risikoer fra vurderingen
              </p>
            </CardContent>
          </Card>
        ) : filteredAndSortedActions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Filter className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Ingen tiltak matcher filtrene</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Nullstill filtre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedActions.map((action) => {
              const originalIndex = actions.findIndex(a => a.id === action.id);
              return (
              <Card key={action.id} className={editingId === action.id ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Tiltak #{originalIndex + 1}
                      </span>
                      {action.risk_id && (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="w-3 h-3 mr-1" />
                          Koblet til risiko
                        </Badge>
                      )}
                      <Badge variant="outline" className={priorityConfig[action.priority].color}>
                        {priorityConfig[action.priority].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === action.id ? null : action.id)}
                      >
                        {editingId === action.id ? "Lukk" : "Rediger"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(action.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === action.id ? (
                    <div className="space-y-4">
                      {action.risk_description && (
                        <div className="p-3 rounded-md bg-muted/50 text-sm">
                          <span className="font-medium">Koblet risiko:</span> {action.risk_description}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Beskrivelse av tiltak *</Label>
                        <Textarea
                          value={action.action_description}
                          onChange={(e) => updateAction(action.id, { action_description: e.target.value })}
                          placeholder="Beskriv tiltaket som skal gjennomføres..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Ansvarlig
                          </Label>
                          <Input
                            value={action.responsible}
                            onChange={(e) => updateAction(action.id, { responsible: e.target.value })}
                            placeholder="Navn på ansvarlig person"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Frist
                          </Label>
                          <Input
                            type="date"
                            value={action.deadline}
                            onChange={(e) => updateAction(action.id, { deadline: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={action.status}
                            onValueChange={(value: ActionItem["status"]) => 
                              updateAction(action.id, { status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ikke_startet">Ikke startet</SelectItem>
                              <SelectItem value="pågår">Pågår</SelectItem>
                              <SelectItem value="fullført">Fullført</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Prioritet</Label>
                          <Select
                            value={action.priority}
                            onValueChange={(value: ActionItem["priority"]) => 
                              updateAction(action.id, { priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lav">Lav</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="høy">Høy</SelectItem>
                              <SelectItem value="kritisk">Kritisk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Kommentarer</Label>
                        <Textarea
                          value={action.comments}
                          onChange={(e) => updateAction(action.id, { comments: e.target.value })}
                          placeholder="Eventuelle kommentarer eller notater..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {action.risk_description && (
                        <p className="text-xs text-muted-foreground">
                          Risiko: {action.risk_description}
                        </p>
                      )}
                      <p className="text-sm">
                        {action.action_description || <span className="text-muted-foreground italic">Ingen beskrivelse</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {action.responsible && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3 h-3" />
                            {action.responsible}
                          </span>
                        )}
                        {action.deadline && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(action.deadline).toLocaleDateString("nb-NO")}
                          </span>
                        )}
                        <Badge variant="outline" className={statusConfig[action.status].bg}>
                          {(() => {
                            const StatusIcon = statusConfig[action.status].icon;
                            return <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig[action.status].color}`} />;
                          })()}
                          {statusConfig[action.status].label}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {actions.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{actions.length}</div>
                <div className="text-xs text-muted-foreground">Totalt tiltak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {actions.filter(a => a.status === "ikke_startet").length}
                </div>
                <div className="text-xs text-muted-foreground">Ikke startet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {actions.filter(a => a.status === "pågår").length}
                </div>
                <div className="text-xs text-muted-foreground">Pågår</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {actions.filter(a => a.status === "fullført").length}
                </div>
                <div className="text-xs text-muted-foreground">Fullført</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
