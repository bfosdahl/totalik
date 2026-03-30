import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface KsModule2Project {
  id: string;
  company_id: string;
  project_name: string;
  project_number: string;
  address: string | null;
  gnr_bnr: string | null;
  client_name: string | null;
  client_org_number: string | null;
  client_contact_person: string | null;
  client_phone: string | null;
  client_email: string | null;
  contractor_type: "total" | "hoved" | "under" | null;
  project_leader_id: string | null;
  project_leader_name: string | null;
  sha_coordinator_kp: string | null;
  sha_coordinator_ku: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  contract_sum: number | null;
  description: string | null;
  status: "planned" | "active" | "handover" | "warranty" | "completed";
  progress_percent: number;
  is_favorite: boolean;
  last_activity_date: string | null;
  last_activity_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewKsModule2ProjectInput {
  project_name: string;
  project_number?: string;
  address?: string;
  gnr_bnr?: string;
  client_name?: string;
  client_org_number?: string;
  client_contact_person?: string;
  client_phone?: string;
  client_email?: string;
  contractor_type?: "total" | "hoved" | "under";
  project_leader_id?: string;
  project_leader_name?: string;
  sha_coordinator_kp?: string;
  sha_coordinator_ku?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  contract_sum?: number;
  description?: string;
}

export function useKsModule2Projects() {
  const { profile, isGuestUser, guestProjects } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<KsModule2Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    // For guest users, fetch only their accessible projects
    if (isGuestUser && guestProjects.length > 0) {
      try {
        setIsLoading(true);
        const projectIds = guestProjects.map(p => p.project_id);
        const { data, error } = await supabase
          .from("ks_module2_projects")
          .select("*")
          .in("id", projectIds)
          .eq("is_deleted", false)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setProjects((data as KsModule2Project[]) || []);
      } catch (error) {
        console.error("Error fetching guest projects:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke hente prosjekter",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For regular company users
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ks_module2_projects")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_deleted", false)
        .order("is_favorite", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects((data as KsModule2Project[]) || []);
    } catch (error) {
      console.error("Error fetching KS Module 2 projects:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente prosjekter",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id, isGuestUser, guestProjects, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (input: NewKsModule2ProjectInput) => {
    if (!profile?.company_id || !profile?.id) {
      toast({
        title: "Feil",
        description: "Du må være logget inn for å opprette prosjekt",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from("ks_module2_projects")
        .insert([{
          company_id: profile.company_id,
          created_by: profile.id,
          project_name: input.project_name,
          project_number: input.project_number || "",
          address: input.address || null,
          gnr_bnr: input.gnr_bnr || null,
          client_name: input.client_name || null,
          client_org_number: input.client_org_number || null,
          client_contact_person: input.client_contact_person || null,
          client_phone: input.client_phone || null,
          client_email: input.client_email || null,
          contractor_type: input.contractor_type || null,
          project_leader_id: input.project_leader_id || null,
          project_leader_name: input.project_leader_name || null,
          sha_coordinator_kp: input.sha_coordinator_kp || null,
          sha_coordinator_ku: input.sha_coordinator_ku || null,
          planned_start_date: input.planned_start_date || null,
          planned_end_date: input.planned_end_date || null,
          contract_sum: input.contract_sum || null,
          description: input.description || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Prosjekt opprettet",
      });

      await fetchProjects();
      return data as KsModule2Project;
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette prosjekt",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<NewKsModule2ProjectInput>) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ks_module2_projects")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Prosjekt oppdatert",
      });

      await fetchProjects();
      return true;
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere prosjekt",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from("ks_module2_projects")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_favorite: !isFavorite } : p))
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_module2_projects")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Prosjekt slettet",
      });

      await fetchProjects();
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette prosjekt",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    projects,
    isLoading,
    isSaving,
    createProject,
    updateProject,
    toggleFavorite,
    deleteProject,
    refetch: fetchProjects,
  };
}
