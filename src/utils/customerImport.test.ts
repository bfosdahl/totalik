import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { decodeCsvBytes } from "./employeeImport";
import {
  suggestMapping, findCustomerHeaderRow, buildCustomers, cleanOrgNumber, splitPostnrSted, buildAddress, countStatuses, chunk,
  STATUS_NEW, STATUS_EXISTS, STATUS_DUPLICATE, STATUS_NO_NAME,
} from "./customerImport";

const CSV =
  "Kundeliste eksport\n\n" +
  "Kundenavn;Kontakt;Epost;Tlf;Gateadresse;Postnr/sted;Org.nr\n" +
  "Bjørn Bygg AS;Åse Ødegård;ase@bb.no;912 34 567;Fjordveien 2;8170 Engavågen;987 654 321\n" +
  "Oslo Tak;;feil@;;Storgata 1;0585 Oslo;12345\n" +
  "bjørn bygg as ;;;;;;\n" +
  ";Uten Navn;;;;;\n" +
  "Eksisterende AS;;;;;;\n" +
  "Ny Org AS;;;;;;111 222 333\n";

const parse = (text: string) => {
  const wb = XLSX.read(text, { type: "string", raw: true });
  return XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: false });
};

describe("customerImport", () => {
  it("finds header below title rows and suggests mapping", () => {
    const rows = parse(CSV);
    const h = findCustomerHeaderRow(rows);
    expect(h).toBe(2);
    expect(suggestMapping(rows[h])).toEqual({ name: 0, contact_person: 1, email: 2, phone: 3, address: 4, postnrSted: 5, org_number: 6 });
  });

  it("builds rows with statuses, æøå, leading zeros and cleaned fields", () => {
    const rows = parse(decodeCsvBytes(new TextEncoder().encode(CSV)));
    const h = findCustomerHeaderRow(rows);
    const out = buildCustomers(rows, h, suggestMapping(rows[h]), [
      { name: "Eksisterende AS", org_number: null },
      { name: "Annet navn", org_number: "111222333" },
    ]);
    expect(out.map((r) => r.status)).toEqual([STATUS_NEW, STATUS_NEW, STATUS_DUPLICATE, STATUS_NO_NAME, STATUS_EXISTS, STATUS_EXISTS]);
    expect(out[0]).toMatchObject({ name: "Bjørn Bygg AS", contact_person: "Åse Ødegård", org_number: "987654321", address: "Fjordveien 2, 8170 Engavågen" });
    expect(out[1]).toMatchObject({ email: "", emailInvalid: true, org_number: "", address: "Storgata 1, 0585 Oslo" });
    expect(countStatuses(out)).toEqual({ nye: 2, finnes: 2, dubletter: 1, utenNavn: 1 });
  });

  it("supports comma separated CSV", () => {
    const rows = parse("Name,Email,Zip,City\nAcme,a@acme.no,0150,Oslo\n");
    const out = buildCustomers(rows, 0, suggestMapping(rows[0]), []);
    expect(out[0]).toMatchObject({ name: "Acme", email: "a@acme.no", address: "0150 Oslo", status: STATUS_NEW });
  });

  it("org.nr is kept only with exactly 9 digits", () => {
    expect(cleanOrgNumber("NO 987 654 321 MVA")).toBe("987654321");
    expect(cleanOrgNumber("12345678")).toBe("");
    expect(cleanOrgNumber("1234567890")).toBe("");
  });

  it("splits postnr/sted and builds address skipping empty parts", () => {
    expect(splitPostnrSted("8170 Engavågen")).toEqual({ postnr: "8170", sted: "Engavågen" });
    expect(splitPostnrSted("Oslo")).toEqual({ postnr: "", sted: "Oslo" });
    expect(buildAddress("", "0585", "")).toBe("0585");
    expect(buildAddress("Vei 1", "", "Bodø")).toBe("Vei 1, Bodø");
  });

  it("chunks in batches of 100", () => {
    expect(chunk(Array.from({ length: 250 }), 100).map((c) => c.length)).toEqual([100, 100, 50]);
  });
});
