import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface KsAvvik {
  id: string;
  company_id: string;
  project_id: string;
  avvik_nummer: string;
  tittel: string;
  beskrivelse: string | null;
  kategori: string;
  prioritet: string;
  status: string;
  ansvarlig: string | null;
  frist: string | null;
  oppdaget_dato: string;
  oppdaget_sted: string | null;
  type: 'avvik' | 'ruh';
  // RUH-specific fields
  incident_time?: string | null;
  incident_location?: string | null;
  incident_type?: string | null;
  severity?: string | null;
  consequences?: string | null;
  involved_persons?: string | null;
  root_cause_analysis?: string | null;
  immediate_actions?: string | null;
  preventive_measures?: string | null;
  reporter_contact?: string | null;
  responsible_receiver?: string | null;
  notify_arbeidstilsynet?: boolean;
  notify_insurance?: boolean;
  additional_info?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewKsAvvikInput {
  project_id: string;
  avvik_nummer: string;
  tittel: string;
  beskrivelse?: string;
  kategori: string;
  prioritet: string;
  status: string;
  ansvarlig?: string;
  frist?: string;
  oppdaget_dato: string;
  oppdaget_sted?: string;
  type: 'avvik' | 'ruh';
  // RUH-specific fields
  incident_time?: string;
  incident_location?: string;
  incident_type?: string;
  severity?: string;
  consequences?: string;
  involved_persons?: string;
  root_cause_analysis?: string;
  immediate_actions?: string;
  preventive_measures?: string;
  reporter_contact?: string;
  responsible_receiver?: string;
  notify_arbeidstilsynet?: boolean;
  notify_insurance?: boolean;
  additional_info?: string;
}

export function useKsAvvik() {
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: avvikList = [], isLoading } = useQuery({
    queryKey: ['ks-avvik', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from('ks_project_deviations')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KsAvvik[];
    },
    enabled: !!company?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: NewKsAvvikInput) => {
      if (!company?.id) throw new Error("No company");
      
      const { data: result, error } = await supabase
        .from('ks_project_deviations')
        .insert({
          company_id: company.id,
          project_id: input.project_id,
          avvik_nummer: input.avvik_nummer,
          tittel: input.tittel,
          beskrivelse: input.beskrivelse || null,
          kategori: input.kategori,
          prioritet: input.prioritet,
          status: input.status,
          ansvarlig: input.ansvarlig || null,
          frist: input.frist || null,
          oppdaget_dato: input.oppdaget_dato,
          oppdaget_sted: input.oppdaget_sted || null,
          type: input.type,
          incident_time: input.incident_time || null,
          incident_location: input.incident_location || null,
          incident_type: input.incident_type || null,
          severity: input.severity || null,
          consequences: input.consequences || null,
          involved_persons: input.involved_persons || null,
          root_cause_analysis: input.root_cause_analysis || null,
          immediate_actions: input.immediate_actions || null,
          preventive_measures: input.preventive_measures || null,
          reporter_contact: input.reporter_contact || null,
          responsible_receiver: input.responsible_receiver || null,
          notify_arbeidstilsynet: input.notify_arbeidstilsynet || false,
          notify_insurance: input.notify_insurance || false,
          additional_info: input.additional_info || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ks-avvik'] });
      toast({ 
        title: variables.type === 'avvik' ? "Avvik opprettet" : "RUH opprettet", 
        description: variables.type === 'avvik' ? "Avviket er registrert." : "Rapporten er registrert." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Feil", 
        description: error?.message || "Kunne ikke opprette rapport.", 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewKsAvvikInput> }) => {
      const { error } = await supabase
        .from('ks_project_deviations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-avvik'] });
      toast({ title: "Rapport oppdatert", description: "Endringene er lagret." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Feil", 
        description: error?.message || "Kunne ikke oppdatere rapport.", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ks_project_deviations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-avvik'] });
      toast({ title: "Rapport slettet", description: "Rapporten er fjernet." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Feil", 
        description: error?.message || "Kunne ikke slette rapport.", 
        variant: "destructive" 
      });
    },
  });

  return {
    avvikList,
    isLoading,
    createAvvik: createMutation.mutate,
    updateAvvik: updateMutation.mutate,
    deleteAvvik: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
