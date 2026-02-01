import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle, CheckCircle2, Info, Vibrate } from "lucide-react";
import { cn } from "@/lib/utils";

interface VibrationSource {
  id: string;
  name: string;
  vibrationLevel: number; // m/s²
  exposureMinutes: number;
}

// Grenseverdier fra Arbeidstilsynet
const HAND_ARM_ACTION_LIMIT = 2.5; // m/s² A(8)
const HAND_ARM_EXPOSURE_LIMIT = 5.0; // m/s² A(8)
const WHOLE_BODY_ACTION_LIMIT = 0.5; // m/s² A(8)
const WHOLE_BODY_EXPOSURE_LIMIT = 1.15; // m/s² A(8)

export function VibrationCalculator() {
  const [vibrationType, setVibrationType] = useState<"hand_arm" | "whole_body">("hand_arm");
  const [sources, setSources] = useState<VibrationSource[]>([
    { id: "1", name: "", vibrationLevel: 0, exposureMinutes: 0 },
  ]);

  const addSource = () => {
    setSources([
      ...sources,
      { id: Date.now().toString(), name: "", vibrationLevel: 0, exposureMinutes: 0 },
    ]);
  };

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(sources.filter((s) => s.id !== id));
    }
  };

  const updateSource = (id: string, field: keyof VibrationSource, value: string | number) => {
    setSources(
      sources.map((s) =>
        s.id === id ? { ...s, [field]: field === "name" ? value : Number(value) || 0 } : s
      )
    );
  };

  // Beregn A(8) - daglig vibrasjonseksponering normalisert til 8 timer
  // Formel: A(8) = sqrt(sum(a²i × Ti / T0)) der T0 = 8 timer = 480 min
  const calculateA8 = () => {
    const T0 = 480; // 8 timer i minutter
    let sumSquared = 0;

    sources.forEach((source) => {
      if (source.vibrationLevel > 0 && source.exposureMinutes > 0) {
        sumSquared += Math.pow(source.vibrationLevel, 2) * (source.exposureMinutes / T0);
      }
    });

    return Math.sqrt(sumSquared);
  };

  // Beregn maksimal eksponeringstid for en gitt vibrasjonsnivå
  const calculateMaxTime = (vibrationLevel: number) => {
    if (vibrationLevel <= 0) return 0;
    const limit = vibrationType === "hand_arm" ? HAND_ARM_EXPOSURE_LIMIT : WHOLE_BODY_EXPOSURE_LIMIT;
    // T = T0 × (limit/a)²
    const maxMinutes = 480 * Math.pow(limit / vibrationLevel, 2);
    return Math.min(maxMinutes, 480);
  };

  const a8Value = calculateA8();
  const actionLimit = vibrationType === "hand_arm" ? HAND_ARM_ACTION_LIMIT : WHOLE_BODY_ACTION_LIMIT;
  const exposureLimit = vibrationType === "hand_arm" ? HAND_ARM_EXPOSURE_LIMIT : WHOLE_BODY_EXPOSURE_LIMIT;

  const getStatus = () => {
    if (a8Value === 0) return { level: "none", color: "text-muted-foreground", bg: "bg-muted" };
    if (a8Value < actionLimit) return { level: "ok", color: "text-green-700", bg: "bg-green-100" };
    if (a8Value < exposureLimit) return { level: "action", color: "text-yellow-700", bg: "bg-yellow-100" };
    return { level: "exceeded", color: "text-red-700", bg: "bg-red-100" };
  };

  const status = getStatus();

  return (
    <div className="space-y-6">
      {/* Type selection */}
      <div className="space-y-2">
        <Label>Type vibrasjon</Label>
        <Select value={vibrationType} onValueChange={(v) => setVibrationType(v as "hand_arm" | "whole_body")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hand_arm">Hånd-arm vibrasjoner</SelectItem>
            <SelectItem value="whole_body">Helkroppsvibrasjoner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Limit info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Grenseverdier for {vibrationType === "hand_arm" ? "hånd-arm" : "helkropp"} vibrasjoner</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-yellow-700">Tiltaksverdi:</span>{" "}
              {actionLimit} m/s² A(8)
            </div>
            <div>
              <span className="font-medium text-red-700">Grenseverdi:</span>{" "}
              {exposureLimit} m/s² A(8)
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Vibration sources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Vibrasjonskilder / utstyr</Label>
          <Button variant="outline" size="sm" onClick={addSource}>
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>

        {sources.map((source, idx) => (
          <div key={source.id} className="grid gap-3 md:grid-cols-4 p-3 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">Maskin/utstyr</Label>
              <Input
                value={source.name}
                onChange={(e) => updateSource(source.id, "name", e.target.value)}
                placeholder="F.eks. Vinkelsliper"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vibrasjonsnivå (m/s²)</Label>
              <Input
                type="number"
                step="0.1"
                value={source.vibrationLevel || ""}
                onChange={(e) => updateSource(source.id, "vibrationLevel", e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Eksponering (min/dag)</Label>
              <Input
                type="number"
                value={source.exposureMinutes || ""}
                onChange={(e) => updateSource(source.id, "exposureMinutes", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 text-xs text-muted-foreground">
                {source.vibrationLevel > 0 && (
                  <span>Maks tid: {Math.round(calculateMaxTime(source.vibrationLevel))} min</span>
                )}
              </div>
              {sources.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeSource(source.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className={cn("p-4 rounded-lg border-2", status.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className={cn("h-8 w-8", status.color)} />
            <div>
              <p className="text-sm text-muted-foreground">Daglig vibrasjonseksponering A(8)</p>
              <p className={cn("text-2xl font-bold", status.color)}>
                {a8Value.toFixed(2)} m/s²
              </p>
            </div>
          </div>
          <div>
            {status.level === "ok" && (
              <Badge className="gap-1 bg-green-100 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3" />
                Under tiltaksverdi
              </Badge>
            )}
            {status.level === "action" && (
              <Badge className="gap-1 bg-yellow-100 text-yellow-700 border-yellow-300">
                <AlertTriangle className="h-3 w-3" />
                Over tiltaksverdi
              </Badge>
            )}
            {status.level === "exceeded" && (
              <Badge className="gap-1 bg-red-100 text-red-700 border-red-300">
                <AlertTriangle className="h-3 w-3" />
                Over grenseverdi!
              </Badge>
            )}
          </div>
        </div>

        {status.level === "action" && (
          <p className="mt-3 text-sm text-yellow-800">
            Tiltaksverdi er overskredet. Arbeidsgiver må iverksette tiltak for å redusere eksponeringen.
          </p>
        )}
        {status.level === "exceeded" && (
          <p className="mt-3 text-sm text-red-800">
            <strong>Grenseverdi er overskredet!</strong> Arbeidet må stanses umiddelbart og tiltak iverksettes.
          </p>
        )}
      </div>

      {/* Guidance */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Hvor finner jeg vibrasjonsnivå?</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Sjekk maskinens brukerveiledning eller CE-merking</li>
          <li>Kontakt leverandøren for spesifikasjoner</li>
          <li>Søk i VIBBASE eller lignende databaser</li>
          <li>Utfør målinger med kalibrert måleutstyr</li>
        </ul>
      </div>
    </div>
  );
}
