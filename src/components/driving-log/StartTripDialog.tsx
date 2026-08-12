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
import { t } from "@/i18n/t";

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
          <DialogTitle>{t("auto.start_ny_tur")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="st-date">{t("auto.dato")}</Label>
              <Input id="st-date" type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-type">{t("auto.type_kjoering_2")}</Label>
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

          {activeVehicles.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> Velg bil fra bilpark</Label>
              <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                <SelectTrigger><SelectValue placeholder={t("auto.velg_bil")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={MANUAL}>{t("auto.skriv_inn_manuelt")}</SelectItem>
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
            <Label htmlFor="st-start">{t("auto.startsted")}</Label>
            <Input id="st-start" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder={t("auto.f_eks_kontoret_oslo")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-km">{t("auto.km_stand_start_3")}</Label>
            <Input id="st-km" type="number" step="0.1" value={odometerStart} onChange={e => setOdometerStart(e.target.value)} placeholder={t("auto.f_eks_45230")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-purpose">Formål (valgfritt nå, kan fylles ut ved avslutning)</Label>
            <Input id="st-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t("auto.f_eks_kundemoete")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="st-vehicle">{t("auto.biltype_2")}</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">{t("auto.firmabil")}</SelectItem>
                  <SelectItem value="private">{t("auto.privatbil")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-reg">{t("auto.reg_nr")}</Label>
              <Input id="st-reg" value={vehicleRegistration} onChange={e => setVehicleRegistration(e.target.value)} placeholder={t("auto.ab_12345")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("auto.avbryt")}</Button>
            <Button type="submit" disabled={isPending || !startLocation || !odometerStart}>
              {isPending ? "Starter..." : "Start tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
