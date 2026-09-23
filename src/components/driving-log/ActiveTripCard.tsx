import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Square, AlertTriangle, Clock, Route } from "lucide-react";
import { DrivingLogEntry } from "@/hooks/useDrivingLog";
import { format, parseISO } from "date-fns";
import { t } from "@/i18n/t";

interface ActiveTripCardProps {
  trip: DrivingLogEntry;
  onComplete: () => void;
  onCancel: () => void;
  gps?: {
    isTracking: boolean;
    distanceKm: number;
    durationMinutes: number;
    stops: { minutes: number }[];
    signalLost: boolean;
    error: string | null;
  };
}

const tripTypeLabels: Record<string, string> = {
  business: "Yrkeskjøring",
  commute: "Arbeidsreise",
  private: "Privat",
};

export function ActiveTripCard({ trip, onComplete, onCancel, gps }: ActiveTripCardProps) {
  const tracking = gps?.isTracking;

  return (
    <Card className="border-2 border-green-500 bg-green-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-green-500 animate-pulse">{t("auto.aktiv_tur")}</Badge>
              <Badge variant="outline">{tripTypeLabels[trip.trip_type] || trip.trip_type}</Badge>
              {tracking && (
                <Badge variant="secondary" className="gap-1">
                  <Navigation className="w-3 h-3" /> GPS-sporing aktiv
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{trip.start_location}</span>
              <span className="text-muted-foreground">
                — Startet {format(parseISO(trip.trip_date), "dd.MM.yyyy")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {trip.odometer_start ? (
                <span>{t("auto.km_stand")} <strong className="text-foreground">{Number(trip.odometer_start).toFixed(0)}</strong></span>
              ) : null}
              {tracking && (
                <>
                  <span className="flex items-center gap-1">
                    <Route className="w-3.5 h-3.5" />
                    <strong className="text-foreground">{gps!.distanceKm.toFixed(1)} km</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <strong className="text-foreground">{gps!.durationMinutes} min</strong>
                  </span>
                  {gps!.stops.length > 0 && <span>{gps!.stops.length} stopp</span>}
                </>
              )}
              {trip.purpose && <span>Formål: {trip.purpose}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <Square className="w-4 h-4 mr-1" />
              {t("auto.avbryt")}
            </Button>
            <Button size="sm" onClick={onComplete}>
              <Navigation className="w-4 h-4 mr-1" />
              {tracking ? "Stopp kjøretur" : t("auto.fullfoer_tur")}
            </Button>
          </div>
        </div>

        {tracking && gps?.signalLost && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              GPS-signalet er borte. Kjørelengden kan bli for lav — sjekk at posisjon er tillatt,
              og rett opp kilometerne når du stopper turen.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
