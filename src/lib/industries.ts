// Sentral liste over bransjer for filtrering av admin-maler.
// Nøkler brukes i companies.industries og admin_*.industries (text[]).
export const INDUSTRIES: { key: string; label: string; description?: string }[] = [
  { key: "tomrer", label: "Tømrer / snekker" },
  { key: "maler", label: "Maler" },
  { key: "elektriker", label: "Elektriker" },
  { key: "rorlegger", label: "Rørlegger / VVS" },
  { key: "murer", label: "Murer / flislegger" },
  { key: "betong", label: "Betong / støp" },
  { key: "grunnarbeid", label: "Grunn- og anleggsarbeid" },
  { key: "taktekker", label: "Taktekker" },
  { key: "blikkenslager", label: "Blikkenslager" },
  { key: "ventilasjon", label: "Ventilasjon / klima" },
  { key: "isolasjon", label: "Isolasjon / tetting" },
  { key: "marine", label: "Marine / skip / verft" },
  { key: "industri_mekanisk", label: "Mekanisk industri / sveising" },
  { key: "renhold", label: "Renhold" },
  { key: "transport", label: "Transport / logistikk" },
  { key: "restaurant", label: "Restaurant / servering" },
  { key: "handel_kontor", label: "Handel / butikk / kontor" },
  { key: "byggmester", label: "Byggmester / byggeledelse" },
  { key: "hms_generelt", label: "Generell HMS (alle bransjer)" },
  { key: "ks_generelt", label: "Generell kvalitetssikring (alle bygg)" },
];

export const INDUSTRY_LABEL: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.key, i.label])
);

// "Universelle" bransjer som alltid vises uavhengig av bedriftens valgte bransjer.
export const UNIVERSAL_INDUSTRIES = ["hms_generelt"] as const;

/**
 * Sjekker om en mal er relevant for en bedrifts valgte bransjer.
 * - Hvis bedriften ikke har valgt noen bransjer: vis alt.
 * - Hvis malen ikke er tagget: vis den (defensivt — vi vil ikke skjule noe).
 * - Hvis malen har overlapp med bedriftens bransjer eller er tagget som universell: vis den.
 */
export function isTemplateRelevant(
  templateIndustries: string[] | null | undefined,
  companyIndustries: string[] | null | undefined
): boolean {
  const tpl = templateIndustries ?? [];
  const comp = companyIndustries ?? [];
  if (comp.length === 0) return true;
  if (tpl.length === 0) return true;
  if (tpl.some((i) => (UNIVERSAL_INDUSTRIES as readonly string[]).includes(i))) return true;
  return tpl.some((i) => comp.includes(i));
}
