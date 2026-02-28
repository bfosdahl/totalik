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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateDrivingLogInput } from "@/hooks/useDrivingLog";
import { format } from "date-fns";

interface AddTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDrivingLogInput) => void;
  isPending: boolean;
  lastOdometerEnd?: number | null;
}

export function AddTripDialog({ open, onOpenChange, onSubmit, isPending, lastOdometerEnd }: AddTripDialogProps) {
  const [tripDate, setTripDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [purpose, setPurpose] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [viaLocations, setViaLocations] = useState("");
  const [odometerStart, setOdometerStart] = useState(lastOdometerEnd?.toString() || "");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [vehicleType, setVehicleType] = useState("company");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [tripType, setTripType] = useState("business");
  const [passengerCount, setPassengerCount] = useState("0");
  const [passengers, setPassengers] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = parseFloat(odometerStart);
    const end = parseFloat(odometerEnd);
    
    if (isNaN(start) || isNaN(end) || end <= start) {
      return;
    }

    onSubmit({
      trip_date: tripDate,
      purpose,
      start_location: startLocation,
      end_location: endLocation,
      via_locations: viaLocations || undefined,
      odometer_start: start,
      odometer_end: end,
      vehicle_type: vehicleType,
      vehicle_registration: vehicleRegistration || undefined,
      vehicle_description: vehicleDescription || undefined,
      trip_type: tripType,
      passenger_count: parseInt(passengerCount) || 0,
      passengers: passengers || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setPurpose("");
    setStartLocation("");
    setEndLocation("");
    setViaLocations("");
    setOdometerStart(odometerEnd);
    setOdometerEnd("");
    setPassengerCount("0");
    setPassengers("");
    setNotes("");
    onOpenChange(false);
  };

  const distance = (() => {
    const s = parseFloat(odometerStart);
    const e = parseFloat(odometerEnd);
    if (!isNaN(s) && !isNaN(e) && e > s) return (e - s).toFixed(1);
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrer ny tur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tripDate">Dato *</Label>
              <Input id="tripDate" type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tripType">Type kjøring *</Label>
              <Select value={tripType} onValueChange={setTripType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Yrkeskjøring</SelectItem>
                  <SelectItem value="commute">Arbeidsreise</SelectItem>
                  <SelectItem value="private">Privat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Formål med turen *</Label>
            <Input id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="F.eks. Kundemøte hos Bygg AS" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation">Fra (startsted) *</Label>
              <Input id="startLocation" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder="F.eks. Kontoret, Oslo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endLocation">Til (sluttsted) *</Label>
              <Input id="endLocation" value={endLocation} onChange={e => setEndLocation(e.target.value)} placeholder="F.eks. Byggeplass, Drammen" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="viaLocations">Via / stoppesteder</Label>
            <Input id="viaLocations" value={viaLocations} onChange={e => setViaLocations(e.target.value)} placeholder="Evt. mellomlandinger" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odometerStart">Km-stand start *</Label>
              <Input id="odometerStart" type="number" step="0.1" value={odometerStart} onChange={e => setOdometerStart(e.target.value)} placeholder="F.eks. 45230" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometerEnd">Km-stand slutt *</Label>
              <Input id="odometerEnd" type="number" step="0.1" value={odometerEnd} onChange={e => setOdometerEnd(e.target.value)} placeholder="F.eks. 45280" required />
            </div>
          </div>

          {distance && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              Beregnet kjørelengde: <strong>{distance} km</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Biltype *</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Firmabil</SelectItem>
                  <SelectItem value="private">Privatbil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleRegistration">Reg.nr</Label>
              <Input id="vehicleRegistration" value={vehicleRegistration} onChange={e => setVehicleRegistration(e.target.value)} placeholder="F.eks. AB 12345" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleDescription">Bilbeskrivelse</Label>
            <Input id="vehicleDescription" value={vehicleDescription} onChange={e => setVehicleDescription(e.target.value)} placeholder="F.eks. Toyota Hilux 2023" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengerCount">Antall passasjerer</Label>
              <Input id="passengerCount" type="number" min="0" value={passengerCount} onChange={e => setPassengerCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Passasjerer (navn)</Label>
              <Input id="passengers" value={passengers} onChange={e => setPassengers(e.target.value)} placeholder="Navn på passasjerer" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Merknader</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Eventuelle merknader..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button type="submit" disabled={isPending || !purpose || !startLocation || !endLocation || !distance}>
              {isPending ? "Lagrer..." : "Registrer tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
