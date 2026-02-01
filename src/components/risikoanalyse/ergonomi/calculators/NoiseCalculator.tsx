import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2, AlertTriangle, CheckCircle2, Info, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoiseSource {
  id: string;
  name: string;
  noiseLevel: number; // dB(A)
  exposureMinutes: number;
}

// Grenseverdier fra Arbeidstilsynet
const LOWER_ACTION_LIMIT = 80; // dB LEX,8h - nedre tiltaksverdi
const UPPER_ACTION_LIMIT = 85; // dB LEX,8h - øvre tiltaksverdi
const EXPOSURE_LIMIT = 87; // dB LEX,8h - grenseverdi (med hørselvern)
const PEAK_LOWER = 130; // dB(C) peak - nedre tiltaksverdi
const PEAK_UPPER = 135; // dB(C) peak - øvre tiltaksverdi
const PEAK_LIMIT = 140; // dB(C) peak - grenseverdi

export function NoiseCalculator() {
  const [sources, setSources] = useState<NoiseSource[]>([
    { id: "1", name: "", noiseLevel: 0, exposureMinutes: 0 },
  ]);
  const [peakLevel, setPeakLevel] = useState<number | "">("");

  const addSource = () => {
    setSources([
      ...sources,
      { id: Date.now().toString(), name: "", noiseLevel: 0, exposureMinutes: 0 },
    ]);
  };

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(sources.filter((s) => s.id !== id));
    }
  };

  const updateSource = (id: string, field: keyof NoiseSource, value: string | number) => {
    setSources(
      sources.map((s) =>
        s.id === id ? { ...s, [field]: field === "name" ? value : Number(value) || 0 } : s
      )
    );
  };

  // Beregn LEX,8h - daglig støyeksponering normalisert til 8 timer
  // Formel: LEX,8h = 10 × log10(sum(10^(Li/10) × Ti / T0))
  const calculateLEX8h = () => {
    const T0 = 480; // 8 timer i minutter
    let sumPressure = 0;

    sources.forEach((source) => {
      if (source.noiseLevel > 0 && source.exposureMinutes > 0) {
        sumPressure += Math.pow(10, source.noiseLevel / 10) * (source.exposureMinutes / T0);
      }
    });

    if (sumPressure === 0) return 0;
    return 10 * Math.log10(sumPressure);
  };

  // Beregn maksimal eksponeringstid for et gitt støynivå
  const calculateMaxTime = (noiseLevel: number) => {
    if (noiseLevel <= 0) return 480;
    // Ved 85 dB = 8 timer, ved 88 dB = 4 timer, ved 91 dB = 2 timer osv.
    // Formel: T = 8 × 2^((85-L)/3) timer = 480 × 2^((85-L)/3) minutter
    const maxMinutes = 480 * Math.pow(2, (85 - noiseLevel) / 3);
    return Math.min(Math.max(maxMinutes, 0), 480);
  };

  const lex8h = calculateLEX8h();
  const peak = typeof peakLevel === "number" ? peakLevel : 0;

  const getStatus = () => {
    if (lex8h === 0 && peak === 0) return { level: "none", color: "text-muted-foreground", bg: "bg-muted" };
    
    const lexExceeded = lex8h >= EXPOSURE_LIMIT;
    const lexUpper = lex8h >= UPPER_ACTION_LIMIT;
    const lexLower = lex8h >= LOWER_ACTION_LIMIT;
    const peakExceeded = peak >= PEAK_LIMIT;
    const peakUpper = peak >= PEAK_UPPER;
    const peakLower = peak >= PEAK_LOWER;

    if (lexExceeded || peakExceeded) return { level: "exceeded", color: "text-red-700", bg: "bg-red-100" };
    if (lexUpper || peakUpper) return { level: "upper", color: "text-orange-700", bg: "bg-orange-100" };
    if (lexLower || peakLower) return { level: "lower", color: "text-yellow-700", bg: "bg-yellow-100" };
    return { level: "ok", color: "text-green-700", bg: "bg-green-100" };
  };

  const status = getStatus();

  return (
    <div className="space-y-6">
      {/* Limit info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Støygrenseverdier (Arbeidstilsynet)</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-yellow-700">Nedre tiltaksverdi:</span>
              <br />L<sub>EX,8h</sub> = 80 dB / L<sub>peak</sub> = 130 dB(C)
            </div>
            <div>
              <span className="font-medium text-orange-700">Øvre tiltaksverdi:</span>
              <br />L<sub>EX,8h</sub> = 85 dB / L<sub>peak</sub> = 135 dB(C)
            </div>
            <div>
              <span className="font-medium text-red-700">Grenseverdi:</span>
              <br />L<sub>EX,8h</sub> = 87 dB / L<sub>peak</sub> = 140 dB(C)
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Noise sources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Støykilder</Label>
          <Button variant="outline" size="sm" onClick={addSource}>
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>

        {sources.map((source) => (
          <div key={source.id} className="grid gap-3 md:grid-cols-4 p-3 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">Støykilde</Label>
              <Input
                value={source.name}
                onChange={(e) => updateSource(source.id, "name", e.target.value)}
                placeholder="F.eks. Sirkelsag"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Støynivå dB(A)</Label>
              <Input
                type="number"
                value={source.noiseLevel || ""}
                onChange={(e) => updateSource(source.id, "noiseLevel", e.target.value)}
                placeholder="0"
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
                {source.noiseLevel >= 80 && (
                  <span>Maks tid: {Math.round(calculateMaxTime(source.noiseLevel))} min</span>
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

      {/* Peak level */}
      <div className="space-y-2">
        <Label>Impulsstøy / toppverdi dB(C)</Label>
        <Input
          type="number"
          value={peakLevel}
          onChange={(e) => setPeakLevel(e.target.value ? Number(e.target.value) : "")}
          placeholder="F.eks. 120"
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Toppverdi ved slag, smell, skudd eller lignende impulsstøy
        </p>
      </div>

      {/* Result */}
      <div className={cn("p-4 rounded-lg border-2", status.bg)}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Volume2 className={cn("h-8 w-8", status.color)} />
            <div>
              <p className="text-sm text-muted-foreground">Daglig støyeksponering L<sub>EX,8h</sub></p>
              <p className={cn("text-2xl font-bold", status.color)}>
                {lex8h > 0 ? lex8h.toFixed(1) : "—"} dB(A)
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
            {status.level === "lower" && (
              <Badge className="gap-1 bg-yellow-100 text-yellow-700 border-yellow-300">
                <AlertTriangle className="h-3 w-3" />
                Over nedre tiltaksverdi
              </Badge>
            )}
            {status.level === "upper" && (
              <Badge className="gap-1 bg-orange-100 text-orange-700 border-orange-300">
                <AlertTriangle className="h-3 w-3" />
                Over øvre tiltaksverdi
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

        {status.level === "lower" && (
          <div className="mt-3 text-sm text-yellow-800 space-y-1">
            <p><strong>Tiltak ved nedre tiltaksverdi (80 dB):</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>Hørselvern skal være tilgjengelig</li>
              <li>Arbeidstakere skal informeres om risiko</li>
              <li>Helseundersøkelse skal tilbys</li>
            </ul>
          </div>
        )}
        {status.level === "upper" && (
          <div className="mt-3 text-sm text-orange-800 space-y-1">
            <p><strong>Tiltak ved øvre tiltaksverdi (85 dB):</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>Hørselvern er <strong>påbudt</strong></li>
              <li>Handlingsplan for å redusere støy</li>
              <li>Arbeidsområdet skal merkes</li>
              <li>Helseundersøkelse er <strong>påbudt</strong></li>
            </ul>
          </div>
        )}
        {status.level === "exceeded" && (
          <p className="mt-3 text-sm text-red-800">
            <strong>Grenseverdi er overskredet!</strong> Umiddelbare tiltak må iverksettes for å redusere eksponeringen.
            Grenseverdien skal ikke overskrides selv med hørselvern.
          </p>
        )}
      </div>

      {/* Reference table */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-2">Vanlige støynivåer (veiledende):</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <span>Samtale: 60-70 dB</span>
          <span>Boremaskin: 85-95 dB</span>
          <span>Vinkelsliper: 95-105 dB</span>
          <span>Spikerpistol: 100-115 dB</span>
        </div>
      </div>
    </div>
  );
}
