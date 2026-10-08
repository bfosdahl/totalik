/**
 * Formats a hazard (farekilde) name for display.
 *
 * AI-oppsett kan lagre rå kodar ("fall_snubling") eller småbegynna tekst
 * ("ergonomi") som eigedefare. Denne normaliserer berre det første teiknet og
 * gjer understrekar til mellomrom – resten av teksten blir ståande uendra.
 */
export function formatHazardName(value?: string | null): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const spaced = trimmed.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
