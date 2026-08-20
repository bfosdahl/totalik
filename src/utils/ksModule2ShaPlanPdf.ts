import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { ShaPlan, ShaTilpasning } from "@/hooks/useKsModule2ShaPlan";

function fmtDate(value?: string | null): string {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd.MM.yyyy", { locale: nb });
  } catch {
    return "-";
  }
}

async function fetchContext(shaPlan: ShaPlan) {
  const [{ data: project }, { data: company }] = await Promise.all([
    supabase
      .from("ks_module2_projects")
      .select("project_number, project_name, address, client_name")
      .eq("id", shaPlan.project_id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("name, org_number, address, postal_code, city, phone, email")
      .eq("id", shaPlan.company_id)
      .maybeSingle(),
  ]);
  return { project, company };
}

/**
 * Builds the SHA-plan PDF document for internally created plans.
 */
export async function buildShaPlanPdf(
  shaPlan: ShaPlan,
  tilpasning: ShaTilpasning | null
): Promise<{ doc: jsPDF; fileName: string }> {
  const { project, company } = await fetchContext(shaPlan);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SHA-PLAN", 15, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Byggherreforskriften §8", 15, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(company?.name || "", pageWidth - 15, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (company?.org_number) doc.text(`Org.nr: ${company.org_number}`, pageWidth - 15, 19, { align: "right" });
  doc.text(`Generert: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: nb })}`, pageWidth - 15, 25, {
    align: "right",
  });
  doc.setTextColor(0, 0, 0);

  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `${project?.project_number ? project.project_number + " – " : ""}${shaPlan.project_name || project?.project_name || ""}`,
    15,
    y
  );
  y += 4;

  // Project info
  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: 30 },
    head: [["Prosjektinformasjon", ""]],
    body: [
      ["Prosjekt", shaPlan.project_name || project?.project_name || "-"],
      ["Adresse", shaPlan.project_address || project?.address || "-"],
      ["Byggherre", shaPlan.client_name || project?.client_name || "-"],
      ["Org.nr byggherre", shaPlan.client_org_number || "-"],
      ["Kontaktperson", shaPlan.client_contact_person || "-"],
      ["Koordinator prosjektering (KP)", shaPlan.sha_coordinator_kp || "-"],
      ["Koordinator utførelse (KU)", shaPlan.sha_coordinator_ku || "-"],
      ["Planlagt oppstart", fmtDate(shaPlan.planned_start_date)],
      ["Planlagt ferdigstillelse", fmtDate(shaPlan.planned_end_date)],
      ["Status", shaPlan.status],
      ["Versjon", String(shaPlan.version_number)],
    ],
    columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
  });

  // Orientering om prosjektet
  if (shaPlan.project_description) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [241, 245, 249], textColor: 30 },
      head: [["Orientering om prosjektet"]],
      body: [[shaPlan.project_description]],
    });
  }

  // Risk areas
  const risks = (shaPlan.risk_areas || []).filter((r) => r.checked);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    head: [["§8 c", "Risikoområde", "Tiltak"]],
    body:
      risks.length > 0
        ? risks.map((r) => [r.paragraph, r.description, r.measures || "-"])
        : [["-", "Ingen risikoområder er avkrysset", "-"]],
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 78 } },
  });

  // Organization
  const org: any = shaPlan.organization_data || {};
  const orgRows: string[][] = [];
  if (org.contract_form) orgRows.push(["Entrepriseform", org.contract_form, ""]);
  if (Array.isArray(org.roles) && org.roles.length > 0) {
    org.roles
      .filter((r: any) => r?.name || r?.company)
      .forEach((r: any) => orgRows.push([r.label || r.role || "-", r.name || "-", r.company || ""]));
  } else {
    if (org.client?.name) orgRows.push(["Byggherre", org.client.name, org.client.role || ""]);
    if (org.kp?.name) orgRows.push(["KP", org.kp.name, org.kp.role || ""]);
    if (org.ku?.name) orgRows.push(["KU", org.ku.name, org.ku.role || ""]);
    if (org.projectLeader?.name)
      orgRows.push(["Prosjektleder", org.projectLeader.name, org.projectLeader.role || ""]);
  }
  (org.subcontractors || []).forEach((s: any) => orgRows.push(["Underleverandør", s.name, s.trade || ""]));

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: 30 },
    head: [["Rolle", "Navn", "Firma / funksjon"]],
    body: orgRows.length > 0 ? orgRows : [["-", "Ingen organisasjon registrert", "-"]],
  });

  // Change routine
  if (shaPlan.change_routine_text) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [241, 245, 249], textColor: 30 },
      head: [["Rutine for endringer i SHA-planen"]],
      body: [[shaPlan.change_routine_text]],
    });
  }

  // Vår tilpasning
  if (tilpasning) {
    const measures = tilpasning.additional_measures || [];
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [241, 245, 249], textColor: 30 },
      head: [["Vår tilpasning", ""]],
      body: [
        ["Gjennomføring", tilpasning.implementation_description || "-"],
        ["Status", tilpasning.status === "signed" ? "Signert" : "Utkast"],
        [
          "Signert av",
          tilpasning.project_leader_signed_by
            ? `${tilpasning.project_leader_signed_by} (${fmtDate(tilpasning.project_leader_signed_at)})`
            : "-",
        ],
        ...measures.map((m) => [
          "Tiltak",
          `${m.description} — ansvarlig: ${m.responsible || "-"}, frist: ${fmtDate(m.deadline)}`,
        ]),
      ],
      columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } },
    });
  }

  // Signatures
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: 30 },
    head: [["Signaturer", "Navn", "Dato"]],
    body: [
      ["Byggherre", shaPlan.client_signed_by || "-", fmtDate(shaPlan.client_signed_at)],
      ["KP", shaPlan.kp_signed_by || "-", fmtDate(shaPlan.kp_signed_at)],
      ["KU", shaPlan.ku_signed_by || "-", fmtDate(shaPlan.ku_signed_at)],
    ],
  });

  // Signature images
  const signatures: Array<{ label: string; data: string | null }> = [
    { label: "Byggherre", data: shaPlan.client_signature },
    { label: "KP", data: shaPlan.kp_signature },
    { label: "KU", data: shaPlan.ku_signature },
  ].filter((s) => !!s.data);

  if (signatures.length > 0) {
    let sy = (doc as any).lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (sy + 40 > pageHeight - 20) {
      doc.addPage();
      sy = 20;
    }
    let sx = 15;
    signatures.forEach((s) => {
      try {
        doc.addImage(s.data as string, "PNG", sx, sy, 55, 22);
      } catch {
        /* ignore malformed signature data */
      }
      doc.setDrawColor(200);
      doc.line(sx, sy + 24, sx + 55, sy + 24);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(s.label, sx, sy + 28);
      doc.setTextColor(0);
      sx += 62;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `SHA-plan | ${project?.project_number || ""} ${project?.project_name || shaPlan.project_name || ""}`,
      10,
      pageHeight - 10
    );
    doc.text(`Side ${i} av ${pageCount}`, pageWidth - 10, pageHeight - 10, { align: "right" });
  }

  const fileName = `SHA-plan_${(project?.project_number || "prosjekt").replace(/\s+/g, "_")}_v${shaPlan.version_number}.pdf`;
  return { doc, fileName };
}

/** Opens the SHA-plan PDF in a new tab (preview). */
export async function previewShaPlanPdf(shaPlan: ShaPlan, tilpasning: ShaTilpasning | null) {
  if (shaPlan.plan_type === "external") {
    const url = await getExternalUrl(shaPlan);
    if (!url) throw new Error("Fant ikke opplastet SHA-plan");
    window.open(url, "_blank", "noopener");
    return;
  }
  const { doc } = await buildShaPlanPdf(shaPlan, tilpasning);
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl as unknown as string, "_blank", "noopener");
}

/** Downloads the SHA-plan PDF. */
export async function downloadShaPlanPdf(shaPlan: ShaPlan, tilpasning: ShaTilpasning | null) {
  if (shaPlan.plan_type === "external") {
    const url = await getExternalUrl(shaPlan);
    if (!url) throw new Error("Fant ikke opplastet SHA-plan");
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = shaPlan.external_file_name || "SHA-plan.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }
  const { doc, fileName } = await buildShaPlanPdf(shaPlan, tilpasning);
  doc.save(fileName);
}

async function getExternalUrl(shaPlan: ShaPlan): Promise<string | null> {
  if (!shaPlan.external_file_path) return null;
  const { data } = await supabase.storage
    .from("sha-documents")
    .createSignedUrl(shaPlan.external_file_path, 3600);
  return data?.signedUrl || null;
}
