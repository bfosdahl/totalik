import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTimeClock } from "@/hooks/useTimeClock";
import { useKsModule2Settings } from "@/hooks/useKsModule2Settings";
import { checkGeofence, getCurrentPosition, GeofenceStatus, GeoPoint } from "@/lib/geo";
import { PositionMap } from "@/components/map/PositionMap";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, LogIn, LogOut, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ProjectClockCardProps {
  projectId: string;
  projectName: string;
  geofence?: {
    enabled: boolean;
    lat: number | null;
    lng: number | null;
    radiusM: number;
  };
}

interface PendingAction {
  type: "in" | "out";
  point: GeoPoint | null;
  status: GeofenceStatus;
  distanceM: number | null;
}

export function ProjectClockCard({ projectId, projectName, geofence }: ProjectClockCardProps) {
  const { activeEntry, clockIn, clockOut } = useTimeClock();
  const { settings } = useKsModule2Settings();
  const allowOutside = settings?.geofence_allow_outside !== false;

  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [outDesc, setOutDesc] = useState("");
  const [outDescError, setOutDescError] = useState(false);
  const outDescRef = useRef("");

  const fenceActive = !!geofence?.enabled && geofence.lat != null && geofence.lng != null;
  const activeHere = activeEntry && (activeEntry as any).project_id === projectId;

  const runCheck = async (type: "in" | "out") => {
    setBusy(true);
    let point: GeoPoint | null = null;
    try {
      point = await getCurrentPosition();
    } catch (err: any) {
      toast.warning(err.message || "Fant ikke posisjon");
    }

    if (!fenceActive) {
      await perform(type, point, "unknown", null, null);
      setBusy(false);
      return;
    }

    const result = checkGeofence(point, { lat: geofence!.lat, lng: geofence!.lng }, geofence!.radiusM);
    setBusy(false);

    if (result.status === "inside") {
      toast.success("Du er innenfor prosjektområdet.");
      await perform(type, point, result.status, result.distanceM, null);
      return;
    }

    // Utenfor eller ukjent posisjon – be om bekreftelse/begrunnelse
    setReason("");
    setPending({ type, point, status: result.status, distanceM: result.distanceM });
  };

  const perform = async (
    type: "in" | "out",
    point: GeoPoint | null,
    status: GeofenceStatus,
    distanceM: number | null,
    reasonText: string | null
  ) => {
    setBusy(true);
    const geo = {
      project_id: projectId,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      status,
      distanceM,
      reason: reasonText,
    };
    if (type === "in") await clockIn(undefined, geo);
    else await clockOut(outDescRef.current || undefined, geo);
    setBusy(false);
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (!allowOutside && pending.status === "outside") return;
    await perform(pending.type, pending.point, pending.status, pending.distanceM, reason || null);
    setPending(null);
  };

  const statusBadge = () => {
    if (!activeHere) return null;
    const s = (activeEntry as any).geofence_status_in as GeofenceStatus | null;
    if (s === "inside") return <Badge className="bg-green-600">Innenfor området</Badge>;
    if (s === "outside") return <Badge variant="destructive">Utenfor området</Badge>;
    return <Badge variant="secondary">Posisjon ikke registrert</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Arbeidstid på {projectName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {fenceActive ? (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" /> Geogjerde {geofence!.radiusM} m
              </Badge>
            ) : (
              <Badge variant="outline">Uten geogjerde</Badge>
            )}
            {activeHere && (
              <>
                <Badge className="bg-green-600 animate-pulse">Arbeidstid pågår</Badge>
                <span className="text-sm text-muted-foreground">
                  Startet {format(new Date(activeEntry!.clock_in), "HH:mm")}
                </span>
                {statusBadge()}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!activeEntry && (
              <Button onClick={() => runCheck("in")} disabled={busy} className="gap-2">
                <LogIn className="h-4 w-4" /> Start arbeidstid
              </Button>
            )}
            {activeHere && (
              <Button variant="outline" onClick={() => { setOutDesc(""); setOutDescError(false); setDescOpen(true); }} disabled={busy} className="gap-2">
                <LogOut className="h-4 w-4" /> Stopp arbeidstid
              </Button>
            )}
            {activeEntry && !activeHere && (
              <p className="text-sm text-muted-foreground">
                Du har allerede startet arbeidstid et annet sted. Stopp den først.
              </p>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Posisjonen hentes kun når du starter eller stopper arbeidstiden – ikke gjennom arbeidsdagen.
          </p>
        </CardContent>
      </Card>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pending?.status === "outside" ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Du er utenfor prosjektområdet
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> Posisjon kunne ikke registreres
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pending?.status === "outside"
                ? `Du er ${pending?.distanceM} meter fra prosjektområdet. ${
                    allowOutside
                      ? "Vil du likevel registrere arbeidstiden? Skriv en kort begrunnelse."
                      : "Bedriften tillater ikke registrering utenfor området."
                  }`
                : "Vi fikk ikke tak i posisjonen din. Du kan likevel registrere arbeidstiden, men det blir merket som uten posisjon."}
            </DialogDescription>
          </DialogHeader>

          {pending?.point && geofence?.lat != null && geofence?.lng != null && (
            <PositionMap
              position={{ lat: pending.point.lat, lng: pending.point.lng }}
              fence={{ lat: geofence.lat, lng: geofence.lng, radiusM: geofence.radiusM }}
              height={200}
            />
          )}

          {(pending?.status === "outside" ? allowOutside : true) && (
            <div className="space-y-2">
              <Label htmlFor="geo-reason">Begrunnelse {pending?.status === "outside" ? "*" : "(valgfritt)"}</Label>
              <Textarea
                id="geo-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="F.eks. henter materialer for prosjektet"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Avbryt</Button>
            <Button
              onClick={confirmPending}
              disabled={
                busy ||
                (pending?.status === "outside" && (!allowOutside || !reason.trim()))
              }
            >
              {pending?.type === "in" ? "Start likevel" : "Stopp likevel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={descOpen} onOpenChange={setDescOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hva jobbet du med?</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="clockout-desc">Beskrivelse *</Label>
            <Textarea id="clockout-desc" value={outDesc} onChange={(e) => setOutDesc(e.target.value)} rows={3} />
            {outDescError && !outDesc.trim() && (
              <p className="text-sm text-destructive">Beskrivelse må fylles ut</p>
            )}
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setDescOpen(false)}>Avbryt</Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                const d = outDesc.trim();
                if (!d) {
                  setOutDescError(true);
                  toast.error("Beskrivelse må fylles ut");
                  return;
                }
                outDescRef.current = d;
                setDescOpen(false);
                runCheck("out");
              }}
            >
              Stopp arbeidstid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProjectClockCard;
