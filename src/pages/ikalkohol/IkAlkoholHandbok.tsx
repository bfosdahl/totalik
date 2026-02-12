import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FileDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Wine,
  Target,
  Users,
  AlertTriangle,
  FileText,
  ClipboardList,
  Scale,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIkAlkoholGoals } from "@/hooks/useIkAlkoholGoals";
import { useIkAlkoholOrganization, ROLE_TYPES } from "@/hooks/useIkAlkoholOrganization";
import { useIkAlkoholRisks, RISK_AREAS, PROBABILITY_LEVELS, CONSEQUENCE_LEVELS } from "@/hooks/useIkAlkoholRisks";
import { useIkAlkoholRoutines, ROUTINE_CATEGORIES } from "@/hooks/useIkAlkoholRoutines";
import { useIkAlkoholControls } from "@/hooks/useIkAlkoholControls";
import { loadImageAsBase64 } from "@/utils/handbookPdfSanitizer";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const handbookSections = [
  { id: "goals", title: "1. Mål", icon: Target, description: "Mål for alkoholhåndtering" },
  { id: "organization", title: "2. Organisering", icon: Users, description: "Roller og ansvar" },
  { id: "risks", title: "3. Risikoanalyse", icon: AlertTriangle, description: "Risikovurdering" },
  { id: "routines", title: "4. Rutiner", icon: FileText, description: "Skriftlige rutiner" },
  { id: "controls", title: "5. Kontroll", icon: ClipboardList, description: "Kontrollrutiner" },
  { id: "regulations", title: "6. Regelverk", icon: Scale, description: "Lover og forskrifter" },
];

export default function IkAlkoholHandbok() {
  const { company } = useAuth();
  const { goals, isLoading: goalsLoading } = useIkAlkoholGoals();
  const { organization, isLoading: orgLoading } = useIkAlkoholOrganization();
  const { risks, isLoading: risksLoading } = useIkAlkoholRisks();
  const { routines, isLoading: routinesLoading } = useIkAlkoholRoutines();
  const { controls, isLoading: controlsLoading } = useIkAlkoholControls();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isLoading = goalsLoading || orgLoading || risksLoading || routinesLoading || controlsLoading;

  const completionStatus = {
    goals: goals.length > 0,
    organization: organization.length > 0,
    risks: risks.length > 0,
    routines: routines.length > 0,
    controls: true, // Always "complete" since control templates are predefined
    regulations: true, // Always complete - static content
  };

  const completedCount = Object.values(completionStatus).filter(Boolean).length;
  const totalSections = Object.keys(completionStatus).length;
  const completionPercent = Math.round((completedCount / totalSections) * 100);

  const getRiskColor = (level: string): [number, number, number] => {
    if (level === "low") return [34, 197, 94];
    if (level === "medium") return [234, 179, 8];
    if (level === "high") return [249, 115, 22];
    return [239, 68, 68];
  };

  const getRiskLabel = (level: string): string => {
    if (level === "low") return "Lav";
    if (level === "medium") return "Middels";
    if (level === "high") return "Høy";
    return "Kritisk";
  };

  const handleDownloadPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      const today = format(new Date(), "d. MMMM yyyy", { locale: nb });

      // Helper: add new page with header
      const addPageHeader = (title: string) => {
        doc.addPage();
        doc.setFillColor(120, 53, 15); // amber-900
        doc.rect(0, 0, pageWidth, 25, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, 17);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        return 35;
      };

      // Helper: check if we need a new page
      const checkPageBreak = (y: number, needed: number = 30): number => {
        if (y + needed > pageHeight - 20) {
          doc.addPage();
          return 20;
        }
        return y;
      };

      // ========== COVER PAGE ==========
      doc.setFillColor(120, 53, 15);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Logo
      let logoBase64: string | null = null;
      if (company?.logo_url) {
        logoBase64 = await loadImageAsBase64(company.logo_url);
      }
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", pageWidth / 2 - 25, 40, 50, 50);
        } catch { /* ignore */ }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      const titleY = logoBase64 ? 115 : 90;
      doc.text("IK-Alkohol", pageWidth / 2, titleY, { align: "center" });
      doc.setFontSize(20);
      doc.text("Handbok", pageWidth / 2, titleY + 12, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      let detailY = titleY + 30;
      const companyName = company?.name || "Bedriftsnavn";
      doc.text(companyName, pageWidth / 2, detailY, { align: "center" });
      detailY += 8;
      if (company?.org_number) {
        doc.text(`Org.nr: ${company.org_number}`, pageWidth / 2, detailY, { align: "center" });
        detailY += 8;
      }
      if (company?.address) {
        doc.text(company.address, pageWidth / 2, detailY, { align: "center" });
        detailY += 8;
      }
      if (company?.postal_code && company?.city) {
        doc.text(`${company.postal_code} ${company.city}`, pageWidth / 2, detailY, { align: "center" });
        detailY += 8;
      }

      doc.setFontSize(10);
      doc.text(`Sist oppdatert: ${today}`, pageWidth / 2, pageHeight - 30, { align: "center" });
      doc.text("Basert på Alkoholloven og Alkoholforskriften", pageWidth / 2, pageHeight - 22, { align: "center" });

      // ========== TABLE OF CONTENTS ==========
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Innholdsfortegnelse", margin, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      let tocY = 45;
      handbookSections.forEach((section) => {
        doc.text(section.title, margin + 5, tocY);
        doc.text(section.description, pageWidth - margin, tocY, { align: "right" });
        tocY += 10;
      });

      // ========== 1. MÅL ==========
      let y = addPageHeader("1. Mål for alkoholhåndtering");
      if (goals.length > 0) {
        goals.forEach((goal) => {
          y = checkPageBreak(y, 20);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`• ${goal.goal_text}`, margin, y);
          y += 6;
          if (goal.description) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(goal.description, contentWidth - 10);
            doc.text(descLines, margin + 5, y);
            y += descLines.length * 5 + 3;
          }
          if (goal.kpi_target) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text(`Målverdi: ${goal.kpi_target}`, margin + 5, y);
            y += 7;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.text("Ingen mål er registrert.", margin, y);
      }

      // ========== 2. ORGANISERING ==========
      y = addPageHeader("2. Organisering og ansvar");
      if (organization.length > 0) {
        const orgTableData = organization.map((role) => {
          const roleType = ROLE_TYPES.find(r => r.value === role.role_type);
          return [
            roleType?.label || role.role_type,
            role.employee_name,
            role.phone || "-",
            role.email || "-",
          ];
        });

        autoTable(doc, {
          startY: y,
          head: [["Rolle", "Navn", "Telefon", "E-post"]],
          body: orgTableData,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [120, 53, 15], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [254, 243, 199] },
        });
      } else {
        doc.setFontSize(10);
        doc.text("Ingen roller er registrert.", margin, y);
      }

      // ========== 3. RISIKOANALYSE ==========
      y = addPageHeader("3. Risikoanalyse");
      if (risks.length > 0) {
        const riskTableData = risks.map((risk) => {
          const area = RISK_AREAS.find(a => a.value === risk.risk_area);
          return [
            area?.label || risk.risk_area,
            risk.risk_description,
            `${risk.probability}`,
            `${risk.consequence}`,
            getRiskLabel(risk.risk_level),
            risk.existing_controls || "-",
          ];
        });

        autoTable(doc, {
          startY: y,
          head: [["Risikoområde", "Beskrivelse", "S", "K", "Nivå", "Eksisterende tiltak"]],
          body: riskTableData,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [120, 53, 15], textColor: [255, 255, 255] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 10, halign: "center" },
            3: { cellWidth: 10, halign: "center" },
            4: { cellWidth: 20, halign: "center" },
          },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 4) {
              const level = risks[data.row.index]?.risk_level;
              if (level) {
                const color = getRiskColor(level);
                data.cell.styles.textColor = color;
                data.cell.styles.fontStyle = "bold";
              }
            }
          },
        });

        // Planned measures
        y = (doc as any).lastAutoTable?.finalY + 10 || y + 50;
        y = checkPageBreak(y, 30);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Planlagte tiltak", margin, y);
        y += 8;

        risks.forEach((risk) => {
          if (risk.planned_measures && risk.planned_measures.length > 0) {
            y = checkPageBreak(y, 15);
            const area = RISK_AREAS.find(a => a.value === risk.risk_area);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`${area?.label || risk.risk_area}:`, margin, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            risk.planned_measures.forEach((measure) => {
              y = checkPageBreak(y, 6);
              doc.text(`  - ${measure}`, margin + 3, y);
              y += 5;
            });
            y += 3;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.text("Ingen risikoanalyse er registrert.", margin, y);
      }

      // ========== 4. RUTINER ==========
      y = addPageHeader("4. Rutiner");
      if (routines.length > 0) {
        const groupedRoutines = routines.reduce((acc, r) => {
          const cat = ROUTINE_CATEGORIES.find(c => c.value === r.category)?.label || r.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(r);
          return acc;
        }, {} as Record<string, typeof routines>);

        Object.entries(groupedRoutines).forEach(([category, categoryRoutines]) => {
          y = checkPageBreak(y, 20);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 53, 15);
          doc.text(category, margin, y);
          doc.setTextColor(0, 0, 0);
          y += 8;

          categoryRoutines.forEach((routine) => {
            y = checkPageBreak(y, 25);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(routine.routine_name, margin + 3, y);
            y += 5;

            if (routine.description) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "italic");
              const descLines = doc.splitTextToSize(routine.description, contentWidth - 10);
              doc.text(descLines, margin + 3, y);
              y += descLines.length * 4 + 2;
            }

            // Render content (strip markdown headers)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const contentClean = routine.content
              .replace(/^#{1,3}\s+/gm, "")
              .replace(/\*\*(.*?)\*\*/g, "$1");
            const contentLines = doc.splitTextToSize(contentClean, contentWidth - 10);
            const maxLines = Math.min(contentLines.length, 20);
            for (let i = 0; i < maxLines; i++) {
              y = checkPageBreak(y, 5);
              doc.text(contentLines[i], margin + 3, y);
              y += 4;
            }
            if (contentLines.length > 20) {
              doc.text("...(se fullstendig rutine i systemet)", margin + 3, y);
              y += 4;
            }
            y += 5;
          });
        });
      } else {
        doc.setFontSize(10);
        doc.text("Ingen rutiner er registrert.", margin, y);
      }

      // ========== 5. KONTROLL ==========
      y = addPageHeader("5. Kontrollrutiner");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Virksomheten gjennomfører følgende kontroller:", margin, y);
      y += 8;

      const controlCategories = [
        { title: "Daglige kontroller", items: ["Alderskontroll", "Beruselseskontroll", "Tidskontroll", "Bemanning", "Orden og sikkerhet", "Avviksregistrering"] },
        { title: "Månedlige kontroller", items: ["Gjennomgang av avvik", "Opplæringsstatus", "Gjennomgang av risikoanalyse", "Beruselsesnivå / skjenkekultur", "Kontroll av bevillingsdokumenter"] },
        { title: "Årlige kontroller", items: ["Årlig intern gjennomgang / revisjon", "Omsetningsoppgave til kommune"] },
      ];

      controlCategories.forEach((cat) => {
        y = checkPageBreak(y, 20);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(cat.title, margin, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        cat.items.forEach((item) => {
          y = checkPageBreak(y, 5);
          doc.text(`  ☐  ${item}`, margin + 3, y);
          y += 5;
        });
        y += 4;
      });

      // Show completed controls count
      const completedControls = controls.filter(c => c.status === "completed");
      if (completedControls.length > 0) {
        y = checkPageBreak(y, 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Gjennomførte kontroller: ${completedControls.length}`, margin, y);
      }

      // ========== 6. REGELVERK ==========
      y = addPageHeader("6. Relevant regelverk");
      const regulations = [
        { name: "Alkoholloven", desc: "Lov om omsetning av alkoholholdig drikk", link: "lovdata.no/lov/1989-06-02-27" },
        { name: "Alkoholforskriften", desc: "Forskrift om omsetning av alkoholholdig drikk", link: "lovdata.no/forskrift/2005-06-08-538" },
        { name: "Serveringsforskriften", desc: "Krav til serveringsbevillingens innhold", link: "" },
        { name: "Prikksystemet", desc: "Kommunalt prikksystem for brudd på alkoholloven", link: "" },
      ];

      regulations.forEach((reg) => {
        y = checkPageBreak(y, 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(reg.name, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(reg.desc, margin + 3, y);
        y += 5;
        if (reg.link) {
          doc.setTextColor(0, 0, 200);
          doc.text(reg.link, margin + 3, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
        y += 3;
      });

      // ========== FOOTER on all pages ==========
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${companyName} - IK-Alkohol Handbok | Side ${i} av ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(today, pageWidth - margin, pageHeight - 10, { align: "right" });
      }

      doc.save(`IK-Alkohol-Handbok_${companyName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [company, goals, organization, risks, routines, controls]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wine className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">{company?.name || "Bedrift"} - IK-Alkohol Handbok</h1>
              <p className="text-amber-200 text-sm">
                Internkontroll for alkoholhåndtering iht. Alkoholloven
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-amber-200">Ferdigstillelse</span>
                <span className="text-sm font-medium">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 bg-amber-700" />
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isLoading}
              className="bg-white text-amber-900 hover:bg-amber-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Last ned PDF
            </Button>
          </div>
        </div>

        {/* Section Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {handbookSections.map((section) => {
            const isComplete = completionStatus[section.id as keyof typeof completionStatus];
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className={`border-l-4 ${isComplete ? "border-l-green-500" : "border-l-amber-400"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isComplete ? "bg-green-100" : "bg-amber-100"}`}>
                      <Icon className={`w-5 h-5 ${isComplete ? "text-green-600" : "text-amber-600"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{section.title}</h3>
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Content Previews */}
        <div className="space-y-4">
          {/* Goals Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  1. Mål
                </CardTitle>
                <Badge variant={goals.length > 0 ? "default" : "secondary"}>
                  {goals.length} mål
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <ul className="space-y-2">
                  {goals.slice(0, 5).map((goal) => (
                    <li key={goal.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{goal.goal_text}</span>
                    </li>
                  ))}
                  {goals.length > 5 && (
                    <li className="text-sm text-muted-foreground">+{goals.length - 5} flere mål</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen mål registrert. Gå til Mål-siden for å legge til.</p>
              )}
            </CardContent>
          </Card>

          {/* Organization Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  2. Organisering
                </CardTitle>
                <Badge variant={organization.length > 0 ? "default" : "secondary"}>
                  {organization.length} roller
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {organization.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {organization.map((role) => {
                    const roleType = ROLE_TYPES.find(r => r.value === role.role_type);
                    return (
                      <div key={role.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                        <span className="font-medium">{roleType?.label || role.role_type}:</span>
                        <span>{role.employee_name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen roller registrert.</p>
              )}
            </CardContent>
          </Card>

          {/* Risks Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  3. Risikoanalyse
                </CardTitle>
                <Badge variant={risks.length > 0 ? "default" : "secondary"}>
                  {risks.length} risikoer
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {risks.length > 0 ? (
                <div className="space-y-2">
                  {risks.slice(0, 4).map((risk) => {
                    const area = RISK_AREAS.find(a => a.value === risk.risk_area);
                    return (
                      <div key={risk.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <span>{area?.label || risk.risk_area}: {risk.risk_description}</span>
                        <Badge variant="outline" className={
                          risk.risk_level === "critical" ? "text-red-600 border-red-300" :
                          risk.risk_level === "high" ? "text-orange-600 border-orange-300" :
                          risk.risk_level === "medium" ? "text-yellow-600 border-yellow-300" :
                          "text-green-600 border-green-300"
                        }>
                          {getRiskLabel(risk.risk_level)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen risikoanalyse registrert.</p>
              )}
            </CardContent>
          </Card>

          {/* Routines Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  4. Rutiner
                </CardTitle>
                <Badge variant={routines.length > 0 ? "default" : "secondary"}>
                  {routines.length} rutiner
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {routines.length > 0 ? (
                <div className="space-y-1">
                  {routines.slice(0, 6).map((routine) => (
                    <div key={routine.id} className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span>{routine.routine_name}</span>
                      {routine.is_mandatory && <Badge variant="outline" className="text-xs">Påkrevd</Badge>}
                    </div>
                  ))}
                  {routines.length > 6 && (
                    <p className="text-sm text-muted-foreground">+{routines.length - 6} flere rutiner</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen rutiner registrert.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
