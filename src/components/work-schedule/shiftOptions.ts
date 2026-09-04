// Generic shift options that work across all industries.
// Values are stored as free text in work_schedules.location / shift_role,
// so companies can also type their own values.

export interface LocationOption {
  label: string;
  color: string;
}

export const LOCATIONS: Record<string, LocationOption> = {
  // General
  site: { label: "Byggeplass / anlegg", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  field: { label: "Ute / oppdrag hos kunde", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  workshop: { label: "Verksted", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  office: { label: "Kontor", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  storage: { label: "Lager", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  remote: { label: "Hjemmekontor", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
  // Food & service
  kitchen: { label: "Kjøkken", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  service: { label: "Servering", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  takeaway: { label: "Gatekjøkken", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  shop: { label: "Butikk", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
};

export const ROLES: Record<string, string> = {
  // General
  leader: "Arbeidsleder",
  foreman: "Bas / formann",
  skilled: "Fagarbeider",
  apprentice: "Lærling",
  helper: "Hjelpearbeider",
  driver: "Sjåfør",
  cleaner: "Renholder",
  admin: "Administrasjon",
  // Food & service
  chef: "Kokk",
  shift_leader: "Skiftleder",
  server: "Servitør",
  cashier: "Kasserer",
  prep: "Forberedelse",
};

const DEFAULT_COLOR = "bg-muted text-foreground";

export function getLocationOption(value?: string | null): LocationOption | null {
  if (!value) return null;
  return LOCATIONS[value] ?? { label: value, color: DEFAULT_COLOR };
}

export function getLocationLabel(value?: string | null): string {
  return getLocationOption(value)?.label ?? "";
}

export function getRoleLabel(value?: string | null): string {
  if (!value) return "";
  return ROLES[value] ?? value;
}
