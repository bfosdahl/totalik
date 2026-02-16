import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Vibrate,
  Volume2,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Vibration types & limits =====
interface VibrationTool {
  id: string;
  name: string;
  vibrationLevel: number;
  exposureMinutes: number;
}

const HAND_ARM_ACTION = 2.5;
const HAND_ARM_LIMIT = 5.0;
const WHOLE_BODY_ACTION = 0.5;
const WHOLE_BODY_LIMIT = 1.15;

// ===== Noise types & limits =====
interface NoiseTool {
  id: string;
  name: string;
  noiseLevel: number;
  exposureMinutes: number;
}

const NOISE_LOWER = 80;
const NOISE_UPPER = 85;
const NOISE_LIMIT = 87;
const PEAK_LOWER = 130;
const PEAK_UPPER = 135;
const PEAK_LIMIT = 140;

// ===== Visual exposure bar =====
function ExposureBar({ currentHours, maxHours = 10 }: { currentHours: number; maxHours?: number }) {
  const percentage = Math.min((currentHours / maxHours) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0t</span>
        <span>{currentHours.toFixed(1)}t</span>
        <span>{maxHours}t</span>
      </div>
      <div className="relative h-6 rounded-full overflow-hidden bg-muted">
        {/* Zone colors */}
        <div className="absolute inset-0 flex">
          <div className="bg-green-400 h-full" style={{ width: "40%" }} />
          <div className="bg-yellow-400 h-full" style={{ width: "30%" }} />
          <div className="bg-red-400 h-full" style={{ width: "30%" }} />
        </div>
        {/* Hour markers */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: maxHours }, (_, i) => (
            <div
              key={i}
              className="absolute h-full border-r border-white/40 flex items-end justify-center"
              style={{ left: `${((i + 1) / maxHours) * 100}%` }}
            >
              <span className="text-[10px] text-white font-bold mb-0.5 -ml-1">{i + 1}</span>
            </div>
          ))}
        </div>
        {/* Current position indicator */}
        {currentHours > 0 && (
          <div
            className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-lg z-10"
            style={{ left: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

// ===== Zone status display =====
function ZoneStatus({ level, type }: { level: "green" | "yellow" | "red" | "none"; type: "vibrasjon" | "stoy" }) {
  if (level === "none") return null;
  
  const configs: Record<"green" | "yellow" | "red", {
    title: string;
    icon: typeof CheckCircle2;
    className: string;
    iconClass: string;
    description: string;
    actions?: string[];
  }> = {
    green: {
      title: "GRØNN SONE",
      icon: CheckCircle2,
      className: "bg-green-50 border-green-300 text-green-800",
      iconClass: "text-green-600",
      description: type === "vibrasjon" 
        ? "Vibrasjonsnivået er under tiltaksverdien. Fortsett med normalt arbeid."
        : "Støynivået er under nedre tiltaksverdi. Normalt arbeid.",
    },
    yellow: {
      title: "GUL SONE",
      icon: AlertTriangle,
      className: "bg-yellow-50 border-yellow-300 text-yellow-800",
      iconClass: "text-yellow-600",
      description: type === "vibrasjon"
        ? "Tiltaksverdi overskredet. Reduser tid, ta pauser, varier med andre oppgaver."
        : "Over nedre tiltaksverdi. Hørselvern skal være tilgjengelig.",
      actions: type === "vibrasjon" 
        ? [
            "Reduser tiden eller ta hvilepauser",
            "Varier med andre arbeidsoppgaver",
            "Vurder om arbeidet gjøres på en hensiktsmessig måte",
            "Om det er gitt tilstrekkelig opplæring i bruk av verktøyet",
          ]
        : [
            "Hørselvern skal være tilgjengelig",
            "Arbeidstakere skal informeres om risiko",
            "Helseundersøkelse skal tilbys",
          ],
    },
    red: {
      title: "RØD SONE",
      icon: AlertTriangle,
      className: "bg-red-50 border-red-300 text-red-800",
      iconClass: "text-red-600",
      description: type === "vibrasjon"
        ? "Grenseverdi overskredet! Fortsatt bruk og eksponering over grenseverdien aksepteres ikke = stans av arbeidet."
        : "Grenseverdi overskredet! Umiddelbare tiltak må iverksettes. Arbeidet må stanses.",
      actions: type === "vibrasjon"
        ? [
            "Stans arbeidet umiddelbart",
            "Iverksett tiltak for å redusere eksponeringen",
            "Vurder alternative verktøy med lavere vibrasjon",
          ]
        : [
            "Hørselvern er PÅBUDT",
            "Umiddelbare tiltak for å redusere støy",
            "Arbeidsområdet skal merkes og avgrenses",
            "Helseundersøkelse er PÅBUDT",
          ],
    },
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <div className={cn("p-4 rounded-lg border-2 space-y-3", config.className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-6 w-6", config.iconClass)} />
        <h3 className="text-lg font-bold">{config.title}</h3>
      </div>
      <p className="text-sm">{config.description}</p>
      {config.actions && (
        <ul className="text-sm space-y-1 ml-4 list-disc">
          {config.actions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ===== Main Component =====
export function EquipmentAssessment() {
  const [activeTab, setActiveTab] = useState("vibrasjon_hand");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Verktøy & Utstyrsvurdering
          </CardTitle>
          <CardDescription>
            Beregn eksponering for vibrasjoner og støy fra verktøy og utstyr. 
            Kalkulatorene viser automatisk hvilken sone du havner i iht. Arbeidstilsynets krav.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vibrasjon_hand" className="gap-1.5">
                <Vibrate className="h-4 w-4" />
                <span className="hidden sm:inline">Håndverktøy</span>
                <span className="sm:hidden">Hånd</span>
              </TabsTrigger>
              <TabsTrigger value="vibrasjon_helkropp" className="gap-1.5">
                <Vibrate className="h-4 w-4" />
                <span className="hidden sm:inline">Helkropp</span>
                <span className="sm:hidden">Kropp</span>
              </TabsTrigger>
              <TabsTrigger value="stoy" className="gap-1.5">
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Støy</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vibrasjon_hand" className="mt-4">
              <VibrationSection type="hand_arm" />
            </TabsContent>
            <TabsContent value="vibrasjon_helkropp" className="mt-4">
              <VibrationSection type="whole_body" />
            </TabsContent>
            <TabsContent value="stoy" className="mt-4">
              <NoiseSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Vibration Section =====
function VibrationSection({ type }: { type: "hand_arm" | "whole_body" }) {
  const [tools, setTools] = useState<VibrationTool[]>([
    { id: "1", name: "", vibrationLevel: 0, exposureMinutes: 0 },
  ]);

  const actionLimit = type === "hand_arm" ? HAND_ARM_ACTION : WHOLE_BODY_ACTION;
  const expLimit = type === "hand_arm" ? HAND_ARM_LIMIT : WHOLE_BODY_LIMIT;

  const addTool = () => {
    setTools([...tools, { id: Date.now().toString(), name: "", vibrationLevel: 0, exposureMinutes: 0 }]);
  };

  const removeTool = (id: string) => {
    if (tools.length > 1) setTools(tools.filter((t) => t.id !== id));
  };

  const updateTool = (id: string, field: keyof VibrationTool, value: string | number) => {
    setTools(
      tools.map((t) =>
        t.id === id ? { ...t, [field]: field === "name" ? value : Number(value) || 0 } : t
      )
    );
  };

  // A(8) = sqrt(sum(a²i × Ti / 480))
  const calcA8 = () => {
    let sum = 0;
    tools.forEach((t) => {
      if (t.vibrationLevel > 0 && t.exposureMinutes > 0) {
        sum += Math.pow(t.vibrationLevel, 2) * (t.exposureMinutes / 480);
      }
    });
    return Math.sqrt(sum);
  };

  const calcMaxTime = (level: number) => {
    if (level <= 0) return 0;
    return Math.min(480 * Math.pow(expLimit / level, 2), 480);
  };

  const a8 = calcA8();
  const totalMinutes = tools.reduce((s, t) => s + t.exposureMinutes, 0);
  const totalHours = totalMinutes / 60;

  const zone: "green" | "yellow" | "red" | "none" =
    a8 === 0 ? "none" : a8 < actionLimit ? "green" : a8 < expLimit ? "yellow" : "red";

  const exposureScore = a8 > 0 ? Math.round((a8 / expLimit) * 1000) : 0;

  const title = type === "hand_arm" ? "Vibrasjonskalkulator for Håndverktøy" : "Vibrasjonskalkulator for Helkropp";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-center">{title}</h3>

      {/* Limit info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>
          Grenseverdier for {type === "hand_arm" ? "hånd-arm" : "helkropp"} vibrasjoner
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-yellow-700">Tiltaksverdi:</span>{" "}
              {actionLimit} m/s² A(8)
            </div>
            <div>
              <span className="font-medium text-red-700">Grenseverdi:</span>{" "}
              {expLimit} m/s² A(8)
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Tool rows */}
      <div className="space-y-3">
        {tools.map((tool) => (
          <div key={tool.id} className="p-3 border rounded-lg space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Verktøy/maskin</Label>
                <Input
                  value={tool.name}
                  onChange={(e) => updateTool(tool.id, "name", e.target.value)}
                  placeholder={type === "hand_arm" ? "F.eks. Borhammer" : "F.eks. Kompaktlaster"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Vibrasjonsnivå (m/s²)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tool.vibrationLevel || ""}
                  onChange={(e) => updateTool(tool.id, "vibrationLevel", e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Daglig eksponering (min)</Label>
                <Input
                  type="number"
                  value={tool.exposureMinutes || ""}
                  onChange={(e) => updateTool(tool.id, "exposureMinutes", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  {tool.vibrationLevel > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Maks: {Math.round(calcMaxTime(tool.vibrationLevel))} min
                    </p>
                  )}
                </div>
                {tools.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeTool(tool.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            {/* Per-tool exposure bar */}
            {tool.exposureMinutes > 0 && tool.vibrationLevel > 0 && (
              <ExposureBar currentHours={tool.exposureMinutes / 60} />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addTool} className="gap-1">
          <Plus className="h-4 w-4" />
          Legg til verktøy
        </Button>
      </div>

      {/* Result */}
      {a8 > 0 && (
        <div className="space-y-4">
          <h4 className="text-center font-bold text-base">RESULTAT:</h4>
          <ExposureBar currentHours={totalHours} />

          <div className="grid md:grid-cols-2 gap-4">
            {/* Vibration result */}
            <div className={cn(
              "p-4 rounded-lg border-2 flex items-start gap-3",
              zone === "green" ? "bg-green-50 border-green-300" :
              zone === "yellow" ? "bg-yellow-50 border-yellow-300" :
              "bg-red-50 border-red-300"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                zone === "green" ? "bg-green-500" :
                zone === "yellow" ? "bg-yellow-500" :
                "bg-red-500"
              )} />
              <div>
                <p className="text-sm text-muted-foreground">Vibrasjonsnivå</p>
                <p className="font-bold">
                  {zone === "green" ? "Innenfor grensene" :
                   zone === "yellow" ? "Over tiltaksverdi" :
                   "Helseskadelige vibrasjoner"}
                </p>
                <p className="text-sm mt-1">
                  Daglig eksponering: <strong>{a8.toFixed(2)} m/s²</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Eksponeringsscore: {exposureScore}
                </p>
              </div>
            </div>

            {/* Hearing protection note */}
            <div className="p-4 rounded-lg border-2 bg-green-50 border-green-300 flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Hørselvernkrav</p>
                <p className="font-bold">
                  {zone === "red" ? "Hørselvern PÅBUDT" : "Vurder hørselvern"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sjekk verktøyets støynivå i tillegg
                </p>
              </div>
            </div>
          </div>

          {/* Zone status */}
          <ZoneStatus level={zone} type="vibrasjon" />
        </div>
      )}

      {/* Guidance */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Hvor finner jeg vibrasjonsnivå?</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li>Sjekk maskinens brukerveiledning eller CE-merking</li>
          <li>Kontakt leverandøren for spesifikasjoner</li>
          <li>Søk i VIBBASE eller lignende databaser</li>
          <li>Utfør målinger med kalibrert måleutstyr</li>
        </ul>
      </div>
    </div>
  );
}

// ===== Noise Section =====
function NoiseSection() {
  const [tools, setTools] = useState<NoiseTool[]>([
    { id: "1", name: "", noiseLevel: 0, exposureMinutes: 0 },
  ]);
  const [peakLevel, setPeakLevel] = useState<number | "">("");

  const addTool = () => {
    setTools([...tools, { id: Date.now().toString(), name: "", noiseLevel: 0, exposureMinutes: 0 }]);
  };

  const removeTool = (id: string) => {
    if (tools.length > 1) setTools(tools.filter((t) => t.id !== id));
  };

  const updateTool = (id: string, field: keyof NoiseTool, value: string | number) => {
    setTools(
      tools.map((t) =>
        t.id === id ? { ...t, [field]: field === "name" ? value : Number(value) || 0 } : t
      )
    );
  };

  // LEX,8h = 10 × log10(sum(10^(Li/10) × Ti / 480))
  const calcLEX8h = () => {
    let sum = 0;
    tools.forEach((t) => {
      if (t.noiseLevel > 0 && t.exposureMinutes > 0) {
        sum += Math.pow(10, t.noiseLevel / 10) * (t.exposureMinutes / 480);
      }
    });
    if (sum === 0) return 0;
    return 10 * Math.log10(sum);
  };

  const calcMaxTime = (level: number) => {
    if (level <= 0) return 480;
    return Math.min(Math.max(480 * Math.pow(2, (85 - level) / 3), 0), 480);
  };

  const lex8h = calcLEX8h();
  const peak = typeof peakLevel === "number" ? peakLevel : 0;
  const totalMinutes = tools.reduce((s, t) => s + t.exposureMinutes, 0);
  const totalHours = totalMinutes / 60;

  const getZone = (): "green" | "yellow" | "red" | "none" => {
    if (lex8h === 0 && peak === 0) return "none";
    if (lex8h >= NOISE_LIMIT || peak >= PEAK_LIMIT) return "red";
    if (lex8h >= NOISE_LOWER || peak >= PEAK_LOWER) return "yellow";
    return "green";
  };

  const zone = getZone();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-center">Støykalkulator for Verktøy & Utstyr</h3>

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

      {/* Tool rows */}
      <div className="space-y-3">
        {tools.map((tool) => (
          <div key={tool.id} className="p-3 border rounded-lg space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Verktøy/støykilde</Label>
                <Input
                  value={tool.name}
                  onChange={(e) => updateTool(tool.id, "name", e.target.value)}
                  placeholder="F.eks. Sirkelsag"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Støynivå dB(A)</Label>
                <Input
                  type="number"
                  value={tool.noiseLevel || ""}
                  onChange={(e) => updateTool(tool.id, "noiseLevel", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Daglig eksponering (min)</Label>
                <Input
                  type="number"
                  value={tool.exposureMinutes || ""}
                  onChange={(e) => updateTool(tool.id, "exposureMinutes", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  {tool.noiseLevel >= 80 && (
                    <p className="text-xs text-muted-foreground">
                      Maks: {Math.round(calcMaxTime(tool.noiseLevel))} min
                    </p>
                  )}
                </div>
                {tools.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeTool(tool.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            {tool.exposureMinutes > 0 && tool.noiseLevel > 0 && (
              <ExposureBar currentHours={tool.exposureMinutes / 60} />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addTool} className="gap-1">
          <Plus className="h-4 w-4" />
          Legg til verktøy
        </Button>
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
      {(lex8h > 0 || peak > 0) && (
        <div className="space-y-4">
          <h4 className="text-center font-bold text-base">RESULTAT:</h4>
          <ExposureBar currentHours={totalHours} />

          <div className="grid md:grid-cols-2 gap-4">
            <div className={cn(
              "p-4 rounded-lg border-2 flex items-start gap-3",
              zone === "green" ? "bg-green-50 border-green-300" :
              zone === "yellow" ? "bg-yellow-50 border-yellow-300" :
              "bg-red-50 border-red-300"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                zone === "green" ? "bg-green-500" :
                zone === "yellow" ? "bg-yellow-500" :
                "bg-red-500"
              )} />
              <div>
                <p className="text-sm text-muted-foreground">Støynivå</p>
                <p className="font-bold">
                  {zone === "green" ? "Innenfor grensene" :
                   zone === "yellow" ? "Over tiltaksverdi" :
                   "Over grenseverdi!"}
                </p>
                <p className="text-sm mt-1">
                  Daglig eksponering: <strong>{lex8h.toFixed(1)} dB(A)</strong>
                </p>
                {peak > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Toppverdi: {peak} dB(C)
                  </p>
                )}
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg border-2 flex items-start gap-3",
              lex8h >= NOISE_UPPER || peak >= PEAK_UPPER
                ? "bg-red-50 border-red-300"
                : lex8h >= NOISE_LOWER || peak >= PEAK_LOWER
                ? "bg-yellow-50 border-yellow-300"
                : "bg-green-50 border-green-300"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                lex8h >= NOISE_UPPER || peak >= PEAK_UPPER ? "bg-red-500" :
                lex8h >= NOISE_LOWER || peak >= PEAK_LOWER ? "bg-yellow-500" : "bg-green-500"
              )} />
              <div>
                <p className="text-sm text-muted-foreground">Hørselvernkrav</p>
                <p className="font-bold">
                  {lex8h >= NOISE_UPPER || peak >= PEAK_UPPER
                    ? "Hørselvern PÅBUDT"
                    : lex8h >= NOISE_LOWER || peak >= PEAK_LOWER
                    ? "Hørselvern skal være tilgjengelig"
                    : "Du trenger ikke bruke hørselvern"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lex8h >= NOISE_UPPER
                    ? "men det bør være tilgjengelig"
                    : "basert på beregnet eksponeringsnivå"}
                </p>
              </div>
            </div>
          </div>

          <ZoneStatus level={zone} type="stoy" />
        </div>
      )}

      {/* Reference */}
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
