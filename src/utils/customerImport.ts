// Pure helpers for the KS customer import (Excel/CSV). No React, unit tested.
import { normalizeHeader, EMAIL_RE } from "./employeeImport";

export type CustomerField = "name" | "contact_person" | "email" | "phone" | "address" | "postnr" | "sted" | "postnrSted" | "org_number";

export const CUSTOMER_FIELDS: { key: Exclude<CustomerField, "postnrSted">; label: string; required?: boolean }[] = [
  { key: "name", label: "Navn", required: true },
  { key: "contact_person", label: "Kontaktperson" },
  { key: "email", label: "E-post" },
  { key: "phone", label: "Telefon" },
  { key: "address", label: "Adresse" },
  { key: "postnr", label: "Postnr" },
  { key: "sted", label: "Sted" },
  { key: "org_number", label: "Org.nr" },
];

export const TEMPLATE_HEADERS = ["Navn", "Kontaktperson", "E-post", "Telefon", "Adresse", "Postnr", "Sted", "Org.nr"];
export const TEMPLATE_EXAMPLE = ["Eksempel Bygg AS", "Ola Nordmann", "ola@eksempel.no", "912 34 567", "Storgata 1", "0585", "Oslo", "123456789"];

const EXACT: Record<string, CustomerField> = {
  navn: "name", kunde: "name", kundenavn: "name", firma: "name", firmanavn: "name", name: "name", customer: "name", customername: "name", company: "name", bedrift: "name",
  kontaktperson: "contact_person", kontakt: "contact_person", contact: "contact_person", contactperson: "contact_person",
  epost: "email", email: "email", mail: "email", epostadresse: "email",
  telefon: "phone", tlf: "phone", mobil: "phone", phone: "phone", mobile: "phone", telefonnummer: "phone",
  adresse: "address", gateadresse: "address", address: "address", besoksadresse: "address", postadresse: "address",
  postnr: "postnr", postnummer: "postnr", zip: "postnr", zipcode: "postnr", postcode: "postnr",
  sted: "sted", by: "sted", city: "sted",
  postnrsted: "postnrSted", poststed: "postnrSted", postnummersted: "postnrSted",
  orgnr: "org_number", organisasjonsnummer: "org_number", orgnummer: "org_number", organisasjonsnr: "org_number",
};

const txt = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

export function customerHeaderField(cell: unknown): CustomerField | null {
  const h = normalizeHeader(cell);
  if (!h) return null;
  if (EXACT[h]) return EXACT[h];
  if (h.includes("epost") || h.includes("email")) return "email";
  if (h.startsWith("orgn") || h.includes("organisasjon")) return "org_number";
  if (h.includes("postn") && h.includes("sted")) return "postnrSted";
  if (h.includes("kontakt")) return "contact_person";
  if (h.includes("telefon") || h.includes("mobil")) return "phone";
  if (h.includes("adresse")) return "address";
  return null;
}

/** Column index per field ("postnrSted" is a combined column). -1 / undefined = not imported. */
export type CustomerMapping = Partial<Record<CustomerField, number>>;

export function suggestMapping(header: unknown[], sampleRows: unknown[][] = []): CustomerMapping {
  const m: CustomerMapping = {};
  header.forEach((cell, i) => {
    let f = customerHeaderField(cell);
    // «Poststed» without digits in the data is just the place name.
    if (f === "postnrSted" && normalizeHeader(cell) === "poststed") {
      const vals = sampleRows.map((r) => txt(r?.[i])).filter(Boolean);
      if (vals.length > 0 && vals.every((v) => !/\d/.test(v))) f = "sted";
    }
    if (f && m[f] === undefined) m[f] = i;
  });
  // A combined column fills postnr/sted only when no separate column exists.
  if (m.postnrSted !== undefined && m.postnr !== undefined && m.sted !== undefined) delete m.postnrSted;
  return m;
}

/** First row within the first 15 that has a name column. */
export function findCustomerHeaderRow(rows: unknown[][]): number {
  const limit = Math.min(rows.length, 15);
  for (let i = 0; i < limit; i++) {
    if ((rows[i] || []).some((c) => customerHeaderField(c) === "name")) return i;
  }
  return -1;
}

export function splitPostnrSted(value: string): { postnr: string; sted: string } {
  const v = value.replace(/\s+/g, " ").trim();
  const m = v.match(/^(\d{3,4})(?:\s+(.*))?$/) || v.match(/^(\d{4})(.*)$/);
  return m ? { postnr: normalizePostnr(m[1]), sted: (m[2] || "").trim() } : { postnr: "", sted: v };
}

/** Excel stores 0585 as 585: pad a 3-digit postnr to 4. Other values unchanged. */
export function normalizePostnr(value: string): string {
  const v = String(value ?? "").trim();
  return /^\d{3}$/.test(v) ? `0${v}` : v;
}

export function cleanOrgNumber(value: string): string {
  const d = String(value ?? "").replace(/\D/g, "");
  return d.length === 9 ? d : "";
}

export function buildAddress(address: string, postnr: string, sted: string): string {
  const place = [postnr, sted].filter(Boolean).join(" ");
  return [address, place].filter(Boolean).join(", ");
}

export const STATUS_NEW = "Ny";
export const STATUS_EXISTS = "Finnes allerede";
export const STATUS_DUPLICATE = "Dublett i filen";
export const STATUS_NO_NAME = "Mangler navn";
export type CustomerStatus = typeof STATUS_NEW | typeof STATUS_EXISTS | typeof STATUS_DUPLICATE | typeof STATUS_NO_NAME;

export interface ImportedCustomer {
  rowNumber: number; // 1-based row in the file
  name: string;
  contact_person: string;
  email: string;
  emailInvalid: boolean;
  phone: string;
  address: string; // combined "Adresse, Postnr Sted"
  org_number: string;
  status: CustomerStatus;
}

const nameKey = (n: string) => n.replace(/\s+/g, " ").trim().toLowerCase();

export function buildCustomers(
  rows: unknown[][],
  headerIndex: number,
  mapping: CustomerMapping,
  existing: { name: string; org_number: string | null }[],
): ImportedCustomer[] {
  const exNames = new Set(existing.map((e) => nameKey(e.name || "")));
  const exOrgs = new Set(existing.map((e) => cleanOrgNumber(e.org_number || "")).filter(Boolean));
  const seenNames = new Set<string>();
  const seenOrgs = new Set<string>();
  const get = (row: unknown[], f: CustomerField) => {
    const i = mapping[f];
    return i === undefined || i < 0 ? "" : txt(row[i]);
  };
  const out: ImportedCustomer[] = [];
  rows.slice(headerIndex + 1).forEach((row, idx) => {
    if (!row || row.every((v) => txt(v) === "")) return;
    const name = get(row, "name");
    let postnr = normalizePostnr(get(row, "postnr"));
    let sted = get(row, "sted");
    const combo = get(row, "postnrSted");
    if (combo && (!postnr || !sted)) {
      const s = splitPostnrSted(combo);
      postnr = postnr || s.postnr;
      sted = sted || s.sted;
    }
    const rawEmail = get(row, "email");
    const emailOk = !rawEmail || EMAIL_RE.test(rawEmail);
    const org = cleanOrgNumber(get(row, "org_number"));
    const key = nameKey(name);
    let status: CustomerStatus;
    if (!name) status = STATUS_NO_NAME;
    else if ((org && exOrgs.has(org)) || exNames.has(key)) status = STATUS_EXISTS;
    else if ((org && seenOrgs.has(org)) || seenNames.has(key)) status = STATUS_DUPLICATE;
    else status = STATUS_NEW;
    if (name) seenNames.add(key);
    if (org) seenOrgs.add(org);
    out.push({
      rowNumber: headerIndex + idx + 2,
      name,
      contact_person: get(row, "contact_person"),
      email: emailOk ? rawEmail : "",
      emailInvalid: !emailOk,
      phone: get(row, "phone"),
      address: buildAddress(get(row, "address"), postnr, sted),
      org_number: org,
      status,
    });
  });
  return out;
}

export function countStatuses(rows: ImportedCustomer[]) {
  const c = { nye: 0, finnes: 0, dubletter: 0, utenNavn: 0 };
  for (const r of rows) {
    if (r.status === STATUS_NEW) c.nye++;
    else if (r.status === STATUS_EXISTS) c.finnes++;
    else if (r.status === STATUS_DUPLICATE) c.dubletter++;
    else c.utenNavn++;
  }
  return c;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
