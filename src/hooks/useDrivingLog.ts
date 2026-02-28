import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DrivingLogEntry {
  id: string;
  user_id: string;
  company_id: string;
  trip_date: string;
  purpose: string;
  start_location: string;
  end_location: string;
  via_locations: string | null;
  odometer_start: number;
  odometer_end: number;
  distance_km: number;
  vehicle_type: string;
  vehicle_registration: string | null;
  vehicle_description: string | null;
  trip_type: string;
  passenger_count: number;
  passengers: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDrivingLogInput {
  trip_date: string;
  purpose: string;
  start_location: string;
  end_location: string;
  via_locations?: string;
  odometer_start: number;
  odometer_end: number;
  vehicle_type: string;
  vehicle_registration?: string;
  vehicle_description?: string;
  trip_type: string;
  passenger_count?: number;
  passengers?: string;
  notes?: string;
}

export function useDrivingLog() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const entries = useQuery({
    queryKey: ["driving-log", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_log_entries")
        .select("*")
        .order("trip_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DrivingLogEntry[];
    },
    enabled: !!profile?.id,
  });

  const createEntry = useMutation({
    mutationFn: async (input: CreateDrivingLogInput) => {
      if (!profile?.id || !profile?.company_id) throw new Error("Ikke innlogget");

      const { data, error } = await supabase
        .from("driving_log_entries")
        .insert({
          user_id: profile.id,
          company_id: profile.company_id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      toast.success("Tur registrert i kjøreboken");
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere tur: " + error.message);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateDrivingLogInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("driving_log_entries")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      toast.success("Tur oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere tur: " + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("driving_log_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      toast.success("Tur slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette tur: " + error.message);
    },
  });

  // Statistics
  const stats = entries.data ? {
    totalTrips: entries.data.length,
    totalKm: entries.data.reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
    businessKm: entries.data.filter(e => e.trip_type === "business").reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
    privateKm: entries.data.filter(e => e.trip_type === "private").reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
    commuteKm: entries.data.filter(e => e.trip_type === "commute").reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
  } : null;

  return {
    entries,
    createEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}
