import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Vibrate,
  Volume2,
  Wrench,
  Clock,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Tool interface: combined vibration + noise =====
interface EquipmentTool {
  id: string;
  name: string;
  vibrationLevel: number; // m/s²
  noiseLevel: number; // dB(A)
  exposureMinutes: number;
}

// ===== Vibration limits =====
const HAND_ARM_ACTION = 2.5;
const HAND_ARM_LIMIT = 5.0;
const WHOLE_BODY_ACTION = 0.5;
const WHOLE_BODY_LIMIT = 1.15;

// ===== Noise limits =====
const NOISE_LOWER = 80;
const NOISE_UPPER = 85;
const NOISE_LIMIT = 87;
const PEAK_LOWER = 130;
const PEAK_UPPER = 135;
const PEAK_LIMIT = 140;

// ===== Exposure bar =====
function ExposureBar({ value, actionLimit, expLimit, unit, label }: {
  value: number;
  actionLimit: number;
  expLimit: number;
  unit: string;
  label: string;
}) {
  if (value === 0) return null;
  const max = expLimit * 1.3;
  const percentage = Math.min((value / max) * 100, 100);
  const actionPct = (actionLimit / max) * 100;
  const limitPct = (expLimit / max) * 100;

  const zone = value < actionLimit ? "green" : value < expLimit ? "yellow" : "red";
  const barColor = zone === "green" ? "bg-green-500" : zone === "yellow" ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={cn(
          "font-bold",
          zone === "green" ? "text-green-700" : zone === "yellow" ? "text-yellow-700" : "text-red-700"
        )}>
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <div className="relative h-5 rounded-full overflow-hidden bg-muted">
        {/* Filled bar */}
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all", barColor)}
          style={{ width: `${percentage}%` }} />
        {/* Action limit marker */}
        <div className="absolute inset-y-0 border-r-2 border-yellow-600 border-dashed z-10"
          style={{ left: `${actionPct}%` }} />
        {/* Exposure limit marker */}
        <div className="absolute inset-y-0 border-r-2 border-red-700 z-10"
          style={{ left: `${limitPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-yellow-700" style={{ marginLeft: `${actionPct - 15}%` }}>
          Tiltak: {actionLimit}
        </span>
        <span className="text-red-700">Grense: {expLimit}</span>
      </div>
    </div>
  );
}

// ===== Zone status =====
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
        ? "Vibrasjonsnivået er under tiltaksverdien. Vær oppmerksom på risikoen."
        : "Støynivået er under nedre tiltaksverdi. Normalt arbeid.",
    },
    yellow: {
      title: "GUL SONE – TILTAK PÅKREVD",
      icon: AlertTriangle,
      className: "bg-yellow-50 border-yellow-300 text-yellow-800",
      iconClass: "text-yellow-600",
      description: type === "vibrasjon"
        ? "Tiltaksverdi overskredet! Vurder tiltak for å redusere eksponering."
        : "Over nedre tiltaksverdi. Hørselvern skal være tilgjengelig.",
      actions: type === "vibrasjon"
        ? [
            "Reduser tiden eller ta hvilepauser",
            "Varier med andre arbeidsoppgaver",
            "Vurder om arbeidet gjøres på en hensiktsmessig måte",
            "Om det er gitt tilstrekkelig opplæring i bruk av verktøyet",
            "Tilbud om helseundersøkelse hos lege",
          ]
        : [
            "Hørselvern skal være tilgjengelig",
            "Arbeidstakere skal informeres om risiko",
            "Helseundersøkelse skal tilbys",
          ],
    },
    red: {
      title: "RØD SONE – STANS ARBEIDET",
      icon: AlertTriangle,
      className: "bg-red-50 border-red-300 text-red-800",
      iconClass: "text-red-600",
      description: type === "vibrasjon"
        ? "Grenseverdi overskredet! Fortsatt bruk og eksponering over grenseverdien aksepteres ikke = stans av arbeidet."
        : "Grenseverdi overskredet! Umiddelbare tiltak må iverksettes.",
      actions: type === "vibrasjon"
        ? [
            "Stans arbeidet umiddelbart",
            "Iverksett tiltak for å redusere eksponeringen",
            "Vurder alternative verktøy med lavere vibrasjon",
            "Helseundersøkelse er PÅBUDT",
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

// ===== Max exposure time calculator =====
function MaxExposureCalculator({ type }: { type: "hand_arm" | "whole_body" }) {
  const [vibLevel, setVibLevel] = useState<number | "">(""  );
  const actionLimit = type === "hand_arm" ? HAND_ARM_ACTION : WHOLE_BODY_ACTION;
  const expLimit = type === "hand_arm" ? HAND_ARM_LIMIT : WHOLE_BODY_LIMIT;

  const level = typeof vibLevel === "number" ? vibLevel : 0;

  const timeToAction = level > 0 ? 480 * Math.pow(actionLimit / level, 2) : 0;
  const timeToLimit = level > 0 ? 480 * Math.pow(expLimit / level, 2) : 0;

  const formatTime = (minutes: number) => {
    if (minutes <= 0) return "—";
    if (minutes >= 480) return "8t 0min (hel arbeidsdag)";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}t ${m}min`;
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Maksimal eksponeringstid-kalkulator</h4>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Vibrasjonsnivå (m/s²)</Label>
          <Input
            type="number"
            step="0.1"
            value={vibLevel}
            onChange={(e) => setVibLevel(e.target.value ? Number(e.target.value) : "")}
            placeholder="F.eks. 5.0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-yellow-700">Tid til tiltaksverdi ({actionLimit} m/s²)</Label>
          <div className="h-10 flex items-center px-3 rounded-md bg-yellow-50 border border-yellow-200 font-mono text-sm font-medium">
            {level > 0 ? formatTime(timeToAction) : "—"}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-red-700">Tid til grenseverdi ({expLimit} m/s²)</Label>
          <div className="h-10 flex items-center px-3 rounded-md bg-red-50 border border-red-200 font-mono text-sm font-medium">
            {level > 0 ? formatTime(timeToLimit) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Combined tool row =====
function ToolRow({ tool, onUpdate, onRemove, canRemove, vibType, showNoise }: {
  tool: EquipmentTool;
  onUpdate: (field: keyof EquipmentTool, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  vibType: "hand_arm" | "whole_body";
  showNoise: boolean;
}) {
  const expLimit = vibType === "hand_arm" ? HAND_ARM_LIMIT : WHOLE_BODY_LIMIT;
  const maxVibMin = tool.vibrationLevel > 0
    ? Math.min(480 * Math.pow(expLimit / tool.vibrationLevel, 2), 480)
    : 0;
  const maxNoiseMin = tool.noiseLevel >= 80
    ? Math.min(Math.max(480 * Math.pow(2, (85 - tool.noiseLevel) / 3), 0), 480)
    : 480;

  // Per-tool A(8)
  const perToolA8 = tool.vibrationLevel > 0 && tool.exposureMinutes > 0
    ? tool.vibrationLevel * Math.sqrt(tool.exposureMinutes / 480)
    : 0;

  return (
    <div className="p-3 border rounded-lg space-y-3">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <div className="space-y-1 col-span-2 md:col-span-1">
          <Label className="text-xs font-medium">Verktøy/maskin</Label>
          <Input
            value={tool.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder={vibType === "hand_arm" ? "F.eks. Borhammer" : "F.eks. Kompaktlaster"}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Vibrasjon (m/s²)</Label>
          <Input
            type="number"
            step="0.1"
            value={tool.vibrationLevel || ""}
            onChange={(e) => onUpdate("vibrationLevel", e.target.value)}
            placeholder="0.0"
          />
        </div>
        {showNoise && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Støy dB(A)</Label>
            <Input
              type="number"
              value={tool.noiseLevel || ""}
              onChange={(e) => onUpdate("noiseLevel", e.target.value)}
              placeholder="0"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs font-medium">Eksponering (min)</Label>
          <Input
            type="number"
            value={tool.exposureMinutes || ""}
            onChange={(e) => onUpdate("exposureMinutes", e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col justify-end gap-1">
          {tool.vibrationLevel > 0 && (
            <p className="text-xs text-muted-foreground">
              Maks vib: <strong>{Math.round(maxVibMin)} min</strong>
            </p>
          )}
          {showNoise && tool.noiseLevel >= 80 && (
            <p className="text-xs text-muted-foreground">
              Maks støy: <strong>{Math.round(maxNoiseMin)} min</strong>
            </p>
          )}
          {canRemove && (
            <Button variant="ghost" size="icon" className="self-end h-7 w-7" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
      {/* Per-tool result */}
      {perToolA8 > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            A(8) = {perToolA8.toFixed(2)} m/s²
          </Badge>
          {tool.exposureMinutes > maxVibMin && maxVibMin > 0 && (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Overskrider maks eksponeringstid!
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Main Component =====
export function EquipmentAssessment() {
  const [vibType, setVibType] = useState<"hand_arm" | "whole_body">("hand_arm");
  const [peakLevel, setPeakLevel] = useState<number | "">("");
  const [tools, setTools] = useState<EquipmentTool[]>([
    { id: "1", name: "", vibrationLevel: 0, noiseLevel: 0, exposureMinutes: 0 },
  ]);

  const actionLimit = vibType === "hand_arm" ? HAND_ARM_ACTION : WHOLE_BODY_ACTION;
  const expLimit = vibType === "hand_arm" ? HAND_ARM_LIMIT : WHOLE_BODY_LIMIT;

  const addTool = () => {
    setTools([...tools, { id: Date.now().toString(), name: "", vibrationLevel: 0, noiseLevel: 0, exposureMinutes: 0 }]);
  };

  const removeTool = (id: string) => {
    if (tools.length > 1) setTools(tools.filter((t) => t.id !== id));
  };

  const updateTool = (id: string, field: keyof EquipmentTool, value: string | number) => {
    setTools(
      tools.map((t) =>
        t.id === id ? { ...t, [field]: field === "name" ? value : Number(value) || 0 } : t
      )
    );
  };

  // === Calculations ===
  // Vibration A(8) = sqrt(sum(ai² × Ti / 480))
  const calcA8 = () => {
    let sum = 0;
    tools.forEach((t) => {
      if (t.vibrationLevel > 0 && t.exposureMinutes > 0) {
        sum += Math.pow(t.vibrationLevel, 2) * (t.exposureMinutes / 480);
      }
    });
    return Math.sqrt(sum);
  };

  // Noise LEX,8h = 10 × log10(sum(10^(Li/10) × Ti / 480))
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

  const a8 = calcA8();
  const lex8h = calcLEX8h();
  const peak = typeof peakLevel === "number" ? peakLevel : 0;
  const hasAnyNoise = tools.some((t) => t.noiseLevel > 0);

  const vibZone: "green" | "yellow" | "red" | "none" =
    a8 === 0 ? "none" : a8 < actionLimit ? "green" : a8 < expLimit ? "yellow" : "red";

  const noiseZone: "green" | "yellow" | "red" | "none" = (() => {
    if (lex8h === 0 && peak === 0) return "none";
    if (lex8h >= NOISE_LIMIT || peak >= PEAK_LIMIT) return "red";
    if (lex8h >= NOISE_LOWER || peak >= PEAK_LOWER) return "yellow";
    return "green";
  })();

  const hasResults = a8 > 0 || lex8h > 0 || peak > 0;

  // Hearing protection requirement
  const hearingProtection = lex8h >= NOISE_UPPER || peak >= PEAK_UPPER
    ? "påbudt" : lex8h >= NOISE_LOWER || peak >= PEAK_LOWER ? "tilgjengelig" : "ingen";

  const vibTypeLabel = vibType === "hand_arm" ? "Hånd-arm" : "Helkropp";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Vibrasjon & Støy – Eksponeringskalkulator
          </CardTitle>
          <CardDescription>
            Beregn daglig eksponering A(8) for vibrasjoner og L<sub>EX,8h</sub> for støy per verktøy.
            Kalkulatoren varsler automatisk ved overskridelse av tiltaks- og grenseverdier iht. Arbeidstilsynets krav.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Vibration type selector */}
          <div className="space-y-2">
            <Label className="font-medium">Type vibrasjon</Label>
            <Tabs value={vibType} onValueChange={(v) => setVibType(v as "hand_arm" | "whole_body")}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="hand_arm" className="gap-1.5">
                  <Vibrate className="h-4 w-4" />
                  Hånd-arm vibrasjoner
                </TabsTrigger>
                <TabsTrigger value="whole_body" className="gap-1.5">
                  <Vibrate className="h-4 w-4" />
                  Helkroppsvibrasjoner
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Limit info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Grenseverdier ({vibTypeLabel} vibrasjoner + støy)</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-1"><Vibrate className="h-3 w-3" /> Vibrasjon</p>
                  <p>Tiltaksverdi: <span className="text-yellow-700 font-medium">{actionLimit} m/s² A(8)</span></p>
                  <p>Grenseverdi: <span className="text-red-700 font-medium">{expLimit} m/s² A(8)</span></p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-1"><Volume2 className="h-3 w-3" /> Støy</p>
                  <p>Nedre tiltaksverdi: <span className="text-yellow-700 font-medium">80 dB / 130 dB(C)</span></p>
                  <p>Øvre tiltaksverdi: <span className="text-orange-700 font-medium">85 dB / 135 dB(C)</span></p>
                  <p>Grenseverdi: <span className="text-red-700 font-medium">87 dB / 140 dB(C)</span></p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Max exposure time calculator */}
          <MaxExposureCalculator type={vibType} />

          <Separator />

          {/* Daily exposure calculator */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Daglig eksponeringskalkulator</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Legg til verktøy og fyll inn vibrasjonsnivå, støynivå og daglig brukstid.
              Vibrasjonsnivå finnes i maskinens brukerveiledning, CE-merking eller fra leverandør.
            </p>
          </div>

          {/* Tool rows */}
          <div className="space-y-3">
            {tools.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                onUpdate={(field, value) => updateTool(tool.id, field, value)}
                onRemove={() => removeTool(tool.id)}
                canRemove={tools.length > 1}
                vibType={vibType}
                showNoise={true}
              />
            ))}
            <Button variant="outline" size="sm" onClick={addTool} className="gap-1">
              <Plus className="h-4 w-4" />
              Legg til verktøy
            </Button>
          </div>

          {/* Peak noise */}
          <div className="space-y-2 max-w-sm">
            <Label>Impulsstøy / toppverdi dB(C)</Label>
            <Input
              type="number"
              value={peakLevel}
              onChange={(e) => setPeakLevel(e.target.value ? Number(e.target.value) : "")}
              placeholder="F.eks. 120"
            />
            <p className="text-xs text-muted-foreground">
              Toppverdi ved slag, smell, skudd eller lignende impulsstøy
            </p>
          </div>

          <Separator />

          {/* ===== RESULTAT ===== */}
          {hasResults && (
            <div className="space-y-6">
              <h3 className="text-center font-bold text-lg">RESULTAT</h3>

              {/* Exposure bars */}
              <div className="space-y-4">
                {a8 > 0 && (
                  <ExposureBar
                    value={a8}
                    actionLimit={actionLimit}
                    expLimit={expLimit}
                    unit="m/s²"
                    label={`Vibrasjonsnivå A(8) – ${vibTypeLabel}`}
                  />
                )}
                {lex8h > 0 && (
                  <ExposureBar
                    value={lex8h}
                    actionLimit={NOISE_LOWER}
                    expLimit={NOISE_LIMIT}
                    unit="dB"
                    label="Støynivå LEX,8h"
                  />
                )}
              </div>

              {/* Result cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Vibration result */}
                {a8 > 0 && (
                  <div className={cn(
                    "p-4 rounded-lg border-2 flex items-start gap-3",
                    vibZone === "green" ? "bg-green-50 border-green-300" :
                    vibZone === "yellow" ? "bg-yellow-50 border-yellow-300" :
                    "bg-red-50 border-red-300"
                  )}>
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      vibZone === "green" ? "bg-green-500" :
                      vibZone === "yellow" ? "bg-yellow-500" :
                      "bg-red-500"
                    )}>
                      <Vibrate className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vibrasjonsnivå ({vibTypeLabel})</p>
                      <p className="font-bold">
                        {vibZone === "green" ? "Innenfor grensene" :
                         vibZone === "yellow" ? "Over tiltaksverdi!" :
                         "Helseskadelig – STANS!"}
                      </p>
                      <p className="text-sm mt-1">
                        Daglig eksponering: <strong>{a8.toFixed(2)} m/s² A(8)</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Eksponeringsscore: {Math.round((a8 / expLimit) * 1000)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Noise result */}
                {(lex8h > 0 || peak > 0) && (
                  <div className={cn(
                    "p-4 rounded-lg border-2 flex items-start gap-3",
                    noiseZone === "green" ? "bg-green-50 border-green-300" :
                    noiseZone === "yellow" ? "bg-yellow-50 border-yellow-300" :
                    "bg-red-50 border-red-300"
                  )}>
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      noiseZone === "green" ? "bg-green-500" :
                      noiseZone === "yellow" ? "bg-yellow-500" :
                      "bg-red-500"
                    )}>
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Støynivå</p>
                      <p className="font-bold">
                        {noiseZone === "green" ? "Innenfor grensene" :
                         noiseZone === "yellow" ? "Over tiltaksverdi!" :
                         "Over grenseverdi – STANS!"}
                      </p>
                      {lex8h > 0 && (
                        <p className="text-sm mt-1">
                          Daglig eksponering: <strong>{lex8h.toFixed(1)} dB L<sub>EX,8h</sub></strong>
                        </p>
                      )}
                      {peak > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Toppverdi: {peak} dB(C)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hearing protection */}
              {(lex8h > 0 || peak > 0) && (
                <div className={cn(
                  "p-3 rounded-lg border flex items-center gap-3",
                  hearingProtection === "påbudt" ? "bg-red-50 border-red-200" :
                  hearingProtection === "tilgjengelig" ? "bg-yellow-50 border-yellow-200" :
                  "bg-green-50 border-green-200"
                )}>
                  <Volume2 className={cn(
                    "h-5 w-5 shrink-0",
                    hearingProtection === "påbudt" ? "text-red-600" :
                    hearingProtection === "tilgjengelig" ? "text-yellow-600" : "text-green-600"
                  )} />
                  <div className="text-sm">
                    <strong>Hørselvernkrav: </strong>
                    {hearingProtection === "påbudt" && "Hørselvern er PÅBUDT. Bruk minimum øreklokker eller støypropper."}
                    {hearingProtection === "tilgjengelig" && "Hørselvern skal være tilgjengelig for arbeidstakere."}
                    {hearingProtection === "ingen" && "Ingen krav om hørselvern basert på målt nivå."}
                  </div>
                </div>
              )}

              {/* Zone statuses */}
              {vibZone !== "none" && vibZone !== "green" && (
                <ZoneStatus level={vibZone} type="vibrasjon" />
              )}
              {noiseZone !== "none" && noiseZone !== "green" && (
                <ZoneStatus level={noiseZone} type="stoy" />
              )}

              {/* Health monitoring */}
              {(vibZone === "yellow" || vibZone === "red") && (
                <Alert className="border-purple-300 bg-purple-50">
                  <Info className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-800">Helseovervaking påkrevd</AlertTitle>
                  <AlertDescription className="text-purple-700 text-sm">
                    Arbeidstakere eksponert for vibrasjoner over tiltaksverdien skal få tilbud om 
                    helseundersøkelse hos lege. Det kan være nødvendig å omplassere arbeidstakere 
                    av helsemessige årsaker, særlig personer med nevropati og Raynauds fenomen.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Reference / guidance */}
          <div className="text-xs text-muted-foreground space-y-3 pt-2">
            <div>
              <p className="font-medium mb-1">Vanlige støynivåer (veiledende):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                <span>Samtale: 60-70 dB</span>
                <span>Boremaskin: 85-95 dB</span>
                <span>Vinkelsliper: 95-105 dB</span>
                <span>Spikerpistol: 100-115 dB</span>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">Hvor finner jeg vibrasjonsnivå?</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Sjekk maskinens brukerveiledning eller CE-merking</li>
                <li>Kontakt leverandøren for spesifikasjoner</li>
                <li>Søk i VIBBASE eller lignende databaser</li>
                <li>Utfør målinger med kalibrert måleutstyr</li>
              </ul>
            </div>
            {vibType === "whole_body" && (
              <div>
                <p className="font-medium mb-1">Tiltak for helkroppsvibrasjoner:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Førerhytte og stol med vibrasjonsdemping</li>
                  <li>Dekk og hjul tilpasset underlaget</li>
                  <li>Redusere eksponeringstiden, variere oppgaver</li>
                  <li>Lavere fart og jevnt kjøreunderlag</li>
                </ul>
              </div>
            )}
            {vibType === "hand_arm" && (
              <div>
                <p className="font-medium mb-1">Tiltak for hånd-arm vibrasjoner:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Alternative arbeidsmetoder og verktøy</li>
                  <li>Utstyr med relativt lav vibrasjon</li>
                  <li>Kortere eksponeringstid</li>
                  <li>Vibrasjonsdempende hansker</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
