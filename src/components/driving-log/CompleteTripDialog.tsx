import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompleteTripInput, DrivingLogEntry } from "@/hooks/useDrivingLog";
import { GeoPoint, getCurrentPosition, reverseGeocode } from "@/lib/geo";
import { Loader2, Navigation } from "lucide-react";
import { t } from "@/i18n/t";

export interface GpsTripSummary {
  points: GeoPoint[];
  stops: { minutes: number }[];
  distanceKm: number;
  durationMinutes: number;
  gpsLost: boolean;
}

interface CompleteTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompleteTripInput) => void;
  isPending: boolean;
  activeTrip: DrivingLogEntry;
  /** Sporingsdata når turen ble kjørt med GPS */
  gpsSummary?: GpsTripSummary | null;
}

export function CompleteTripDialog({ open, onOpenChange, onSubmit, isPending, activeTrip, gpsSummary }: CompleteTripDialogProps) {
  const isGpsTrip = !!gpsSummary;
  const [endLocation, setEndLocation] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [purpose, setPurpose] = useState(activeTrip.purpose || "");
  const [viaLocations, setViaLocations] = useState("");
  const [passengerCount, setPassengerCount] = useState("0");
  const [passengers, setPassengers] = useState("");
  const [notes, setNotes] = useState(activeTrip.notes || "");
  const [endPoint, setEndPoint] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);

  // Hent sluttposisjon og forhåndsutfyll fra GPS når dialogen åpnes
  useEffect(() => {
    if (!open || !isGpsTrip) return;
    let cancelled = false;
    setDistanceKm(gpsSummary!.distanceKm.toFixed(1));
    if (activeTrip.odometer_start) {
      setOdometerEnd((Number(activeTrip.odometer_start) + gpsSummary!.distanceKm).toFixed(1));
    }
    (async () => {
      setLocating(true);
      try {
        const point = await getCurrentPosition();
        if (cancelled) return;
        setEndPoint(point);
        const address = await reverseGeocode(point);
        if (!cancelled && address) setEndLocation((prev) => prev || address);
      } catch {
        /* brukeren kan skrive inn adressen manuelt */
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isGpsTrip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const end = parseFloat(odometerEnd);
    const manualDistance = parseFloat(distanceKm);

    if (!isGpsTrip && (isNaN(end) || end <= activeTrip.odometer_start)) return;

    const start = Number(activeTrip.odometer_start) || 0;
    const resolvedEnd = !isNaN(end)
      ? end
      : start + (isNaN(manualDistance) ? 0 : manualDistance);

    onSubmit({
      id: activeTrip.id,
      end_location: endLocation,
      odometer_end: resolvedEnd,
      purpose: purpose || undefined,
      via_locations: viaLocations || undefined,
      passenger_count: parseInt(passengerCount) || 0,
      passengers: passengers || undefined,
      notes: notes || undefined,
      end_lat: endPoint?.lat ?? null,
      end_lng: endPoint?.lng ?? null,
      gps_distance_km: isGpsTrip ? gpsSummary!.distanceKm : null,
      duration_minutes: isGpsTrip ? gpsSummary!.durationMinutes : null,
      stops: isGpsTrip ? gpsSummary!.stops : [],
      gps_lost: isGpsTrip ? gpsSummary!.gpsLost : false,
      ended_at: new Date().toISOString(),
      trackPoints: isGpsTrip ? gpsSummary!.points : undefined,
    });

    onOpenChange(false);
  };

  const computedDistance = (() => {
    const e = parseFloat(odometerEnd);
    if (!isNaN(e) && e > activeTrip.odometer_start) return (e - Number(activeTrip.odometer_start)).toFixed(1);
    const d = parseFloat(distanceKm);
    if (!isNaN(d) && d > 0) return d.toFixed(1);
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isGpsTrip ? "Kontroller og lagre kjøreturen" : t("auto.fullfoer_tur")}</DialogTitle>
        </DialogHeader>
        <div className="bg-muted rounded-md px-3 py-2 text-sm mb-2 space-y-1">
          <p><span className="text-muted-foreground">{t("auto.startet_fra")}</span> <strong>{activeTrip.start_location}</strong></p>
          {!!activeTrip.odometer_start && (
            <p><span className="text-muted-foreground">{t("auto.km_stand_start_2")}</span> <strong>{Number(activeTrip.odometer_start).toFixed(0)}</strong></p>
          )}
          {isGpsTrip && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Navigation className="h-3.5 w-3.5" />
              GPS: {gpsSummary!.distanceKm.toFixed(1)} km · {gpsSummary!.durationMinutes} min ·{" "}
              {gpsSummary!.stops.length} stopp
              {gpsSummary!.gpsLost && " · signalet var borte en periode"}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ct-end">{t("auto.sluttsted")}</Label>
              {locating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <Input id="ct-end" value={endLocation} onChange={e => setEndLocation(e.target.value)} placeholder={t("auto.f_eks_byggeplass_drammen")} required />
          </div>

          {isGpsTrip && (
            <div className="space-y-2">
              <Label htmlFor="ct-dist">Kjørelengde (km) – kan rettes</Label>
              <Input
                id="ct-dist"
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={e => {
                  setDistanceKm(e.target.value);
                  const d = parseFloat(e.target.value);
                  if (!isNaN(d) && activeTrip.odometer_start) {
                    setOdometerEnd((Number(activeTrip.odometer_start) + d).toFixed(1));
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ct-km">Km-stand slutt {isGpsTrip ? "(valgfritt)" : "*"}</Label>
            <Input id="ct-km" type="number" step="0.1" value={odometerEnd} onChange={e => setOdometerEnd(e.target.value)} placeholder={t("auto.f_eks_45280")} required={!isGpsTrip} />
          </div>

          {computedDistance && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              {t("auto.beregnet_kjoerelengde")} <strong>{computedDistance} km</strong>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ct-purpose">Formål med turen {!activeTrip.purpose && "*"}</Label>
            <Input id="ct-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t("auto.f_eks_kundemoete_hos_bygg_as")} required={!activeTrip.purpose} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ct-via">{t("auto.via_stoppesteder")}</Label>
            <Input id="ct-via" value={viaLocations} onChange={e => setViaLocations(e.target.value)} placeholder={t("auto.evt_mellomlandinger")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-pcount">{t("auto.antall_passasjerer")}</Label>
              <Input id="ct-pcount" type="number" min="0" value={passengerCount} onChange={e => setPassengerCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-passengers">Passasjerer (navn)</Label>
              <Input id="ct-passengers" value={passengers} onChange={e => setPassengers(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ct-notes">{t("auto.merknader")}</Label>
            <Textarea id="ct-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("auto.avbryt")}</Button>
            <Button type="submit" disabled={isPending || !endLocation || !computedDistance}>
              {isPending ? "Lagrer..." : "Lagre tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
