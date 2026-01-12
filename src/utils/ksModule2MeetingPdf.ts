import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Meeting, MeetingItem, MeetingParticipant } from "@/hooks/useKsModule2Meetings";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface MeetingPdfData {
  meeting: Meeting;
  items: MeetingItem[];
  projectName: string;
  projectNumber: string;
  companyName?: string;
}

export async function generateMeetingPdf(data: MeetingPdfData): Promise<Blob> {
  const { meeting, items, projectName, projectNumber, companyName } = data;
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Møtereferat ${meeting.meeting_number}`, 14, yPos);
  doc.text(`Prosjekt: ${projectName} (${projectNumber})`, 14, yPos + 5);
  if (companyName) {
    doc.text(companyName, doc.internal.pageSize.width - 14, yPos, { align: "right" });
  }
  
  yPos += 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(meeting.title, 14, yPos);
  yPos += 10;

  // Meeting info
  doc.setFontSize(11);
  doc.setTextColor(60);
  
  const infoLines = [
    `Møtetype: ${meeting.meeting_type}`,
    `Dato: ${format(new Date(meeting.meeting_date), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}`,
    meeting.location ? `Sted: ${meeting.location}` : null,
  ].filter(Boolean) as string[];

  infoLines.forEach(line => {
    doc.text(line, 14, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Participants
  if (meeting.participants && meeting.participants.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Deltakere", 14, yPos);
    yPos += 6;

    const participantRows = meeting.participants.map((p: MeetingParticipant) => [
      p.name,
      p.role || "",
      p.company || "",
      p.email || "",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Navn", "Rolle", "Firma", "E-post"]],
      body: participantRows,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Agenda
  if (meeting.agenda) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Agenda", 14, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const agendaLines = doc.splitTextToSize(meeting.agenda, 180);
    doc.text(agendaLines, 14, yPos);
    yPos += agendaLines.length * 5 + 10;
  }

  // Meeting items/topics
  if (items.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Saker", 14, yPos);
    yPos += 6;

    const itemRows = items.map(item => [
      item.item_number.toString(),
      item.topic,
      item.decision || "",
      item.responsible_name || "",
      item.deadline ? format(new Date(item.deadline), "dd.MM.yyyy") : "",
      item.status === "completed" ? "Fullført" : item.status === "in_progress" ? "Pågår" : "Åpen",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Sak", "Beslutning", "Ansvarlig", "Frist", "Status"]],
      body: itemRows,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notes
  if (meeting.notes) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Notater", 14, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const notesLines = doc.splitTextToSize(meeting.notes, 180);
    doc.text(notesLines, 14, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generert: ${format(new Date(), "dd.MM.yyyy HH:mm")} | Side ${i} av ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc.output("blob");
}
