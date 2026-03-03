import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Square } from "lucide-react";
import { DrivingLogEntry } from "@/hooks/useDrivingLog";
import { format, parseISO } from "date-fns";

interface ActiveTripCardProps {
  trip: DrivingLogEntry;
  onComplete: () => void;
  onCancel: () => void;
}

const tripTypeLabels: Record<string, string> = {
  business: "Yrkeskjøring",
  commute: "Arbeidsreise",
  private: "Privat",
};

export function ActiveTripCard({ trip, onComplete, onCancel }: ActiveTripCardProps) {
  return (
    <Card className="border-2 border-green-500 bg-green-500/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 animate-pulse">Aktiv tur</Badge>
              <Badge variant="outline">{tripTypeLabels[trip.trip_type] || trip.trip_type}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{trip.start_location}</span>
              <span className="text-muted-foreground">
                — Startet {format(parseISO(trip.trip_date), "dd.MM.yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Km-stand: <strong className="text-foreground">{Number(trip.odometer_start).toFixed(0)}</strong></span>
              {trip.purpose && <span>Formål: {trip.purpose}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <Square className="w-4 h-4 mr-1" />
              Avbryt
            </Button>
            <Button size="sm" onClick={onComplete}>
              <Navigation className="w-4 h-4 mr-1" />
              Fullfør tur
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
