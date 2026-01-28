import jsPDF from "jspdf";
import { EmploymentContract } from "@/hooks/useEmploymentContracts";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const contractTypeLabels: Record<string, string> = {
  permanent: 'Fast ansettelse',
  temporary: 'Midlertidig ansettelse',
  project: 'Prosjektansettelse',
  probation: 'Prøvetidsavtale',
  apprentice: 'Lærlingkontrakt',
  internship: 'Praksisplass',
};

const workTimeArrangementLabels: Record<string, string> = {
  normal: 'Normal arbeidstid',
  shift: 'Skiftarbeid',
  flexible: 'Fleksitid',
  average_calculated: 'Gjennomsnittsberegnet',
  reduced: 'Redusert arbeidstid',
  exempt_manager: 'Ledende stilling (unntatt)',
  exempt_independent: 'Særlig uavhengig stilling (unntatt)',
};

const salaryTypeLabels: Record<string, string> = {
  monthly: 'Månedslønn',
  hourly: 'Timelønn',
  annual: 'Årslønn',
};

interface CompanyInfo {
  name: string;
  org_number?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

export function generateContractPdf(contract: EmploymentContract, company: CompanyInfo): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const employeeName = contract.employee 
    ? `${contract.employee.first_name || ''} ${contract.employee.last_name || ''}`.trim()
    : 'Ukjent';

  // Helper functions
  const addTitle = (text: string) => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(text, pageWidth / 2, y, { align: "center" });
    y += 12;
  };

  const addSectionHeader = (text: string) => {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, contentWidth, 8, "F");
    doc.text(text, margin + 2, y);
    y += 10;
  };

  const addField = (label: string, value: string | number | null | undefined) => {
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    const valueStr = value?.toString() || '-';
    const lines = doc.splitTextToSize(valueStr, contentWidth - 50);
    doc.text(lines, margin + 50, y);
    y += Math.max(6, lines.length * 5);
  };

  const addParagraph = (label: string, text: string | null | undefined) => {
    if (!text) return;
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  addTitle("ARBEIDSAVTALE");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("I henhold til arbeidsmiljøloven § 14-6", pageWidth / 2, y, { align: "center" });
  y += 15;

  // Section 1: Parties
  addSectionHeader("1. Avtalens parter");
  addField("Arbeidsgiver", company.name);
  if (company.org_number) addField("Org.nr", company.org_number);
  if (company.address) {
    const address = [company.address, company.postal_code, company.city].filter(Boolean).join(', ');
    addField("Adresse", address);
  }
  y += 3;
  addField("Arbeidstaker", employeeName);
  if (contract.employee?.email) addField("E-post", contract.employee.email);
  y += 5;

  // Section 2: Position and description
  addSectionHeader("2. Stilling og arbeidsbeskrivelse");
  addField("Stilling", contract.position);
  addField("Avtale type", contractTypeLabels[contract.contract_type] || contract.contract_type);
  addField("Stillingsprosent", `${contract.employment_percentage}%`);
  addParagraph("Arbeidsbeskrivelse", contract.work_description);
  y += 5;

  // Section 3: Workplace
  addSectionHeader("3. Arbeidssted");
  addField("Arbeidssted", contract.workplace_address);
  if (contract.has_multiple_workplaces) {
    addField("Flere arbeidssteder", "Ja - arbeidstaker arbeider på forskjellige steder");
  }
  if (contract.remote_work_allowed) {
    addField("Hjemmekontor", "Tillatt");
    addParagraph("Detaljer fjernarbeid", contract.remote_work_details);
  }
  y += 5;

  // Section 4: Dates and duration
  addSectionHeader("4. Tiltredelse og varighet");
  addField("Startdato", format(new Date(contract.start_date), 'd. MMMM yyyy', { locale: nb }));
  if (contract.end_date) {
    addField("Sluttdato", format(new Date(contract.end_date), 'd. MMMM yyyy', { locale: nb }));
  }
  if (contract.temporary_reason) {
    addField("Grunnlag midlertidig", contract.temporary_reason);
  }
  if (contract.probation_period_months) {
    addField("Prøvetid", `${contract.probation_period_months} måneder`);
  }
  y += 5;

  // Section 5: Working hours
  addSectionHeader("5. Arbeidstid");
  addField("Arbeidstidsordning", workTimeArrangementLabels[contract.work_time_arrangement || 'normal'] || contract.work_time_arrangement);
  addField("Timer per uke", contract.working_hours_per_week);
  if (contract.working_hours_per_day) {
    addField("Timer per dag", contract.working_hours_per_day);
  }
  addField("Pauselengde", `${contract.break_duration_minutes} minutter`);
  if (contract.variable_working_hours) {
    addField("Varierende arbeidstid", "Ja");
    addParagraph("Beskrivelse", contract.variable_hours_description);
    addParagraph("Regler for vaktendringer", contract.shift_change_rules);
  }
  if (contract.special_work_time_exemptions) {
    addParagraph("Unntak arbeidstid", contract.special_work_time_details);
  }
  y += 5;

  // Section 6: Vacation
  addSectionHeader("6. Ferie og feriepenger");
  addField("Feriedager", `${contract.vacation_days} virkedager`);
  addField("Feriepenger", `${contract.holiday_pay_percentage}%`);
  addParagraph("Ferieregler", contract.vacation_rules);
  y += 5;

  // Section 7: Salary
  addSectionHeader("7. Lønn og godtgjørelse");
  if (contract.salary_amount) {
    const salaryLabel = salaryTypeLabels[contract.salary_type] || contract.salary_type;
    addField(salaryLabel, `${contract.salary_amount.toLocaleString('nb-NO')} NOK`);
  }
  addField("Utbetalingsmåte", contract.payment_method === 'bank_transfer' ? 'Bankoverføring' : contract.payment_method);
  addField("Lønningsdag", `${contract.payment_day}. hver måned`);
  addParagraph("Overtidsgodtgjørelse", contract.overtime_compensation);
  addParagraph("Andre tillegg", contract.other_allowances);
  y += 5;

  // Section 8: Notice period
  addSectionHeader("8. Oppsigelse");
  addField("Arbeidstakers oppsigelsestid", `${contract.notice_period_employee_months} måned(er)`);
  addField("Arbeidsgivers oppsigelsestid", `${contract.notice_period_employer_months} måned(er)`);
  addParagraph("Oppsigelsesprosedyrer", contract.termination_procedures || "Oppsigelse skal skje i henhold til arbeidsmiljøloven § 15-4");
  y += 5;

  // Section 9: Staffing agency (if applicable)
  if (contract.is_staffing_agency) {
    addSectionHeader("9. Bemanningsforetak / Innleie");
    addField("Bemanningsforetak", "Ja");
    if (contract.client_company_name) {
      addField("Innleier", contract.client_company_name);
    }
    if (contract.client_company_org_number) {
      addField("Innleiers org.nr", contract.client_company_org_number);
    }
    y += 5;
  }

  // Section 10: Benefits
  addSectionHeader(contract.is_staffing_agency ? "10. Opplæring og sosiale ytelser" : "9. Opplæring og sosiale ytelser");
  addParagraph("Kompetanseutvikling", contract.training_provisions);
  addParagraph("Pensjonsordning", contract.pension_scheme);
  addParagraph("Forsikringer", contract.insurance_provisions);
  addParagraph("Sykelønn", contract.sick_pay_rules);
  y += 5;

  // Section 11: Collective agreement
  if (contract.has_collective_agreement) {
    addSectionHeader(contract.is_staffing_agency ? "11. Tariffavtale" : "10. Tariffavtale");
    addField("Tariffavtale", contract.collective_agreement_name);
    if (contract.collective_agreement_parties) {
      addField("Tariffparter", contract.collective_agreement_parties);
    }
    y += 5;
  }

  // Notes
  if (contract.notes) {
    addSectionHeader("Tilleggsopplysninger");
    addParagraph("Notater", contract.notes);
    y += 5;
  }

  // Signatures
  checkPageBreak(80);
  y += 10;
  addSectionHeader("Signaturer");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Signature date
  if (contract.signed_date) {
    doc.text(`Dato: ${format(new Date(contract.signed_date), 'd. MMMM yyyy', { locale: nb })}`, margin, y);
    y += 10;
  }

  // Two columns for signatures
  const colWidth = (contentWidth - 20) / 2;
  
  // Employer signature
  doc.setFont("helvetica", "bold");
  doc.text("Arbeidsgiver:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 8;
  
  if (contract.employer_signature) {
    try {
      doc.addImage(contract.employer_signature, 'PNG', margin, y, 60, 25);
    } catch {
      doc.text("[Signert elektronisk]", margin, y + 10);
    }
  } else {
    doc.line(margin, y + 20, margin + colWidth - 10, y + 20);
  }
  
  // Employee signature (same row, right side)
  const rightCol = margin + colWidth + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Arbeidstaker:", rightCol, y - 8);
  doc.setFont("helvetica", "normal");
  
  if (contract.employee_signature) {
    try {
      doc.addImage(contract.employee_signature, 'PNG', rightCol, y, 60, 25);
    } catch {
      doc.text("[Signert elektronisk]", rightCol, y + 10);
    }
  } else {
    doc.line(rightCol, y + 20, rightCol + colWidth - 10, y + 20);
  }

  y += 30;
  doc.setFontSize(8);
  doc.text(company.name, margin, y);
  doc.text(employeeName, rightCol, y);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Side ${i} av ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      `Generert: ${format(new Date(), 'd. MMM yyyy', { locale: nb })}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Download
  const filename = `arbeidsavtale-${employeeName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(contract.start_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
