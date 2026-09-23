import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L, { OSM_ATTRIBUTION, OSM_TILE_URL } from "./LeafletBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { geocodeAddress } from "@/lib/geo";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

interface GeofencePickerProps {
  lat: number | null;
  lng: number | null;
  radiusM: number;
  address?: string | null;
  onChange: (value: { lat: number; lng: number; radiusM: number }) => void;
}

const RADIUS_OPTIONS = [50, 100, 250, 500];
const DEFAULT_CENTER: [number, number] = [59.9139, 10.7522]; // Oslo

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() < 14 ? 15 : map.getZoom());
  }, [center[0], center[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function GeofencePicker({ lat, lng, radiusM, address, onChange }: GeofencePickerProps) {
  const [search, setSearch] = useState(address || "");
  const [searching, setSearching] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  const center: [number, number] = useMemo(
    () => (lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER),
    [lat, lng]
  );

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const result = await geocodeAddress(search.trim());
    setSearching(false);
    if (!result) {
      toast.error("Fant ikke adressen. Flytt markøren manuelt på kartet.");
      return;
    }
    onChange({ lat: result.lat, lng: result.lng, radiusM });
  };

  // Slå opp prosjektadressen automatisk første gang
  useEffect(() => {
    if (lat == null && lng == null && address) {
      (async () => {
        const result = await geocodeAddress(address);
        if (result) onChange({ lat: result.lat, lng: result.lng, radiusM });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="geofence-search">Søk opp adressen</Label>
          <Input
            id="geofence-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                doSearch();
              }
            }}
            placeholder="F.eks. Ringveien 7, Halden"
          />
        </div>
        <div className="space-y-1">
          <Label>&nbsp;</Label>
          <Button type="button" variant="outline" onClick={doSearch} disabled={searching} className="w-full sm:w-auto">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1">Søk</span>
          </Button>
        </div>
        <div className="space-y-1">
          <Label>Radius</Label>
          <Select
            value={String(radiusM)}
            onValueChange={(v) =>
              onChange({ lat: lat ?? DEFAULT_CENTER[0], lng: lng ?? DEFAULT_CENTER[1], radiusM: parseInt(v) })
            }
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>{r} meter</SelectItem>
              ))}
              {!RADIUS_OPTIONS.includes(radiusM) && (
                <SelectItem value={String(radiusM)}>{radiusM} meter</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-72 w-full overflow-hidden rounded-lg border">
        <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
          <Recenter center={center} />
          <ClickHandler onPick={(la, ln) => onChange({ lat: la, lng: ln, radiusM })} />
          {lat != null && lng != null && (
            <>
              <Marker
                position={[lat, lng]}
                draggable
                ref={markerRef as any}
                eventHandlers={{
                  dragend: () => {
                    const m = markerRef.current;
                    if (!m) return;
                    const pos = m.getLatLng();
                    onChange({ lat: pos.lat, lng: pos.lng, radiusM });
                  },
                }}
              />
              <Circle center={[lat, lng]} radius={radiusM} pathOptions={{ color: "#2563eb", fillOpacity: 0.12 }} />
            </>
          )}
        </MapContainer>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Klikk i kartet eller dra markøren for å flytte prosjektområdet.
        {lat != null && lng != null && ` Valgt punkt: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`}
      </p>
    </div>
  );
}

export default GeofencePicker;
