import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TimelineEvent {
  id: string;
  project_id: string;
  company_id: string;
  title: string;
  description: string | null;
  event_date: string;
  photo_paths: string[];
  category: string;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useKsModule2TimelineEvents(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["ks-module2-timeline-events", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_timeline_events")
        .select("*")
        .eq("project_id", projectId)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!projectId,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<TimelineEvent, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ks_module2_timeline_events")
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-timeline-events", projectId] });
      toast({ title: "Hendelse opprettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved opprettelse", description: error.message, variant: "destructive" });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimelineEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_timeline_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-timeline-events", projectId] });
      toast({ title: "Hendelse oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil ved oppdatering", description: error.message, variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_timeline_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-timeline-events", projectId] });
      toast({ title: "Hendelse slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
    },
  });

  const uploadPhoto = async (file: File, projectId: string): Promise<string | null> => {
    const fileName = `${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { error } = await supabase.storage
      .from("ks-module2-files")
      .upload(fileName, file);

    if (error) {
      toast({ title: "Feil ved opplasting", description: error.message, variant: "destructive" });
      return null;
    }

    return fileName;
  };

  const getPhotoUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from("ks-module2-files")
      .createSignedUrl(path, 3600);

    return data?.signedUrl || null;
  };

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadPhoto,
    getPhotoUrl,
  };
}
