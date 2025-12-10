import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Loader2, AlertCircle } from "lucide-react";

interface Ks2ProjectMapProps {
  address?: string | null;
  gnrBnr?: string | null;
  projectName?: string;
}

interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

export default function Ks2ProjectMap({ address, gnrBnr, projectName }: Ks2ProjectMapProps) {
  const [coordinates, setCoordinates] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse gnr/bnr to create Kartverket link
  const getKartverketLink = () => {
    if (!gnrBnr) return null;
    
    const cleanedGnrBnr = gnrBnr.replace(/\s/g, "");
    
    // Pattern: kommunenr/gnr/bnr or kommunenr-gnr/bnr
    const fullMatch = cleanedGnrBnr.match(/^(\d{4})[-\/](\d+)\/(\d+)$/);
    if (fullMatch) {
      const [, kommunenr, gnr, bnr] = fullMatch;
      return `https://eiendomsregisteret.kartverket.no/eiendom/${kommunenr}/${gnr}/${bnr}`;
    }
    
    // Pattern: gnr/bnr only
    const simpleMatch = cleanedGnrBnr.match(/^(\d+)\/(\d+)$/);
    if (simpleMatch) {
      return `https://eiendomsregisteret.kartverket.no/`;
    }
    
    return null;
  };

  // Geocode address using Nominatim (OpenStreetMap)
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address) {
        setCoordinates(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchQuery = `${address}, Norge`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=no`,
          {
            headers: {
              "User-Agent": "Total-IK-KS-System/1.0",
            },
          }
        );

        if (!response.ok) throw new Error("Geocoding failed");

        const data = await response.json();

        if (data && data.length > 0) {
          setCoordinates({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name,
          });
        } else {
          setError("Kunne ikke finne adresse på kartet");
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setError("Feil ved oppslag av adresse");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(geocodeAddress, 500);
    return () => clearTimeout(timer);
  }, [address]);

  const kartverketLink = getKartverketLink();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasjon
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {kartverketLink && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={kartverketLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Eiendomsregisteret
                </a>
              </Button>
            )}
            {coordinates && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a 
                  href={`https://norgeskart.no/#!?project=norgeskart&layers=1002&zoom=15&lat=${coordinates.lat}&lon=${coordinates.lon}&markerLat=${coordinates.lat}&markerLon=${coordinates.lon}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Norgeskart
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && error && !coordinates && (
          <div className="h-[300px] flex flex-col items-center justify-center bg-muted rounded-lg text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1">Legg inn en gyldig adresse for å vise kart</p>
          </div>
        )}

        {!isLoading && !address && (
          <div className="h-[300px] flex flex-col items-center justify-center bg-muted rounded-lg text-muted-foreground">
            <MapPin className="h-8 w-8 mb-2" />
            <p className="text-sm">Ingen adresse angitt</p>
            <p className="text-xs mt-1">Legg inn adresse i prosjektinfo for å vise kart</p>
          </div>
        )}

        {/* OpenStreetMap iframe embed - no React compatibility issues */}
        {!isLoading && coordinates && (
          <div className="h-[300px] rounded-lg overflow-hidden border">
            <iframe
              title={`Kart for ${projectName || 'prosjekt'}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon - 0.01}%2C${coordinates.lat - 0.005}%2C${coordinates.lon + 0.01}%2C${coordinates.lat + 0.005}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`}
            />
          </div>
        )}

        {gnrBnr && (
          <p className="text-xs text-muted-foreground mt-2">
            Gnr/Bnr: {gnrBnr}
            {!kartverketLink?.includes("/eiendom/") && (
              <span className="ml-1">
                (For direkte lenke til Kartverket, bruk format: kommunenr/gnr/bnr, f.eks. 3101/62/595)
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
