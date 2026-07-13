import { format } from "date-fns";
import { nb } from "date-fns/locale";

export const CLOSURE_PREFIX = "🔒 Lukkekommentar:";

export const AVVIK_STATUS_LABELS: Record<string, string> = {
  open: "Åpen",
  in_progress: "Under arbeid",
  closed: "Lukket",
};

export const AVVIK_SEVERITY_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
  critical: "Kritisk",
};

/** Splits a corrective_action string into the raw corrective part
 * and the closure comment (stored after "🔒 Lukkekommentar:"). */
export function splitClosureComment(
  text: string | null | undefined,
): { corrective: string; closure: string | null } {
  if (!text) return { corrective: "", closure: null };
  const idx = text.indexOf(CLOSURE_PREFIX);
  if (idx === -1) return { corrective: text, closure: null };
  const closure = text.slice(idx + CLOSURE_PREFIX.length).trim();
  const corrective = text.slice(0, idx).trim();
  return { corrective, closure: closure || null };
}

export interface AvvikHistoryInput {
  created_at?: string | null;
  updated_at?: string | null;
  closed_at?: string | null;
  reported_by_name?: string | null;
  responsible_name?: string | null;
  closed_by_name?: string | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
}

export interface AvvikHistoryRow {
  date: string;
  event: string;
  who: string;
}

const fmt = (iso?: string | null) =>
  iso ? format(new Date(iso), "dd.MM.yyyy HH:mm", { locale: nb }) : "-";

/** Builds a compact change-history log used in the PDF and in the UI. */
export function buildAvvikHistoryRows(avvik: AvvikHistoryInput): AvvikHistoryRow[] {
  const { corrective, closure } = splitClosureComment(avvik.corrective_action);
  const updatedLabel = avvik.updated_at ? fmt(avvik.updated_at) : "-";
  const responsibleLabel = avvik.responsible_name || "Ikke tildelt";
  const rows: AvvikHistoryRow[] = [];

  if (avvik.created_at) {
    rows.push({
      date: fmt(avvik.created_at),
      event: "Avvik opprettet",
      who: avvik.reported_by_name || "-",
    });
  }
  if (corrective) {
    rows.push({
      date: updatedLabel,
      event: "Korrigerende tiltak registrert",
      who: responsibleLabel,
    });
  }
  if (avvik.preventive_action) {
    rows.push({
      date: updatedLabel,
      event: "Forebyggende tiltak registrert",
      who: responsibleLabel,
    });
  }
  if (
    avvik.updated_at &&
    avvik.updated_at !== avvik.created_at &&
    !corrective &&
    !avvik.preventive_action
  ) {
    rows.push({
      date: updatedLabel,
      event: "Avvik oppdatert",
      who: responsibleLabel,
    });
  }
  if (closure) {
    rows.push({
      date: avvik.closed_at ? fmt(avvik.closed_at) : updatedLabel,
      event: "Lukkekommentar lagt til",
      who: avvik.closed_by_name || responsibleLabel,
    });
  }
  if (avvik.closed_at && avvik.closed_by_name) {
    rows.push({
      date: fmt(avvik.closed_at),
      event: "Avvik lukket",
      who: avvik.closed_by_name,
    });
  }
  return rows;
}
