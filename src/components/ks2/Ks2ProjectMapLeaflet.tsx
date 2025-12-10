import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Ks2ProjectMapLeafletProps {
  lat: number;
  lon: number;
  projectName?: string;
  address?: string | null;
  gnrBnr?: string | null;
}

// Component to recenter map when coordinates change
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lon], 15);
  }, [map, lat, lon]);
  
  return null;
}

export default function Ks2ProjectMapLeaflet({ 
  lat, 
  lon, 
  projectName, 
  address, 
  gnrBnr 
}: Ks2ProjectMapLeafletProps) {
  return (
    <div className="h-[300px] rounded-lg overflow-hidden border">
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]}>
          <Popup>
            <div className="text-sm">
              <strong>{projectName || "Prosjekt"}</strong>
              <br />
              {address}
              {gnrBnr && (
                <>
                  <br />
                  <span className="text-muted-foreground">Gnr/Bnr: {gnrBnr}</span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
        <RecenterMap lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
}
