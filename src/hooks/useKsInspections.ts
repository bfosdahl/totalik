import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type InspectionType = 'ferdigbefaring' | 'forhåndsbefaring' | 'hms' | 'sluttbefaring' | 'vernerunde' | 'befaring';
export type InspectionStatus = 'planlagt' | 'ikke_startet' | 'pågår' | 'ferdig' | 'aktiv' | 'tilbud_opprettet' | 'faktura_opprettet' | 'fakturert' | 'utløpt';

export interface KsInspection {
  id: string;
  project_id: string;
  company_id: string;
  created_at: string;
  inspection_date: string;
  inspection_type: InspectionType;
  tittel: string | null;
  område: string | null;
  tidspunkt: string | null;
  planlagt_start: string | null;
  startdato: string | null;
  sluttdato: string | null;
  beskrivelse: string | null;
  adresse: string | null;
  postal_code: string | null;
  city: string | null;
  kunde_navn: string | null;
  gyldig_til: string | null;
  status: InspectionStatus;
  pris: number | null;
  template_id: string | null;
  results: any;
  opprettet_av_user_id: string | null;
  opprettet_av_navn: string | null;
  updated_at: string;
}

export function useKsInspections(projectId?: string) {
  const { profile } = useAuth();
  const [inspections, setInspections] = useState<KsInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInspections = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("ks_project_inspections")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("inspection_date", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInspections((data as KsInspection[]) || []);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      toast.error("Kunne ikke laste inspeksjoner");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [profile?.company_id, projectId]);

  const createInspection = async (inspection: Omit<KsInspection, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    if (!profile?.company_id) {
      toast.error("Ingen bedriftsinformasjon funnet");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ks_project_inspections")
        .insert({
          ...inspection,
          company_id: profile.company_id,
          opprettet_av_user_id: profile.user_id,
          opprettet_av_navn: profile.email
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Inspeksjon opprettet");
      await fetchInspections();
      return data;
    } catch (error) {
      console.error("Error creating inspection:", error);
      toast.error("Kunne ikke opprette inspeksjon");
    }
  };

  const updateInspection = async (id: string, updates: Partial<KsInspection>) => {
    try {
      const { error } = await supabase
        .from("ks_project_inspections")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Inspeksjon oppdatert");
      await fetchInspections();
    } catch (error) {
      console.error("Error updating inspection:", error);
      toast.error("Kunne ikke oppdatere inspeksjon");
    }
  };

  const deleteInspection = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_project_inspections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Inspeksjon slettet");
      await fetchInspections();
    } catch (error) {
      console.error("Error deleting inspection:", error);
      toast.error("Kunne ikke slette inspeksjon");
    }
  };

  return {
    inspections,
    isLoading,
    createInspection,
    updateInspection,
    deleteInspection,
    refetch: fetchInspections
  };
}
