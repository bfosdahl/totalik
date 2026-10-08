// Shared parser for the employee import (Excel/CSV). Pure functions, no React, so it can be unit tested.
// The PDF path goes through the parse-employee-file edge function instead.

export interface ImportedEmployee {
  firstName: string;
  lastName: string;
  email: string;
  admin: boolean;
  /** Stilling/tittel from the file, if any (used for the admin hint). */
  title?: string;
  /** Row problem shown to the user. Rows with a status are not imported. */
  status?: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MISSING_EMAIL = "Mangler e-post – fyll inn for å importere";
export const INVALID_EMAIL = "Ugyldig e-post";
export const ALREADY_EXISTS = "Finnes allerede";
export const DUPLICATE_IN_FILE = "Duplikat i filen";

/** Lowercase, drop accents and Norwegian letters' diacritics, keep only a–z and 0–9. */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

type Field = "firstName" | "lastName" | "fullName" | "email" | "title" | "role";

const EXACT: Record<string, Field> = {
  fornavn: "firstName", firstname: "firstName", first: "firstName", givenname: "firstName",
  etternavn: "lastName", lastname: "lastName", last: "lastName", surname: "lastName", familyname: "lastName",
  navn: "fullName", name: "fullName", fulltnavn: "fullName", fullname: "fullName", ansatt: "fullName",
  ansattnavn: "fullName", medarbeider: "fullName", medarbeidernavn: "fullName", fornavnetternavn: "fullName",
  fornavnogetternavn: "fullName", etternavnfornavn: "fullName", etternavnogfornavn: "fullName", personnavn: "fullName",
  epost: "email", email: "email", mail: "email", epostadresse: "email", emailadresse: "email", emailaddress: "email",
  mailadresse: "email", eposta: "email",
  stilling: "title", tittel: "title", stillingstittel: "title", jobbtittel: "title", title: "title",
  jobtitle: "title", position: "title", stillingrolle: "title", stillingtittel: "title",
  rolle: "role", role: "role", tilgang: "role", brukerrolle: "role",
};

/** Map one header cell to a field, or null if it is not one we use. */
export function headerField(cell: unknown): Field | null {
  const h = normalizeHeader(cell);
  if (!h) return null;
  if (EXACT[h]) return EXACT[h];
  if (h.includes("epost") || h.includes("email") || h.includes("mail")) return "email";
  if (h.includes("fornavn") && h.includes("etternavn")) return "fullName";
  if (h.includes("fornavn")) return "firstName";
  if (h.includes("etternavn")) return "lastName";
  if (h.includes("stilling") || h.includes("tittel")) return "title";
  if (h.includes("navn") && !/(firma|bedrift|avdeling|selskap|kunde|leder|prosjekt)navn/.test(h)) return "fullName";
  return null;
}

type Columns = Partial<Record<Field, number>>;

function columnsFor(row: unknown[]): Columns {
  const cols: Columns = {};
  row.forEach((cell, i) => {
    const f = headerField(cell);
    if (f && cols[f] === undefined) cols[f] = i;
  });
  return cols;
}

/**
 * Find the header row: the first row (within the first 20) that names a person column
 * (fornavn/etternavn/navn) or an e-post column plus at least one other known column.
 * Title rows like "Ansattliste … eksportert 08.10.2026" above the table are skipped.
 */
export function findHeaderRow(rows: unknown[][]): { index: number; columns: Columns } | null {
  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i++) {
    const columns = columnsFor(rows[i] || []);
    const hasPerson = columns.firstName !== undefined || columns.fullName !== undefined;
    const known = Object.keys(columns).length;
    if ((hasPerson || columns.email !== undefined) && known >= 2) return { index: i, columns };
  }
  return null;
}

/** Owner/manager titles that get the admin hint. IT/system administrators do NOT. */
export function isLeaderTitle(title: string): boolean {
  const t = normalizeHeader(title);
  if (!t) return false;
  if (t.includes("system") || t.includes("itadmin") || t.includes("itansvarlig")) return false;
  return (
    t.includes("dagligleder") ||
    t.includes("administrerendedirektor") ||
    t.startsWith("admdir") ||
    t === "ceo" || t.startsWith("ceo") ||
    t.includes("innehaver") ||
    t === "eier" || t.startsWith("eierog") || t.endsWith("ogeier") || t.includes("medeier")
  );
}

/** Explicit app role column ("Rolle": Admin/Administrator/Ansatt). "Systemadministrator" is not admin. */
function isAdminRole(role: string): boolean {
  const r = normalizeHeader(role);
  return r === "admin" || r === "administrator" || r === "companyadmin" || r === "firmaadmin" || r === "bedriftsadmin";
}

const cellText = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

function splitFullName(full: string): { firstName: string; lastName: string } {
  if (full.includes(",")) {
    // "Etternavn, Fornavn"
    const [last, ...rest] = full.split(",");
    return { firstName: rest.join(" ").trim(), lastName: last.trim() };
  }
  const parts = full.split(" ").filter(Boolean);
  return { firstName: parts.shift() || "", lastName: parts.join(" ") };
}

/** Parse sheet rows (array of arrays, e.g. XLSX sheet_to_json with header: 1) into employees. */
export function parseEmployeeRows(rows: unknown[][]): ImportedEmployee[] {
  const header = findHeaderRow(rows);
  if (!header) return [];
  const { index, columns: c } = header;
  const get = (row: unknown[], f: Field) => (c[f] === undefined ? "" : cellText(row[c[f]!]));
  const out: ImportedEmployee[] = [];
  for (const row of rows.slice(index + 1)) {
    if (!row || row.every((v) => cellText(v) === "")) continue;
    let firstName = get(row, "firstName");
    let lastName = get(row, "lastName");
    const full = get(row, "fullName");
    if (!firstName && full) ({ firstName, lastName } = splitFullName(full));
    let email = get(row, "email").toLowerCase();
    if (!email) {
      const found = row.map(cellText).find((v) => EMAIL_RE.test(v));
      if (found) email = found.toLowerCase();
    }
    if (!firstName && !lastName && !email) continue; // title/footer rows
    const headerCells = rows[index];
    if (Object.values(c).every((i) => normalizeHeader(row[i]) === normalizeHeader(headerCells[i]))) continue; // repeated header row
    const title = get(row, "title");
    const role = get(row, "role");
    out.push({ firstName, lastName, email, admin: isAdminRole(role) || isLeaderTitle(title), ...(title ? { title } : {}) });
  }
  return out;
}

/** Set the per-row status (missing/invalid e-post, already exists, duplicate). Keeps every row. */
export function validateEmployees(rows: ImportedEmployee[], existingEmails: string[]): ImportedEmployee[] {
  const existing = new Set(existingEmails.map((e) => e.toLowerCase()));
  const seen = new Set<string>();
  return rows.map((r) => {
    const email = r.email.trim().toLowerCase();
    let status: string | undefined;
    if (!email) status = MISSING_EMAIL;
    else if (!EMAIL_RE.test(email)) status = INVALID_EMAIL;
    else if (existing.has(email)) status = ALREADY_EXISTS;
    else if (seen.has(email)) status = DUPLICATE_IN_FILE;
    if (email) seen.add(email);
    const { status: _old, ...rest } = r;
    return status ? { ...rest, email, status } : { ...rest, email };
  });
}

/** Decode CSV bytes: UTF-8 (with or without BOM), falling back to Windows-1252 (Excel "CSV (semikolon)"). */
export function decodeCsvBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
