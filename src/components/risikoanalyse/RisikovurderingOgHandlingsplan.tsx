import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Circle,
  Filter,
  Link2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Risk categories
const RISK_CATEGORIES = [
  { value: "fysisk", label: "Fysisk arbeidsmiljø", color: "bg-blue-500" },
  { value: "psykososialt", label: "Psykososialt arbeidsmiljø", color: "bg-purple-500" },
  { value: "ergonomisk", label: "Ergonomisk", color: "bg-green-500" },
  { value: "kjemisk", label: "Kjemisk/biologisk", color: "bg-orange-500" },
  { value: "organisatorisk", label: "Organisatorisk", color: "bg-cyan-500" },
  { value: "brann", label: "Brann og sikkerhet", color: "bg-red-500" },
  { value: "annet", label: "Annet", color: "bg-gray-500" },
];

// Consequence and probability scales
const CONSEQUENCE_LEVELS = [
  { value: 1, label: "1 - Ufarlig", description: "Ubetydelige skader" },
  { value: 2, label: "2 - Farlig", description: "Mindre skader, kort fravær" },
  { value: 3, label: "3 - Kritisk", description: "Betydelige skader, lengre fravær" },
  { value: 4, label: "4 - Meget kritisk", description: "Alvorlige skader, kan være varig" },
  { value: 5, label: "5 - Katastrofalt", description: "Død eller varige mén" },
];

const PROBABILITY_LEVELS = [
  { value: 1, label: "1 - Lite sannsynlig", description: "Sjeldnere enn hvert 10. år" },
  { value: 2, label: "2 - Mindre sannsynlig", description: "Hvert 5-10 år" },
  { value: 3, label: "3 - Sannsynlig", description: "Hvert 1-5 år" },
  { value: 4, label: "4 - Meget sannsynlig", description: "1-10 ganger årlig" },
  { value: 5, label: "5 - Svært sannsynlig", description: "Mer enn 10 ganger årlig" },
];

interface RiskItem {
  id: string;
  category: string;
  description: string;
  consequence: number;
  probability: number;
  existing_measures: string;
  planned_measures: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
}

interface ActionItem {
  id: string;
  risk_id: string | null;
  risk_description: string;
  action_description: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
  priority: "lav" | "medium" | "høy" | "kritisk";
}

const getRiskLevel = (consequence: number, probability: number) => {
  const score = consequence * probability;
  if (score <= 4) return { level: "Lav", color: "text-green-600", bg: "bg-green-100", border: "border-green-300" };
  if (score <= 9) return { level: "Moderat", color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-300" };
  if (score <= 15) return { level: "Høy", color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-300" };
  return { level: "Svært høy", color: "text-red-600", bg: "bg-red-100", border: "border-red-300" };
};

const statusConfig = {
  ikke_startet: { label: "Ikke startet", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
  pågår: { label: "Pågår", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  fullført: { label: "Fullført", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
};

const priorityConfig = {
  lav: { label: "Lav", color: "bg-green-100 text-green-700 border-green-200" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  høy: { label: "Høy", color: "bg-orange-100 text-orange-700 border-orange-200" },
  kritisk: { label: "Kritisk", color: "bg-red-100 text-red-700 border-red-200" },
};

export function RisikovurderingOgHandlingsplan() {
  const { company, profile } = useAuth();
  const { employees } = useEmployees();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("alle");

  // Current user name for default responsible
  const currentUserName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  // New risk form state - default responsible to current user
  const [newRisk, setNewRisk] = useState<Partial<RiskItem>>({
    category: "",
    description: "",
    consequence: 3,
    probability: 3,
    existing_measures: "",
    planned_measures: "",
    responsible: currentUserName,
    deadline: "",
    status: "ikke_startet",
  });

  // Update responsible when profile loads
  useEffect(() => {
    if (currentUserName && !newRisk.responsible) {
      setNewRisk(p => ({ ...p, responsible: currentUserName }));
    }
  }, [currentUserName]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!company?.id) return;
      
      try {
        // Load risk assessments
        const { data: riskData } = await supabase
          .from("company_risk_assessments")
          .select("*")
          .eq("company_id", company.id)
          .single();
        
        if (riskData?.risks) {
          const loadedRisks = (riskData.risks as unknown as any[]).map(r => ({
            ...r,
            category: r.category || "annet",
            status: r.status || "ikke_startet",
          }));
          setRisks(loadedRisks);
        }

        // Load action plans
        const { data: actionData } = await supabase
          .from("company_action_plans")
          .select("*")
          .eq("company_id", company.id)
          .single();
        
        if (actionData?.actions) {
          setActions(actionData.actions as unknown as ActionItem[]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [company?.id]);

  // Save all data
  const handleSave = async () => {
    if (!company?.id) return;
    setIsSaving(true);

    try {
      // Save risks
      const { error: riskError } = await supabase
        .from("company_risk_assessments")
        .upsert([{
          company_id: company.id,
          risks: risks as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id" });

      if (riskError) throw riskError;

      // Save actions
      const { error: actionError } = await supabase
        .from("company_action_plans")
        .upsert([{
          company_id: company.id,
          actions: actions as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id" });

      if (actionError) throw actionError;

      toast.success("Risikovurdering og handlingsplan lagret");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new risk
  const addRisk = () => {
    if (!newRisk.description || !newRisk.consequence || !newRisk.probability || !newRisk.category) {
      toast.error("Fyll ut alle påkrevde felt");
      return;
    }

    const risk: RiskItem = {
      id: crypto.randomUUID(),
      category: newRisk.category,
      description: newRisk.description,
      consequence: newRisk.consequence,
      probability: newRisk.probability,
      existing_measures: newRisk.existing_measures || "",
      planned_measures: newRisk.planned_measures || "",
      responsible: newRisk.responsible || "",
      deadline: newRisk.deadline || "",
      status: "ikke_startet",
    };

    setRisks([...risks, risk]);
    setNewRisk({
      category: "",
      description: "",
      consequence: 3,
      probability: 3,
      existing_measures: "",
      planned_measures: "",
      responsible: currentUserName,
      deadline: "",
      status: "ikke_startet",
    });

    // Auto-create action for all risks
    const riskLevel = getRiskLevel(risk.consequence, risk.probability);
    const getPriorityFromRiskLevel = (level: string): ActionItem["priority"] => {
      switch (level) {
        case "Svært høy": return "kritisk";
        case "Høy": return "høy";
        case "Moderat": return "medium";
        default: return "lav";
      }
    };

    const action: ActionItem = {
      id: crypto.randomUUID(),
      risk_id: risk.id,
      risk_description: `${RISK_CATEGORIES.find(c => c.value === risk.category)?.label}: ${risk.description}`,
      action_description: risk.planned_measures || "Definer tiltak",
      responsible: risk.responsible || "",
      deadline: risk.deadline || "",
      status: "ikke_startet",
      priority: getPriorityFromRiskLevel(riskLevel.level),
    };
    setActions(prev => [...prev, action]);

    toast.success("Risiko og tiltak lagt til");
  };

  // Delete risk
  const deleteRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id));
    // Also remove linked actions
    setActions(actions.filter(a => a.risk_id !== id));
    toast.success("Risiko slettet");
  };

  // Add action manually
  const addAction = () => {
    const action: ActionItem = {
      id: crypto.randomUUID(),
      risk_id: null,
      risk_description: "",
      action_description: "",
      responsible: "",
      deadline: "",
      status: "ikke_startet",
      priority: "medium",
    };
    setActions([...actions, action]);
    setExpandedActions(prev => new Set([...prev, action.id]));
  };

  // Update action
  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Delete action
  const deleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
    toast.success("Tiltak slettet");
  };

  // Filter risks by category
  const filteredRisks = categoryFilter === "alle" 
    ? risks 
    : risks.filter(r => r.category === categoryFilter);

  // Sort risks by risk level (highest first)
  const sortedRisks = [...filteredRisks].sort((a, b) => {
    const scoreA = a.consequence * a.probability;
    const scoreB = b.consequence * b.probability;
    return scoreB - scoreA;
  });

  // Get statistics
  const stats = {
    total: risks.length,
    high: risks.filter(r => r.consequence * r.probability >= 10).length,
    medium: risks.filter(r => {
      const score = r.consequence * r.probability;
      return score >= 5 && score < 10;
    }).length,
    low: risks.filter(r => r.consequence * r.probability < 5).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totalt risikoer</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
            <div className="text-sm text-muted-foreground">Høy/Svært høy</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-sm text-muted-foreground">Moderat</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
            <div className="text-sm text-muted-foreground">Lav</div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Lagrer..." : "Lagre alt"}
        </Button>
      </div>

      {/* Help section */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Veiledning for risikovurdering
            </span>
            {showHelp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Risikomatrise (Risiko = Konsekvens × Sannsynlighet)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-muted/50">S ↓ / K →</th>
                        {[1,2,3,4,5].map(c => (
                          <th key={c} className="border p-2 bg-muted/50 w-12">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[5,4,3,2,1].map(p => (
                        <tr key={p}>
                          <td className="border p-2 bg-muted/50 font-medium">{p}</td>
                          {[1,2,3,4,5].map(c => {
                            const { bg } = getRiskLevel(c, p);
                            return (
                              <td key={c} className={cn("border p-2 text-center font-medium", bg)}>
                                {c * p}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100" /> 1-4: Lav</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100" /> 5-9: Moderat</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100" /> 10-15: Høy</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> 16-25: Svært høy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Two-column layout for risks and actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risks column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Risikovurdering
                  </CardTitle>
                  <CardDescription>Identifiser og vurder risikoer etter kategori</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrer etter kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle kategorier</SelectItem>
                    {RISK_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", cat.color)} />
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Simplified Add new risk form */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Legg til ny risiko
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Row 1: Category and Description */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={newRisk.category} onValueChange={(v) => setNewRisk(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Beskriv risikoen..." 
                      value={newRisk.description || ""}
                      onChange={(e) => setNewRisk(p => ({ ...p, description: e.target.value }))}
                      className="flex-1"
                    />
                  </div>

                  {/* Row 2: Consequence and Probability with simple 1-5 buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Konsekvens (1-5)</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <Button 
                            key={n} 
                            type="button"
                            variant={newRisk.consequence === n ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => setNewRisk(p => ({ ...p, consequence: n }))}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Sannsynlighet (1-5)</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <Button 
                            key={n} 
                            type="button"
                            variant={newRisk.probability === n ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => setNewRisk(p => ({ ...p, probability: n }))}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Tiltak (combined) */}
                  <Input 
                    placeholder="Tiltak (planlagte/eksisterende)" 
                    value={newRisk.planned_measures || ""}
                    onChange={(e) => setNewRisk(p => ({ ...p, planned_measures: e.target.value }))}
                  />

                  {/* Row 4: Responsible, Deadline, Add button */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={newRisk.responsible || ""} onValueChange={(v) => setNewRisk(p => ({ ...p, responsible: v }))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Ansvarlig">
                          {newRisk.responsible || "Velg ansvarlig"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {currentUserName && (
                          <SelectItem value={currentUserName}>
                            {currentUserName} (meg)
                          </SelectItem>
                        )}
                        {employees.filter(emp => `${emp.first_name} ${emp.last_name}`.trim() !== currentUserName).map(emp => (
                          <SelectItem key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                            {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      type="date" 
                      value={newRisk.deadline || ""}
                      onChange={(e) => setNewRisk(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full sm:w-[140px]"
                    />
                    <Button onClick={addRisk} className="flex-shrink-0">
                      <Plus className="h-4 w-4 mr-1" />
                      Legg til
                    </Button>
                  </div>

                  {/* Risk level preview */}
                  {newRisk.consequence && newRisk.probability && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Risikonivå:</span>
                      {(() => {
                        const level = getRiskLevel(newRisk.consequence, newRisk.probability);
                        return (
                          <Badge className={cn(level.bg, level.color)}>
                            {newRisk.consequence * newRisk.probability} - {level.level}
                          </Badge>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk list */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {sortedRisks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Ingen risikoer registrert ennå</p>
                  </div>
                ) : (
                  sortedRisks.map(risk => {
                    const riskLevel = getRiskLevel(risk.consequence, risk.probability);
                    const category = RISK_CATEGORIES.find(c => c.value === risk.category);
                    const isExpanded = expandedRisks.has(risk.id);

                    return (
                      <Collapsible
                        key={risk.id}
                        open={isExpanded}
                        onOpenChange={() => {
                          setExpandedRisks(prev => {
                            const next = new Set(prev);
                            if (next.has(risk.id)) next.delete(risk.id);
                            else next.add(risk.id);
                            return next;
                          });
                        }}
                      >
                        <div className={cn("border rounded-lg overflow-hidden", riskLevel.border)}>
                          <CollapsibleTrigger className="w-full">
                            <div className={cn("p-3 flex items-center gap-3", riskLevel.bg)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", category?.color)} />
                              <span className="flex-1 text-left text-sm font-medium truncate">{risk.description}</span>
                              <Badge className={cn("text-xs", riskLevel.bg, riskLevel.color)}>
                                {risk.consequence * risk.probability} - {riskLevel.level}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 space-y-2 text-sm border-t bg-background">
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-muted-foreground">Kategori:</span> {category?.label}</div>
                                <div><span className="text-muted-foreground">K×S:</span> {risk.consequence}×{risk.probability}</div>
                              </div>
                              {risk.existing_measures && (
                                <div><span className="text-muted-foreground">Eksisterende tiltak:</span> {risk.existing_measures}</div>
                              )}
                              {risk.planned_measures && (
                                <div><span className="text-muted-foreground">Planlagte tiltak:</span> {risk.planned_measures}</div>
                              )}
                              {risk.responsible && (
                                <div><span className="text-muted-foreground">Ansvarlig:</span> {risk.responsible}</div>
                              )}
                              {risk.deadline && (
                                <div><span className="text-muted-foreground">Frist:</span> {new Date(risk.deadline).toLocaleDateString("nb-NO")}</div>
                              )}
                              <div className="flex justify-end pt-2">
                                <Button variant="destructive" size="sm" onClick={() => deleteRisk(risk.id)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Slett
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Handlingsplan
                  </CardTitle>
                  <CardDescription>Tiltak og oppfølging av risikoer</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt tiltak
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[700px] overflow-y-auto">
                {actions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Ingen tiltak registrert</p>
                    <p className="text-xs mt-1">Tiltak opprettes automatisk for høyrisikoer</p>
                  </div>
                ) : (
                  actions.map(action => {
                    const isExpanded = expandedActions.has(action.id);
                    const StatusIcon = statusConfig[action.status].icon;

                    return (
                      <Collapsible
                        key={action.id}
                        open={isExpanded}
                        onOpenChange={() => {
                          setExpandedActions(prev => {
                            const next = new Set(prev);
                            if (next.has(action.id)) next.delete(action.id);
                            else next.add(action.id);
                            return next;
                          });
                        }}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger className="w-full">
                            <div className="p-3 flex items-center gap-3 hover:bg-muted/50">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <StatusIcon className={cn("h-4 w-4", statusConfig[action.status].color)} />
                              <span className="flex-1 text-left text-sm truncate">
                                {action.action_description || "Nytt tiltak"}
                              </span>
                              <Badge variant="outline" className={priorityConfig[action.priority].color}>
                                {priorityConfig[action.priority].label}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 space-y-3 border-t bg-muted/20">
                              {action.risk_id && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Link2 className="h-3 w-3" />
                                  Koblet til: {action.risk_description}
                                </div>
                              )}
                              <Textarea 
                                placeholder="Beskriv tiltaket"
                                value={action.action_description}
                                onChange={(e) => updateAction(action.id, { action_description: e.target.value })}
                                className="min-h-[60px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Select 
                                  value={action.responsible || ""} 
                                  onValueChange={(v) => updateAction(action.id, { responsible: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Ansvarlig" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employees.map(emp => (
                                      <SelectItem key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                                        {emp.first_name} {emp.last_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input 
                                  type="date"
                                  value={action.deadline || ""}
                                  onChange={(e) => updateAction(action.id, { deadline: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select 
                                  value={action.status} 
                                  onValueChange={(v: any) => updateAction(action.id, { status: v })}
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
                                <Select 
                                  value={action.priority} 
                                  onValueChange={(v: any) => updateAction(action.id, { priority: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="lav">Lav prioritet</SelectItem>
                                    <SelectItem value="medium">Medium prioritet</SelectItem>
                                    <SelectItem value="høy">Høy prioritet</SelectItem>
                                    <SelectItem value="kritisk">Kritisk</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end">
                                <Button variant="destructive" size="sm" onClick={() => deleteAction(action.id)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Slett
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
