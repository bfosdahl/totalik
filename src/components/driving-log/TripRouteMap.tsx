import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PositionMap } from "@/components/map/PositionMap";
import { DrivingLogEntry } from "@/hooks/useDrivingLog";
import { Navigation } from "lucide-react";

interface TripRouteMapProps {
  trip: DrivingLogEntry;
}

export function TripRouteMap({ trip }: TripRouteMapProps) {
  const { data: points = [], isLoading } = useQuery({
    queryKey: ["driving-log-route", trip.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_log_track_points" as any)
        .select("lat, lng, recorded_at")
        .eq("entry_id", trip.id)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as { lat: number; lng: number }[];
    },
    enabled: trip.tracking_mode === "gps",
  });

  if (trip.tracking_mode !== "gps") return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Laster rute...</p>;
  if (points.length === 0 && trip.start_lat == null) return null;

  const stops = Array.isArray(trip.stops) ? trip.stops.length : 0;

  return (
    <div className="space-y-2">
      <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Navigation className="h-3.5 w-3.5" /> Kjørt rute
        </span>
        {trip.duration_minutes != null && <span>{trip.duration_minutes} min</span>}
        {trip.gps_distance_km != null && <span>GPS: {Number(trip.gps_distance_km).toFixed(1)} km</span>}
        {stops > 0 && <span>{stops} stopp</span>}
        {trip.gps_lost && <span className="text-destructive">GPS-signalet var borte en periode</span>}
      </p>
      <PositionMap
        route={points}
        position={
          trip.start_lat != null && trip.start_lng != null
            ? { lat: trip.start_lat, lng: trip.start_lng }
            : points[0] || null
        }
        height={220}
      />
    </div>
  );
}

export default TripRouteMap;
