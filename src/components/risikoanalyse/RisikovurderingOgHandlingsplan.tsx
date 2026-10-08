import { useState, useEffect } from "react";
import { AI_DATA_CHANGED_EVENT } from "@/lib/aiDataEvents";
import { formatHazardName } from "@/lib/formatHazardName";
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
  Info,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";

// Predefined hazard sources (farekilder) - "Annet" first for easy access
const PREDEFINED_HAZARDS = [
  { value: "annet", label: "Annet (fritekst)", category: "annet" },
  { value: "arbeid_i_hoyden", label: t("auto.arbeid_i_hoeyden"), category: "fysisk" },
  { value: "varmt_arbeid", label: "Varmt arbeid (sveising/sliping)", category: "brann" },
  { value: "elektrisk_arbeid", label: t("auto.elektrisk_arbeid"), category: "fysisk" },
  { value: "maskinarbeid", label: t("auto.maskinarbeid_verktoey"), category: "fysisk" },
  { value: "tunge_loft", label: t("auto.tunge_loeft_manuelt_arbeid"), category: "ergonomisk" },
  { value: "kjemikalier", label: t("auto.arbeid_med_kjemikalier"), category: "kjemisk" },
  { value: "stoystov", label: t("auto.stoey_stoev"), category: "fysisk" },
  { value: "trafikk", label: t("auto.trafikk_kjoeretoey"), category: "fysisk" },
  { value: "alenearbeid", label: t("auto.alenearbeid"), category: "organisatorisk" },
  { value: "trange_rom", label: t("auto.trange_rom_innesperring"), category: "fysisk" },
  { value: "utgravning", label: t("auto.utgravning_groefter"), category: "fysisk" },
  { value: "stress", label: t("auto.stress_arbeidspress"), category: "psykososialt" },
  { value: "vold_trusler", label: t("auto.vold_trusler"), category: "psykososialt" },
];

// Consequence descriptions with tooltips
const CONSEQUENCE_LEVELS = [
  { value: 1, label: "1", description: t("auto.ubetydelig_ingen_minimal_skade") },
  { value: 2, label: "2", description: t("auto.mindre_alvorlig_foerstehjelp_kort_fravae") },
  { value: 3, label: "3", description: t("auto.alvorlig_medisinsk_behandling_lengre_fra") },
  { value: 4, label: "4", description: t("auto.svaert_alvorlig_sykehusinnleggelse_varig") },
  { value: 5, label: "5", description: t("auto.kritisk_livstruende_doed_eller_permanent") },
];

// Probability descriptions with tooltips
const PROBABILITY_LEVELS = [
  { value: 1, label: "1", description: t("auto.svaert_lite_sannsynlig_sjeldnere_enn_hve") },
  { value: 2, label: "2", description: t("auto.lite_sannsynlig_hvert_5_10_aar") },
  { value: 3, label: "3", description: t("auto.mulig_hvert_1_5_aar") },
  { value: 4, label: "4", description: t("auto.sannsynlig_1_10_ganger_aarlig") },
  { value: 5, label: "5", description: t("auto.svaert_sannsynlig_mer_enn_10_ganger_aarl") },
];

// Action types
const ACTION_TYPES = [
  { value: "teknisk", label: t("auto.teknisk") },
  { value: "organisatorisk", label: t("auto.organisatorisk") },
  { value: "opplaering", label: t("auto.opplaering") },
  { value: "ppe", label: t("auto.verneutstyr") },
];

// Each unwanted event under a hazard source
interface UnwantedEvent {
  id: string;
  description: string;
  consequence: number;
  probability: number;
  measures: string;
  responsible: string;
  deadline: string;
  status: "planlagt" | "pågår" | "utført";
  consequence_after?: number;
  probability_after?: number;
  reevaluated_at?: string;
  reevaluated_by?: string;
}

// Main risk item = one hazard source with multiple unwanted events
interface RiskItem {
  id: string;
  hazard_source: string; // Farekilde
  hazard_source_custom?: string; // Custom name if "annet"
  events: UnwantedEvent[]; // Uønskede hendelser
  created_at: string;
  created_by: string;
}

interface ActionItem {
  id: string;
  risk_id: string;
  event_id: string;
  risk_source: string;
  event_description: string;
  action_description: string;
  action_type: string;
  responsible: string;
  deadline: string;
  status: "planlagt" | "pågår" | "utført";
  priority: "lav" | "medium" | "høy" | "kritisk";
}

// Risk calculation with correct thresholds: Green 1-5, Yellow 6-10, Red 11-25
const getRiskLevel = (consequence: number, probability: number) => {
  // Handle invalid/missing values
  if (!consequence || !probability || isNaN(consequence) || isNaN(probability)) {
    return { 
      level: "Ikke vurdert", 
      color: "text-muted-foreground", 
      bg: "bg-muted", 
      border: "border-muted",
      requiresAction: false
    };
  }
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

export function RisikovurderingOgHandlingsplan() {
  const { company, profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const { employees } = useEmployees();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReevaluateDialog, setShowReevaluateDialog] = useState(false);
  const [selectedEventForReeval, setSelectedEventForReeval] = useState<{risk: RiskItem, event: UnwantedEvent} | null>(null);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [showAddActionDialog, setShowAddActionDialog] = useState(false);
  const [selectedEventForAction, setSelectedEventForAction] = useState<{risk: RiskItem, event: UnwantedEvent} | null>(null);
  const [newActionDescription, setNewActionDescription] = useState("");
  const currentUserName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  // New risk form
  const [newRisk, setNewRisk] = useState({
    hazard_source: "",
    hazard_source_custom: "",
    events: [{ description: "", consequence: 3, probability: 3, measures: "", responsible: "", deadline: "" }] as Array<{
      description: string;
      consequence: number;
      probability: number;
      measures: string;
      responsible: string;
      deadline: string;
    }>
  });

  // Set default responsible when profile loads
  useEffect(() => {
    if (currentUserName && newRisk.events[0].responsible === "") {
      setNewRisk(p => ({
        ...p,
        events: p.events.map((e, i) => i === 0 ? { ...e, responsible: currentUserName } : e)
      }));
    }
  }, [currentUserName]);

  // Helper to normalize and validate event values
  const normalizeEvent = (event: any): UnwantedEvent => {
    const consequence = typeof event.consequence === 'number' && !isNaN(event.consequence) && event.consequence >= 1 && event.consequence <= 5 
      ? event.consequence 
      : 3;
    const probability = typeof event.probability === 'number' && !isNaN(event.probability) && event.probability >= 1 && event.probability <= 5 
      ? event.probability 
      : 3;
    
    return {
      id: event.id || crypto.randomUUID(),
      description: event.description || "",
      consequence,
      probability,
      measures: event.measures || "",
      responsible: event.responsible || "",
      deadline: event.deadline || "",
      status: event.status || "planlagt",
      consequence_after: event.consequence_after,
      probability_after: event.probability_after,
      reevaluated_at: event.reevaluated_at,
      reevaluated_by: event.reevaluated_by,
    };
  };

  // Convert simple format from setup wizard to full format
  const convertSimpleToFullFormat = (simpleRisk: any): RiskItem => {
    // Ensure events is always an array
    const safeEvents = Array.isArray(simpleRisk.events) ? simpleRisk.events : [];
    
    // Check if it's already in full format (has hazard_source and events)
    if (simpleRisk.hazard_source) {
      // Normalize all events to ensure valid values
      const normalizedEvents = safeEvents.length > 0 
        ? safeEvents.map(normalizeEvent)
        : [{
            id: crypto.randomUUID(),
            description: simpleRisk.hazard_source_custom || simpleRisk.description || "",
            consequence: 3,
            probability: 3,
            measures: "",
            responsible: "",
            deadline: "",
            status: "planlagt" as const,
          }];
      
      return {
        ...simpleRisk,
        events: normalizedEvents,
      };
    }
    
    // Convert simple format: { id, description, consequence, probability, existing_measures, planned_measures }
    // To full format: { id, hazard_source, hazard_source_custom, events: [...], created_at, created_by }
    const consequence = typeof simpleRisk.consequence === 'number' && !isNaN(simpleRisk.consequence) && simpleRisk.consequence >= 1 && simpleRisk.consequence <= 5 
      ? simpleRisk.consequence 
      : 3;
    const probability = typeof simpleRisk.probability === 'number' && !isNaN(simpleRisk.probability) && simpleRisk.probability >= 1 && simpleRisk.probability <= 5 
      ? simpleRisk.probability 
      : 3;

    return {
      id: simpleRisk.id || crypto.randomUUID(),
      hazard_source: "annet",
      hazard_source_custom: simpleRisk.description || "Risiko fra oppsett",
      events: [{
        id: crypto.randomUUID(),
        description: simpleRisk.description || "",
        consequence,
        probability,
        measures: [simpleRisk.existing_measures, simpleRisk.planned_measures].filter(Boolean).join(". "),
        responsible: "",
        deadline: "",
        status: "planlagt" as const,
      }],
      created_at: simpleRisk.created_at || new Date().toISOString(),
      created_by: simpleRisk.created_by || "Oppsett-veiviser",
    };
  };

  // Load data - uses a key to force re-fetch after deletions
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh when an AI assistant (HMS/MAT Proffen) changed data
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(AI_DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AI_DATA_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!company?.id) return;
      
      try {
        let rq = supabase
          .from("company_risk_assessments")
          .select("*")
          .eq("company_id", company.id);
        rq = filterDepartmentId
          ? rq.eq("department_id", filterDepartmentId)
          : rq.is("department_id", null);
        const { data: riskData } = await rq.maybeSingle();
        
        if (riskData?.risks) {
          const rawRisks = riskData.risks as unknown as any[];
          // Convert all risks to full format
          const convertedRisks = rawRisks.map(r => convertSimpleToFullFormat(r));
          setRisks(convertedRisks);
        } else {
          setRisks([]);
        }

        let aq = supabase
          .from("company_action_plans")
          .select("*")
          .eq("company_id", company.id);
        aq = filterDepartmentId
          ? aq.eq("department_id", filterDepartmentId)
          : aq.is("department_id", null);
        const { data: actionData } = await aq.maybeSingle();
        
        if (actionData?.actions) {
          setActions(actionData.actions as unknown as ActionItem[]);
        } else {
          setActions([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [company?.id, refreshKey, filterDepartmentId]);

  // Persist given data (used by autosave)
  const persistData = async (nextRisks: RiskItem[], nextActions: ActionItem[]) => {
    if (!company?.id) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const { error: riskError } = await supabase
        .from("company_risk_assessments")
        .upsert([{
          company_id: company.id,
          department_id: filterDepartmentId,
          risks: nextRisks as unknown as Json,
          updated_at: nowIso,
        }], { onConflict: "company_id,department_id" });
      if (riskError) throw riskError;

      const { error: actionError } = await supabase
        .from("company_action_plans")
        .upsert([{
          company_id: company.id,
          department_id: filterDepartmentId,
          actions: nextActions as unknown as Json,
          updated_at: nowIso,
        }], { onConflict: "company_id,department_id" });
      if (actionError) throw actionError;
    } catch (error) {
      console.error("Autosave error:", error);
      toast.error(t("auto.kunne_ikke_lagre_2"));
    } finally {
      setIsSaving(false);
    }
  };

  // Save all data
  const handleSave = async () => {
    if (!company?.id) return;
    setIsSaving(true);


    try {
      const { error: riskError } = await supabase
        .from("company_risk_assessments")
        .upsert([{
          company_id: company.id,
          department_id: filterDepartmentId,
          risks: risks as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id,department_id" });

      if (riskError) throw riskError;

      const { error: actionError } = await supabase
        .from("company_action_plans")
        .upsert([{
          company_id: company.id,
          department_id: filterDepartmentId,
          actions: actions as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id,department_id" });

      if (actionError) throw actionError;

      toast.success(t("auto.lagret"));
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(t("auto.kunne_ikke_lagre_2"));
    } finally {
      setIsSaving(false);
    }
  };

  // Add new risk with events
  const addRisk = async () => {
    const validEvents = newRisk.events.filter(e => e.description.trim());
    if (!newRisk.hazard_source || validEvents.length === 0) {
      toast.error(t("auto.velg_farekilde_og_legg_til_minst_n_uoens"));
      return;
    }

    const hazardLabel = newRisk.hazard_source === "annet" 
      ? newRisk.hazard_source_custom || "Annet"
      : PREDEFINED_HAZARDS.find(h => h.value === newRisk.hazard_source)?.label || newRisk.hazard_source;

    const risk: RiskItem = {
      id: crypto.randomUUID(),
      hazard_source: newRisk.hazard_source,
      hazard_source_custom: newRisk.hazard_source === "annet" ? newRisk.hazard_source_custom : undefined,
      events: validEvents.map(e => ({
        id: crypto.randomUUID(),
        description: e.description,
        consequence: e.consequence,
        probability: e.probability,
        measures: e.measures,
        responsible: e.responsible || currentUserName,
        deadline: e.deadline,
        status: "planlagt" as const,
      })),
      created_at: new Date().toISOString(),
      created_by: currentUserName,
    };

    const updatedRisks = [...risks, risk];
    setRisks(updatedRisks);

    // Auto-create actions for events that require it (yellow/red)
    const newActions: ActionItem[] = [];
    risk.events.forEach(event => {
      const level = getRiskLevel(event.consequence, event.probability);
      if (level.requiresAction) {
        newActions.push({
          id: crypto.randomUUID(),
          risk_id: risk.id,
          event_id: event.id,
          risk_source: hazardLabel,
          event_description: event.description,
          action_description: event.measures || "Definer tiltak",
          action_type: "teknisk",
          responsible: event.responsible,
          deadline: event.deadline,
          status: "planlagt",
          priority: level.level === "Tiltak påkrevd" ? "høy" : "medium",
        });
      }
    });

    const updatedActions = newActions.length > 0 ? [...actions, ...newActions] : actions;
    if (newActions.length > 0) {
      setActions(updatedActions);
    }

    // Reset form
    setNewRisk({
      hazard_source: "",
      hazard_source_custom: "",
      events: [{ description: "", consequence: 3, probability: 3, measures: "", responsible: currentUserName, deadline: "" }]
    });

    setShowAddDialog(false);
    await persistData(updatedRisks, updatedActions);
    toast.success(`Farekilde lagret med ${risk.events.length} hendelse(r)${newActions.length > 0 ? ` - ${newActions.length} tiltak opprettet` : ""}`);
  };

  // Add event to form
  const addEventToForm = () => {
    setNewRisk(p => ({
      ...p,
      events: [...p.events, { description: "", consequence: 3, probability: 3, measures: "", responsible: currentUserName, deadline: "" }]
    }));
  };

  // Remove event from form
  const removeEventFromForm = (index: number) => {
    if (newRisk.events.length <= 1) return;
    setNewRisk(p => ({
      ...p,
      events: p.events.filter((_, i) => i !== index)
    }));
  };

  // Update event in form
  const updateEventInForm = (index: number, field: string, value: any) => {
    setNewRisk(p => ({
      ...p,
      events: p.events.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }));
  };

  // Re-evaluate event after measures
  const handleReevaluate = () => {
    if (!selectedEventForReeval) return;
    const { risk, event } = selectedEventForReeval;

    const newLevel = getRiskLevel(
      event.consequence_after || event.consequence,
      event.probability_after || event.probability
    );

    setRisks(risks.map(r => {
      if (r.id === risk.id) {
        return {
          ...r,
          events: r.events.map(e => {
            if (e.id === event.id) {
              return {
                ...e,
                consequence_after: event.consequence_after,
                probability_after: event.probability_after,
                reevaluated_at: new Date().toISOString(),
                reevaluated_by: currentUserName,
                status: newLevel.requiresAction ? "pågår" : "utført",
              };
            }
            return e;
          })
        };
      }
      return r;
    }));

    // Update related action status
    setActions(actions.map(a => {
      if (a.event_id === event.id) {
        return { ...a, status: newLevel.requiresAction ? "pågår" : "utført" };
      }
      return a;
    }));

    setShowReevaluateDialog(false);
    setSelectedEventForReeval(null);
    toast.success(t("auto.hendelse_revurdert"));
  };

  // Delete risk - with auto-save to database
  const deleteRisk = async (id: string) => {
    if (!company?.id) return;
    const prevRisks = risks;
    const prevActions = actions;
    
    const updatedRisks = risks.filter(r => r.id !== id);
    const updatedActions = actions.filter(a => a.risk_id !== id);
    
    // Update local state immediately
    setRisks(updatedRisks);
    setActions(updatedActions);
    
    // Auto-save to database to prevent data from reappearing after navigation
    try {
      const nowIso = new Date().toISOString();

      // Prefer explicit UPDATE (more predictable than upsert when debugging persistence)
      const { data: updatedRiskRow, error: riskUpdateError } = await supabase
        .from("company_risk_assessments")
        .update({
          risks: updatedRisks as unknown as Json,
          updated_at: nowIso,
        })
        .eq("company_id", company.id)
        .select("company_id, risks")
        .maybeSingle();

      // If row doesn't exist yet, INSERT it
      if (riskUpdateError || !updatedRiskRow) {
        const { data: insertedRiskRow, error: riskInsertError } = await supabase
          .from("company_risk_assessments")
          .insert({
            company_id: company.id,
            department_id: filterDepartmentId,
            risks: updatedRisks as unknown as Json,
            updated_at: nowIso,
          })
          .select("company_id, risks")
          .maybeSingle();

        if (riskInsertError || !insertedRiskRow) throw riskInsertError || new Error("Risk insert failed");
      }

      const { data: updatedActionRow, error: actionUpdateError } = await supabase
        .from("company_action_plans")
        .update({
          actions: updatedActions as unknown as Json,
          updated_at: nowIso,
        })
        .eq("company_id", company.id)
        .select("company_id")
        .maybeSingle();

      if (actionUpdateError || !updatedActionRow) {
        const { data: insertedActionRow, error: actionInsertError } = await supabase
          .from("company_action_plans")
          .insert({
            company_id: company.id,
            department_id: filterDepartmentId,
            actions: updatedActions as unknown as Json,
            updated_at: nowIso,
          })
          .select("company_id")
          .maybeSingle();

        if (actionInsertError || !insertedActionRow) throw actionInsertError || new Error("Action insert failed");
      }

      // Final verification: re-read and ensure the deleted id is actually gone
      const { data: verifyRiskRow, error: verifyError } = await supabase
        .from("company_risk_assessments")
        .select("risks")
        .eq("company_id", company.id)
        .maybeSingle();

      if (verifyError) throw verifyError;
      const verifyRisks = (verifyRiskRow?.risks as unknown as Array<{ id?: string }> | null) || [];
      if (verifyRisks.some((r) => r?.id === id)) {
        throw new Error("Delete verification failed: risk still present");
      }

      toast.success(t("auto.farekilde_slettet"));
      // Force re-fetch data so UI matches DB without full navigation
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast.error(t("auto.kunne_ikke_slette_farekilde"));
      // Rollback on error
      setRisks(prevRisks);
      setActions(prevActions);
    }
  };

  // Update action
  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Delete action
  const deleteAction = async (id: string) => {
    const updatedActions = actions.filter(a => a.id !== id);
    setActions(updatedActions);
    await persistData(risks, updatedActions);
    toast.success(t("auto.tiltak_slettet"));
  };

  // Add action for a specific event
  const addActionForEvent = (risk: RiskItem, event: UnwantedEvent) => {
    setSelectedEventForAction({ risk, event });
    setNewActionDescription(event.measures || "");
    setShowAddActionDialog(true);
  };

  // Save new action from dialog
  const saveNewAction = async () => {
    if (!selectedEventForAction || !newActionDescription.trim()) {
      toast.error(t("auto.fyll_inn_beskrivelse_av_tiltaket"));
      return;
    }

    const { risk, event } = selectedEventForAction;
    const hazardLabel = formatHazardName(
      risk.hazard_source === "annet"
        ? risk.hazard_source_custom
        : PREDEFINED_HAZARDS.find(h => h.value === risk.hazard_source)?.label || risk.hazard_source
    );
    
    const level = getRiskLevel(event.consequence, event.probability);

    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      risk_id: risk.id,
      event_id: event.id,
      risk_source: hazardLabel || "",
      event_description: event.description,
      action_description: newActionDescription,
      action_type: "teknisk",
      responsible: event.responsible || currentUserName,
      deadline: event.deadline || "",
      status: "planlagt",
      priority: level.level === "Tiltak påkrevd" ? "høy" : level.requiresAction ? "medium" : "lav",
    };

    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    setShowAddActionDialog(false);
    setSelectedEventForAction(null);
    setNewActionDescription("");
    await persistData(risks, updatedActions);
    toast.success(t("auto.tiltak_lagt_til"));
  };

  // Check if event already has action
  const eventHasAction = (eventId: string) => {
    return actions.some(a => a.event_id === eventId);
  };

  // Start editing a risk
  const startEditRisk = (risk: RiskItem) => {
    setEditingRisk(risk);
    setNewRisk({
      hazard_source: risk.hazard_source,
      hazard_source_custom: risk.hazard_source_custom || "",
      events: risk.events.map(e => ({
        description: e.description,
        consequence: e.consequence,
        probability: e.probability,
        measures: e.measures,
        responsible: e.responsible,
        deadline: e.deadline,
      }))
    });
    setShowAddDialog(true);
  };

  // Save edited risk
  const saveEditedRisk = async () => {
    if (!editingRisk) return;

    const hazardLabel = newRisk.hazard_source === "annet" 
      ? newRisk.hazard_source_custom 
      : PREDEFINED_HAZARDS.find(h => h.value === newRisk.hazard_source)?.label || newRisk.hazard_source;

    if (!hazardLabel?.trim()) {
      toast.error(t("auto.velg_eller_skriv_inn_farekilde"));
      return;
    }

    if (newRisk.events.some(e => !e.description.trim())) {
      toast.error(t("auto.alle_hendelser_maa_ha_en_beskrivelse"));
      return;
    }

    // Update the risk with preserved event IDs where possible
    const updatedRisk: RiskItem = {
      ...editingRisk,
      hazard_source: newRisk.hazard_source,
      hazard_source_custom: newRisk.hazard_source === "annet" ? newRisk.hazard_source_custom : undefined,
      events: newRisk.events.map((e, idx) => ({
        id: editingRisk.events[idx]?.id || crypto.randomUUID(),
        description: e.description,
        consequence: e.consequence,
        probability: e.probability,
        measures: e.measures,
        responsible: e.responsible || currentUserName,
        deadline: e.deadline,
        status: editingRisk.events[idx]?.status || "planlagt" as const,
        // Preserve re-evaluation data if exists
        consequence_after: editingRisk.events[idx]?.consequence_after,
        probability_after: editingRisk.events[idx]?.probability_after,
        reevaluated_at: editingRisk.events[idx]?.reevaluated_at,
        reevaluated_by: editingRisk.events[idx]?.reevaluated_by,
      })),
    };

    const updatedRisks = risks.map(r => r.id === editingRisk.id ? updatedRisk : r);
    setRisks(updatedRisks);

    // Update related actions
    const updatedActions = actions.map(a => {
      if (a.risk_id === editingRisk.id) {
        const event = updatedRisk.events.find(e => e.id === a.event_id);
        if (event) {
          return {
            ...a,
            risk_source: hazardLabel,
            event_description: event.description,
            action_description: event.measures || a.action_description,
            responsible: event.responsible || a.responsible,
            deadline: event.deadline || a.deadline,
          };
        }
      }
      return a;
    });
    setActions(updatedActions);

    // Reset form and close dialog
    setNewRisk({
      hazard_source: "",
      hazard_source_custom: "",
      events: [{ description: "", consequence: 3, probability: 3, measures: "", responsible: currentUserName, deadline: "" }]
    });
    setEditingRisk(null);
    setShowAddDialog(false);
    await persistData(updatedRisks, updatedActions);
    toast.success(t("auto.farekilde_oppdatert"));
  };

  // Close dialog and reset
  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingRisk(null);
    setNewRisk({
      hazard_source: "",
      hazard_source_custom: "",
      events: [{ description: "", consequence: 3, probability: 3, measures: "", responsible: currentUserName, deadline: "" }]
    });
  };

  // Add example risks
  const addExampleRisks = () => {
    const exampleRisks: RiskItem[] = [
      {
        id: crypto.randomUUID(),
        hazard_source: "annet",
        hazard_source_custom: "Brann på kontoret",
        events: [
          {
            id: crypto.randomUUID(),
            description: t("auto.brann_i_elektrisk_anlegg"),
            consequence: 4,
            probability: 2,
            measures: "Kontroller at man ikke har løse stikkontakter og unødvendig mye bruk av skjøtekabler!",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
          {
            id: crypto.randomUUID(),
            description: t("auto.brann_i_kaffetrakter"),
            consequence: 4,
            probability: 2,
            measures: "Montere timer på kaffetrakter",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
        ],
        created_at: new Date().toISOString(),
        created_by: currentUserName,
      },
      {
        id: crypto.randomUUID(),
        hazard_source: "arbeid_i_hoyden",
        events: [
          {
            id: crypto.randomUUID(),
            description: t("auto.fall_fra_stige_eller_stillas"),
            consequence: 5,
            probability: 3,
            measures: "Bruke godkjent stillas med rekkverk, aldri stige over 2 meter uten sikring",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
          {
            id: crypto.randomUUID(),
            description: t("auto.fallende_gjenstander_fra_hoeyden"),
            consequence: 4,
            probability: 3,
            measures: "Sikre verktøy med stropper, avsperring under arbeidsområde, påbudt hjelm",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
          {
            id: crypto.randomUUID(),
            description: t("auto.hengende_igjen_i_fallsikringsutstyr"),
            consequence: 3,
            probability: 2,
            measures: "Opplæring i bruk av fallsikring, aldri alenearbeid i høyden",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
        ],
        created_at: new Date().toISOString(),
        created_by: currentUserName,
      },
      {
        id: crypto.randomUUID(),
        hazard_source: "vold_trusler",
        hazard_source_custom: "",
        events: [
          {
            id: crypto.randomUUID(),
            description: t("auto.mobbing_eller_trakassering_paa_arbeidspl"),
            consequence: 4,
            probability: 2,
            measures: "Etablere tydelige rutiner mot mobbing, anonym varslingskanal, jevnlige medarbeidersamtaler",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
          {
            id: crypto.randomUUID(),
            description: t("auto.langvarig_stress_og_utbrenthet"),
            consequence: 4,
            probability: 3,
            measures: "Jevnlig oppfølging av arbeidsbelastning, fleksibel arbeidstid, tilgang til bedriftshelsetjeneste",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
        ],
        created_at: new Date().toISOString(),
        created_by: currentUserName,
      },
      {
        id: crypto.randomUUID(),
        hazard_source: "tunge_loft",
        events: [
          {
            id: crypto.randomUUID(),
            description: t("auto.ryggskade_ved_tunge_loeft"),
            consequence: 4,
            probability: 3,
            measures: "Opplæring i riktig løfteteknikk, bruk av løfteutstyr ved last over 15 kg",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
          {
            id: crypto.randomUUID(),
            description: t("auto.belastningsskader_ved_repetitivt_arbeid"),
            consequence: 3,
            probability: 3,
            measures: "Variere arbeidsoppgaver, jevnlige pauser, ergonomisk tilpasset arbeidsplass",
            responsible: currentUserName,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planlagt",
          },
        ],
        created_at: new Date().toISOString(),
        created_by: currentUserName,
      },
    ];

    // Create actions for yellow/red risks
    const newActions: ActionItem[] = [];
    exampleRisks.forEach(risk => {
      const hazardLabel = formatHazardName(
        risk.hazard_source === "annet"
          ? risk.hazard_source_custom
          : PREDEFINED_HAZARDS.find(h => h.value === risk.hazard_source)?.label || risk.hazard_source
      );
      
      risk.events.forEach(event => {
        const level = getRiskLevel(event.consequence, event.probability);
        if (level.requiresAction) {
          newActions.push({
            id: crypto.randomUUID(),
            risk_id: risk.id,
            event_id: event.id,
            risk_source: hazardLabel || "",
            event_description: event.description,
            action_description: event.measures,
            action_type: "teknisk",
            responsible: event.responsible,
            deadline: event.deadline,
            status: "planlagt",
            priority: level.level === "Tiltak påkrevd" ? "høy" : "medium",
          });
        }
      });
    });

    setRisks(prev => [...prev, ...exampleRisks]);
    setActions(prev => [...prev, ...newActions]);
    toast.success(`Lagt til 4 eksempler med ${newActions.length} tiltak`);
  };
  const allEvents = risks.flatMap(r => r.events || []);
  const stats = {
    totalSources: risks.length,
    totalEvents: allEvents.length,
    red: allEvents.filter(e => e.consequence * e.probability >= 11).length,
    redWithoutAction: allEvents.filter(e => e.consequence * e.probability >= 11 && !eventHasAction(e.id)).length,
    yellow: allEvents.filter(e => {
      const score = e.consequence * e.probability;
      return score >= 6 && score <= 10;
    }).length,
    green: allEvents.filter(e => e.consequence * e.probability <= 5).length,
    openActions: actions.filter(a => a.status !== "utført").length,
    overdueActions: actions.filter(a => a.status !== "utført" && a.deadline && new Date(a.deadline) < new Date()).length,
  };

  // Get highest risk level for a risk item
  const getHighestRiskLevel = (risk: RiskItem) => {
    const events = risk.events || [];
    if (events.length === 0) return getRiskLevel(1, 1);
    const maxScore = Math.max(...events.map(e => e.consequence * e.probability));
    const event = events.find(e => e.consequence * e.probability === maxScore);
    return event ? getRiskLevel(event.consequence, event.probability) : getRiskLevel(1, 1);
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
              <div className="text-2xl font-bold">{stats.totalSources}</div>
              <div className="text-xs text-muted-foreground">{t("auto.farekilder")}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-red-600">{stats.red}</div>
              <div className="text-xs text-muted-foreground">{t("auto.roede_11_25")}</div>
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
              <div className="text-xs text-muted-foreground">{t("auto.groenne_1_5")}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-orange-600">{stats.openActions}</div>
              <div className="text-xs text-muted-foreground">{t("auto.aapne_tiltak")}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-destructive">{stats.overdueActions}</div>
              <div className="text-xs text-muted-foreground">{t("auto.forfalt")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={(open) => open ? setShowAddDialog(true) : closeDialog()}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("auto.ny_risikovurdering")}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRisk ? "Rediger farekilde" : "Ny risikovurdering"}</DialogTitle>
                <DialogDescription>
                  {editingRisk ? "Endre farekilde og uønskede hendelser" : "Velg farekilde og legg til uønskede hendelser"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Step 1: Hazard Source */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                    {t("auto.farekilde")}
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>{t("auto.hva_er_kilden_til_faren_f_eks_arbeid_i_h")}</TooltipContent>
                    </Tooltip>
                  </label>
                  <Select value={newRisk.hazard_source} onValueChange={(v) => setNewRisk(p => ({ ...p, hazard_source: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_farekilde")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_HAZARDS.map(h => (
                        <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newRisk.hazard_source === "annet" && (
                    <Input 
                      placeholder={t("auto.beskriv_farekilden")}
                      value={newRisk.hazard_source_custom}
                      onChange={(e) => setNewRisk(p => ({ ...p, hazard_source_custom: e.target.value }))}
                    />
                  )}
                </div>

                {/* Step 2: Unwanted Events */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                    {t("auto.uoenskede_hendelser")}
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Legg til alle mulige uønskede hendelser fra denne farekilden. 
                        F.eks. for "Arbeid i høyden": fall, fallende gjenstander, hengende igjen i fallsikring.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  
                  <div className="space-y-4">
                    {newRisk.events.map((event, idx) => {
                      const riskLevel = getRiskLevel(event.consequence, event.probability);
                      
                      return (
                        <Card key={idx} className={cn("p-4", riskLevel.bg, riskLevel.border)}>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Hendelse {idx + 1}</span>
                              {newRisk.events.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => removeEventFromForm(idx)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Event description */}
                            <div>
                              <label className="text-xs text-muted-foreground">{t("auto.hva_kan_skje")}</label>
                              <Input 
                                placeholder={t("auto.beskriv_den_uoenskede_hendelsen")}
                                value={event.description}
                                onChange={(e) => updateEventInForm(idx, "description", e.target.value)}
                              />
                            </div>

                            {/* Consequence & Probability */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-muted-foreground">Konsekvens (K)</label>
                                <div className="flex gap-1 mt-1">
                                  {CONSEQUENCE_LEVELS.map(level => (
                                    <Tooltip key={level.value}>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          type="button"
                                          variant={event.consequence === level.value ? "default" : "outline"}
                                          size="sm"
                                          className="flex-1 h-8"
                                          onClick={() => updateEventInForm(idx, "consequence", level.value)}
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
                                <label className="text-xs text-muted-foreground">Sannsynlighet (S)</label>
                                <div className="flex gap-1 mt-1">
                                  {PROBABILITY_LEVELS.map(level => (
                                    <Tooltip key={level.value}>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          type="button"
                                          variant={event.probability === level.value ? "default" : "outline"}
                                          size="sm"
                                          className="flex-1 h-8"
                                          onClick={() => updateEventInForm(idx, "probability", level.value)}
                                        >
                                          {level.label}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom">{level.description}</TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Risk level display */}
                            <div className={cn("p-2 rounded flex items-center justify-between text-sm", riskLevel.bg)}>
                              <span>Risiko: {event.consequence} × {event.probability} = {event.consequence * event.probability}</span>
                              <Badge className={cn(riskLevel.bg, riskLevel.color)}>{riskLevel.level}</Badge>
                            </div>

                            {/* Measures */}
                            <div>
                              <label className="text-xs text-muted-foreground">{t("auto.tiltak")}</label>
                              <Textarea 
                                placeholder={t("auto.hvilke_tiltak_skal_er_iverksatt_for_denn")}
                                value={event.measures}
                                onChange={(e) => updateEventInForm(idx, "measures", e.target.value)}
                                className="min-h-[60px]"
                              />
                            </div>

                            {/* Responsible and deadline */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground">{t("auto.ansvarlig_2")}</label>
                                <Select value={event.responsible || ""} onValueChange={(v) => updateEventInForm(idx, "responsible", v)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("auto.velg_2")}>{event.responsible || "Velg"}</SelectValue>
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
                                <label className="text-xs text-muted-foreground">{t("auto.frist_2")}</label>
                                <Input 
                                  type="date" 
                                  value={event.deadline || ""}
                                  onChange={(e) => updateEventInForm(idx, "deadline", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                    <Button type="button" variant="outline" className="w-full" onClick={addEventToForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("auto.legg_til_flere_hendelser")}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={closeDialog}>{t("auto.avbryt")}</Button>
                <Button onClick={editingRisk ? saveEditedRisk : addRisk}>
                  {editingRisk ? "Lagre endringer" : "Legg til risikovurdering"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={addExampleRisks}>
            <Plus className="h-4 w-4 mr-2" />
            {t("auto.legg_til_eksempler")}
          </Button>
          </div>

          <Button onClick={handleSave} disabled={isSaving} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Lagrer..." : "Lagre"}
          </Button>
        </div>

        {/* Alert for red risks */}
        {stats.redWithoutAction > 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700">
                <strong>{stats.redWithoutAction} {stats.redWithoutAction === 1 ? "hendelse" : "hendelser"}</strong> {t("auto.krever_tiltak_roed_risiko_kan_ikke_godkj")}
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
              <CardDescription>{t("auto.farekilder_med_uoenskede_hendelser")}</CardDescription>
            </CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t("auto.ingen_risikoer_registrert")}</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("auto.legg_til_foerste_risiko")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {risks.map(risk => {
                    const hazardLabel = formatHazardName(
                      risk.hazard_source === "annet"
                        ? risk.hazard_source_custom
                        : PREDEFINED_HAZARDS.find(h => h.value === risk.hazard_source)?.label || risk.hazard_source
                    );
                    const highestLevel = getHighestRiskLevel(risk);
                    const isExpanded = expandedRisk === risk.id;

                    return (
                      <Collapsible
                        key={risk.id}
                        open={isExpanded}
                        onOpenChange={() => setExpandedRisk(isExpanded ? null : risk.id)}
                      >
                        <div className={cn("border rounded-lg overflow-hidden", highestLevel.border)}>
                          <CollapsibleTrigger className="w-full">
                            <div className={cn("p-3 flex items-center gap-2", highestLevel.bg)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="flex-1 text-left text-sm font-medium truncate">
                                {hazardLabel}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {(risk.events || []).length} hendelse{(risk.events || []).length !== 1 ? "r" : ""}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 space-y-3 border-t bg-background">
                              {(risk.events || []).map((event, idx) => {
                                const eventLevel = getRiskLevel(event.consequence, event.probability);
                                const hasReeval = event.consequence_after !== undefined;
                                const levelAfter = hasReeval ? getRiskLevel(event.consequence_after!, event.probability_after!) : null;

                                return (
                                  <div key={event.id} className={cn("p-3 rounded-lg text-sm", eventLevel.bg, eventLevel.border)}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="font-medium">{event.description}</p>
                                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                          <div>K×S: {event.consequence}×{event.probability} = {event.consequence * event.probability} ({eventLevel.level})</div>
                                          {event.measures && <div>Tiltak: {event.measures}</div>}
                                          {event.responsible && <div>Ansvarlig: {event.responsible}</div>}
                                          {event.deadline && <div>Frist: {new Date(event.deadline).toLocaleDateString("nb-NO")}</div>}
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <Badge className={cn("text-xs", eventLevel.bg, eventLevel.color)}>
                                          {event.consequence * event.probability}
                                        </Badge>
                                        {hasReeval && levelAfter && (
                                          <Badge className={cn("text-xs", levelAfter.bg, levelAfter.color)}>
                                            → {event.consequence_after! * event.probability_after!}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {hasReeval && (
                                      <div className={cn("mt-2 p-2 rounded text-xs", levelAfter?.bg)}>
                                        <div className="font-medium">{t("auto.etter_tiltak_2")}</div>
                                        <div>K×S: {event.consequence_after}×{event.probability_after} = {event.consequence_after! * event.probability_after!} ({levelAfter?.level})</div>
                                        {event.reevaluated_at && (
                                          <div className="text-muted-foreground">
                                            Revurdert {new Date(event.reevaluated_at).toLocaleDateString("nb-NO")} av {event.reevaluated_by}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Action buttons for this event */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {/* Show "Add action" button */}
                                      {!eventHasAction(event.id) ? (
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addActionForEvent(risk, event);
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          {t("auto.legg_til_tiltak")}
                                        </Button>
                                      ) : (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Har tiltak
                                        </Badge>
                                      )}

                                      {/* Re-evaluate button for yellow/red risks */}
                                      {eventLevel.requiresAction && !hasReeval && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEventForReeval({ 
                                              risk, 
                                              event: { ...event, consequence_after: event.consequence, probability_after: event.probability } 
                                            });
                                            setShowReevaluateDialog(true);
                                          }}
                                        >
                                          <RefreshCw className="h-3 w-3 mr-1" />
                                          Revurder
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="flex gap-2 pt-2 border-t">
                                <Button size="sm" variant="outline" onClick={() => startEditRisk(risk)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  {t("auto.rediger")}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteRisk(risk.id)}>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {t("auto.slett_farekilde")}
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
              <CardDescription>{t("auto.tiltak_for_aa_redusere_risiko")}</CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t("auto.ingen_tiltak_registrert")}</p>
                  <p className="text-xs mt-1">{t("auto.tiltak_opprettes_automatisk_for_gul_roed")}</p>
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
                            <p className="text-sm font-medium">{action.action_description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatHazardName(action.risk_source)}: {action.event_description}
                            </p>
                          </div>
                          <Select value={action.status} onValueChange={(v: any) => updateAction(action.id, { status: v })}>
                            <SelectTrigger className="w-[100px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planlagt">{t("auto.planlagt")}</SelectItem>
                              <SelectItem value="pågår">{t("auto.paagaar")}</SelectItem>
                              <SelectItem value="utført">{t("auto.utfoert")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Select value={action.action_type || "teknisk"} onValueChange={(v) => updateAction(action.id, { action_type: v })}>
                            <SelectTrigger className="w-[110px] h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder={t("auto.ansvarlig_2")}
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
              <DialogTitle>{t("auto.revurder_hendelse_etter_tiltak")}</DialogTitle>
              <DialogDescription>
                {t("auto.vurder_ny_konsekvens_og_sannsynlighet_et")}
              </DialogDescription>
            </DialogHeader>
            {selectedEventForReeval && (
              <div className="space-y-4">
                <div className="p-3 rounded bg-muted text-sm">
                  <strong>{t("auto.hendelse")}</strong> {selectedEventForReeval.event.description}
                  <div className="text-xs text-muted-foreground mt-1">
                    Før tiltak: {selectedEventForReeval.event.consequence}×{selectedEventForReeval.event.probability} = {selectedEventForReeval.event.consequence * selectedEventForReeval.event.probability}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{t("auto.ny_konsekvens_k")}</label>
                  <div className="flex gap-1 mt-1">
                    {CONSEQUENCE_LEVELS.map(level => (
                      <Tooltip key={level.value}>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant={selectedEventForReeval.event.consequence_after === level.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedEventForReeval(p => p ? { 
                              ...p, 
                              event: { ...p.event, consequence_after: level.value } 
                            } : null)}
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
                  <label className="text-sm font-medium">{t("auto.ny_sannsynlighet_s")}</label>
                  <div className="flex gap-1 mt-1">
                    {PROBABILITY_LEVELS.map(level => (
                      <Tooltip key={level.value}>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant={selectedEventForReeval.event.probability_after === level.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedEventForReeval(p => p ? { 
                              ...p, 
                              event: { ...p.event, probability_after: level.value } 
                            } : null)}
                          >
                            {level.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{level.description}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {selectedEventForReeval.event.consequence_after && selectedEventForReeval.event.probability_after && (
                  <div className={cn(
                    "p-3 rounded-lg",
                    getRiskLevel(selectedEventForReeval.event.consequence_after, selectedEventForReeval.event.probability_after).bg
                  )}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Ny risiko: {selectedEventForReeval.event.consequence_after} × {selectedEventForReeval.event.probability_after} = {selectedEventForReeval.event.consequence_after * selectedEventForReeval.event.probability_after}
                      </span>
                      <Badge className={cn(
                        getRiskLevel(selectedEventForReeval.event.consequence_after, selectedEventForReeval.event.probability_after).bg,
                        getRiskLevel(selectedEventForReeval.event.consequence_after, selectedEventForReeval.event.probability_after).color
                      )}>
                        {getRiskLevel(selectedEventForReeval.event.consequence_after, selectedEventForReeval.event.probability_after).level}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReevaluateDialog(false)}>{t("auto.avbryt")}</Button>
              <Button onClick={handleReevaluate}>{t("auto.bekreft_revurdering")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add action dialog */}
        <Dialog open={showAddActionDialog} onOpenChange={setShowAddActionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("auto.legg_til_tiltak")}</DialogTitle>
              <DialogDescription>
                {t("auto.beskriv_tiltaket_som_skal_redusere_risik")}
              </DialogDescription>
            </DialogHeader>
            {selectedEventForAction && (
              <div className="space-y-4">
                <div className="p-3 rounded bg-muted text-sm">
                  <strong>{t("auto.farekilde_2")}</strong> {formatHazardName(
                    selectedEventForAction.risk.hazard_source === "annet"
                      ? selectedEventForAction.risk.hazard_source_custom
                      : PREDEFINED_HAZARDS.find(h => h.value === selectedEventForAction.risk.hazard_source)?.label || selectedEventForAction.risk.hazard_source
                  )}
                  <div className="mt-1"><strong>{t("auto.hendelse")}</strong> {selectedEventForAction.event.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Risiko: {selectedEventForAction.event.consequence}×{selectedEventForAction.event.probability} = {selectedEventForAction.event.consequence * selectedEventForAction.event.probability}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("auto.beskrivelse_av_tiltak")}</label>
                  <Textarea 
                    placeholder={t("auto.hva_skal_gjoeres_for_aa_redusere_risikoe")}
                    value={newActionDescription}
                    onChange={(e) => setNewActionDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddActionDialog(false);
                setSelectedEventForAction(null);
                setNewActionDescription("");
              }}>
                {t("auto.avbryt")}
              </Button>
              <Button onClick={saveNewAction}>{t("auto.legg_til_tiltak")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legal reference footer */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          {t("auto.risikovurdering_i_henhold_til_internkont")}
        </div>
      </div>
    </TooltipProvider>
  );
}
