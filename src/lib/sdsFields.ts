// Shared shape for the SDS fields stored on ik_hms_stoffkartotek and global_chemicals.

export interface SdsComponent {
  name: string;
  cas: string;
  ec: string;
  percentage: string;
}

export interface HazardStatement {
  code: string;
  text: string;
}

export interface SdsExtra {
  cas_numbers: SdsComponent[];
  hazard_statements: HazardStatement[];
  signal_word: string;
  revision_date: string;
  emergency_phone: string;
  pictograms: string[];
}

export const emptySdsExtra = (): SdsExtra => ({
  cas_numbers: [],
  hazard_statements: [],
  signal_word: "",
  revision_date: "",
  emergency_phone: "",
  pictograms: [],
});

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function sdsExtraFromRow(row: any): SdsExtra {
  const comps = Array.isArray(row?.cas_numbers) ? row.cas_numbers : [];
  const hazards = Array.isArray(row?.hazard_statements) ? row.hazard_statements : [];
  const rev = str(row?.revision_date);
  return {
    cas_numbers: comps.map((c: any) => ({
      name: str(c?.name), cas: str(c?.cas), ec: str(c?.ec), percentage: str(c?.percentage),
    })),
    hazard_statements: hazards.map((h: any) => ({ code: str(h?.code), text: str(h?.text) })),
    signal_word: str(row?.signal_word),
    revision_date: /^\d{4}-\d{2}-\d{2}/.test(rev) ? rev.slice(0, 10) : "",
    emergency_phone: str(row?.emergency_phone),
    pictograms: Array.isArray(row?.pictograms) ? row.pictograms.map(str).filter(Boolean) : [],
  };
}

export function sdsExtraFromParse(data: any): SdsExtra {
  return sdsExtraFromRow(data);
}

/** First non-empty CAS, kept in global_chemicals.cas_number for the existing search. */
export function firstCas(components: SdsComponent[]): string {
  return components.map((c) => c.cas).find((c) => c.length > 0) || "";
}

/** Columns to write. Empty revision date becomes null. */
export function sdsExtraToDb(extra: SdsExtra) {
  return {
    cas_numbers: extra.cas_numbers.filter((c) => c.name || c.cas || c.ec || c.percentage),
    hazard_statements: extra.hazard_statements.filter((h) => h.code || h.text),
    signal_word: extra.signal_word || null,
    revision_date: /^\d{4}-\d{2}-\d{2}$/.test(extra.revision_date) ? extra.revision_date : null,
    emergency_phone: extra.emergency_phone || null,
    pictograms: extra.pictograms.map((p) => p.trim()).filter(Boolean),
  };
}
