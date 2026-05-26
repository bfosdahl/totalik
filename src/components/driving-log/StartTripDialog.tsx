import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StartTripInput } from "@/hooks/useDrivingLog";
import { useCompanyVehicles } from "@/hooks/useCompanyVehicles";
import { format } from "date-fns";
import { Car } from "lucide-react";

interface StartTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StartTripInput) => void;
  isPending: boolean;
  lastOdometerEnd?: number | null;
}

const MANUAL = "__manual__";

export function StartTripDialog({ open, onOpenChange, onSubmit, isPending, lastOdometerEnd }: StartTripDialogProps) {
  const { vehicles } = useCompanyVehicles();
  const activeVehicles = useMemo(() => vehicles.filter((v) => v.is_active), [vehicles]);

  const [tripDate, setTripDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startLocation, setStartLocation] = useState("");
  const [odometerStart, setOdometerStart] = useState(lastOdometerEnd?.toString() || "");
  const [vehicleType, setVehicleType] = useState("company");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(MANUAL);
  const [tripType, setTripType] = useState("business");
  const [purpose, setPurpose] = useState("");

  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    if (id === MANUAL) {
      setVehicleRegistration("");
      return;
    }
    const v = activeVehicles.find((x) => x.id === id);
    if (v) {
      setVehicleRegistration(v.license_plate);
      if (v.vehicle_type === "private" || v.vehicle_type === "company") {
        setVehicleType(v.vehicle_type);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseFloat(odometerStart);
    if (isNaN(start)) return;

    onSubmit({
      trip_date: tripDate,
      start_location: startLocation,
      odometer_start: start,
      vehicle_type: vehicleType,
      vehicle_registration: vehicleRegistration || undefined,
      trip_type: tripType,
      purpose: purpose || undefined,
    });

    setStartLocation("");
    setOdometerStart("");
    setPurpose("");
    setVehicleRegistration("");
    setSelectedVehicleId(MANUAL);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start ny tur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="st-date">Dato</Label>
              <Input id="st-date" type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-type">Type kjøring</Label>
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

          {activeVehicles.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> Velg bil fra bilpark</Label>
              <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                <SelectTrigger><SelectValue placeholder="Velg bil..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={MANUAL}>Skriv inn manuelt</SelectItem>
                  {activeVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.license_plate} {[v.make, v.model].filter(Boolean).join(" ") && `– ${[v.make, v.model].filter(Boolean).join(" ")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="st-start">Startsted *</Label>
            <Input id="st-start" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder="F.eks. Kontoret, Oslo" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-km">Km-stand start *</Label>
            <Input id="st-km" type="number" step="0.1" value={odometerStart} onChange={e => setOdometerStart(e.target.value)} placeholder="F.eks. 45230" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-purpose">Formål (valgfritt nå, kan fylles ut ved avslutning)</Label>
            <Input id="st-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="F.eks. Kundemøte" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="st-vehicle">Biltype</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Firmabil</SelectItem>
                  <SelectItem value="private">Privatbil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-reg">Reg.nr</Label>
              <Input id="st-reg" value={vehicleRegistration} onChange={e => setVehicleRegistration(e.target.value)} placeholder="AB 12345" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button type="submit" disabled={isPending || !startLocation || !odometerStart}>
              {isPending ? "Starter..." : "Start tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
