import * as XLSX from "xlsx";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface TimeEntry {
  id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  description: string | null;
  status: string;
  approved_by_name: string | null;
  approved_at: string | null;
}

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  submitted: "Innsendt",
  approved: "Godkjent",
  rejected: "Avvist",
};

export function exportTimeEntriesToExcel(
  entries: TimeEntry[],
  companyName: string,
  startDate?: Date,
  endDate?: Date
) {
  // Filter entries by date range if provided
  let filteredEntries = entries;
  if (startDate) {
    filteredEntries = filteredEntries.filter(
      (e) => new Date(e.entry_date) >= startDate
    );
  }
  if (endDate) {
    filteredEntries = filteredEntries.filter(
      (e) => new Date(e.entry_date) <= endDate
    );
  }

  // Sort by date
  filteredEntries.sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  // Transform data for Excel
  const excelData = filteredEntries.map((entry) => ({
    Dato: format(new Date(entry.entry_date), "dd.MM.yyyy", { locale: nb }),
    Ansatt: entry.user_name,
    Timer: entry.hours,
    Prosjekt: entry.project_name || "-",
    Beskrivelse: entry.description || "-",
    Status: statusLabels[entry.status] || entry.status,
    "Godkjent av": entry.approved_by_name || "-",
    "Godkjent dato": entry.approved_at
      ? format(new Date(entry.approved_at), "dd.MM.yyyy HH:mm", { locale: nb })
      : "-",
  }));

  // Create summary by employee
  const summaryByEmployee: Record<string, number> = {};
  filteredEntries.forEach((entry) => {
    summaryByEmployee[entry.user_name] =
      (summaryByEmployee[entry.user_name] || 0) + Number(entry.hours);
  });

  const summaryData = Object.entries(summaryByEmployee).map(([name, hours]) => ({
    Ansatt: name,
    "Totalt timer": hours,
  }));

  // Create summary by project
  const summaryByProject: Record<string, number> = {};
  filteredEntries.forEach((entry) => {
    const projectName = entry.project_name || "Uten prosjekt";
    summaryByProject[projectName] =
      (summaryByProject[projectName] || 0) + Number(entry.hours);
  });

  const projectSummaryData = Object.entries(summaryByProject).map(
    ([project, hours]) => ({
      Prosjekt: project,
      "Totalt timer": hours,
    })
  );

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add main data sheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb, ws, "Timeregistreringer");

  // Add employee summary sheet
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Oppsummering ansatte");

  // Add project summary sheet
  const wsProjectSummary = XLSX.utils.json_to_sheet(projectSummaryData);
  XLSX.utils.book_append_sheet(wb, wsProjectSummary, "Oppsummering prosjekter");

  // Generate filename
  const dateRange =
    startDate && endDate
      ? `_${format(startDate, "yyyy-MM-dd")}_til_${format(endDate, "yyyy-MM-dd")}`
      : `_${format(new Date(), "yyyy-MM-dd")}`;

  const filename = `Timeregistrering_${companyName.replace(/\s+/g, "_")}${dateRange}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
}
