import { t } from "@/i18n/t";
import type { DeviationCategory } from "@/hooks/useDeviations";

const CATEGORY_LABEL_KEYS: Record<DeviationCategory, string> = {
  safety: "auto.hms_sikkerhet",
  quality: "auto.kvalitet",
  environment: "auto.miljoe",
  process: "auto.prosess",
  equipment: "auto.utstyr",
  personnel: "auto.personell",
  documentation: "auto.dokumentasjon",
  other: "auto.annet",
  temperature: "auto.temperaturavvik",
  cleaning: "auto.renhold",
  pest_control: "auto.skadedyr",
  allergen: "auto.allergenhaandtering",
  traceability: "auto.sporbarhet",
  hygiene: "auto.hygiene",
  storage: "auto.lagring",
  pests: "auto.skadedyr",
  expiry: "auto.utgaatt_holdbarhet",
  contamination: "auto.krysskontaminering",
  receiving: "auto.varemottak",
  other_food: "auto.annet_matsikkerhet",
};

/** Translated label for a deviation category; falls back to the raw value. */
export function getDeviationCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  const key = (CATEGORY_LABEL_KEYS as Record<string, string>)[category];
  return key ? t(key) : category;
}
