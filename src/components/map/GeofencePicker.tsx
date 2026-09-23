import { useEffect, useRef, useState } from "react";
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

export function GeofencePicker({ lat, lng, radiusM, address, onChange }: GeofencePickerProps) {
  const [search, setSearch] = useState(address || "");
  const [searching, setSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  const radiusRef = useRef(radiusM);
  onChangeRef.current = onChange;
  radiusRef.current = radiusM;

  // Initier kart én gang
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView(
      lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER,
      15
    );
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng, radiusM: radiusRef.current });
    });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Oppdater markør, sirkel og senter
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat == null || lng == null) {
      markerRef.current?.remove();
      circleRef.current?.remove();
      markerRef.current = null;
      circleRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ lat: pos.lat, lng: pos.lng, radiusM: radiusRef.current });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (!circleRef.current) {
      circleRef.current = L.circle([lat, lng], {
        radius: radiusM,
        color: "#2563eb",
        fillOpacity: 0.12,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusM);
    }

    map.setView([lat, lng], map.getZoom() < 14 ? 15 : map.getZoom());
    setTimeout(() => map.invalidateSize(), 100);
  }, [lat, lng, radiusM]);

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
        if (result) onChangeRef.current({ lat: result.lat, lng: result.lng, radiusM: radiusRef.current });
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
            <SelectContent className="z-[2000]">
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

      <div className="relative z-0 isolate h-72 w-full overflow-hidden rounded-lg border">
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
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
