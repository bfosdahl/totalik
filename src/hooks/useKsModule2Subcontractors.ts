import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsModule2Subcontractor {
  id: string;
  project_id: string;
  company_id: string;
  firm_name: string;
  org_number: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  work_scope: string;
  trade: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  approval_status: 'pending' | 'approved' | 'approved_with_remarks' | 'rejected';
  approval_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewSubcontractorInput {
  firm_name: string;
  org_number?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  work_scope: string;
  trade?: string;
  contract_value?: number;
  start_date?: string;
  end_date?: string;
}

export const useKsModule2Subcontractors = (projectId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: subcontractors, isLoading } = useQuery({
    queryKey: ['ks-module2-subcontractors', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('ks_module2_subcontractors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KsModule2Subcontractor[];
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: NewSubcontractorInput) => {
      if (!profile?.company_id || !projectId) throw new Error("Mangler data");

      const { data, error } = await supabase
        .from('ks_module2_subcontractors')
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
      queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractors', projectId] });
      toast.success("Underleverandør registrert");
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error("Kunne ikke registrere underleverandør");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2Subcontractor> & { id: string }) => {
      const { data, error } = await supabase
        .from('ks_module2_subcontractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractors', projectId] });
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
        .from('ks_module2_subcontractors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractors', projectId] });
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
    updateSubcontractor: updateMutation.mutate,
    deleteSubcontractor: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

// Hook for subcontractor evaluations
export interface SubcontractorEvaluation {
  id: string;
  subcontractor_id: string;
  company_id: string;
  has_valid_org_number: boolean | null;
  has_tax_certificate: boolean | null;
  has_liability_insurance: boolean | null;
  has_valid_hms_card: boolean | null;
  has_required_certifications: boolean | null;
  has_signed_contract: boolean | null;
  has_competence_documentation: boolean | null;
  has_references: boolean | null;
  has_quality_system: boolean | null;
  has_environmental_plan: boolean | null;
  org_number_comment: string | null;
  tax_certificate_comment: string | null;
  liability_insurance_comment: string | null;
  hms_card_comment: string | null;
  certifications_comment: string | null;
  contract_comment: string | null;
  competence_comment: string | null;
  references_comment: string | null;
  quality_system_comment: string | null;
  environmental_plan_comment: string | null;
  overall_conclusion: 'approved' | 'approved_with_remarks' | 'rejected' | null;
  conclusion_notes: string | null;
  evaluated_by: string;
  evaluated_at: string;
}

export const useKsModule2SubcontractorEvaluation = (subcontractorId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['ks-module2-subcontractor-evaluation', subcontractorId],
    queryFn: async () => {
      if (!subcontractorId) return null;
      const { data, error } = await supabase
        .from('ks_module2_subcontractor_evaluations')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SubcontractorEvaluation | null;
    },
    enabled: !!subcontractorId,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: Partial<SubcontractorEvaluation>) => {
      if (!profile?.company_id || !subcontractorId) throw new Error("Mangler data");

      const userName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.email || 'Ukjent';

      // Upsert - update if exists, insert if not
      if (evaluation?.id) {
        const { data, error } = await supabase
          .from('ks_module2_subcontractor_evaluations')
          .update({
            ...input,
            evaluated_by: userName,
            evaluated_at: new Date().toISOString(),
          })
          .eq('id', evaluation.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('ks_module2_subcontractor_evaluations')
          .insert({
            subcontractor_id: subcontractorId,
            company_id: profile.company_id,
            evaluated_by: userName,
            ...input,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractor-evaluation', subcontractorId] });
      
      // Also update subcontractor approval status based on conclusion
      if (data.overall_conclusion) {
        const statusMap: Record<string, string> = {
          'approved': 'approved',
          'approved_with_remarks': 'approved_with_remarks',
          'rejected': 'rejected'
        };
        supabase
          .from('ks_module2_subcontractors')
          .update({ 
            approval_status: statusMap[data.overall_conclusion],
            approved_at: new Date().toISOString(),
            approved_by: data.evaluated_by
          })
          .eq('id', subcontractorId)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractors'] });
          });
      }
      
      toast.success("Gransking lagret");
    },
    onError: (error) => {
      console.error('Save evaluation error:', error);
      toast.error("Kunne ikke lagre gransking");
    },
  });

  return {
    evaluation,
    isLoading,
    saveEvaluation: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
};

// Hook for subcontractor documents
export interface SubcontractorDocument {
  id: string;
  subcontractor_id: string;
  company_id: string;
  document_type: 'contract' | 'insurance' | 'certification' | 'competence' | 'hms_card' | 'other';
  document_name: string;
  file_path: string;
  expiry_date: string | null;
  uploaded_by: string;
  created_at: string;
}

export const useKsModule2SubcontractorDocuments = (subcontractorId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['ks-module2-subcontractor-documents', subcontractorId],
    queryFn: async () => {
      if (!subcontractorId) return [];
      const { data, error } = await supabase
        .from('ks_module2_subcontractor_documents')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubcontractorDocument[];
    },
    enabled: !!subcontractorId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ 
      file, 
      documentType, 
      documentName,
      expiryDate 
    }: { 
      file: File; 
      documentType: SubcontractorDocument['document_type']; 
      documentName: string;
      expiryDate?: string;
    }) => {
      if (!profile?.company_id || !subcontractorId) throw new Error("Mangler data");

      const userName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.email || 'Ukjent';

      // Upload file
      const sanitizedName = file.name.replace(/[^\w.-]/g, '_');
      const filePath = `${profile.company_id}/${subcontractorId}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('subcontractor-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('ks_module2_subcontractor_documents')
        .insert({
          subcontractor_id: subcontractorId,
          company_id: profile.company_id,
          document_type: documentType,
          document_name: documentName,
          file_path: filePath,
          expiry_date: expiryDate || null,
          uploaded_by: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractor-documents', subcontractorId] });
      toast.success("Dokument lastet opp");
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error("Kunne ikke laste opp dokument");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const doc = documents?.find(d => d.id === id);
      if (doc) {
        await supabase.storage.from('subcontractor-files').remove([doc.file_path]);
      }

      const { error } = await supabase
        .from('ks_module2_subcontractor_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-module2-subcontractor-documents', subcontractorId] });
      toast.success("Dokument slettet");
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error("Kunne ikke slette dokument");
    },
  });

  const downloadDocument = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('subcontractor-files')
      .createSignedUrl(filePath, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return {
    documents: documents || [],
    isLoading,
    uploadDocument: uploadMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    downloadDocument,
    isUploading: uploadMutation.isPending,
  };
};
