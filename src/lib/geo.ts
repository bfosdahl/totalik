/**
 * Geo-hjelpefunksjoner: avstand, adresseoppslag og geofence-kontroll.
 * Adresseoppslag bruker Nominatim (OpenStreetMap), samme kilde som prosjektkartet.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  recorded_at?: string;
}

const R = 6371000; // jordens radius i meter

/** Avstand i meter mellom to punkter (haversine) */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total lengde i km for en rute */
export function routeDistanceKm(points: GeoPoint[]): number {
  let meters = 0;
  for (let i = 1; i < points.length; i++) {
    meters += haversineMeters(points[i - 1], points[i]);
  }
  return meters / 1000;
}

export type GeofenceStatus = "inside" | "outside" | "unknown";

export interface GeofenceResult {
  status: GeofenceStatus;
  distanceM: number | null;
}

export function checkGeofence(
  position: GeoPoint | null,
  center: { lat: number | null; lng: number | null },
  radiusM: number
): GeofenceResult {
  if (!position || center.lat == null || center.lng == null) {
    return { status: "unknown", distanceM: null };
  }
  const distance = haversineMeters(position, { lat: center.lat, lng: center.lng });
  return {
    status: distance <= radiusM ? "inside" : "outside",
    distanceM: Math.round(distance),
  };
}

/** Henter nåværende posisjon én gang */
export function getCurrentPosition(timeoutMs = 15000): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Enheten støtter ikke posisjon"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          recorded_at: new Date(pos.timestamp).toISOString(),
        }),
      (err) => reject(new Error(geoErrorMessage(err))),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 5000 }
    );
  });
}

export function geoErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Posisjon er avslått. Tillat posisjon i nettleseren for å bruke GPS.";
    case err.POSITION_UNAVAILABLE:
      return "Fant ikke GPS-signal akkurat nå.";
    case err.TIMEOUT:
      return "Det tok for lang tid å finne posisjonen.";
    default:
      return "Kunne ikke hente posisjon.";
  }
}

const geocodeCache = new Map<string, string>();

/** Slår opp adresse fra koordinater */
export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=18&addressdetails=1&accept-language=no`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const street = [a.road, a.house_number].filter(Boolean).join(" ");
    const city = a.city || a.town || a.village || a.municipality || "";
    const label = [street, city].filter(Boolean).join(", ") || data.display_name || null;
    if (label) geocodeCache.set(key, label);
    return label;
  } catch {
    return null;
  }
}

/** Slår opp koordinater fra adresse */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=no&q=${encodeURIComponent(address)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name as string,
    };
  } catch {
    return null;
  }
}
