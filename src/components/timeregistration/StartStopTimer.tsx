import { useState, useEffect } from "react";
import { Play, Square, Pause, Briefcase, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { checkGeofence, getCurrentPosition, GeofenceStatus, GeoPoint } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";
import { useProjectOptions } from "@/hooks/useProjectOptions";

const NO_PROJECT = "__none__";
const LAST_PROJECT_KEY = "timer:lastProjectId";

export interface GeoStamp {
  lat: number | null;
  lng: number | null;
  status: GeofenceStatus | null;
  distanceM: number | null;
}

export interface TimerResult {
  ksProjectId: string | null;
  projectName: string | null;
  startGeo?: GeoStamp | null;
  endGeo?: GeoStamp | null;
  description: string;
}

interface StartStopTimerProps {
  onComplete: (hours: number, result: TimerResult) => void;
  isDisabled?: boolean;
}

export function StartStopTimer({ onComplete, isDisabled }: StartStopTimerProps) {
  const { data: projects = [] } = useProjectOptions();
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [startGeo, setStartGeo] = useState<GeoStamp | null>(null);
  const [locating, setLocating] = useState(false);
  const [pending, setPending] = useState<{ hours: number; endGeo: GeoStamp | null } | null>(null);
  const [stopDesc, setStopDesc] = useState("");
  const [stopDescError, setStopDescError] = useState(false);

  // Load saved timer state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("activeTimer");
    if (saved) {
      const { startTime: savedStart, pausedSeconds: savedPaused, isPaused: savedIsPaused, projectId: savedProject, startGeo: savedGeo } = JSON.parse(saved);
      setStartTime(new Date(savedStart));
      setPausedSeconds(savedPaused || 0);
      setIsPaused(savedIsPaused || false);
      if (savedProject) setProjectId(savedProject);
      if (savedGeo) setStartGeo(savedGeo);
      setIsRunning(true);
    } else {
      const last = localStorage.getItem(LAST_PROJECT_KEY);
      if (last) setProjectId(last);
    }
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (!isRunning || !startTime || isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pausedSeconds;
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime, isPaused, pausedSeconds]);

  // Save timer state to localStorage
  useEffect(() => {
    if (isRunning && startTime) {
      localStorage.setItem("activeTimer", JSON.stringify({
        startTime: startTime.toISOString(),
        pausedSeconds,
        isPaused,
        projectId,
        startGeo,
      }));
    }
  }, [isRunning, startTime, pausedSeconds, isPaused, projectId, startGeo]);


  const selectedProject = projects.find((p) => p.id === projectId) || null;
  const fence =
    selectedProject?.geofence_enabled && selectedProject.geofence_lat != null && selectedProject.geofence_lng != null
      ? {
          lat: selectedProject.geofence_lat as number,
          lng: selectedProject.geofence_lng as number,
          radiusM: selectedProject.geofence_radius_m ?? 150,
        }
      : null;

  /** Henter posisjon kun i det øyeblikket man starter eller stopper arbeidstiden */
  const stampPosition = async (): Promise<GeoStamp | null> => {
    if (projectId === NO_PROJECT) return null;
    let point: GeoPoint | null = null;
    try {
      point = await getCurrentPosition();
    } catch (err: any) {
      toast.warning(err?.message || "Fant ikke posisjonen din");
    }
    if (!point) return { lat: null, lng: null, status: "unknown", distanceM: null };
    if (!fence) return { lat: point.lat, lng: point.lng, status: "unknown", distanceM: null };
    const result = checkGeofence(point, { lat: fence.lat, lng: fence.lng }, fence.radiusM);
    return { lat: point.lat, lng: point.lng, status: result.status, distanceM: result.distanceM };
  };

  const handleStart = async () => {
    const now = new Date();
    if (projectId !== NO_PROJECT) localStorage.setItem(LAST_PROJECT_KEY, projectId);
    setLocating(true);
    const geo = await stampPosition();
    setLocating(false);
    setStartGeo(geo);
    if (geo?.status === "inside") toast.success("Du er innenfor prosjektområdet.");
    if (geo?.status === "outside") toast.warning(`Du er ${geo.distanceM} m fra prosjektområdet. Dette blir synlig for leder.`);
    setStartTime(now);
    setElapsedSeconds(0);
    setPausedSeconds(0);
    setIsPaused(false);
    setIsRunning(true);
  };


  const handlePause = () => {
    if (!isPaused) {
      // Pausing - record when we paused
      setIsPaused(true);
      localStorage.setItem("pauseStart", new Date().toISOString());
    } else {
      // Resuming - add paused time
      const pauseStart = localStorage.getItem("pauseStart");
      if (pauseStart) {
        const pauseDuration = Math.floor((new Date().getTime() - new Date(pauseStart).getTime()) / 1000);
        setPausedSeconds(prev => prev + pauseDuration);
        localStorage.removeItem("pauseStart");
      }
      setIsPaused(false);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setPausedSeconds(0);
    setIsPaused(false);
    setStartGeo(null);
    localStorage.removeItem("activeTimer");
    localStorage.removeItem("pauseStart");
  };

  const handleStop = async () => {
    if (!startTime) return;

    const hours = elapsedSeconds / 3600;

    setLocating(true);
    const endGeo = await stampPosition();
    setLocating(false);

    // Under 1 minutt: bare nullstill uten dialog
    if (hours < 1 / 60) {
      resetTimer();
      return;
    }
    setStopDesc("");
    setStopDescError(false);
    setPending({ hours: Math.round(hours * 4) / 4, endGeo }); // nærmeste 0,25 t
  };

  const handleSaveStop = () => {
    if (!pending) return;
    const desc = stopDesc.trim();
    if (!desc) {
      setStopDescError(true);
      toast.error("Beskrivelse må fylles ut");
      return;
    }
    onComplete(pending.hours, {
      ksProjectId: projectId === NO_PROJECT ? null : projectId,
      projectName: selectedProject?.project_name ?? null,
      startGeo,
      endGeo: pending.endGeo,
      description: desc,
    });
    setPending(null);
    resetTimer();
  };

  const formatDuration = (h: number) => {
    const total = Math.round(h * 60);
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return hh > 0 ? `${hh} t${mm ? ` ${mm} min` : ""}` : `${mm} min`;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRunning) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Velg prosjekt
            </Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={isDisabled}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Velg prosjekt (valgfritt)" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value={NO_PROJECT}>Uten prosjekt</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.project_number ? `${p.project_number} - ` : ""}{p.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleStart}
            disabled={isDisabled || locating}
            size="lg"
            className="w-full h-14 text-lg gap-3"
          >
            <Play className="h-6 w-6" />
            {locating ? "Henter posisjon …" : "Start arbeidstid"}
          </Button>
          {fence && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Prosjektet har arbeidsområde ({fence.radiusM} m). Posisjonen registreres kun når du starter og stopper arbeidstiden.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }


  return (
    <>
    <Card className={cn(
      "border-2",
      isPaused ? "border-orange-500 bg-orange-500/5" : "border-green-500 bg-green-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={isPaused ? "secondary" : "default"} className={cn(
                "animate-pulse",
                !isPaused && "bg-green-500"
              )}>
                {isPaused ? t("auto.pause") : t("auto.paagaar")}
              </Badge>
              {startTime && (
                <span className="text-xs text-muted-foreground">
                  {t("auto.startet")} {startTime.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            {selectedProject && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {selectedProject.project_name}
              </p>
            )}
            {startGeo && (
              <p className="text-xs mt-1 flex items-center gap-1">
                <MapPin className={cn("h-3 w-3", startGeo.status === "outside" ? "text-amber-600" : "text-muted-foreground")} />
                {startGeo.status === "inside"
                  ? "Startet innenfor prosjektområdet"
                  : startGeo.status === "outside"
                    ? `Startet ${startGeo.distanceM} m utenfor prosjektområdet`
                    : "Posisjon ikke registrert"}
              </p>
            )}
            <p className="text-3xl font-mono font-bold mt-1 tabular-nums">
              {formatTime(elapsedSeconds)}
            </p>

          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePause}
              className="h-12 w-12"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleStop}
              className="h-12 w-12"
            >
              <Square className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    <Dialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hva jobbet du med?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">
            Tid som registreres: <span className="font-semibold">{pending ? formatDuration(pending.hours) : ""}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="timer-desc">Beskrivelse *</Label>
            <Textarea
              id="timer-desc"
              value={stopDesc}
              onChange={(e) => setStopDesc(e.target.value)}
              rows={3}
            />
            {stopDescError && !stopDesc.trim() && (
              <p className="text-sm text-destructive">Beskrivelse må fylles ut</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setPending(null)}>Avbryt</Button>
          <Button type="button" onClick={handleSaveStop}>Lagre timer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
