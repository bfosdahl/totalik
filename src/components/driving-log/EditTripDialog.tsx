import { useState, useEffect } from "react";
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
import { DrivingLogEntry } from "@/hooks/useDrivingLog";
import { format, parseISO } from "date-fns";
import { t } from "@/i18n/t";

interface EditTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { id: string } & Record<string, any>) => void;
  isPending: boolean;
  trip: DrivingLogEntry | null;
}

export function EditTripDialog({ open, onOpenChange, onSubmit, isPending, trip }: EditTripDialogProps) {
  const [tripDate, setTripDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [viaLocations, setViaLocations] = useState("");
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [vehicleType, setVehicleType] = useState("company");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [tripType, setTripType] = useState("business");
  const [passengerCount, setPassengerCount] = useState("0");
  const [passengers, setPassengers] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (trip && open) {
      setTripDate(format(parseISO(trip.trip_date), "yyyy-MM-dd"));
      setPurpose(trip.purpose || "");
      setStartLocation(trip.start_location);
      setEndLocation(trip.end_location || "");
      setViaLocations(trip.via_locations || "");
      setOdometerStart(trip.odometer_start?.toString() || "");
      setOdometerEnd(trip.odometer_end?.toString() || "");
      setVehicleType(trip.vehicle_type);
      setVehicleRegistration(trip.vehicle_registration || "");
      setVehicleDescription(trip.vehicle_description || "");
      setTripType(trip.trip_type);
      setPassengerCount(trip.passenger_count?.toString() || "0");
      setPassengers(trip.passengers || "");
      setNotes(trip.notes || "");
    }
  }, [trip, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    const start = parseFloat(odometerStart);
    const end = odometerEnd ? parseFloat(odometerEnd) : undefined;

    onSubmit({
      id: trip.id,
      trip_date: tripDate,
      purpose: purpose || undefined,
      start_location: startLocation,
      end_location: endLocation || undefined,
      via_locations: viaLocations || undefined,
      odometer_start: isNaN(start) ? undefined : start,
      odometer_end: end && !isNaN(end) ? end : undefined,
      vehicle_type: vehicleType,
      vehicle_registration: vehicleRegistration || undefined,
      vehicle_description: vehicleDescription || undefined,
      trip_type: tripType,
      passenger_count: parseInt(passengerCount) || 0,
      passengers: passengers || undefined,
      notes: notes || undefined,
    });

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
          <DialogTitle>{t("auto.rediger_tur")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editTripDate">{t("auto.dato_2")}</Label>
              <Input id="editTripDate" type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTripType">{t("auto.type_kjoering")}</Label>
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
            <Label htmlFor="editPurpose">{t("auto.formaal_med_turen")}</Label>
            <Input id="editPurpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t("auto.f_eks_kundemoete_hos_bygg_as")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editStartLocation">Fra (startsted) *</Label>
              <Input id="editStartLocation" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder={t("auto.f_eks_kontoret_oslo")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEndLocation">Til (sluttsted)</Label>
              <Input id="editEndLocation" value={endLocation} onChange={e => setEndLocation(e.target.value)} placeholder={t("auto.f_eks_byggeplass_drammen")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editViaLocations">{t("auto.via_stoppesteder")}</Label>
            <Input id="editViaLocations" value={viaLocations} onChange={e => setViaLocations(e.target.value)} placeholder={t("auto.evt_mellomlandinger")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editOdometerStart">{t("auto.km_stand_start")}</Label>
              <Input id="editOdometerStart" type="number" step="0.1" value={odometerStart} onChange={e => setOdometerStart(e.target.value)} placeholder={t("auto.f_eks_45230")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editOdometerEnd">{t("auto.km_stand_slutt")}</Label>
              <Input id="editOdometerEnd" type="number" step="0.1" value={odometerEnd} onChange={e => setOdometerEnd(e.target.value)} placeholder={t("auto.f_eks_45280")} />
            </div>
          </div>

          {distance && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              {t("auto.beregnet_kjoerelengde")} <strong>{distance} km</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editVehicleType">{t("auto.biltype")}</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">{t("auto.firmabil")}</SelectItem>
                  <SelectItem value="private">{t("auto.privatbil")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editVehicleRegistration">{t("auto.reg_nr")}</Label>
              <Input id="editVehicleRegistration" value={vehicleRegistration} onChange={e => setVehicleRegistration(e.target.value)} placeholder={t("auto.f_eks_ab_12345")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editVehicleDescription">{t("auto.bilbeskrivelse")}</Label>
            <Input id="editVehicleDescription" value={vehicleDescription} onChange={e => setVehicleDescription(e.target.value)} placeholder={t("auto.f_eks_toyota_hilux_2023")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editPassengerCount">{t("auto.antall_passasjerer")}</Label>
              <Input id="editPassengerCount" type="number" min="0" value={passengerCount} onChange={e => setPassengerCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassengers">Passasjerer (navn)</Label>
              <Input id="editPassengers" value={passengers} onChange={e => setPassengers(e.target.value)} placeholder={t("auto.navn_paa_passasjerer")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editNotes">{t("auto.merknader")}</Label>
            <Textarea id="editNotes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("auto.eventuelle_merknader")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("auto.avbryt")}</Button>
            <Button type="submit" disabled={isPending || !startLocation}>
              {isPending ? "Lagrer..." : "Lagre endringer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
