import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Building2, Coffee, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { useKsModule2Settings } from "@/hooks/useKsModule2Settings";
import { checkGeofence, getCurrentPosition, GeofenceStatus, GeoPoint } from "@/lib/geo";
import { PositionMap } from "@/components/map/PositionMap";
import { toast } from "sonner";
import { useTimeClock } from "@/hooks/useTimeClock";
import { t } from "@/i18n/t";

export default function TimeClock() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { activeEntry, clockIn, clockOut, startBreak, endBreak, isOnBreak, findQrCodeByCode, isLoading } = useTimeClock();
  
  const [qrCodeName, setQrCodeName] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { data: projectOptions = [] } = useProjectOptions();
  const { settings } = useKsModule2Settings();
  const allowOutside = (settings as any)?.geofence_allow_outside !== false;
  const [projectId, setProjectId] = useState<string>("none");
  const [pending, setPending] = useState<{
    type: "in" | "out";
    point: GeoPoint | null;
    status: GeofenceStatus;
    distanceM: number | null;
  } | null>(null);
  const [reason, setReason] = useState("");

  const selectedProject = projectOptions.find((p) => p.id === projectId);
  const fence =
    selectedProject?.geofence_enabled && selectedProject.geofence_lat != null && selectedProject.geofence_lng != null
      ? {
          lat: selectedProject.geofence_lat as number,
          lng: selectedProject.geofence_lng as number,
          radiusM: selectedProject.geofence_radius_m || 150,
        }
      : null;

  const performClock = async (
    type: "in" | "out",
    point: GeoPoint | null,
    status: GeofenceStatus,
    distanceM: number | null,
    reasonText: string | null
  ) => {
    const geo = {
      project_id: projectId === "none" ? null : projectId,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      status,
      distanceM,
      reason: reasonText,
    };
    setProcessing(true);
    if (type === "in") {
      await clockIn(qrCodeId || undefined, geo);
    } else {
      const ok = await clockOut(notes || undefined, geo);
      if (ok) setNotes("");
    }
    setProcessing(false);
  };

  const runClock = async (type: "in" | "out") => {
    if (!fence) {
      let point: GeoPoint | null = null;
      if (projectId !== "none") {
        try { point = await getCurrentPosition(); } catch { /* uten posisjon */ }
      }
      await performClock(type, point, point ? "unknown" : "unknown", null, null);
      return;
    }

    setProcessing(true);
    let point: GeoPoint | null = null;
    try {
      point = await getCurrentPosition();
    } catch (err: any) {
      toast.warning(err.message || "Fant ikke posisjon");
    }
    const result = checkGeofence(point, { lat: fence.lat, lng: fence.lng }, fence.radiusM);
    setProcessing(false);

    if (result.status === "inside") {
      toast.success("Du er innenfor prosjektområdet.");
      await performClock(type, point, result.status, result.distanceM, null);
      return;
    }
    setReason("");
    setPending({ type, point, status: result.status, distanceM: result.distanceM });
  };

  const code = searchParams.get("kode");

  // Validate QR code on load
  useEffect(() => {
    const validateCode = async () => {
      if (code) {
        const qr = await findQrCodeByCode(code);
        if (qr) {
          setQrCodeName(qr.name);
          setQrCodeId(qr.id);
        }
      }
    };
    validateCode();
  }, [code]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      // Preserve the QR code in the redirect
      const returnUrl = code ? `/stemple?kode=${code}` : "/stemple";
      navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, code, navigate]);

  const handleClockIn = () => runClock("in");

  const handleClockOut = () => runClock("out");

  const handleStartBreak = async () => {
    setProcessing(true);
    await startBreak();
    setProcessing(false);
  };

  const handleEndBreak = async () => {
    setProcessing(true);
    await endBreak();
    setProcessing(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("auto.laster")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // No success screen - stay on main page, toast handles feedback

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{t("auto.stempling")}</CardTitle>
          {qrCodeName && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Building2 className="h-4 w-4" />
              {qrCodeName}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User info */}
          <div className="text-center pb-4 border-b">
            <p className="font-medium">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE d. MMMM yyyy", { locale: nb })}
            </p>
          </div>

          {/* Prosjekt og geogjerde */}
          {projectOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Prosjekt (valgfritt)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Velg prosjekt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen prosjekt</SelectItem>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.project_number ? `${p.project_number} – ` : ""}{p.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fence && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Badge variant="outline">Geogjerde {fence.radiusM} m</Badge>
                  Posisjonen din sjekkes når du stempler inn og ut.
                </p>
              )}
            </div>
          )}

          {/* Current status */}
          {activeEntry ? (
            <div className="space-y-4">
              {isOnBreak ? (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 mb-1">
                    <Coffee className="h-5 w-5" />
                    <span className="font-medium">{t("auto.du_er_paa_pause")}</span>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Siden {format(new Date(activeEntry.break_start!), "HH:mm", { locale: nb })}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 mb-1">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{t("auto.du_er_stemplet_inn")}</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Siden {format(new Date(activeEntry.clock_in), "HH:mm", { locale: nb })}
                    {activeEntry.total_break_minutes ? ` • ${activeEntry.total_break_minutes} min pause` : ""}
                  </p>
                </div>
              )}

              {/* Pause button */}
              {isOnBreak ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600"
                  onClick={handleEndBreak}
                  disabled={processing}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {processing ? "Avslutter pause..." : "Avslutt pause"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-12 text-base"
                  variant="outline"
                  onClick={handleStartBreak}
                  disabled={processing}
                >
                  <Coffee className="mr-2 h-5 w-5" />
                  {processing ? "Starter pause..." : "Start pause"}
                </Button>
              )}

              {/* Notes for clock out */}
              {!isOnBreak && (
                <div>
                  <Label htmlFor="notes">{t("auto.notat_valgfritt")}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t("auto.legg_til_et_notat_om_arbeidsdagen")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-14 text-lg"
                variant="destructive"
                onClick={handleClockOut}
                disabled={processing || isOnBreak}
              >
                <LogOut className="mr-2 h-5 w-5" />
                {processing ? "Stempler ut..." : "Stemple ut"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <AlertCircle className="h-5 w-5" />
                  <span>{t("auto.ikke_stemplet_inn")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("auto.trykk_paa_knappen_under_for_aa_starte_ar")}
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleClockIn}
                disabled={processing}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {processing ? "Stempler inn..." : "Stemple inn"}
              </Button>
            </div>
          )}

          {/* Time display */}
          <div className="text-center pt-4 border-t">
            <p className="text-4xl font-mono font-bold text-primary">
              {format(new Date(), "HH:mm")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.status === "outside" ? "Du er utenfor prosjektområdet" : "Posisjon kunne ikke registreres"}
            </DialogTitle>
            <DialogDescription>
              {pending?.status === "outside"
                ? `Du er ${pending?.distanceM} meter fra prosjektområdet. ${
                    allowOutside
                      ? "Vil du likevel registrere arbeidstiden? Skriv en kort begrunnelse."
                      : "Bedriften tillater ikke registrering utenfor området."
                  }`
                : "Vi fikk ikke tak i posisjonen din. Stemplingen blir merket som uten posisjon."}
            </DialogDescription>
          </DialogHeader>

          {pending?.point && fence && (
            <PositionMap
              position={{ lat: pending.point.lat, lng: pending.point.lng }}
              fence={fence}
              height={200}
            />
          )}

          {(pending?.status === "outside" ? allowOutside : true) && (
            <div className="space-y-2">
              <Label htmlFor="tc-reason">Begrunnelse {pending?.status === "outside" ? "*" : "(valgfritt)"}</Label>
              <Textarea id="tc-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Avbryt</Button>
            <Button
              disabled={processing || (pending?.status === "outside" && (!allowOutside || !reason.trim()))}
              onClick={async () => {
                if (!pending) return;
                await performClock(pending.type, pending.point, pending.status, pending.distanceM, reason || null);
                setPending(null);
              }}
            >
              {pending?.type === "in" ? "Stemple inn likevel" : "Stemple ut likevel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
