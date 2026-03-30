import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CompanyKsRoutine {
  id: string;
  company_id: string;
  routine_name: string;
  description: string | null;
  content: string;
  category: string;
  admin_template_id: string | null;
  file_path: string | null;
  version: string;
  is_active: boolean;
  sort_order: number;
  routine_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewRoutineInput {
  routine_name: string;
  description?: string;
  content?: string;
  category?: string;
  admin_template_id?: string;
  routine_number?: string;
}

export function useCompanyKsRoutines() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const [routines, setRoutines] = useState<CompanyKsRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoutines = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_ks_routines")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error fetching KS routines:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const createRoutine = async (input: NewRoutineInput) => {
    if (!companyId) return null;
    
    setIsSaving(true);
    try {
      const maxOrder = routines.length > 0 
        ? Math.max(...routines.map(r => r.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from("company_ks_routines")
        .insert({
          company_id: companyId,
          routine_name: input.routine_name,
          description: input.description || null,
          content: input.content || "",
          category: input.category || "general",
          admin_template_id: input.admin_template_id || null,
          routine_number: input.routine_number || null,
          sort_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      
      setRoutines(prev => [...prev, data]);
      toast({ title: "Rutine opprettet" });
      return data;
    } catch (error) {
      console.error("Error creating routine:", error);
      toast({ title: "Kunne ikke opprette rutine", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateRoutine = async (id: string, updates: Partial<CompanyKsRoutine>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_routines")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast({ title: "Rutine oppdatert" });
    } catch (error) {
      console.error("Error updating routine:", error);
      toast({ title: "Kunne ikke oppdatere rutine", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRoutine = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_routines")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setRoutines(prev => prev.filter(r => r.id !== id));
      toast({ title: "Rutine slettet" });
    } catch (error) {
      console.error("Error deleting routine:", error);
      toast({ title: "Kunne ikke slette rutine", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocument = async (routineId: string, file: File) => {
    if (!companyId) return null;
    
    setIsSaving(true);
    try {
      const filePath = `${companyId}/ks-routines/${routineId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;
      
      await updateRoutine(routineId, { file_path: filePath });
      return filePath;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Kunne ikke laste opp dokument", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("company-documents")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  };

  return {
    routines,
    isLoading,
    isSaving,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    uploadDocument,
    getDocumentUrl,
    refetch: fetchRoutines,
  };
}
