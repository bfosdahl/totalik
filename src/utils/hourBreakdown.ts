/**
 * Fellesnøkkel for å regne ut normal / 50% / 100%-overtid for en timeføring.
 *
 * Timeføringer lagres nå som ÉN rad per fra-til-periode. Total timer ligger på
 * `hours`, og eventuelle overtidsintervaller ligger i `overtime_segments` (jsonb).
 * Aggregeringer (lønn, oversikt, eksport) bruker denne helperen slik at én rad
 * kan splittes riktig i normale timer, 50%-overtid og 100%-overtid uten at vi
 * må opprette flere rader i databasen.
 */

export interface OvertimeSegmentLike {
  start?: string | null;
  end?: string | null;
  rate?: "overtime_50" | "overtime_100" | string | null;
  hours?: number | null;
}

export interface HourBreakdownInput {
  hours: number | null | undefined;
  hour_type?: string | null;
  overtime_segments?: OvertimeSegmentLike[] | null | any;
}

export interface HourBreakdown {
  normal: number;
  overtime_50: number;
  overtime_100: number;
  total: number;
  hasOvertime: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function parseSegments(raw: any): OvertimeSegmentLike[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as OvertimeSegmentLike[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getHourBreakdown(entry: HourBreakdownInput): HourBreakdown {
  const total = Math.max(0, Number(entry.hours) || 0);
  const segs = parseSegments(entry.overtime_segments);

  if (segs.length > 0) {
    const ot50 = round2(
      segs.filter((s) => s.rate === "overtime_50").reduce((sum, s) => sum + (Number(s.hours) || 0), 0)
    );
    const ot100 = round2(
      segs.filter((s) => s.rate === "overtime_100").reduce((sum, s) => sum + (Number(s.hours) || 0), 0)
    );
    const normal = round2(Math.max(0, total - ot50 - ot100));
    return {
      normal,
      overtime_50: ot50,
      overtime_100: ot100,
      total,
      hasOvertime: ot50 + ot100 > 0,
    };
  }

  if (entry.hour_type === "overtime_50") {
    return { normal: 0, overtime_50: total, overtime_100: 0, total, hasOvertime: total > 0 };
  }
  if (entry.hour_type === "overtime_100") {
    return { normal: 0, overtime_50: 0, overtime_100: total, total, hasOvertime: total > 0 };
  }
  return { normal: total, overtime_50: 0, overtime_100: 0, total, hasOvertime: false };
}

/** Kompakt tekst-etikett for én rad – f.eks. "Normal + 2t 50%" */
export function hourBreakdownLabel(entry: HourBreakdownInput): string {
  const b = getHourBreakdown(entry);
  const parts: string[] = [];
  if (b.normal > 0) parts.push(`${b.normal}t normal`);
  if (b.overtime_50 > 0) parts.push(`${b.overtime_50}t 50%`);
  if (b.overtime_100 > 0) parts.push(`${b.overtime_100}t 100%`);
  if (parts.length === 0) return "Normal";
  return parts.join(" + ");
}
