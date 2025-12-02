import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsSubcontractor {
  id: string;
  project_id: string;
  company_id: string;
  subcontractor_name: string;
  org_number: string | null;
  contact_person: string;
  contact_email: string;
  contact_phone: string | null;
  work_scope: string;
  work_description: string | null;
  status: 'active' | 'completed' | 'terminated';
  user_id: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  approval_status: 'godkjent' | 'ikke_godkjent' | 'godkjent_med_forbehold' | 'pending';
  approval_date: string | null;
  approved_by: string | null;
  approval_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewSubcontractorInput {
  subcontractor_name: string;
  org_number?: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  work_scope: string;
  work_description?: string;
  contract_value?: number;
  start_date?: string;
  end_date?: string;
}

export const useKsSubcontractors = (projectId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: subcontractors, isLoading } = useQuery({
    queryKey: ['ks-subcontractors', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('ks_project_subcontractors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KsSubcontractor[];
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: NewSubcontractorInput) => {
      if (!profile?.company_id || !projectId) throw new Error("Ingen bedrift eller prosjekt funnet");

      const { data, error } = await supabase
        .from('ks_project_subcontractors')
        .insert({
          project_id: projectId,
          company_id: profile.company_id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-subcontractors', projectId] });
      toast.success("Underleverandør opprettet");
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error("Kunne ikke opprette underleverandør");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewSubcontractorInput> }) => {
      const { data, error } = await supabase
        .from('ks_project_subcontractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-subcontractors', projectId] });
      toast.success("Underleverandør oppdatert");
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error("Kunne ikke oppdatere underleverandør");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ks_project_subcontractors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-subcontractors', projectId] });
      toast.success("Underleverandør slettet");
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error("Kunne ikke slette underleverandør");
    },
  });

  return {
    subcontractors: subcontractors || [],
    isLoading,
    createSubcontractor: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateSubcontractor: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSubcontractor: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

// Hook for contracts
export interface SubcontractorContract {
  id: string;
  subcontractor_id: string;
  company_id: string;
  contract_name: string;
  contract_number: string | null;
  contract_date: string | null;
  contract_value: number | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export const useSubcontractorContracts = (subcontractorId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['subcontractor-contracts', subcontractorId],
    queryFn: async () => {
      if (!subcontractorId) return [];
      const { data, error } = await supabase
        .from('ks_subcontractor_contracts')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubcontractorContract[];
    },
    enabled: !!subcontractorId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: {
      contract_name: string;
      contract_number?: string;
      contract_date?: string;
      contract_value?: number;
      description?: string;
      file: File;
    }) => {
      if (!profile?.company_id || !subcontractorId) throw new Error("Ingen bedrift eller underleverandør funnet");

      // Upload file
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${subcontractorId}/contracts/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('subcontractor-files')
        .upload(fileName, input.file);

      if (uploadError) throw uploadError;

      // Create record
      const { data, error } = await supabase
        .from('ks_subcontractor_contracts')
        .insert({
          subcontractor_id: subcontractorId,
          company_id: profile.company_id,
          contract_name: input.contract_name,
          contract_number: input.contract_number || null,
          contract_date: input.contract_date || null,
          contract_value: input.contract_value || null,
          description: input.description || null,
          file_path: fileName,
          file_name: input.file.name,
          file_size: input.file.size,
          file_type: input.file.type,
          uploaded_by: profile.id,
          uploaded_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractor-contracts', subcontractorId] });
      toast.success("Kontrakt lastet opp");
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error("Kunne ikke laste opp kontrakt");
    },
  });

  const downloadContract = async (contract: SubcontractorContract) => {
    try {
      const { data, error } = await supabase.storage
        .from('subcontractor-files')
        .download(contract.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = contract.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Kontrakt lastet ned");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Kunne ikke laste ned kontrakt");
    }
  };

  return {
    contracts: contracts || [],
    isLoading,
    uploadContract: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    downloadContract,
  };
};

// Hook for competence documentation
export interface SubcontractorCompetence {
  id: string;
  subcontractor_id: string;
  company_id: string;
  document_type: 'hms_card' | 'certificate' | 'insurance' | 'other';
  document_name: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  notes: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export const useSubcontractorCompetence = (subcontractorId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: competence, isLoading } = useQuery({
    queryKey: ['subcontractor-competence', subcontractorId],
    queryFn: async () => {
      if (!subcontractorId) return [];
      const { data, error } = await supabase
        .from('ks_subcontractor_competence')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubcontractorCompetence[];
    },
    enabled: !!subcontractorId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: {
      document_type: SubcontractorCompetence['document_type'];
      document_name: string;
      document_number?: string;
      issue_date?: string;
      expiry_date?: string;
      notes?: string;
      file: File;
    }) => {
      if (!profile?.company_id || !subcontractorId) throw new Error("Ingen bedrift eller underleverandør funnet");

      // Upload file
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${subcontractorId}/competence/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('subcontractor-files')
        .upload(fileName, input.file);

      if (uploadError) throw uploadError;

      // Create record
      const { data, error } = await supabase
        .from('ks_subcontractor_competence')
        .insert({
          subcontractor_id: subcontractorId,
          company_id: profile.company_id,
          document_type: input.document_type,
          document_name: input.document_name,
          document_number: input.document_number || null,
          issue_date: input.issue_date || null,
          expiry_date: input.expiry_date || null,
          notes: input.notes || null,
          file_path: fileName,
          file_name: input.file.name,
          file_size: input.file.size,
          file_type: input.file.type,
          uploaded_by: profile.id,
          uploaded_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractor-competence', subcontractorId] });
      toast.success("Kompetansedokument lastet opp");
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error("Kunne ikke laste opp dokument");
    },
  });

  return {
    competence: competence || [],
    isLoading,
    uploadCompetence: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
  };
};
