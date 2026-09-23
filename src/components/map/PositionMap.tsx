import { useEffect, useRef } from "react";
import L, { OSM_ATTRIBUTION, OSM_TILE_URL } from "./LeafletBase";

interface PositionMapProps {
  /** Punkt som skal markeres */
  position?: { lat: number; lng: number } | null;
  /** Geofence som skal tegnes */
  fence?: { lat: number; lng: number; radiusM: number } | null;
  /** Kjørt rute */
  route?: { lat: number; lng: number }[];
  height?: number;
}

export function PositionMap({ position, fence, route = [], height = 260 }: PositionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([59.9139, 10.7522], 14);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    if (fence) {
      L.circle([fence.lat, fence.lng], {
        radius: fence.radiusM,
        color: "#2563eb",
        fillOpacity: 0.1,
      }).addTo(layer);
      bounds.push([fence.lat, fence.lng]);
    }

    if (route.length > 1) {
      const pts = route.map((p) => [p.lat, p.lng] as [number, number]);
      L.polyline(pts, { color: "#16a34a" }).addTo(layer);
      bounds.push(...pts);
    }

    if (position) {
      L.marker([position.lat, position.lng]).addTo(layer);
      bounds.push([position.lat, position.lng]);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0] as [number, number], 15);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]).pad(0.2));
    }
    setTimeout(() => map.invalidateSize(), 100);
  }, [position?.lat, position?.lng, fence?.lat, fence?.lng, fence?.radiusM, route.length]);

  return (
    <div className="w-full overflow-hidden rounded-lg border" style={{ height }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default PositionMap;
