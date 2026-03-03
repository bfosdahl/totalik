import { useState } from "react";
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

interface CompleteTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompleteTripInput) => void;
  isPending: boolean;
  activeTrip: DrivingLogEntry;
}

export function CompleteTripDialog({ open, onOpenChange, onSubmit, isPending, activeTrip }: CompleteTripDialogProps) {
  const [endLocation, setEndLocation] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [purpose, setPurpose] = useState(activeTrip.purpose || "");
  const [viaLocations, setViaLocations] = useState("");
  const [passengerCount, setPassengerCount] = useState("0");
  const [passengers, setPassengers] = useState("");
  const [notes, setNotes] = useState(activeTrip.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const end = parseFloat(odometerEnd);
    if (isNaN(end) || end <= activeTrip.odometer_start) return;

    onSubmit({
      id: activeTrip.id,
      end_location: endLocation,
      odometer_end: end,
      purpose: purpose || undefined,
      via_locations: viaLocations || undefined,
      passenger_count: parseInt(passengerCount) || 0,
      passengers: passengers || undefined,
      notes: notes || undefined,
    });

    onOpenChange(false);
  };

  const distance = (() => {
    const e = parseFloat(odometerEnd);
    if (!isNaN(e) && e > activeTrip.odometer_start) return (e - activeTrip.odometer_start).toFixed(1);
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fullfør tur</DialogTitle>
        </DialogHeader>
        <div className="bg-muted rounded-md px-3 py-2 text-sm mb-2 space-y-1">
          <p><span className="text-muted-foreground">Startet fra:</span> <strong>{activeTrip.start_location}</strong></p>
          <p><span className="text-muted-foreground">Km-stand start:</span> <strong>{Number(activeTrip.odometer_start).toFixed(0)}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ct-end">Sluttsted *</Label>
            <Input id="ct-end" value={endLocation} onChange={e => setEndLocation(e.target.value)} placeholder="F.eks. Byggeplass, Drammen" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ct-km">Km-stand slutt *</Label>
            <Input id="ct-km" type="number" step="0.1" value={odometerEnd} onChange={e => setOdometerEnd(e.target.value)} placeholder="F.eks. 45280" required />
          </div>

          {distance && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              Beregnet kjørelengde: <strong>{distance} km</strong>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ct-purpose">Formål med turen {!activeTrip.purpose && "*"}</Label>
            <Input id="ct-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="F.eks. Kundemøte hos Bygg AS" required={!activeTrip.purpose} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ct-via">Via / stoppesteder</Label>
            <Input id="ct-via" value={viaLocations} onChange={e => setViaLocations(e.target.value)} placeholder="Evt. mellomlandinger" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-pcount">Antall passasjerer</Label>
              <Input id="ct-pcount" type="number" min="0" value={passengerCount} onChange={e => setPassengerCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-passengers">Passasjerer (navn)</Label>
              <Input id="ct-passengers" value={passengers} onChange={e => setPassengers(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ct-notes">Merknader</Label>
            <Textarea id="ct-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button type="submit" disabled={isPending || !endLocation || !distance}>
              {isPending ? "Lagrer..." : "Fullfør tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
