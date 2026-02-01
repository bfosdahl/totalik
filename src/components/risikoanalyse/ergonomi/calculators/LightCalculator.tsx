import { useState } from "react";
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
import { AlertTriangle, CheckCircle2, Info, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkAreaRequirement {
  name: string;
  minLux: number;
  recommendedLux: number;
  description: string;
}

const WORK_AREA_REQUIREMENTS: WorkAreaRequirement[] = [
  { name: "gang_lager", minLux: 100, recommendedLux: 150, description: "Ganger, lager, trapper" },
  { name: "grovarbeid", minLux: 200, recommendedLux: 300, description: "Grovarbeid, montering" },
  { name: "kontor", minLux: 300, recommendedLux: 500, description: "Kontorarbeid, lesing" },
  { name: "finarbeid", minLux: 500, recommendedLux: 750, description: "Finarbeid, kontroll" },
  { name: "presisjon", minLux: 750, recommendedLux: 1000, description: "Presisjonsarbeid, montering av små deler" },
  { name: "finmekanikk", minLux: 1000, recommendedLux: 1500, description: "Finmekanikk, elektronikk" },
  { name: "svært_krevende", minLux: 1500, recommendedLux: 2000, description: "Svært krevende synsoppgaver" },
];

export function LightCalculator() {
  const [selectedArea, setSelectedArea] = useState<string>("kontor");
  const [measuredLux, setMeasuredLux] = useState<number | "">("");
  const [uniformityRatio, setUniformityRatio] = useState<number | "">("");
  const [glareRating, setGlareRating] = useState<string>("");
  const [colorTemp, setColorTemp] = useState<number | "">("");

  const requirement = WORK_AREA_REQUIREMENTS.find((r) => r.name === selectedArea);
  const measuredValue = typeof measuredLux === "number" ? measuredLux : 0;

  const getStatus = () => {
    if (!requirement || measuredValue === 0) {
      return { level: "none", color: "text-muted-foreground", bg: "bg-muted" };
    }
    if (measuredValue >= requirement.recommendedLux) {
      return { level: "optimal", color: "text-green-700", bg: "bg-green-100" };
    }
    if (measuredValue >= requirement.minLux) {
      return { level: "acceptable", color: "text-yellow-700", bg: "bg-yellow-100" };
    }
    return { level: "insufficient", color: "text-red-700", bg: "bg-red-100" };
  };

  const status = getStatus();

  const getUniformityStatus = () => {
    if (typeof uniformityRatio !== "number" || uniformityRatio === 0) return null;
    // Jevnhet bør være minst 0.6 (Emin/Egjennomsnitt)
    if (uniformityRatio >= 0.7) return "good";
    if (uniformityRatio >= 0.5) return "acceptable";
    return "poor";
  };

  const uniformityStatus = getUniformityStatus();

  return (
    <div className="space-y-6">
      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Krav til belysning (NS-EN 12464-1)</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          Belysningen skal tilpasses arbeidsoppgavene og sikre at arbeidstakerne kan utføre arbeidet
          uten unødig belastning av øynene. Kravene varierer med type arbeid.
        </AlertDescription>
      </Alert>

      {/* Work area selection */}
      <div className="space-y-2">
        <Label>Type arbeidsområde</Label>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORK_AREA_REQUIREMENTS.map((area) => (
              <SelectItem key={area.name} value={area.name}>
                {area.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requirement && (
          <p className="text-xs text-muted-foreground">
            Krav: minimum {requirement.minLux} lux, anbefalt {requirement.recommendedLux} lux
          </p>
        )}
      </div>

      {/* Measurements */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Målt belysningsstyrke (lux)</Label>
          <Input
            type="number"
            value={measuredLux}
            onChange={(e) => setMeasuredLux(e.target.value ? Number(e.target.value) : "")}
            placeholder="F.eks. 500"
          />
        </div>
        <div className="space-y-2">
          <Label>Jevnhet (E<sub>min</sub>/E<sub>gj.snitt</sub>)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={uniformityRatio}
            onChange={(e) => setUniformityRatio(e.target.value ? Number(e.target.value) : "")}
            placeholder="F.eks. 0.7"
          />
          <p className="text-xs text-muted-foreground">Bør være minst 0.6</p>
        </div>
        <div className="space-y-2">
          <Label>Blending (UGR-verdi)</Label>
          <Select value={glareRating} onValueChange={setGlareRating}>
            <SelectTrigger>
              <SelectValue placeholder="Velg vurdering" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Utmerket (UGR ≤ 16)</SelectItem>
              <SelectItem value="good">God (UGR ≤ 19)</SelectItem>
              <SelectItem value="acceptable">Akseptabel (UGR ≤ 22)</SelectItem>
              <SelectItem value="poor">Dårlig (UGR &gt; 22)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fargetemperatur (Kelvin)</Label>
          <Input
            type="number"
            value={colorTemp}
            onChange={(e) => setColorTemp(e.target.value ? Number(e.target.value) : "")}
            placeholder="F.eks. 4000"
          />
          <p className="text-xs text-muted-foreground">
            Varm: 2700-3000K, Nøytral: 3500-4100K, Kald: 5000-6500K
          </p>
        </div>
      </div>

      {/* Result */}
      {requirement && (
        <div className={cn("p-4 rounded-lg border-2", status.bg)}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Sun className={cn("h-8 w-8", status.color)} />
              <div>
                <p className="text-sm text-muted-foreground">Belysningsstyrke</p>
                <p className={cn("text-2xl font-bold", status.color)}>
                  {measuredValue > 0 ? `${measuredValue} lux` : "—"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {status.level === "optimal" && (
                <Badge className="gap-1 bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Optimal belysning
                </Badge>
              )}
              {status.level === "acceptable" && (
                <Badge className="gap-1 bg-yellow-100 text-yellow-700 border-yellow-300">
                  <AlertTriangle className="h-3 w-3" />
                  Akseptabel
                </Badge>
              )}
              {status.level === "insufficient" && (
                <Badge className="gap-1 bg-red-100 text-red-700 border-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  Utilstrekkelig!
                </Badge>
              )}

              {uniformityStatus === "good" && (
                <Badge variant="outline" className="text-xs">Jevnhet: God</Badge>
              )}
              {uniformityStatus === "acceptable" && (
                <Badge variant="outline" className="text-xs text-yellow-700">Jevnhet: Akseptabel</Badge>
              )}
              {uniformityStatus === "poor" && (
                <Badge variant="outline" className="text-xs text-red-700">Jevnhet: Dårlig</Badge>
              )}
            </div>
          </div>

          {status.level === "acceptable" && (
            <p className="mt-3 text-sm text-yellow-800">
              Belysningen oppfyller minimumskravet på {requirement.minLux} lux, men er under 
              anbefalt nivå på {requirement.recommendedLux} lux. Vurder å forbedre belysningen.
            </p>
          )}
          {status.level === "insufficient" && (
            <p className="mt-3 text-sm text-red-800">
              <strong>Belysningen er utilstrekkelig!</strong> Minimumskravet er {requirement.minLux} lux.
              Tiltak må iverksettes for å forbedre belysningsforholdene.
            </p>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="p-4 bg-muted rounded-lg space-y-3">
        <h4 className="font-medium text-sm">Vanlige tiltak for å forbedre belysning:</h4>
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
          <li>Øke antall lyskilder eller lysarmaturens effekt</li>
          <li>Rengjøre lysarmaturer og reflekterende flater</li>
          <li>Bruke lysere farger på vegger og tak</li>
          <li>Installere arbeidsbelysning ved arbeidsstasjoner</li>
          <li>Plassere arbeidsplasser nærmere vinduer (dagslys)</li>
          <li>Bruke blendingsskjermer eller diffuse lyskilder</li>
        </ul>
      </div>

      {/* Reference */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-2">Referanseverdier (NS-EN 12464-1):</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1 pr-4">Arbeidstype</th>
                <th className="py-1 pr-4">Min. lux</th>
                <th className="py-1">Anbefalt lux</th>
              </tr>
            </thead>
            <tbody>
              {WORK_AREA_REQUIREMENTS.map((req) => (
                <tr key={req.name} className="border-b border-muted">
                  <td className="py-1 pr-4">{req.description}</td>
                  <td className="py-1 pr-4">{req.minLux}</td>
                  <td className="py-1">{req.recommendedLux}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
