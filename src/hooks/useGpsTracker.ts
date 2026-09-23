import { useCallback, useEffect, useRef, useState } from "react";
import { GeoPoint, geoErrorMessage, haversineMeters, routeDistanceKm } from "@/lib/geo";

export interface TripStop {
  lat: number;
  lng: number;
  from: string;
  to: string;
  minutes: number;
}

interface TrackerState {
  tripId: string;
  startedAt: string;
  points: GeoPoint[];
  stops: TripStop[];
  gpsLost: boolean;
}

const STORAGE_KEY = "drivingLogGpsTracker";
const MIN_MOVE_M = 20; // ignorer små bevegelser (GPS-drift)
const MAX_ACCURACY_M = 50; // ignorer unøyaktige punkter
const STOP_MINUTES = 3; // stillstand over 3 min = stopp
const SIGNAL_TIMEOUT_MS = 90_000; // ingen punkt på 90 sek = tapt signal

function load(): TrackerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackerState) : null;
  } catch {
    return null;
  }
}

function save(state: TrackerState | null) {
  if (!state) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Sporer posisjon under en kjøretur. Sporingen starter kun når brukeren
 * trykker "Start kjøretur" og stopper når turen avsluttes.
 */
export function useGpsTracker() {
  const [state, setState] = useState<TrackerState | null>(() => load());
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastFixAt = useRef<number>(Date.now());
  const stateRef = useRef<TrackerState | null>(state);

  stateRef.current = state;

  const isTracking = !!state;
  const points = state?.points ?? [];
  const distanceKm = routeDistanceKm(points);
  const durationMinutes = state
    ? Math.max(0, Math.round((Date.now() - new Date(state.startedAt).getTime()) / 60000))
    : 0;

  const update = useCallback((next: TrackerState | null) => {
    stateRef.current = next;
    setState(next);
    save(next);
  }, []);

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      lastFixAt.current = Date.now();
      setError(null);
      const current = stateRef.current;
      if (!current) return;

      const point: GeoPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        recorded_at: new Date(pos.timestamp).toISOString(),
      };

      if (point.accuracy != null && point.accuracy > MAX_ACCURACY_M) return;

      const last = current.points[current.points.length - 1];
      const next: TrackerState = { ...current, gpsLost: false };

      if (last) {
        const moved = haversineMeters(last, point);
        if (moved < MIN_MOVE_M) {
          // Stillstand — registrer stopp hvis lenge nok
          const stillMinutes =
            (new Date(point.recorded_at!).getTime() - new Date(last.recorded_at!).getTime()) / 60000;
          if (stillMinutes >= STOP_MINUTES) {
            next.stops = [
              ...current.stops,
              {
                lat: last.lat,
                lng: last.lng,
                from: last.recorded_at!,
                to: point.recorded_at!,
                minutes: Math.round(stillMinutes),
              },
            ];
            next.points = [...current.points.slice(0, -1), point];
            update(next);
          }
          return;
        }
      }

      next.points = [...current.points, point];
      update(next);
    },
    [update]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(geoErrorMessage(err));
    const current = stateRef.current;
    if (current && !current.gpsLost) {
      const next = { ...current, gpsLost: true };
      stateRef.current = next;
      setState(next);
      save(next);
    }
  }, []);

  // Start/stopp watchPosition når sporing er aktiv
  useEffect(() => {
    if (!isTracking) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("Enheten støtter ikke posisjon");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });
    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isTracking, handlePosition, handleError]);

  // Varsel hvis GPS-signalet blir borte
  const [signalLost, setSignalLost] = useState(false);
  useEffect(() => {
    if (!isTracking) {
      setSignalLost(false);
      return;
    }
    const interval = setInterval(() => {
      setSignalLost(Date.now() - lastFixAt.current > SIGNAL_TIMEOUT_MS);
    }, 15000);
    return () => clearInterval(interval);
  }, [isTracking]);

  const start = useCallback(
    (tripId: string, firstPoint?: GeoPoint) => {
      lastFixAt.current = Date.now();
      update({
        tripId,
        startedAt: new Date().toISOString(),
        points: firstPoint ? [{ ...firstPoint, recorded_at: firstPoint.recorded_at || new Date().toISOString() }] : [],
        stops: [],
        gpsLost: false,
      });
    },
    [update]
  );

  const stop = useCallback(() => {
    const current = stateRef.current;
    update(null);
    setSignalLost(false);
    if (!current) return null;
    return {
      tripId: current.tripId,
      startedAt: current.startedAt,
      endedAt: new Date().toISOString(),
      points: current.points,
      stops: current.stops,
      gpsLost: current.gpsLost,
      distanceKm: routeDistanceKm(current.points),
      durationMinutes: Math.max(
        0,
        Math.round((Date.now() - new Date(current.startedAt).getTime()) / 60000)
      ),
    };
  }, [update]);

  return {
    isTracking,
    trackedTripId: state?.tripId ?? null,
    points,
    stops: state?.stops ?? [],
    distanceKm,
    durationMinutes,
    signalLost: signalLost || !!state?.gpsLost,
    error,
    start,
    stop,
  };
}
