import { MapContainer, TileLayer, Marker, Circle, Polyline } from "react-leaflet";
import { OSM_ATTRIBUTION, OSM_TILE_URL } from "./LeafletBase";

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
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : fence
    ? [fence.lat, fence.lng]
    : route.length > 0
    ? [route[0].lat, route[0].lng]
    : [59.9139, 10.7522];

  return (
    <div className="w-full overflow-hidden rounded-lg border" style={{ height }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        {fence && (
          <Circle center={[fence.lat, fence.lng]} radius={fence.radiusM} pathOptions={{ color: "#2563eb", fillOpacity: 0.1 }} />
        )}
        {route.length > 1 && (
          <Polyline positions={route.map((p) => [p.lat, p.lng]) as [number, number][]} pathOptions={{ color: "#16a34a" }} />
        )}
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
    </div>
  );
}

export default PositionMap;
