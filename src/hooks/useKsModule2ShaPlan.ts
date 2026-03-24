import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ShaPlan {
  id: string;
  company_id: string;
  project_id: string;
  plan_type: "internal" | "external";
  status: "draft" | "pending_signatures" | "signed" | "approved";
  external_file_path: string | null;
  external_file_name: string | null;
  uploaded_by_name: string | null;
  uploaded_at: string | null;
  template_id: string | null;
  project_name: string | null;
  project_address: string | null;
  client_name: string | null;
  client_org_number: string | null;
  client_contact_person: string | null;
  sha_coordinator_kp: string | null;
  sha_coordinator_ku: string | null;
  contractor_type: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  risk_areas: RiskArea[];
  organization_data: OrganizationData;
  change_routine_text: string | null;
  client_signature: string | null;
  client_signed_at: string | null;
  client_signed_by: string | null;
  kp_signature: string | null;
  kp_signed_at: string | null;
  kp_signed_by: string | null;
  ku_signature: string | null;
  ku_signed_at: string | null;
  ku_signed_by: string | null;
  version_number: number;
  is_current_version: boolean;
  entrepreneur_approved: boolean;
  entrepreneur_approved_at: string | null;
  entrepreneur_approved_by: string | null;
  signed_pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskArea {
  id: string;
  paragraph: string;
  description: string;
  checked: boolean;
  measures: string;
}

export interface OrganizationData {
  client?: { name: string; role: string };
  kp?: { name: string; role: string };
  ku?: { name: string; role: string };
  projectLeader?: { name: string; role: string };
  subcontractors?: Array<{ name: string; trade: string }>;
}

export interface ShaTilpasning {
  id: string;
  company_id: string;
  project_id: string;
  sha_plan_id: string | null;
  implementation_description: string | null;
  additional_measures: AdditionalMeasure[];
  linked_sja_ids: string[];
  linked_vernerunde_ids: string[];
  linked_avvik_ids: string[];
  project_leader_signature: string | null;
  project_leader_signed_at: string | null;
  project_leader_signed_by: string | null;
  status: "draft" | "signed";
  created_at: string;
  updated_at: string;
}

export interface AdditionalMeasure {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
}

// Byggherreforskriften §8 risk areas (17 points)
export const DEFAULT_RISK_AREAS: Omit<RiskArea, "id" | "checked" | "measures">[] = [
  { paragraph: "a", description: "Arbeid som innebærer særlig fare for å bli begravet, synke ned eller falle" },
  { paragraph: "b", description: "Arbeid som utsetter arbeidstakerne for kjemiske eller biologiske stoffer som utgjør særlig helsefare" },
  { paragraph: "c", description: "Arbeid med ioniserende stråling som krever at det utpekes kontrollerte eller overvåkede soner" },
  { paragraph: "d", description: "Arbeid i nærheten av høyspentledninger" },
  { paragraph: "e", description: "Arbeid som innebærer fare for drukning" },
  { paragraph: "f", description: "Arbeid i brønner og tunneler samt underjordisk arbeid" },
  { paragraph: "g", description: "Arbeid under vann med dykkerutstyr" },
  { paragraph: "h", description: "Arbeid i trykkammer" },
  { paragraph: "i", description: "Arbeid som innebærer bruk av sprengstoff" },
  { paragraph: "j", description: "Arbeid med montering eller demontering av tunge prefabrikkerte elementer" },
  { paragraph: "k", description: "Arbeid som innebærer riving av bærende konstruksjoner" },
  { paragraph: "l", description: "Arbeid med støping og oppspenning av spennarmering" },
  { paragraph: "m", description: "Arbeid på steder med risiko for fall" },
  { paragraph: "n", description: "Arbeid som utsetter arbeidstakere for eksponering fra elektrisk spenning" },
  { paragraph: "o", description: "Arbeid med graving dypere enn 1,25 meter og som kan medføre fare for ras" },
  { paragraph: "p", description: "Arbeid som innebærer fare for helseskadelig eksponering for støv, støy og vibrasjon" },
  { paragraph: "q", description: "Arbeid ved eller på vei, jernbane, rullebane eller annen trafikkert grunn" },
];

export function useKsModule2ShaPlan(projectId: string) {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [shaPlan, setShaPlan] = useState<ShaPlan | null>(null);
  const [tilpasning, setTilpasning] = useState<ShaTilpasning | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchShaPlan = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      
      // Fetch current SHA plan
      const { data: planData, error: planError } = await supabase
        .from("ks_module2_sha_plans")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_current_version", true)
        .maybeSingle();

      if (planError) throw planError;
      
      if (planData) {
        setShaPlan({
          ...planData,
          risk_areas: (planData.risk_areas as unknown as RiskArea[]) || [],
          organization_data: (planData.organization_data as unknown as OrganizationData) || {},
        } as ShaPlan);

        // Fetch tilpasning
        const { data: tilpasningData, error: tilpasningError } = await supabase
          .from("ks_module2_sha_tilpasning")
          .select("*")
          .eq("project_id", projectId)
          .eq("sha_plan_id", planData.id)
          .maybeSingle();

        if (tilpasningError) throw tilpasningError;
        
        if (tilpasningData) {
          setTilpasning({
            ...tilpasningData,
            additional_measures: (tilpasningData.additional_measures as unknown as AdditionalMeasure[]) || [],
            linked_sja_ids: tilpasningData.linked_sja_ids || [],
            linked_vernerunde_ids: tilpasningData.linked_vernerunde_ids || [],
            linked_avvik_ids: tilpasningData.linked_avvik_ids || [],
          } as ShaTilpasning);
        }
      }
    } catch (error) {
      console.error("Error fetching SHA plan:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente SHA-plan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchShaPlan();
  }, [fetchShaPlan]);

  const createInternalPlan = async (projectData: {
    project_name: string;
    project_address: string | null;
    client_name: string | null;
    client_org_number: string | null;
    client_contact_person: string | null;
    sha_coordinator_kp: string | null;
    sha_coordinator_ku: string | null;
    contractor_type: string | null;
    planned_start_date: string | null;
    planned_end_date: string | null;
  }, riskAreas?: RiskArea[], changeRoutineText?: string) => {
    if (!profile?.company_id || !user?.id) return null;

    try {
      setIsSaving(true);

      // Use provided risk areas or initialize with defaults
      const finalRiskAreas: RiskArea[] = riskAreas || DEFAULT_RISK_AREAS.map((ra, index) => ({
        id: `risk-${index}`,
        ...ra,
        checked: false,
        measures: "",
      }));

      const { data, error } = await supabase
        .from("ks_module2_sha_plans")
        .insert([{
          company_id: profile.company_id,
          project_id: projectId,
          plan_type: "internal",
          status: "draft",
          created_by: user.id,
          ...projectData,
          risk_areas: finalRiskAreas as unknown as any,
          change_routine_text: changeRoutineText || "Ved endringer i prosjektet som påvirker sikkerhet, helse og arbeidsmiljø, skal SHA-planen revideres. Alle parter skal varsles om endringer.",
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "SHA-plan opprettet",
      });

      await fetchShaPlan();
      return data;
    } catch (error) {
      console.error("Error creating internal SHA plan:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette SHA-plan",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const uploadExternalPlan = async (file: File, uploadedByName: string) => {
    if (!profile?.company_id || !user?.id) return null;

    try {
      setIsSaving(true);

      // Upload file to storage
      const fileName = `${projectId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("sha-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create SHA plan record
      const { data, error } = await supabase
        .from("ks_module2_sha_plans")
        .insert([{
          company_id: profile.company_id,
          project_id: projectId,
          plan_type: "external",
          status: "draft",
          external_file_path: fileName,
          external_file_name: file.name,
          uploaded_by_name: uploadedByName,
          uploaded_at: new Date().toISOString(),
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Auto-create tilpasning for external plans
      await supabase
        .from("ks_module2_sha_tilpasning")
        .insert([{
          company_id: profile.company_id,
          project_id: projectId,
          sha_plan_id: data.id,
          created_by: user.id,
        }]);

      toast({
        title: "Suksess",
        description: "SHA-plan lastet opp",
      });

      await fetchShaPlan();
      return data;
    } catch (error) {
      console.error("Error uploading external SHA plan:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste opp SHA-plan",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateShaPlan = async (updates: Partial<ShaPlan>) => {
    if (!shaPlan) return false;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("ks_module2_sha_plans")
        .update(updates as any)
        .eq("id", shaPlan.id);

      if (error) throw error;

      toast({
        title: "Lagret",
        description: "SHA-plan oppdatert",
      });

      await fetchShaPlan();
      return true;
    } catch (error) {
      console.error("Error updating SHA plan:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere SHA-plan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const approveAsEntrepreneur = async (approvedByName: string) => {
    if (!shaPlan) return false;

    return updateShaPlan({
      entrepreneur_approved: true,
      entrepreneur_approved_at: new Date().toISOString(),
      entrepreneur_approved_by: approvedByName,
      status: "approved",
    } as Partial<ShaPlan>);
  };

  const updateTilpasning = async (updates: Partial<ShaTilpasning>) => {
    if (!tilpasning) return false;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("ks_module2_sha_tilpasning")
        .update(updates as any)
        .eq("id", tilpasning.id);

      if (error) throw error;

      toast({
        title: "Lagret",
        description: "Tilpasning oppdatert",
      });

      await fetchShaPlan();
      return true;
    } catch (error) {
      console.error("Error updating tilpasning:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere tilpasning",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const createTilpasning = async () => {
    if (!profile?.company_id || !user?.id || !shaPlan) return null;

    try {
      setIsSaving(true);

      const { data, error } = await supabase
        .from("ks_module2_sha_tilpasning")
        .insert([{
          company_id: profile.company_id,
          project_id: projectId,
          sha_plan_id: shaPlan.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchShaPlan();
      return data;
    } catch (error) {
      console.error("Error creating tilpasning:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette tilpasning",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const getExternalFileUrl = async () => {
    if (!shaPlan?.external_file_path) return null;

    const { data } = await supabase.storage
      .from("sha-documents")
      .createSignedUrl(shaPlan.external_file_path, 3600);

    return data?.signedUrl || null;
  };

  return {
    shaPlan,
    tilpasning,
    isLoading,
    isSaving,
    createInternalPlan,
    uploadExternalPlan,
    updateShaPlan,
    approveAsEntrepreneur,
    updateTilpasning,
    createTilpasning,
    getExternalFileUrl,
    refetch: fetchShaPlan,
  };
}
