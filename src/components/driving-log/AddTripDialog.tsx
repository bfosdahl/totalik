import { useState } from "react";
import { JevCheckPanel } from "@/components/shared/JevCheckPanel";
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
import { t } from "@/i18n/t";

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
    
    const start = odometerStart ? parseFloat(odometerStart) : 0;
    const end = odometerEnd ? parseFloat(odometerEnd) : undefined;
    
    // Only validate km if both are provided
    if (odometerStart && odometerEnd) {
      const s = parseFloat(odometerStart);
      const e = parseFloat(odometerEnd);
      if (isNaN(s) || isNaN(e) || e <= s) return;
    }

    onSubmit({
      trip_date: tripDate,
      purpose: purpose || "Ikke angitt ennå",
      start_location: startLocation,
      end_location: endLocation || startLocation,
      via_locations: viaLocations || undefined,
      odometer_start: start,
      odometer_end: end ?? start,
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
    setOdometerStart(odometerEnd || odometerStart);
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
          <DialogTitle>{t("auto.registrer_ny_tur")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tripDate">{t("auto.dato_2")}</Label>
              <Input id="tripDate" type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tripType">{t("auto.type_kjoering")}</Label>
              <Select value={tripType} onValueChange={setTripType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">{t("auto.yrkeskjoering")}</SelectItem>
                  <SelectItem value="commute">{t("auto.arbeidsreise")}</SelectItem>
                  <SelectItem value="private">{t("auto.privat")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">{t("auto.formaal_med_turen")}</Label>
            <Input id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="F.eks. Kundemøte hos Bygg AS (kan fylles inn senere)" />
          </div>

          <JevCheckPanel
            label="Foreslå type kjøring"
            disabled={purpose.trim().length < 3}
            hint="Skriv formål med turen først."
            run={async (call) => {
              const r = await call<{ tripType: string; confidence: number | null }>({ mode: "trip_type", purpose, from: startLocation, to: endLocation, notes });
              if (!r) return null;
              const names: Record<string, string> = { business: "Yrkeskjøring", commute: "Arbeidsreise", private: "Privat" };
              setTripType(r.tripType);
              return [{ ok: true, text: `Satt til «${names[r.tripType]}». Endre over om det er feil.` }];
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation">Fra (startsted) *</Label>
              <Input id="startLocation" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder={t("auto.f_eks_kontoret_oslo")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endLocation">Til (sluttsted)</Label>
              <Input id="endLocation" value={endLocation} onChange={e => setEndLocation(e.target.value)} placeholder={t("auto.kan_fylles_inn_etter_turen")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="viaLocations">{t("auto.via_stoppesteder")}</Label>
            <Input id="viaLocations" value={viaLocations} onChange={e => setViaLocations(e.target.value)} placeholder={t("auto.evt_mellomlandinger")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odometerStart">{t("auto.km_stand_start")}</Label>
              <Input id="odometerStart" type="number" step="0.1" value={odometerStart} onChange={e => setOdometerStart(e.target.value)} placeholder={t("auto.kan_fylles_inn_senere")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometerEnd">{t("auto.km_stand_slutt")}</Label>
              <Input id="odometerEnd" type="number" step="0.1" value={odometerEnd} onChange={e => setOdometerEnd(e.target.value)} placeholder={t("auto.kan_fylles_inn_senere")} />
            </div>
          </div>

          {distance && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              {t("auto.beregnet_kjoerelengde")} <strong>{distance} km</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">{t("auto.biltype")}</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">{t("auto.firmabil")}</SelectItem>
                  <SelectItem value="private">{t("auto.privatbil")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleRegistration">{t("auto.reg_nr")}</Label>
              <Input id="vehicleRegistration" value={vehicleRegistration} onChange={e => setVehicleRegistration(e.target.value)} placeholder={t("auto.f_eks_ab_12345")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleDescription">{t("auto.bilbeskrivelse")}</Label>
            <Input id="vehicleDescription" value={vehicleDescription} onChange={e => setVehicleDescription(e.target.value)} placeholder={t("auto.f_eks_toyota_hilux_2023")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengerCount">{t("auto.antall_passasjerer")}</Label>
              <Input id="passengerCount" type="number" min="0" value={passengerCount} onChange={e => setPassengerCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Passasjerer (navn)</Label>
              <Input id="passengers" value={passengers} onChange={e => setPassengers(e.target.value)} placeholder={t("auto.navn_paa_passasjerer")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("auto.merknader")}</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("auto.eventuelle_merknader")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("auto.avbryt")}</Button>
            <Button type="submit" disabled={isPending || !startLocation}>
              {isPending ? "Lagrer..." : "Registrer tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
