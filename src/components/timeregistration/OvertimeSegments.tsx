import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface OvertimeSegment {
  id: string;
  start: string;
  end: string;
  rate: "overtime_50" | "overtime_100";
}

interface Props {
  segments: OvertimeSegment[];
  onChange: (segs: OvertimeSegment[]) => void;
  /** Hovedperiode start/slutt (HH:mm). Brukes til validering. */
  mainStart?: string;
  mainEnd?: string;
}

const hoursBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let diff = (th * 60 + tm) - (fh * 60 + fm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
};

export function computeSegmentBreakdown(totalHours: number, segments: OvertimeSegment[]) {
  let ot50 = 0, ot100 = 0;
  for (const s of segments) {
    const h = hoursBetween(s.start, s.end);
    if (s.rate === "overtime_50") ot50 += h;
    else ot100 += h;
  }
  const normal = Math.max(0, Math.round((totalHours - ot50 - ot100) * 100) / 100);
  return { normal, overtime_50: ot50, overtime_100: ot100 };
}

export function OvertimeSegmentsEditor({ segments, onChange, mainStart, mainEnd }: Props) {
  const add = () => {
    onChange([
      ...segments,
      {
        id: crypto.randomUUID(),
        start: mainStart || "15:00",
        end: mainEnd || "18:00",
        rate: "overtime_50",
      },
    ]);
  };

  const update = (id: string, patch: Partial<OvertimeSegment>) => {
    onChange(segments.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const remove = (id: string) => onChange(segments.filter((s) => s.id !== id));

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Overtid i denne perioden</Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
          <Plus className="h-3 w-3" /> Legg til
        </Button>
      </div>

      {segments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ingen overtid. Legg til ett eller flere intervaller hvis deler av perioden var overtid (50% eller 100%).
        </p>
      ) : (
        <div className="space-y-2">
          {segments.map((s) => {
            const h = hoursBetween(s.start, s.end);
            return (
              <div key={s.id} className="grid grid-cols-[1fr_1fr_110px_auto] gap-2 items-end bg-muted/30 p-2 rounded-md">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Fra</Label>
                  <Input type="time" step={60} value={s.start} onChange={(e) => update(s.id, { start: e.target.value })} className="h-9" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Til</Label>
                  <Input type="time" step={60} value={s.end} onChange={(e) => update(s.id, { end: e.target.value })} className="h-9" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Sats</Label>
                  <Select value={s.rate} onValueChange={(v) => update(s.id, { rate: v as OvertimeSegment["rate"] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overtime_50">50% overtid</SelectItem>
                      <SelectItem value="overtime_100">100% overtid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => remove(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <div className="col-span-4 text-[11px] text-muted-foreground text-right">
                  {h > 0 ? `${h.toFixed(2)} t på ${s.rate === "overtime_50" ? "50%" : "100%"}` : "Velg start og slutt"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SegmentSummary({ totalHours, segments }: { totalHours: number; segments: OvertimeSegment[] }) {
  const { normal, overtime_50, overtime_100 } = computeSegmentBreakdown(totalHours, segments);
  const sumOt = overtime_50 + overtime_100;
  const overflow = sumOt > totalHours + 0.001;

  return (
    <div className="rounded-md border bg-card p-3 text-sm space-y-1">
      <div className="flex justify-between"><span className="text-muted-foreground">Normaltid</span><span className="font-medium">{normal.toFixed(2)} t</span></div>
      {overtime_50 > 0 && <div className="flex justify-between"><span className="text-orange-600">50% overtid</span><span className="font-medium">{overtime_50.toFixed(2)} t</span></div>}
      {overtime_100 > 0 && <div className="flex justify-between"><span className="text-red-600">100% overtid</span><span className="font-medium">{overtime_100.toFixed(2)} t</span></div>}
      <div className="flex justify-between border-t pt-1 mt-1"><span className="font-semibold">Totalt</span><span className="font-semibold">{totalHours.toFixed(2)} t</span></div>
      {overflow && (
        <div className="flex items-center gap-1 text-xs text-destructive mt-1">
          <AlertCircle className="h-3 w-3" /> Overtid overstiger totalt antall timer
        </div>
      )}
    </div>
  );
}
