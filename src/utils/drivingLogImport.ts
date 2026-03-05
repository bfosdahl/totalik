import * as XLSX from "xlsx";
import { parse, isValid } from "date-fns";
import { CreateDrivingLogInput } from "@/hooks/useDrivingLog";

export interface ImportedRow {
  trip_date: string;
  purpose: string;
  trip_type: string;
  start_location: string;
  end_location: string;
  via_locations: string;
  odometer_start: number;
  odometer_end: number;
  distance_km: number;
  vehicle_type: string;
  vehicle_registration: string;
  passengers: string;
  passenger_count: number;
  notes: string;
}

const tripTypeLabelToValue: Record<string, string> = {
  yrkeskjøring: "business",
  yrke: "business",
  arbeidsreise: "commute",
  privat: "private",
};

const vehicleTypeLabelToValue: Record<string, string> = {
  firmabil: "company",
  privatbil: "private",
};

function parseDateStr(val: any): string | null {
  if (!val) return null;

  // If it's a JS Date (xlsx can auto-parse dates)
  if (val instanceof Date && isValid(val)) {
    return val.toISOString().split("T")[0];
  }

  const str = String(val).trim();

  // Try dd.MM.yyyy
  const parsed = parse(str, "dd.MM.yyyy", new Date());
  if (isValid(parsed)) return parsed.toISOString().split("T")[0];

  // Try yyyy-MM-dd
  const parsed2 = parse(str, "yyyy-MM-dd", new Date());
  if (isValid(parsed2)) return parsed2.toISOString().split("T")[0];

  return null;
}

function cleanDash(val: any): string {
  const s = String(val ?? "").trim();
  return s === "-" ? "" : s;
}

function parseNum(val: any): number {
  if (typeof val === "number") return val;
  const n = parseFloat(String(val ?? "0").replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
}

function normalizeHeader(header: any): string {
  if (!header) return "";
  return String(header)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Map of normalized aliases to canonical field names
const headerAliases: Record<string, string> = {
  "dato": "date",
  "date": "date",
  "formal": "purpose",
  "formaal": "purpose",
  "purpose": "purpose",
  "turtype": "trip_type",
  "type": "trip_type",
  "type (yrke/privat)": "trip_type",
  "startsted": "start_location",
  "fra": "start_location",
  "from": "start_location",
  "sluttsted": "end_location",
  "til": "end_location",
  "to": "end_location",
  "via (mellomstasjoner)": "via_locations",
  "via": "via_locations",
  "km.stand start": "odometer_start",
  "km start": "odometer_start",
  "kmstand start": "odometer_start",
  "km.stand slutt": "odometer_end",
  "km slutt": "odometer_end",
  "kmstand slutt": "odometer_end",
  "kjort (km)": "distance_km",
  "km kjort": "distance_km",
  "distanse": "distance_km",
  "distance": "distance_km",
  "kjoretoy": "vehicle_type",
  "kjøretøy": "vehicle_type",
  "regnr": "vehicle_registration",
  "reg.nr": "vehicle_registration",
  "registreringsnummer": "vehicle_registration",
  "passasjerer": "passengers",
  "ant. passasjerer": "passenger_count",
  "antall passasjerer": "passenger_count",
  "merknader": "notes",
  "merknad": "notes",
  "notat": "notes",
  "notes": "notes",
};

function buildColumnMap(headers: string[]): Record<string, string> {
  // Maps original header string -> canonical field name
  const map: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    // Try exact match first
    if (headerAliases[normalized]) {
      map[header] = headerAliases[normalized];
      continue;
    }
    // Try partial match
    for (const [alias, canonical] of Object.entries(headerAliases)) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        map[header] = canonical;
        break;
      }
    }
  }
  return map;
}

export function parseExcelFile(file: File): Promise<ImportedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        if (rows.length === 0) {
          resolve([]);
          return;
        }

        // Build column mapping from actual headers
        const headers = Object.keys(rows[0]);
        const colMap = buildColumnMap(headers);

        // Helper to get value by canonical field name
        const getField = (row: any, canonical: string): any => {
          for (const [originalHeader, mappedCanonical] of Object.entries(colMap)) {
            if (mappedCanonical === canonical) {
              return row[originalHeader];
            }
          }
          return undefined;
        };

        const imported: ImportedRow[] = [];

        for (const row of rows) {
          const dateStr = parseDateStr(getField(row, "date"));
          if (!dateStr) continue;

          const tripTypeRaw = cleanDash(getField(row, "trip_type")).toLowerCase();
          const vehicleRaw = cleanDash(getField(row, "vehicle_type")).toLowerCase();

          imported.push({
            trip_date: dateStr,
            purpose: cleanDash(getField(row, "purpose")),
            trip_type: tripTypeLabelToValue[tripTypeRaw] || "business",
            start_location: cleanDash(getField(row, "start_location")),
            end_location: cleanDash(getField(row, "end_location")),
            via_locations: cleanDash(getField(row, "via_locations")),
            odometer_start: parseNum(getField(row, "odometer_start")),
            odometer_end: parseNum(getField(row, "odometer_end")),
            distance_km: parseNum(getField(row, "distance_km")),
            vehicle_type: vehicleTypeLabelToValue[vehicleRaw] || "private",
            vehicle_registration: cleanDash(getField(row, "vehicle_registration")),
            passengers: cleanDash(getField(row, "passengers")),
            passenger_count: parseNum(getField(row, "passenger_count")),
            notes: cleanDash(getField(row, "notes")),
          });
        }

        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Kunne ikke lese filen"));
    reader.readAsArrayBuffer(file);
  });
}

export function importedRowToInput(row: ImportedRow): CreateDrivingLogInput {
  return {
    trip_date: row.trip_date,
    purpose: row.purpose || "Importert tur",
    start_location: row.start_location,
    end_location: row.end_location,
    via_locations: row.via_locations || undefined,
    odometer_start: row.odometer_start,
    odometer_end: row.odometer_end,
    vehicle_type: row.vehicle_type,
    vehicle_registration: row.vehicle_registration || undefined,
    trip_type: row.trip_type,
    passenger_count: row.passenger_count || undefined,
    passengers: row.passengers || undefined,
    notes: row.notes || undefined,
  };
}
