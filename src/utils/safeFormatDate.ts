import { format } from "date-fns";
import { nb } from "date-fns/locale";

/**
 * Safe wrapper around date-fns `format` that returns a fallback string
 * instead of throwing "Invalid time value" when the input is null,
 * undefined, an empty string, or an unparseable date.
 *
 * Use in PDF generators and reports where bad data must never crash the export.
 */
export function safeFormatDate(
  value: string | number | Date | null | undefined,
  pattern: string = "dd.MM.yyyy",
  fallback: string = "—"
): string {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return format(d, pattern, { locale: nb });
  } catch {
    return fallback;
  }
}
