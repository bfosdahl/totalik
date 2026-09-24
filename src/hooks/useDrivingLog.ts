import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GeoPoint } from "@/lib/geo";

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
  // GPS
  project_id: string | null;
  tracking_mode: string;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  gps_distance_km: number | null;
  duration_minutes: number | null;
  stops: any;
  gps_lost: boolean;
  started_at: string | null;
  ended_at: string | null;
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
  project_id?: string | null;
  tracking_mode?: string;
  start_lat?: number | null;
  start_lng?: number | null;
  started_at?: string | null;
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
  project_id?: string | null;
  end_lat?: number | null;
  end_lng?: number | null;
  gps_distance_km?: number | null;
  duration_minutes?: number | null;
  stops?: any;
  gps_lost?: boolean;
  ended_at?: string | null;
  /** Rutepunkter som skal lagres sammen med turen */
  trackPoints?: GeoPoint[];
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
  project_id?: string | null;
}

const ENTRY_COLUMNS =
  "id, user_id, company_id, trip_date, purpose, start_location, end_location, via_locations, odometer_start, odometer_end, distance_km, vehicle_type, vehicle_registration, vehicle_description, trip_type, passenger_count, passengers, notes, status, created_at, updated_at, project_id, tracking_mode, start_lat, start_lng, end_lat, end_lng, gps_distance_km, duration_minutes, stops, gps_lost, started_at, ended_at";

export function useDrivingLog() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const entries = useQuery({
    queryKey: ["driving-log", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_log_entries")
        .select(ENTRY_COLUMNS)
        .order("trip_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as DrivingLogEntry[];
    },
    enabled: !!profile?.id,
  });

  // Active trip (status = 'active')
  const activeTrip = entries.data?.find(e => e.status === "active") ?? null;

  /** Legger kjørelengden til kjøretøyets kilometerstand */
  const bumpVehicleOdometer = async (registration: string | null | undefined, odometerEnd: number) => {
    if (!registration || !profile?.company_id || !odometerEnd) return;
    try {
      const { data } = await supabase
        .from("company_vehicles" as any)
        .select("id, current_odometer")
        .eq("company_id", profile.company_id)
        .eq("license_plate", registration)
        .maybeSingle();
      const vehicle = data as any;
      if (!vehicle) return;
      if (vehicle.current_odometer != null && Number(vehicle.current_odometer) >= odometerEnd) return;
      await supabase
        .from("company_vehicles" as any)
        .update({ current_odometer: odometerEnd })
        .eq("id", vehicle.id);
    } catch (e) {
      console.error("Kunne ikke oppdatere kilometerstand", e);
    }
  };

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
          started_at: input.started_at || new Date().toISOString(),
          ...input,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DrivingLogEntry;
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
    mutationFn: async ({ id, trackPoints, ...input }: CompleteTripInput) => {
      const { data, error } = await supabase
        .from("driving_log_entries")
        .update({
          ...input,
          ended_at: input.ended_at || new Date().toISOString(),
          status: "completed",
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (trackPoints && trackPoints.length > 0 && profile?.id && profile?.company_id) {
        const rows = trackPoints.map((p) => ({
          entry_id: id,
          company_id: profile.company_id,
          user_id: profile.id,
          lat: p.lat,
          lng: p.lng,
          accuracy: p.accuracy ?? null,
          speed: p.speed ?? null,
          recorded_at: p.recorded_at || new Date().toISOString(),
        }));
        const { error: pointError } = await supabase
          .from("driving_log_track_points" as any)
          .insert(rows as any);
        if (pointError) console.error("Kunne ikke lagre rutepunkter", pointError);
      }

      const entry = data as unknown as DrivingLogEntry;
      // Kun oppdater kjøretøyets km-stand når turen hadde en reell startverdi
      if (Number(entry.odometer_start) > 0) {
        await bumpVehicleOdometer(entry.vehicle_registration, Number(input.odometer_end));
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
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
        } as any)
        .select()
        .single();

      if (error) throw error;
      await bumpVehicleOdometer(input.vehicle_registration, Number(input.odometer_end));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving-log"] });
      queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
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
        .update(input as any)
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
