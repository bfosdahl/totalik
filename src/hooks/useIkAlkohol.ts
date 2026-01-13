import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Types
export interface AlkoholLicense {
  id: string;
  company_id: string;
  license_type: string;
  municipality: string;
  license_number: string | null;
  valid_from: string | null;
  valid_to: string | null;
  concept_category: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  manager_email: string | null;
  deputy_name: string | null;
  deputy_phone: string | null;
  deputy_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlkoholComplianceItem {
  id: string;
  company_id: string;
  rule_reference: string;
  violation_description: string;
  points: number;
  recommended_focus: string | null;
  category: string | null;
  is_active: boolean;
  is_template: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AlkoholRiskControl {
  id: string;
  company_id: string;
  license_id: string | null;
  compliance_item_id: string | null;
  challenges: string | null;
  preventive_measures: string | null;
  responsible_role: string | null;
  deadline_period: string | null;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  compliance_item?: AlkoholComplianceItem;
}

export interface AlkoholTraining {
  id: string;
  company_id: string;
  employee_name: string;
  role: string;
  training_type: string;
  required_by: string | null;
  completed_date: string | null;
  expires_date: string | null;
  documentation_path: string | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlkoholIncident {
  id: string;
  company_id: string;
  license_id: string | null;
  compliance_item_id: string | null;
  incident_number: string;
  incident_date: string;
  incident_time: string | null;
  incident_type: string;
  description: string;
  handling: string | null;
  involved_parties: string | null;
  learning_improvement: string | null;
  reported_by_id: string | null;
  reported_by_name: string | null;
  status: string;
  severity: string;
  created_at: string;
  updated_at: string;
}

export interface AlkoholReview {
  id: string;
  company_id: string;
  license_id: string | null;
  review_type: string;
  planned_date: string;
  completed_date: string | null;
  agenda_points: any[];
  tasks: any[];
  summary: string | null;
  participants: string | null;
  status: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlkoholAttachment {
  id: string;
  company_id: string;
  category: string;
  document_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by_id: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

// Default compliance items based on Norwegian prikksystem
export const DEFAULT_COMPLIANCE_ITEMS: Omit<AlkoholComplianceItem, 'id' | 'company_id' | 'created_at' | 'updated_at'>[] = [
  {
    rule_reference: "AL § 1-8",
    violation_description: "Salg eller skjenking til mindreårige",
    points: 8,
    recommended_focus: "Alderskontroll ved alle salg",
    category: "alderskontroll",
    is_active: true,
    is_template: true,
    sort_order: 1
  },
  {
    rule_reference: "AL § 8-11",
    violation_description: "Salg eller skjenking til åpenbart beruset person",
    points: 8,
    recommended_focus: "Observasjon og opplæring i å gjenkjenne beruselse",
    category: "ruspavirkning",
    is_active: true,
    is_template: true,
    sort_order: 2
  },
  {
    rule_reference: "AL § 4-4",
    violation_description: "Brudd på skjenketider",
    points: 4,
    recommended_focus: "Rutiner for siste servering og stengetid",
    category: "skjenketid",
    is_active: true,
    is_template: true,
    sort_order: 3
  },
  {
    rule_reference: "AL § 4-7",
    violation_description: "Manglende kontroll med ro og orden",
    points: 2,
    recommended_focus: "Vaktholdrutiner og konflikthåndtering",
    category: "orden",
    is_active: true,
    is_template: true,
    sort_order: 4
  },
  {
    rule_reference: "AF § 4-1",
    violation_description: "Styrer eller stedfortreder ikke til stede",
    points: 2,
    recommended_focus: "Sikre at ansvarlig alltid er tilstede",
    category: "bemanning",
    is_active: true,
    is_template: true,
    sort_order: 5
  },
  {
    rule_reference: "AL § 1-7c",
    violation_description: "Tillatt beruset person å oppholde seg på stedet",
    points: 4,
    recommended_focus: "Bortvisningsrutiner",
    category: "ruspavirkning",
    is_active: true,
    is_template: true,
    sort_order: 6
  },
  {
    rule_reference: "AF § 4-2",
    violation_description: "Manglende internkontroll",
    points: 2,
    recommended_focus: "Dokumentert internkontrollsystem",
    category: "internkontroll",
    is_active: true,
    is_template: true,
    sort_order: 7
  },
  {
    rule_reference: "AL § 4-2",
    violation_description: "Skjenking utenfor godkjent areal",
    points: 2,
    recommended_focus: "Tydelig markering av skjenkeområde",
    category: "areal",
    is_active: true,
    is_template: true,
    sort_order: 8
  },
  {
    rule_reference: "AF § 4-5",
    violation_description: "Manglende aldersmerking",
    points: 1,
    recommended_focus: "Synlig aldersmerking ved inngang og bar",
    category: "alderskontroll",
    is_active: true,
    is_template: true,
    sort_order: 9
  },
  {
    rule_reference: "AL § 8-6",
    violation_description: "Ulovlig reklame for alkohol",
    points: 1,
    recommended_focus: "Fjern all alkoholreklame",
    category: "reklame",
    is_active: true,
    is_template: true,
    sort_order: 10
  },
];

export function useIkAlkohol() {
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  // Licenses
  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ["ik-alkohol-licenses", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_licenses")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlkoholLicense[];
    },
    enabled: !!companyId,
  });

  const createLicense = useMutation({
    mutationFn: async (license: Partial<AlkoholLicense>) => {
      if (!companyId) throw new Error("No company");
      const { data, error } = await supabase
        .from("ik_alkohol_licenses")
        .insert([{ ...license, company_id: companyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-licenses"] });
      toast({ title: "Bevilling opprettet" });
    },
    onError: (error: any) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const updateLicense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholLicense> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_alkohol_licenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-licenses"] });
      toast({ title: "Bevilling oppdatert" });
    },
  });

  // Compliance Items
  const { data: complianceItems = [], isLoading: complianceLoading } = useQuery({
    queryKey: ["ik-alkohol-compliance", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_compliance_items")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AlkoholComplianceItem[];
    },
    enabled: !!companyId,
  });

  const initializeComplianceItems = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      
      // Check if already initialized
      const { count } = await supabase
        .from("ik_alkohol_compliance_items")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      
      if (count && count > 0) return;

      const items = DEFAULT_COMPLIANCE_ITEMS.map(item => ({
        ...item,
        company_id: companyId,
      }));

      const { error } = await supabase
        .from("ik_alkohol_compliance_items")
        .insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-compliance"] });
    },
  });

  // Risk Controls
  const { data: riskControls = [], isLoading: riskControlsLoading } = useQuery({
    queryKey: ["ik-alkohol-risk-controls", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_risk_controls")
        .select("*, compliance_item:ik_alkohol_compliance_items(*)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlkoholRiskControl[];
    },
    enabled: !!companyId,
  });

  const upsertRiskControl = useMutation({
    mutationFn: async (control: Partial<AlkoholRiskControl>) => {
      if (!companyId) throw new Error("No company");
      
      if (control.id) {
        const { data, error } = await supabase
          .from("ik_alkohol_risk_controls")
          .update(control)
          .eq("id", control.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("ik_alkohol_risk_controls")
          .insert({ ...control, company_id: companyId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-risk-controls"] });
      toast({ title: "Tiltak lagret" });
    },
  });

  // Training
  const { data: training = [], isLoading: trainingLoading } = useQuery({
    queryKey: ["ik-alkohol-training", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_training")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlkoholTraining[];
    },
    enabled: !!companyId,
  });

  const createTraining = useMutation({
    mutationFn: async (training: Partial<AlkoholTraining>) => {
      if (!companyId) throw new Error("No company");
      const { data, error } = await supabase
        .from("ik_alkohol_training")
        .insert([{ ...training, company_id: companyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-training"] });
      toast({ title: "Opplæring registrert" });
    },
  });

  const updateTraining = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholTraining> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_alkohol_training")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-training"] });
      toast({ title: "Opplæring oppdatert" });
    },
  });

  const deleteTraining = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_alkohol_training")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-training"] });
      toast({ title: "Opplæring slettet" });
    },
  });

  // Incidents
  const { data: incidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ["ik-alkohol-incidents", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_incidents")
        .select("*")
        .eq("company_id", companyId)
        .order("incident_date", { ascending: false });
      if (error) throw error;
      return data as AlkoholIncident[];
    },
    enabled: !!companyId,
  });

  const createIncident = useMutation({
    mutationFn: async (incident: Partial<AlkoholIncident>) => {
      if (!companyId) throw new Error("No company");
      
      // Generate incident number
      const { count } = await supabase
        .from("ik_alkohol_incidents")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      
      const incidentNumber = `ALK-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;
      
      const { data, error } = await supabase
        .from("ik_alkohol_incidents")
        .insert([{ ...incident, company_id: companyId, incident_number: incidentNumber }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-incidents"] });
      toast({ title: "Hendelse registrert" });
    },
  });

  const updateIncident = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholIncident> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_alkohol_incidents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-incidents"] });
      toast({ title: "Hendelse oppdatert" });
    },
  });

  // Reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["ik-alkohol-reviews", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_reviews")
        .select("*")
        .eq("company_id", companyId)
        .order("planned_date", { ascending: false });
      if (error) throw error;
      return data as AlkoholReview[];
    },
    enabled: !!companyId,
  });

  const createReview = useMutation({
    mutationFn: async (review: Partial<AlkoholReview>) => {
      if (!companyId) throw new Error("No company");
      const { data, error } = await supabase
        .from("ik_alkohol_reviews")
        .insert([{ ...review, company_id: companyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-reviews"] });
      toast({ title: "Revisjon planlagt" });
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholReview> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_alkohol_reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-reviews"] });
      toast({ title: "Revisjon oppdatert" });
    },
  });

  // Attachments
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ["ik-alkohol-attachments", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_attachments")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlkoholAttachment[];
    },
    enabled: !!companyId,
  });

  return {
    // Licenses
    licenses,
    licensesLoading,
    createLicense,
    updateLicense,
    
    // Compliance Items
    complianceItems,
    complianceLoading,
    initializeComplianceItems,
    
    // Risk Controls
    riskControls,
    riskControlsLoading,
    upsertRiskControl,
    
    // Training
    training,
    trainingLoading,
    createTraining,
    updateTraining,
    deleteTraining,
    
    // Incidents
    incidents,
    incidentsLoading,
    createIncident,
    updateIncident,
    
    // Reviews
    reviews,
    reviewsLoading,
    createReview,
    updateReview,
    
    // Attachments
    attachments,
    attachmentsLoading,
  };
}
