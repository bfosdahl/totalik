export interface NormalizedHmsRoutine {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

type RoutineLike = Record<string, unknown>;

const safeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = safeText(value);
    if (text) return text;
  }
  return "";
};

const decodeHtmlEntities = (value: string): string => value
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

export const stripHtml = (value: unknown): string => {
  const source = safeText(value);
  if (!source) return "";

  const withLineBreaks = source
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/\s*(p|div|h[1-6]|li|ul|ol|tr|section|article)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withLineBreaks)
    .split(/\n+/)
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
};

const extractLabel = (text: string, label: string): string => {
  const regex = new RegExp(`^${label}\\s*:\\s*(.+)$`, "im");
  return text.match(regex)?.[1]?.trim() || "";
};

const removeExtractedLabels = (text: string): string => text
  .split(/\n+/)
  .map((line) => line.trim())
  .filter((line) => line && !/^(ansvar|frekvens)\s*:/i.test(line))
  .join("\n");

export const normalizeHmsRoutine = (input: unknown, index: number): NormalizedHmsRoutine => {
  const routine = (input && typeof input === "object" ? input : {}) as RoutineLike;
  const defaultNumber = `R${String(index + 1).padStart(3, "0")}`;
  const contentText = stripHtml(firstText(routine.content, routine.procedure, routine.prosedyre));
  const responsibilityFromContent = extractLabel(contentText, "Ansvar");
  const frequencyFromContent = extractLabel(contentText, "Frekvens");
  const existingRemember = stripHtml(routine.remember);

  return {
    id: firstText(routine.id) || globalThis.crypto?.randomUUID?.() || `routine-${index + 1}`,
    routine_number: firstText(routine.routine_number, routine.number) || defaultNumber,
    routine_name: firstText(routine.routine_name, routine.name, routine.title, routine.tittel) || "Ukjent rutine",
    category: firstText(routine.category, routine.kategori) || "Generelt",
    purpose: stripHtml(firstText(routine.purpose, routine.formaal, routine.description)),
    responsibility: stripHtml(firstText(routine.responsibility, routine.ansvar, routine.responsible, responsibilityFromContent)),
    procedure: removeExtractedLabels(stripHtml(firstText(routine.procedure, routine.prosedyre, routine.content))),
    examples: stripHtml(routine.examples),
    remember: [existingRemember, frequencyFromContent ? `Frekvens: ${frequencyFromContent}` : ""].filter(Boolean).join("\n"),
    is_predefined: Boolean(routine.is_predefined),
  };
};

export const normalizeHmsRoutines = (data: unknown): NormalizedHmsRoutine[] => {
  if (!Array.isArray(data)) return [];
  return data.map((routine, index) => normalizeHmsRoutine(routine, index));
};

export const buildCanonicalOrganizationContent = (organization: {
  dagligLeder?: string | null;
  verneombud?: string | null;
  andreRoller?: Array<{ rolle?: string | null; navn?: string | null }>;
} | null | undefined): string => {
  const roles: Array<{ title: string; personName: string; description: string; depth: number; childCount: number }> = [];

  if (organization?.dagligLeder) {
    roles.push({ title: "Daglig leder", personName: organization.dagligLeder, description: "Overordnet ansvar for internkontroll og HMS-arbeid.", depth: 0, childCount: 0 });
  }
  if (organization?.verneombud) {
    roles.push({ title: "Verneombud", personName: organization.verneombud, description: "Arbeidstakernes representant i HMS-arbeidet.", depth: roles.length ? 1 : 0, childCount: 0 });
  }
  organization?.andreRoller?.forEach((role) => {
    const title = safeText(role.rolle);
    if (!title) return;
    roles.push({ title, personName: safeText(role.navn), description: "", depth: roles.length ? 1 : 0, childCount: 0 });
  });

  const description = roles
    .map((role) => `${role.title}${role.personName ? `: ${role.personName}` : ""}${role.description ? ` – ${role.description}` : ""}`)
    .join("\n");

  return JSON.stringify({ description, roles });
};