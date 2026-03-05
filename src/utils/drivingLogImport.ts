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

export function parseExcelFile(file: File): Promise<ImportedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });

        // Use the first sheet (Kjørebok)
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        const imported: ImportedRow[] = [];

        for (const row of rows) {
          const dateStr = parseDateStr(row["Dato"]);
          if (!dateStr) continue; // skip rows without valid date

          const tripTypeRaw = cleanDash(row["Turtype"]).toLowerCase();
          const vehicleRaw = cleanDash(row["Kjøretøy"]).toLowerCase();

          imported.push({
            trip_date: dateStr,
            purpose: cleanDash(row["Formål"]),
            trip_type: tripTypeLabelToValue[tripTypeRaw] || "business",
            start_location: cleanDash(row["Startsted"]),
            end_location: cleanDash(row["Sluttsted"]),
            via_locations: cleanDash(row["Via (mellomstasjoner)"]),
            odometer_start: parseNum(row["Km.stand start"]),
            odometer_end: parseNum(row["Km.stand slutt"]),
            distance_km: parseNum(row["Kjørt (km)"]),
            vehicle_type: vehicleTypeLabelToValue[vehicleRaw] || "private",
            vehicle_registration: cleanDash(row["Regnr"]),
            passengers: cleanDash(row["Passasjerer"]),
            passenger_count: parseNum(row["Ant. passasjerer"]),
            notes: cleanDash(row["Merknader"]),
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
