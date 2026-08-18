import * as hmsKort from "./hms-kort.ts";
import * as kompetansebevis from "./kompetansebevis.ts";
import * as renholdMed from "./renhold-med-ansatte.ts";
import * as renholdUten from "./renhold-uten-ansatte.ts";

export type ServiceTemplateKey =
  | "hms-kort"
  | "kompetansebevis"
  | "renhold-med-ansatte"
  | "renhold-uten-ansatte";

export const SERVICE_TEMPLATES: Record<ServiceTemplateKey, { subject: string; html: string }> = {
  "hms-kort": { subject: hmsKort.subject, html: hmsKort.html },
  "kompetansebevis": { subject: kompetansebevis.subject, html: kompetansebevis.html },
  "renhold-med-ansatte": { subject: renholdMed.subject, html: renholdMed.html },
  "renhold-uten-ansatte": { subject: renholdUten.subject, html: renholdUten.html },
};

// Produktnavn i NextCom → tjenestemal.
// "renhold" håndteres spesielt (med/uten ansatte) i detectServiceTemplates().
const KEYWORD_MAP: Array<{ keyword: string; template: ServiceTemplateKey | "renhold" }> = [
  { keyword: "hms-kort", template: "hms-kort" },
  { keyword: "hms kort", template: "hms-kort" },
  { keyword: "hmskort", template: "hms-kort" },
  { keyword: "kompetansebevis", template: "kompetansebevis" },
  { keyword: "kompetansekort", template: "kompetansebevis" },
  { keyword: "plastkort", template: "kompetansebevis" },
  { keyword: "renholdsgodkjenning", template: "renhold" },
  { keyword: "renholdsregister", template: "renhold" },
  { keyword: "renholdssøknad", template: "renhold" },
  { keyword: "renholdsoknad", template: "renhold" },
  { keyword: "godkjenning renhold", template: "renhold" },
];

/**
 * Finner hvilke tjenestemaler en ordre skal utløse.
 * employeeCount brukes til å velge riktig renholdsmal (null/0 = uten ansatte).
 */
export function detectServiceTemplates(
  productNames: string[],
  employeeCount: number | null,
): ServiceTemplateKey[] {
  const hits = new Set<ServiceTemplateKey>();
  for (const product of productNames) {
    const lower = product.toLowerCase().trim();
    for (const { keyword, template } of KEYWORD_MAP) {
      if (!lower.includes(keyword)) continue;
      if (template === "renhold") {
        hits.add((employeeCount ?? 0) > 0 ? "renhold-med-ansatte" : "renhold-uten-ansatte");
      } else {
        hits.add(template);
      }
    }
  }
  return Array.from(hits);
}
