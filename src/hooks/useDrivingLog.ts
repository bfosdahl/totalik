import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DrivingLogEntry {
  id: string;
  user_id: string;
  company_id: string;
  trip_date: string;
  purpose: string | null;
  start_location: string;
  end_location: string | null;
  via_locations: string | null;
  odometer_start: number;
  odometer_end: number | null;
  distance_km: number;
  vehicle_type: string;
  vehicle_registration: string | null;
  vehicle_description: string | null;
  trip_type: string;
  passenger_count: number;
  passengers: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StartTripInput {
  trip_date: string;
  start_location: string;
  odometer_start: number;
  vehicle_type: string;
  vehicle_registration?: string;
  vehicle_description?: string;
  trip_type: string;
  purpose?: string;
  notes?: string;
}

export interface CompleteTripInput {
  id: string;
  end_location: string;
  odometer_end: number;
  purpose?: string;
  via_locations?: string;
  passenger_count?: number;
  passengers?: string;
  notes?: string;
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

  // Active trip (status = 'active')
  const activeTrip = entries.data?.find(e => e.status === "active") ?? null;

  const startTrip = useMutation({
    mutationFn: async (input: StartTripInput) => {
      if (!profile?.id || !profile?.company_id) throw new Error("Ikke innlogget");

      // Check no active trip exists
      if (activeTrip) throw new Error("Du har allerede en aktiv tur");

      const { data, error } = await supabase
        .from("driving_log_entries")
        .insert({
          user_id: profile.id,
          company_id: profile.company_id,
          status: "active",
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      toast.success("Tur startet!");
    },
    onError: (error) => {
      toast.error("Kunne ikke starte tur: " + error.message);
    },
  });

  const completeTrip = useMutation({
    mutationFn: async ({ id, ...input }: CompleteTripInput) => {
      const { data, error } = await supabase
        .from("driving_log_entries")
        .update({
          ...input,
          status: "completed",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      toast.success("Tur fullført og registrert i kjøreboken!");
    },
    onError: (error) => {
      toast.error("Kunne ikke fullføre tur: " + error.message);
    },
  });

  const createEntry = useMutation({
    mutationFn: async (input: CreateDrivingLogInput) => {
      if (!profile?.id || !profile?.company_id) throw new Error("Ikke innlogget");

      const { data, error } = await supabase
        .from("driving_log_entries")
        .insert({
          user_id: profile.id,
          company_id: profile.company_id,
          status: "completed",
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

  const completedEntries = entries.data?.filter(e => e.status === "completed") ?? [];

  const stats = completedEntries.length > 0 ? {
    totalTrips: completedEntries.length,
    totalKm: completedEntries.reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
    businessKm: completedEntries.filter(e => e.trip_type === "business").reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
    privateKm: completedEntries.filter(e => e.trip_type === "private").reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
    commuteKm: completedEntries.filter(e => e.trip_type === "commute").reduce((sum, e) => sum + Number(e.distance_km || 0), 0),
  } : null;

  return {
    entries,
    activeTrip,
    startTrip,
    completeTrip,
    createEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}
