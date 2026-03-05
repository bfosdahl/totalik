import * as XLSX from "xlsx";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { DrivingLogEntry } from "@/hooks/useDrivingLog";

const tripTypeLabels: Record<string, string> = {
  business: "Yrkeskjøring",
  commute: "Arbeidsreise",
  private: "Privat",
};

const vehicleTypeLabels: Record<string, string> = {
  company: "Firmabil",
  private: "Privatbil",
};

export function exportDrivingLogToExcel(
  entries: DrivingLogEntry[],
  userName: string,
  year?: number
) {
  const completed = entries
    .filter((e) => e.status === "completed")
    .filter((e) => !year || new Date(e.trip_date).getFullYear() === year)
    .sort(
      (a, b) => new Date(a.trip_date).getTime() - new Date(b.trip_date).getTime()
    );

  // Main data sheet
  const excelData = completed.map((entry) => ({
    Dato: format(new Date(entry.trip_date), "dd.MM.yyyy", { locale: nb }),
    Formål: entry.purpose || "-",
    "Turtype": tripTypeLabels[entry.trip_type] || entry.trip_type,
    Startsted: entry.start_location,
    Sluttsted: entry.end_location || "-",
    "Via (mellomstasjoner)": entry.via_locations || "-",
    "Km.stand start": entry.odometer_start,
    "Km.stand slutt": entry.odometer_end ?? "-",
    "Kjørt (km)": entry.distance_km,
    Kjøretøy: vehicleTypeLabels[entry.vehicle_type] || entry.vehicle_type,
    Regnr: entry.vehicle_registration || "-",
    Passasjerer: entry.passengers || "-",
    "Ant. passasjerer": entry.passenger_count || 0,
    Merknader: entry.notes || "-",
  }));

  // Summary by trip type
  const summaryByType: Record<string, { count: number; km: number }> = {};
  completed.forEach((e) => {
    const label = tripTypeLabels[e.trip_type] || e.trip_type;
    if (!summaryByType[label]) summaryByType[label] = { count: 0, km: 0 };
    summaryByType[label].count++;
    summaryByType[label].km += Number(e.distance_km || 0);
  });

  const summaryData = Object.entries(summaryByType).map(([type, data]) => ({
    Turtype: type,
    "Antall turer": data.count,
    "Totalt km": data.km,
  }));

  // Monthly summary
  const monthlyData: Record<string, { business: number; commute: number; private: number; total: number }> = {};
  completed.forEach((e) => {
    const monthKey = format(new Date(e.trip_date), "yyyy-MM");
    if (!monthlyData[monthKey])
      monthlyData[monthKey] = { business: 0, commute: 0, private: 0, total: 0 };
    const km = Number(e.distance_km || 0);
    monthlyData[monthKey].total += km;
    if (e.trip_type === "business") monthlyData[monthKey].business += km;
    else if (e.trip_type === "commute") monthlyData[monthKey].commute += km;
    else monthlyData[monthKey].private += km;
  });

  const monthlySummary = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      Måned: format(new Date(month + "-01"), "MMMM yyyy", { locale: nb }),
      "Yrkeskjøring (km)": data.business,
      "Arbeidsreise (km)": data.commute,
      "Privat (km)": data.private,
      "Totalt (km)": data.total,
    }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(excelData);
  // Set column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Kjørebok");

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Oppsummering");

  const wsMonthly = XLSX.utils.json_to_sheet(monthlySummary);
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Månedsoversikt");

  const yearStr = year || new Date().getFullYear();
  const filename = `Kjørebok_${userName.replace(/\s+/g, "_")}_${yearStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
