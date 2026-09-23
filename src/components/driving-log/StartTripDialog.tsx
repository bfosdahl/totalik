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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StartTripInput } from "@/hooks/useDrivingLog";
import { useCompanyVehicles } from "@/hooks/useCompanyVehicles";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { GeoPoint, getCurrentPosition, reverseGeocode } from "@/lib/geo";
import { format } from "date-fns";
import { Car, Loader2, Navigation, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n/t";

interface StartTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StartTripInput, gpsStart?: GeoPoint | null) => void;
  isPending: boolean;
  lastOdometerEnd?: number | null;
}

const MANUAL = "__manual__";
const NO_PROJECT = "__none__";

export function StartTripDialog({ open, onOpenChange, onSubmit, isPending, lastOdometerEnd }: StartTripDialogProps) {
  const { vehicles } = useCompanyVehicles();
  const { data: projects = [] } = useProjectOptions();
  const activeVehicles = useMemo(() => vehicles.filter((v) => v.is_active), [vehicles]);

  const [tripDate, setTripDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startLocation, setStartLocation] = useState("");
  const [odometerStart, setOdometerStart] = useState(lastOdometerEnd?.toString() || "");
  const [vehicleType, setVehicleType] = useState("company");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(MANUAL);
  const [tripType, setTripType] = useState("business");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);
  const [useGps, setUseGps] = useState(true);
  const [locating, setLocating] = useState(false);

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
      if ((v as any).current_odometer != null && !odometerStart) {
        setOdometerStart(String((v as any).current_odometer));
      }
    }
  };

  const fetchPosition = async (): Promise<GeoPoint | null> => {
    setLocating(true);
    try {
      const point = await getCurrentPosition();
      const address = await reverseGeocode(point);
      if (address) setStartLocation(address);
      return point;
    } catch (err: any) {
      toast.error(err.message || "Fant ikke posisjon");
      return null;
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let gpsStart: GeoPoint | null = null;
    let resolvedStart = startLocation;

    if (useGps) {
      gpsStart = await fetchPosition();
      if (gpsStart && !resolvedStart) {
        resolvedStart = (await reverseGeocode(gpsStart)) || "Startposisjon (GPS)";
      }
      if (!gpsStart && !resolvedStart) {
        toast.error("Skriv inn startsted, eller slå av GPS for denne turen.");
        return;
      }
      resolvedStart = resolvedStart || startLocation || "Startposisjon (GPS)";
    }

    const start = parseFloat(odometerStart);

    onSubmit(
      {
        trip_date: tripDate,
        start_location: resolvedStart || startLocation,
        odometer_start: isNaN(start) ? 0 : start,
        vehicle_type: vehicleType,
        vehicle_registration: vehicleRegistration || undefined,
        trip_type: tripType,
        purpose: purpose || undefined,
        notes: destination ? `Planlagt destinasjon: ${destination}` : undefined,
        project_id: projectId === NO_PROJECT ? null : projectId,
        tracking_mode: useGps ? "gps" : "manual",
        start_lat: gpsStart?.lat ?? null,
        start_lng: gpsStart?.lng ?? null,
        started_at: new Date().toISOString(),
      },
      gpsStart
    );

    setStartLocation("");
    setOdometerStart("");
    setPurpose("");
    setDestination("");
    setVehicleRegistration("");
    setSelectedVehicleId(MANUAL);
    setProjectId(NO_PROJECT);
    onOpenChange(false);
  };

  const canSubmit = useGps ? !!(vehicleRegistration || selectedVehicleId === MANUAL) : !!startLocation && !!odometerStart;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("auto.start_ny_tur")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="st-gps" className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4" /> Bruk GPS på mobilen
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Adresse, kjørelengde, stopp og varighet registreres automatisk.
                Sporingen starter nå og stopper når du trykker «Stopp kjøretur».
              </p>
            </div>
            <Switch id="st-gps" checked={useGps} onCheckedChange={setUseGps} />
          </div>

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
              <Label className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> {t("auto.velg_bil_fra_bilpark")}</Label>
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

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Prosjekt (valgfritt)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Velg prosjekt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>Ingen</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.project_number ? `${p.project_number} – ` : ""}{p.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="st-start">Startsted {useGps ? "(hentes fra GPS)" : "*"}</Label>
              {useGps && (
                <Button type="button" variant="ghost" size="sm" onClick={fetchPosition} disabled={locating}>
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Hent posisjon"}
                </Button>
              )}
            </div>
            <Input id="st-start" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder={useGps ? "Fylles inn automatisk" : t("auto.f_eks_kontoret_oslo")} required={!useGps} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-dest">Planlagt destinasjon (valgfritt)</Label>
            <Input id="st-dest" value={destination} onChange={e => setDestination(e.target.value)} placeholder="F.eks. Ringveien 7, Halden" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-km">Km-stand start {useGps ? "(valgfritt)" : "*"}</Label>
            <Input id="st-km" type="number" step="0.1" value={odometerStart} onChange={e => setOdometerStart(e.target.value)} placeholder={t("auto.f_eks_45230")} required={!useGps} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-purpose">{t("auto.formaal_valgfritt_naa_kan_fylles_ut_ved_")}</Label>
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

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Posisjonen registreres kun mens turen pågår, og alle punkter lagres med dato og klokkeslett.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("auto.avbryt")}</Button>
            <Button type="submit" disabled={isPending || locating || !canSubmit}>
              {isPending || locating ? "Starter..." : useGps ? "Start kjøretur" : "Start tur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
