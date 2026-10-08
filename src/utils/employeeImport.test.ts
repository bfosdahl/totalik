import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  parseEmployeeRows, validateEmployees, findHeaderRow, isLeaderTitle, decodeCsvBytes, headerField,
  MISSING_EMAIL, ALREADY_EXISTS, DUPLICATE_IN_FILE, INVALID_EMAIL,
} from "./employeeImport";

// Exact contents of the import test files (ansatte-fjordbygg.xlsx and ansatteliste_eksport.csv).
const CLEAN: string[][] = [
  ["Fornavn", "Etternavn", "E-post", "Telefon", "Stilling", "Avdeling", "Startdato"],
  ["Ingrid", "Solheim", "ingrid.solheim@fjordbygg-test.no", "+47 912 34 567", "Daglig leder", "Ledelse", "01.03.2015"],
  ["Ola", "Nordmann", "ola.nordmann@fjordbygg-test.no", "934 56 789", "Tømrer", "Produksjon", "15.08.2018"],
  ["Kari", "Nilsen Berg", "kari.berg@fjordbygg-test.no", "45 67 89 01", "HMS-ansvarlig", "Kvalitet og HMS", "02.01.2020"],
  ["Mohammed", "Al-Sayed", "m.alsayed@fjordbygg-test.no", "+47 401 23 456", "Lærling tømrer", "Produksjon", "19.08.2024"],
  ["Åse", "Bjørnstad", "ase.bjornstad@fjordbygg-test.no", "976 54 321", "Prosjektleder", "Prosjekt", "10.05.2017"],
  ["Piotr", "Kowalski", "", "413 22 110", "Betongarbeider", "Produksjon", "03.04.2023"],
  ["Sindre", "Ødegård", "sindre.odegard@fjordbygg-test.no", "990 11 223", "Verneombud / tømrer", "Produksjon", "01.09.2016"],
  ["Lise", "Haugen", "lise.haugen@fjordbygg-test.no", "482 33 445", "Systemadministrator", "Administrasjon", "14.02.2022"],
  ["Jonas", "Eriksen", "jonas.eriksen@fjordbygg-test.no", "", "Regnskapsmedarbeider", "Administrasjon", "01.11.2021"],
];

const MESSY_CSV =
  "\uFEFF" +
  "Ansattliste Fjordbygg Test AS - eksportert 08.10.2026\n" +
  "\n" +
  "Avd.;Ansatt navn;Stilling/rolle;Mob.;Epost-adresse;Ansatt fra\n" +
  "Ledelse;Ingrid Solheim;Daglig leder;+47 912 34 567;ingrid.solheim@fjordbygg-test.no;01.03.2015\n" +
  "Produksjon;Ola Nordmann;Tømrer;934 56 789;ola.nordmann@fjordbygg-test.no;15.08.2018\n" +
  "Kvalitet og HMS;Kari Nilsen Berg;HMS-ansvarlig;45 67 89 01;kari.berg@fjordbygg-test.no;02.01.2020\n" +
  "Produksjon;Mohammed Al-Sayed;Lærling tømrer;+47 401 23 456;m.alsayed@fjordbygg-test.no;19.08.2024\n" +
  "Prosjekt;Åse Bjørnstad;Prosjektleder;976 54 321;ase.bjornstad@fjordbygg-test.no;10.05.2017\n" +
  "Produksjon;Piotr Kowalski;Betongarbeider;413 22 110;;03.04.2023\n" +
  "Produksjon;Sindre Ødegård;Verneombud / tømrer;990 11 223;sindre.odegard@fjordbygg-test.no;01.09.2016\n" +
  "Administrasjon;Lise Haugen;Systemadministrator;482 33 445;lise.haugen@fjordbygg-test.no;14.02.2022\n" +
  "Administrasjon;Jonas Eriksen;Regnskapsmedarbeider;;jonas.eriksen@fjordbygg-test.no;01.11.2021\n";

const rowsFromWorkbook = (wb: XLSX.WorkBook) =>
  XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: false });

describe("employeeImport", () => {
  it("parses the clean xlsx and marks only daglig leder as admin", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(CLEAN), "Ansatte");
    const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const rows = parseEmployeeRows(rowsFromWorkbook(XLSX.read(bytes, { type: "array" })));
    expect(rows).toHaveLength(9);
    expect(rows[0]).toMatchObject({ firstName: "Ingrid", lastName: "Solheim", email: "ingrid.solheim@fjordbygg-test.no", admin: true, title: "Daglig leder" });
    expect(rows.filter((r) => r.admin).map((r) => r.firstName)).toEqual(["Ingrid"]);
    expect(rows.find((r) => r.firstName === "Lise")?.admin).toBe(false);
    expect(rows.find((r) => r.firstName === "Piotr")).toMatchObject({ lastName: "Kowalski", email: "" });
  });

  it("parses the messy CSV with title rows, odd headers and a missing e-post", () => {
    const wb = XLSX.read(MESSY_CSV, { type: "string", raw: true });
    const sheet = rowsFromWorkbook(wb);
    expect(findHeaderRow(sheet)?.index).toBe(2);
    const rows = parseEmployeeRows(sheet);
    expect(rows).toHaveLength(9);
    expect(rows.map((r) => `${r.firstName} ${r.lastName}`)).toEqual([
      "Ingrid Solheim", "Ola Nordmann", "Kari Nilsen Berg", "Mohammed Al-Sayed", "Åse Bjørnstad",
      "Piotr Kowalski", "Sindre Ødegård", "Lise Haugen", "Jonas Eriksen",
    ]);
    expect(rows[0]).toMatchObject({ email: "ingrid.solheim@fjordbygg-test.no", admin: true, title: "Daglig leder" });
    expect(rows.filter((r) => r.admin)).toHaveLength(1);

    const validated = validateEmployees(rows, []);
    expect(validated.find((r) => r.firstName === "Piotr")?.status).toBe(MISSING_EMAIL);
    expect(validated.filter((r) => !r.status)).toHaveLength(8);
  });

  it("decodes UTF-8 without BOM and Windows-1252 CSV bytes", () => {
    const text = "Navn;E-post\nSindre Ødegård;s@x.no\n";
    const utf8 = new TextEncoder().encode(text);
    expect(decodeCsvBytes(utf8)).toBe(text);
    const cp1252 = Uint8Array.from([...text].map((ch) => ({ Ø: 0xd8, å: 0xe5 } as Record<string, number>)[ch] ?? ch.charCodeAt(0)));
    expect(decodeCsvBytes(cp1252)).toBe(text);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8]);
    expect(decodeCsvBytes(bom)).toBe(text);
  });

  it("recognises common Norwegian header variants", () => {
    expect(headerField("Ansatt navn")).toBe("fullName");
    expect(headerField("Fornavn/Etternavn")).toBe("fullName");
    expect(headerField("Navn")).toBe("fullName");
    expect(headerField("Epost")).toBe("email");
    expect(headerField("E-postadresse")).toBe("email");
    expect(headerField("Stilling")).toBe("title");
    expect(headerField("Ansatt fra")).toBeNull();
    expect(headerField("Firmanavn")).toBeNull();
  });

  it("handles 'Etternavn, Fornavn' and an explicit Rolle column", () => {
    const rows = parseEmployeeRows([
      ["Navn", "Epost", "Rolle"],
      ["Hansen, Per", "per@x.no", "Admin"],
      ["Olsen, Eva", "eva@x.no", "Systemadministrator"],
    ]);
    expect(rows[0]).toMatchObject({ firstName: "Per", lastName: "Hansen", admin: true });
    expect(rows[1]).toMatchObject({ firstName: "Eva", lastName: "Olsen", admin: false });
  });

  it("only owner/manager titles give the admin hint", () => {
    for (const t of ["Daglig leder", "Daglig leder / eier", "Administrerende direktør", "Adm. dir.", "CEO", "Eier", "Innehaver"]) expect(isLeaderTitle(t)).toBe(true);
    for (const t of ["Systemadministrator", "IT-administrator", "Prosjektleder", "HMS-ansvarlig", "Tømrer", ""]) expect(isLeaderTitle(t)).toBe(false);
  });

  it("flags invalid, existing and duplicate e-posts", () => {
    const v = validateEmployees(
      [
        { firstName: "A", lastName: "", email: "a@x.no", admin: false },
        { firstName: "B", lastName: "", email: "A@x.no", admin: false },
        { firstName: "C", lastName: "", email: "c@", admin: false },
        { firstName: "D", lastName: "", email: "d@x.no", admin: false },
      ],
      ["D@x.no"],
    );
    expect(v.map((r) => r.status)).toEqual([undefined, DUPLICATE_IN_FILE, INVALID_EMAIL, ALREADY_EXISTS]);
  });
});
