import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  Clock,
  Circle,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Predefined hazards (farekilde) for quick selection - "Annet" first for easy access
const PREDEFINED_HAZARDS = [
  { value: "annet", label: "Annet (fritekst)", category: "annet" },
  { value: "fall_hoyde", label: "Fall fra høyde", category: "fysisk" },
  { value: "fallende_gjenstander", label: "Fallende gjenstander", category: "fysisk" },
  { value: "stoy", label: "Støy", category: "fysisk" },
  { value: "vibrasjon", label: "Vibrasjon", category: "fysisk" },
  { value: "varmt_arbeid", label: "Varmt arbeid (sveising/sliping)", category: "brann" },
  { value: "brannfare", label: "Brann/eksplosjon", category: "brann" },
  { value: "elektrisk", label: "Elektrisk fare", category: "fysisk" },
  { value: "klemfare", label: "Klemfare/maskineri", category: "fysisk" },
  { value: "tunge_loft", label: "Tunge løft/ergonomi", category: "ergonomisk" },
  { value: "repetitivt", label: "Repetitivt arbeid", category: "ergonomisk" },
  { value: "kjemikalier", label: "Kjemikalier/farlige stoffer", category: "kjemisk" },
  { value: "stov", label: "Støv/partikler", category: "kjemisk" },
  { value: "stress", label: "Stress/høyt arbeidspress", category: "psykososialt" },
  { value: "alenearbeid", label: "Alenearbeid", category: "organisatorisk" },
  { value: "trafikk", label: "Trafikk/kjøretøy", category: "fysisk" },
  { value: "vold_trusler", label: "Vold/trusler", category: "psykososialt" },
];

// Consequence descriptions with tooltips
const CONSEQUENCE_LEVELS = [
  { value: 1, label: "1", description: "Ubetydelig - Ingen/minimal skade" },
  { value: 2, label: "2", description: "Mindre alvorlig - Førstehjelp, kort fravær" },
  { value: 3, label: "3", description: "Alvorlig - Medisinsk behandling, lengre fravær" },
  { value: 4, label: "4", description: "Svært alvorlig - Sykehusinnleggelse, varig skade" },
  { value: 5, label: "5", description: "Kritisk/livstruende - Død eller permanent invaliditet" },
];

// Probability descriptions with tooltips
const PROBABILITY_LEVELS = [
  { value: 1, label: "1", description: "Svært lite sannsynlig - Sjeldnere enn hvert 10. år" },
  { value: 2, label: "2", description: "Lite sannsynlig - Hvert 5-10 år" },
  { value: 3, label: "3", description: "Mulig - Hvert 1-5 år" },
  { value: 4, label: "4", description: "Sannsynlig - 1-10 ganger årlig" },
  { value: 5, label: "5", description: "Svært sannsynlig - Mer enn 10 ganger årlig" },
];

// Action types
const ACTION_TYPES = [
  { value: "teknisk", label: "Teknisk tiltak" },
  { value: "organisatorisk", label: "Organisatorisk tiltak" },
  { value: "opplaering", label: "Opplæring" },
  { value: "ppe", label: "Personlig verneutstyr (PPE)" },
];

interface RiskItem {
  id: string;
  hazard_type: string;
  description: string;
  descriptions?: string[]; // Multiple descriptions for complex hazards
  who_affected: string[];
  consequence: number;
  probability: number;
  measures: string;
  responsible: string;
  deadline: string;
  status: "ikke_vurdert" | "akseptabel" | "tiltak_kreves" | "under_behandling" | "lukket";
  // Re-evaluation fields
  consequence_after?: number;
  probability_after?: number;
  reevaluated_at?: string;
  reevaluated_by?: string;
}

interface ActionItem {
  id: string;
  risk_id: string | null;
  risk_description: string;
  action_description: string;
  action_type: string;
  responsible: string;
  deadline: string;
  status: "planlagt" | "pågår" | "utført";
  priority: "lav" | "medium" | "høy" | "kritisk";
  documentation?: string;
}

// Risk calculation with correct thresholds: Green 1-5, Yellow 6-10, Red 11-25
const getRiskLevel = (consequence: number, probability: number) => {
  const score = consequence * probability;
  if (score <= 5) return { 
    level: "Akseptabel", 
    color: "text-green-700", 
    bg: "bg-green-100", 
    border: "border-green-300",
    requiresAction: false
  };
  if (score <= 10) return { 
    level: "Bør vurderes", 
    color: "text-yellow-700", 
    bg: "bg-yellow-100", 
    border: "border-yellow-300",
    requiresAction: true
  };
  return { 
    level: "Tiltak påkrevd", 
    color: "text-red-700", 
    bg: "bg-red-100", 
    border: "border-red-300",
    requiresAction: true
  };
};

const statusConfig = {
  ikke_vurdert: { label: "Ikke vurdert", icon: Circle, color: "text-muted-foreground" },
  akseptabel: { label: "Akseptabel", icon: CheckCircle2, color: "text-green-600" },
  tiltak_kreves: { label: "Tiltak kreves", icon: AlertTriangle, color: "text-red-600" },
  under_behandling: { label: "Under behandling", icon: Clock, color: "text-yellow-600" },
  lukket: { label: "Lukket", icon: ShieldCheck, color: "text-green-600" },
};

export function RisikovurderingOgHandlingsplan() {
  const { company, profile } = useAuth();
  const { employees } = useEmployees();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReevaluateDialog, setShowReevaluateDialog] = useState(false);
  const [selectedRiskForReeval, setSelectedRiskForReeval] = useState<RiskItem | null>(null);

  const currentUserName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  // New risk form - simplified
  const [newRisk, setNewRisk] = useState<Partial<RiskItem>>({
    hazard_type: "",
    description: "",
    descriptions: [""],
    who_affected: ["ansatte"],
    consequence: 3,
    probability: 3,
    measures: "",
    responsible: "",
    deadline: "",
    status: "ikke_vurdert",
  });

  // Set default responsible when profile loads
  useEffect(() => {
    if (currentUserName) {
      setNewRisk(p => ({ ...p, responsible: p.responsible || currentUserName }));
    }
  }, [currentUserName]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!company?.id) return;
      
      try {
        const { data: riskData } = await supabase
          .from("company_risk_assessments")
          .select("*")
          .eq("company_id", company.id)
          .single();
        
        if (riskData?.risks) {
          setRisks((riskData.risks as unknown as RiskItem[]).map(r => ({
            ...r,
            hazard_type: r.hazard_type || "annet",
            status: r.status || "ikke_vurdert",
          })));
        }

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
      const { error: riskError } = await supabase
        .from("company_risk_assessments")
        .upsert([{
          company_id: company.id,
          risks: risks as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id" });

      if (riskError) throw riskError;

      const { error: actionError } = await supabase
        .from("company_action_plans")
        .upsert([{
          company_id: company.id,
          actions: actions as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id" });

      if (actionError) throw actionError;

      toast.success("Lagret");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new risk
  const addRisk = () => {
    const descriptions = (newRisk.descriptions || []).filter(d => d.trim());
    if (!newRisk.hazard_type || descriptions.length === 0) {
      toast.error("Velg farekilde og beskriv minst én uønsket hendelse");
      return;
    }

    const hazard = PREDEFINED_HAZARDS.find(h => h.value === newRisk.hazard_type);
    const riskLevel = getRiskLevel(newRisk.consequence || 3, newRisk.probability || 3);

    const risk: RiskItem = {
      id: crypto.randomUUID(),
      hazard_type: newRisk.hazard_type,
      description: descriptions[0] || hazard?.label || "",
      descriptions: descriptions,
      who_affected: newRisk.who_affected || ["ansatte"],
      consequence: newRisk.consequence || 3,
      probability: newRisk.probability || 3,
      measures: newRisk.measures || "",
      responsible: newRisk.responsible || currentUserName,
      deadline: newRisk.deadline || "",
      status: riskLevel.requiresAction ? "tiltak_kreves" : "akseptabel",
    };

    setRisks([...risks, risk]);

    // Auto-create action if risk requires it (yellow/red)
    if (riskLevel.requiresAction) {
      const action: ActionItem = {
        id: crypto.randomUUID(),
        risk_id: risk.id,
        risk_description: descriptions.join(", "),
        action_description: risk.measures || "Definer tiltak",
        action_type: "teknisk",
        responsible: risk.responsible,
        deadline: risk.deadline,
        status: "planlagt",
        priority: riskLevel.level === "Tiltak påkrevd" ? "høy" : "medium",
      };
      setActions(prev => [...prev, action]);
    }

    // Reset form
    setNewRisk({
      hazard_type: "",
      description: "",
      descriptions: [""],
      who_affected: ["ansatte"],
      consequence: 3,
      probability: 3,
      measures: "",
      responsible: currentUserName,
      deadline: "",
      status: "ikke_vurdert",
    });

    setShowAddDialog(false);
    toast.success("Risiko lagt til" + (riskLevel.requiresAction ? " - tiltak opprettet automatisk" : ""));
  };

  // Re-evaluate risk after measures
  const handleReevaluate = () => {
    if (!selectedRiskForReeval) return;

    const newLevel = getRiskLevel(
      selectedRiskForReeval.consequence_after || selectedRiskForReeval.consequence,
      selectedRiskForReeval.probability_after || selectedRiskForReeval.probability
    );

    setRisks(risks.map(r => {
      if (r.id === selectedRiskForReeval.id) {
        return {
          ...r,
          consequence_after: selectedRiskForReeval.consequence_after,
          probability_after: selectedRiskForReeval.probability_after,
          reevaluated_at: new Date().toISOString(),
          reevaluated_by: currentUserName,
          status: newLevel.requiresAction ? "under_behandling" : "lukket",
        };
      }
      return r;
    }));

    setShowReevaluateDialog(false);
    setSelectedRiskForReeval(null);
    toast.success("Risiko revurdert");
  };

  // Delete risk
  const deleteRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id));
    setActions(actions.filter(a => a.risk_id !== id));
    toast.success("Risiko slettet");
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

  // Stats
  const stats = {
    total: risks.length,
    red: risks.filter(r => r.consequence * r.probability >= 11).length,
    yellow: risks.filter(r => {
      const score = r.consequence * r.probability;
      return score >= 6 && score <= 10;
    }).length,
    green: risks.filter(r => r.consequence * r.probability <= 5).length,
    openActions: actions.filter(a => a.status !== "utført").length,
    overdueActions: actions.filter(a => a.status !== "utført" && a.deadline && new Date(a.deadline) < new Date()).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Risikoer</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-red-600">{stats.red}</div>
              <div className="text-xs text-muted-foreground">Røde (11-25)</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-yellow-600">{stats.yellow}</div>
              <div className="text-xs text-muted-foreground">Gule (6-10)</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-green-600">{stats.green}</div>
              <div className="text-xs text-muted-foreground">Grønne (1-5)</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-orange-600">{stats.openActions}</div>
              <div className="text-xs text-muted-foreground">Åpne tiltak</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-destructive">{stats.overdueActions}</div>
              <div className="text-xs text-muted-foreground">Forfalt</div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-between">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny risikovurdering
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ny risikovurdering</DialogTitle>
                <DialogDescription>Fyll ut skjemaet for å registrere en ny risiko</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                {/* Hazard selection */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    Farekilde *
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Hva kan forårsake skade?</TooltipContent>
                    </Tooltip>
                  </label>
                  <Select value={newRisk.hazard_type} onValueChange={(v) => {
                    const hazard = PREDEFINED_HAZARDS.find(h => h.value === v);
                    setNewRisk(p => ({ 
                      ...p, 
                      hazard_type: v,
                      descriptions: v === "annet" ? [""] : [hazard?.label || ""]
                    }));
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Velg farekilde" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_HAZARDS.map(h => (
                        <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Multiple descriptions for complex hazards */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    Uønsket hendelse / Beskrivelse *
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Legg til flere hvis faren har flere mulige utfall</TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="space-y-2 mt-1">
                    {(newRisk.descriptions || [""]).map((desc, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          placeholder={idx === 0 ? "Hva kan skje?" : "Annen uønsket hendelse..."}
                          value={desc}
                          onChange={(e) => {
                            const updated = [...(newRisk.descriptions || [""])];
                            updated[idx] = e.target.value;
                            setNewRisk(p => ({ ...p, descriptions: updated }));
                          }}
                        />
                        {idx > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              const updated = (newRisk.descriptions || []).filter((_, i) => i !== idx);
                              setNewRisk(p => ({ ...p, descriptions: updated }));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewRisk(p => ({ ...p, descriptions: [...(p.descriptions || []), ""] }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Legg til hendelse
                    </Button>
                  </div>
                </div>

                {/* Consequence with tooltips */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    Konsekvens (K)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">Hvor alvorlig kan skaden bli?</TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="flex gap-1 mt-1">
                    {CONSEQUENCE_LEVELS.map(level => (
                      <Tooltip key={level.value}>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant={newRisk.consequence === level.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-10"
                            onClick={() => setNewRisk(p => ({ ...p, consequence: level.value }))}
                          >
                            {level.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px]">
                          {level.description}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Probability with tooltips */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    Sannsynlighet (S)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">Hvor sannsynlig er det at dette skjer?</TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="flex gap-1 mt-1">
                    {PROBABILITY_LEVELS.map(level => (
                      <Tooltip key={level.value}>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant={newRisk.probability === level.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-10"
                            onClick={() => setNewRisk(p => ({ ...p, probability: level.value }))}
                          >
                            {level.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px]">
                          {level.description}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Risk level preview */}
                {newRisk.consequence && newRisk.probability && (
                  <div className={cn(
                    "p-3 rounded-lg flex items-center justify-between",
                    getRiskLevel(newRisk.consequence, newRisk.probability).bg
                  )}>
                    <span className="text-sm font-medium">
                      Risikonivå: {newRisk.consequence} × {newRisk.probability} = {newRisk.consequence * newRisk.probability}
                    </span>
                    <Badge className={cn(
                      getRiskLevel(newRisk.consequence, newRisk.probability).bg,
                      getRiskLevel(newRisk.consequence, newRisk.probability).color
                    )}>
                      {getRiskLevel(newRisk.consequence, newRisk.probability).level}
                    </Badge>
                  </div>
                )}

                {/* Measures */}
                <div>
                  <label className="text-sm font-medium">Tiltak (planlagte/eksisterende)</label>
                  <Textarea 
                    placeholder="Hvilke tiltak skal/er iverksatt?"
                    value={newRisk.measures || ""}
                    onChange={(e) => setNewRisk(p => ({ ...p, measures: e.target.value }))}
                    className="min-h-[60px]"
                  />
                </div>

                {/* Responsible and deadline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Ansvarlig</label>
                    <Select value={newRisk.responsible || ""} onValueChange={(v) => setNewRisk(p => ({ ...p, responsible: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg">{newRisk.responsible || "Velg"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {currentUserName && (
                          <SelectItem value={currentUserName}>{currentUserName} (meg)</SelectItem>
                        )}
                        {employees.filter(e => `${e.first_name} ${e.last_name}`.trim() !== currentUserName).map(emp => (
                          <SelectItem key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                            {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Frist</label>
                    <Input 
                      type="date" 
                      value={newRisk.deadline || ""}
                      onChange={(e) => setNewRisk(p => ({ ...p, deadline: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Avbryt</Button>
                <Button onClick={addRisk}>Legg til risiko</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSave} disabled={isSaving} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Lagrer..." : "Lagre"}
          </Button>
        </div>

        {/* Alert for red risks */}
        {stats.red > 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700">
                <strong>{stats.red} risikoer</strong> krever tiltak (rød risiko kan ikke godkjennes uten tiltak)
              </span>
            </CardContent>
          </Card>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Risikovurdering
              </CardTitle>
              <CardDescription>Identifiserte risikoer sortert etter alvorlighet</CardDescription>
            </CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Ingen risikoer registrert</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til første risiko
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {[...risks]
                    .sort((a, b) => (b.consequence * b.probability) - (a.consequence * a.probability))
                    .map(risk => {
                      const level = getRiskLevel(risk.consequence, risk.probability);
                      const hazard = PREDEFINED_HAZARDS.find(h => h.value === risk.hazard_type);
                      const isExpanded = expandedRisk === risk.id;
                      const hasReeval = risk.consequence_after !== undefined;
                      const levelAfter = hasReeval ? getRiskLevel(risk.consequence_after!, risk.probability_after!) : null;

                      return (
                        <Collapsible
                          key={risk.id}
                          open={isExpanded}
                          onOpenChange={() => setExpandedRisk(isExpanded ? null : risk.id)}
                        >
                          <div className={cn("border rounded-lg overflow-hidden", level.border)}>
                            <CollapsibleTrigger className="w-full">
                              <div className={cn("p-3 flex items-center gap-2", level.bg)}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="flex-1 text-left text-sm font-medium truncate">
                                  {risk.description || hazard?.label}
                                </span>
                                <Badge className={cn("text-xs", level.bg, level.color)}>
                                  {risk.consequence * risk.probability}
                                </Badge>
                                {hasReeval && levelAfter && (
                                  <>
                                    <span className="text-xs">→</span>
                                    <Badge className={cn("text-xs", levelAfter.bg, levelAfter.color)}>
                                      {risk.consequence_after! * risk.probability_after!}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-3 space-y-3 border-t bg-background text-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div><span className="text-muted-foreground">K×S:</span> {risk.consequence}×{risk.probability} = {risk.consequence * risk.probability}</div>
                                  <div><span className="text-muted-foreground">Nivå:</span> {level.level}</div>
                                  {risk.responsible && <div><span className="text-muted-foreground">Ansvarlig:</span> {risk.responsible}</div>}
                                  {risk.deadline && <div><span className="text-muted-foreground">Frist:</span> {new Date(risk.deadline).toLocaleDateString("nb-NO")}</div>}
                                </div>
                                {risk.measures && (
                                  <div className="text-xs"><span className="text-muted-foreground">Tiltak:</span> {risk.measures}</div>
                                )}
                                
                                {/* Re-evaluation section */}
                                {hasReeval && (
                                  <div className={cn("p-2 rounded text-xs", levelAfter?.bg)}>
                                    <div className="font-medium mb-1">Etter tiltak:</div>
                                    <div>K×S: {risk.consequence_after}×{risk.probability_after} = {risk.consequence_after! * risk.probability_after!} ({levelAfter?.level})</div>
                                    {risk.reevaluated_at && (
                                      <div className="text-muted-foreground mt-1">
                                        Revurdert {new Date(risk.reevaluated_at).toLocaleDateString("nb-NO")} av {risk.reevaluated_by}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                  {level.requiresAction && !hasReeval && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedRiskForReeval({ ...risk, consequence_after: risk.consequence, probability_after: risk.probability });
                                        setShowReevaluateDialog(true);
                                      }}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Revurder
                                    </Button>
                                  )}
                                  <Button size="sm" variant="destructive" onClick={() => deleteRisk(risk.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Slett
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Handlingsplan
              </CardTitle>
              <CardDescription>Tiltak for å redusere risiko</CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Ingen tiltak registrert</p>
                  <p className="text-xs mt-1">Tiltak opprettes automatisk for gul/rød risiko</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {actions.map(action => {
                    const isOverdue = action.status !== "utført" && action.deadline && new Date(action.deadline) < new Date();
                    
                    return (
                      <div key={action.id} className={cn(
                        "border rounded-lg p-3 space-y-2",
                        isOverdue && "border-red-300 bg-red-50"
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{action.action_description}</p>
                            {action.risk_description && (
                              <p className="text-xs text-muted-foreground truncate">Fra: {action.risk_description}</p>
                            )}
                          </div>
                          <Select value={action.status} onValueChange={(v: any) => updateAction(action.id, { status: v })}>
                            <SelectTrigger className="w-[110px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planlagt">Planlagt</SelectItem>
                              <SelectItem value="pågår">Pågår</SelectItem>
                              <SelectItem value="utført">Utført</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Select value={action.action_type || "teknisk"} onValueChange={(v) => updateAction(action.id, { action_type: v })}>
                            <SelectTrigger className="w-[130px] h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder="Ansvarlig"
                            value={action.responsible || ""}
                            onChange={(e) => updateAction(action.id, { responsible: e.target.value })}
                            className="flex-1 h-6 text-xs min-w-[100px]"
                          />
                          <Input 
                            type="date"
                            value={action.deadline || ""}
                            onChange={(e) => updateAction(action.id, { deadline: e.target.value })}
                            className="w-[120px] h-6 text-xs"
                          />
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteAction(action.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Re-evaluate dialog */}
        <Dialog open={showReevaluateDialog} onOpenChange={setShowReevaluateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Revurder risiko etter tiltak</DialogTitle>
              <DialogDescription>
                Vurder ny konsekvens og sannsynlighet etter at tiltak er gjennomført
              </DialogDescription>
            </DialogHeader>
            {selectedRiskForReeval && (
              <div className="space-y-4">
                <div className="p-3 rounded bg-muted text-sm">
                  <strong>Risiko:</strong> {selectedRiskForReeval.description}
                  <div className="text-xs text-muted-foreground mt-1">
                    Før tiltak: {selectedRiskForReeval.consequence}×{selectedRiskForReeval.probability} = {selectedRiskForReeval.consequence * selectedRiskForReeval.probability}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Ny konsekvens (K)</label>
                  <div className="flex gap-1 mt-1">
                    {CONSEQUENCE_LEVELS.map(level => (
                      <Tooltip key={level.value}>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant={selectedRiskForReeval.consequence_after === level.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedRiskForReeval(p => p ? { ...p, consequence_after: level.value } : null)}
                          >
                            {level.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{level.description}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Ny sannsynlighet (S)</label>
                  <div className="flex gap-1 mt-1">
                    {PROBABILITY_LEVELS.map(level => (
                      <Tooltip key={level.value}>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant={selectedRiskForReeval.probability_after === level.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedRiskForReeval(p => p ? { ...p, probability_after: level.value } : null)}
                          >
                            {level.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{level.description}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {selectedRiskForReeval.consequence_after && selectedRiskForReeval.probability_after && (
                  <div className={cn(
                    "p-3 rounded-lg",
                    getRiskLevel(selectedRiskForReeval.consequence_after, selectedRiskForReeval.probability_after).bg
                  )}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Ny risiko: {selectedRiskForReeval.consequence_after} × {selectedRiskForReeval.probability_after} = {selectedRiskForReeval.consequence_after * selectedRiskForReeval.probability_after}
                      </span>
                      <Badge className={cn(
                        getRiskLevel(selectedRiskForReeval.consequence_after, selectedRiskForReeval.probability_after).bg,
                        getRiskLevel(selectedRiskForReeval.consequence_after, selectedRiskForReeval.probability_after).color
                      )}>
                        {getRiskLevel(selectedRiskForReeval.consequence_after, selectedRiskForReeval.probability_after).level}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReevaluateDialog(false)}>Avbryt</Button>
              <Button onClick={handleReevaluate}>Bekreft revurdering</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legal reference footer */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Risikovurdering i henhold til Internkontrollforskriften §5, Arbeidsmiljøloven §3-1, og Forskrift om organisering, ledelse og medvirkning §7-1
        </div>
      </div>
    </TooltipProvider>
  );
}
