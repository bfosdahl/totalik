import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Eye, 
  Target, 
  Building2, 
  AlertTriangle, 
  ListChecks,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LogoUpload } from "./LogoUpload";

interface GoalData {
  id: string;
  goal_text: string;
  is_predefined: boolean;
}

interface OrganizationData {
  custom_content: string;
  template_id: string | null;
  is_custom: boolean;
}

interface RiskItem {
  id: string;
  category: string;
  description: string;
  probability: number;
  consequence: number;
  risk_value: number;
  measures: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
}

interface RiskAssessmentData {
  risks: RiskItem[];
}

interface RoutineItem {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

interface RoutinesData {
  routines: RoutineItem[];
}

interface CompanyInfo {
  id: string;
  name: string;
  org_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  logo_url?: string | null;
}

interface HandbookStepProps {
  goals: GoalData[];
  organization: OrganizationData | null;
  riskAssessment: RiskAssessmentData | null;
  routines: RoutinesData | null;
  companyInfo: CompanyInfo | null;
}

export function HandbookStep({ 
  goals, 
  organization, 
  riskAssessment, 
  routines,
  companyInfo
}: HandbookStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(companyInfo?.logo_url || null);

  useEffect(() => {
    setLogoUrl(companyInfo?.logo_url || null);
  }, [companyInfo?.logo_url]);

  const completionStatus = {
    goals: goals.length > 0,
    organization: organization && organization.custom_content.trim() !== "",
    riskAssessment: riskAssessment && riskAssessment.risks.length > 0,
    routines: routines && routines.routines.length > 0,
  };

  const allComplete = Object.values(completionStatus).every(Boolean);

  const getRiskLevelText = (value: number): string => {
    if (value <= 4) return "Lav";
    if (value <= 9) return "Moderat";
    if (value <= 15) return "Høy";
    return "Kritisk";
  };

  const getRiskLevelColor = (value: number): [number, number, number] => {
    if (value <= 4) return [34, 197, 94]; // green
    if (value <= 9) return [234, 179, 8]; // yellow
    if (value <= 15) return [249, 115, 22]; // orange
    return [239, 68, 68]; // red
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Helper function to load image as base64
  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const generatePDF = async (preview: boolean = false) => {
    if (preview) {
      setIsPreviewing(true);
    } else {
      setIsGenerating(true);
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Load logo if available
      let logoBase64: string | null = null;
      if (logoUrl) {
        logoBase64 = await loadImageAsBase64(logoUrl);
      }

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper function to add section header
      const addSectionHeader = (title: string) => {
        checkPageBreak(20);
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, yPos, contentWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 5, yPos + 7);
        doc.setTextColor(0, 0, 0);
        yPos += 15;
      };

      // ============= COVER PAGE =============
      // Background header
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 80, "F");

      // Add logo to cover page if available
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", pageWidth / 2 - 15, 85, 30, 30);
        } catch (e) {
          console.warn("Could not add logo to PDF:", e);
        }
      }

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("INTERNKONTROLL", pageWidth / 2, 35, { align: "center" });
      doc.setFontSize(20);
      doc.text("HMS-HÅNDBOK", pageWidth / 2, 50, { align: "center" });

      // Company name - adjust position based on logo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const companyName = companyInfo?.name || "Bedriftsnavn";
      const nameY = logoBase64 ? 130 : 110;
      doc.text(companyName, pageWidth / 2, nameY, { align: "center" });

      // Company details
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let detailsY = logoBase64 ? 145 : 125;
      
      if (companyInfo?.org_number) {
        doc.text(`Org.nr: ${companyInfo.org_number}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (companyInfo?.address) {
        doc.text(companyInfo.address, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (companyInfo?.postal_code && companyInfo?.city) {
        doc.text(`${companyInfo.postal_code} ${companyInfo.city}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (companyInfo?.phone) {
        doc.text(`Tlf: ${companyInfo.phone}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (companyInfo?.email) {
        doc.text(`E-post: ${companyInfo.email}`, pageWidth / 2, detailsY, { align: "center" });
      }

      // Date
      doc.setFontSize(12);
      doc.text(`Dato: ${formatDate(new Date())}`, pageWidth / 2, pageHeight - 40, { align: "center" });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Utarbeidet i henhold til forskrift om systematisk helse-, miljø- og sikkerhetsarbeid", 
        pageWidth / 2, pageHeight - 25, { align: "center" });

      // ============= TABLE OF CONTENTS =============
      doc.addPage();
      yPos = margin;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Innholdsfortegnelse", margin, yPos);
      yPos += 15;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const tocItems = [
        { title: "1. Mål for internkontroll", page: 3 },
        { title: "2. Organisering og ansvar", page: 4 },
        { title: "3. Risikovurdering", page: 5 },
        { title: "4. Rutiner og prosedyrer", page: 6 },
      ];

      tocItems.forEach(item => {
        doc.text(item.title, margin, yPos);
        doc.text(item.page.toString(), pageWidth - margin, yPos, { align: "right" });
        yPos += 8;
      });

      // ============= SECTION 1: GOALS =============
      doc.addPage();
      yPos = margin;

      addSectionHeader("1. Mål for internkontroll");

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const goalsIntro = "Bedriften har fastsatt følgende mål for sitt systematiske HMS-arbeid:";
      doc.text(goalsIntro, margin, yPos);
      yPos += 10;

      if (goals.length > 0) {
        goals.forEach((goal, index) => {
          checkPageBreak(15);
          doc.setFillColor(240, 249, 255);
          const lines = doc.splitTextToSize(goal.goal_text, contentWidth - 15);
          const boxHeight = lines.length * 6 + 6;
          doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, "F");
          
          doc.setFontSize(11);
          doc.text(`${index + 1}.`, margin + 5, yPos + 6);
          doc.text(lines, margin + 12, yPos + 6);
          yPos += boxHeight + 5;
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen mål er definert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }

      // ============= SECTION 2: ORGANIZATION =============
      doc.addPage();
      yPos = margin;

      addSectionHeader("2. Organisering og ansvar");

      if (organization && organization.custom_content) {
        const orgLines = doc.splitTextToSize(organization.custom_content, contentWidth);
        orgLines.forEach((line: string) => {
          checkPageBreak(8);
          doc.setFontSize(11);
          doc.text(line, margin, yPos);
          yPos += 6;
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Organisasjonsstruktur er ikke definert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // ============= SECTION 3: RISK ASSESSMENT =============
      doc.addPage();
      yPos = margin;

      addSectionHeader("3. Risikovurdering");

      doc.setFontSize(11);
      doc.text("Risiko = Sannsynlighet × Konsekvens (Arbeidstilsynets metodikk)", margin, yPos);
      yPos += 10;

      if (riskAssessment && riskAssessment.risks.length > 0) {
        const riskTableData = riskAssessment.risks.map(risk => [
          risk.category,
          risk.description.substring(0, 50) + (risk.description.length > 50 ? "..." : ""),
          risk.probability.toString(),
          risk.consequence.toString(),
          risk.risk_value.toString(),
          getRiskLevelText(risk.risk_value)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Kategori", "Beskrivelse", "S", "K", "R", "Nivå"]],
          body: riskTableData,
          theme: "striped",
          headStyles: { 
            fillColor: [59, 130, 246],
            fontSize: 9,
            fontStyle: "bold"
          },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 60 },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 15, halign: "center" },
            5: { cellWidth: 25, halign: "center" }
          },
          margin: { left: margin, right: margin },
          didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === 5) {
              const riskValue = parseInt(riskTableData[data.row.index][4]);
              const color = getRiskLevelColor(riskValue);
              doc.setTextColor(color[0], color[1], color[2]);
            }
          },
          willDrawCell: (data) => {
            doc.setTextColor(0, 0, 0);
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Legend
        checkPageBreak(30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Forklaring:", margin, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.text("S = Sannsynlighet (1-5), K = Konsekvens (1-5), R = Risikoverdi", margin, yPos);
        yPos += 6;
        
        const legendItems = [
          { level: "Lav (1-4)", color: [34, 197, 94] },
          { level: "Moderat (5-9)", color: [234, 179, 8] },
          { level: "Høy (10-15)", color: [249, 115, 22] },
          { level: "Kritisk (16-25)", color: [239, 68, 68] }
        ];
        
        let legendX = margin;
        legendItems.forEach(item => {
          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          doc.rect(legendX, yPos - 3, 4, 4, "F");
          doc.text(item.level, legendX + 6, yPos);
          legendX += 40;
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen risikovurderinger er registrert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // ============= SECTION 4: ROUTINES =============
      doc.addPage();
      yPos = margin;

      addSectionHeader("4. Rutiner og prosedyrer");

      if (routines && routines.routines.length > 0) {
        routines.routines.forEach((routine, index) => {
          checkPageBreak(60);
          
          // Routine header
          doc.setFillColor(240, 249, 255);
          doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`${routine.routine_number} - ${routine.routine_name}`, margin + 5, yPos + 8);
          yPos += 17;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");

          // Purpose
          if (routine.purpose) {
            doc.setFont("helvetica", "bold");
            doc.text("Formål:", margin, yPos);
            doc.setFont("helvetica", "normal");
            const purposeLines = doc.splitTextToSize(routine.purpose, contentWidth - 20);
            doc.text(purposeLines, margin + 20, yPos);
            yPos += purposeLines.length * 5 + 5;
          }

          // Responsibility
          if (routine.responsibility) {
            checkPageBreak(15);
            doc.setFont("helvetica", "bold");
            doc.text("Ansvar:", margin, yPos);
            doc.setFont("helvetica", "normal");
            const respLines = doc.splitTextToSize(routine.responsibility, contentWidth - 20);
            doc.text(respLines, margin + 20, yPos);
            yPos += respLines.length * 5 + 5;
          }

          // Procedure (abbreviated)
          if (routine.procedure) {
            checkPageBreak(20);
            doc.setFont("helvetica", "bold");
            doc.text("Fremgangsmåte:", margin, yPos);
            yPos += 5;
            doc.setFont("helvetica", "normal");
            const procLines = doc.splitTextToSize(routine.procedure.substring(0, 300) + 
              (routine.procedure.length > 300 ? "..." : ""), contentWidth);
            procLines.slice(0, 5).forEach((line: string) => {
              checkPageBreak(6);
              doc.text(line, margin, yPos);
              yPos += 5;
            });
          }

          yPos += 10;
          
          // Add separator between routines
          if (index < routines.routines.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
          }
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen rutiner er registrert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // ============= FOOTER ON ALL PAGES =============
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${companyName} - Internkontroll HMS-håndbok`,
          margin,
          pageHeight - 10
        );
        doc.text(
          `Side ${i} av ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      // Output
      const filename = `IK-Handbok_${companyName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      
      if (preview) {
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, "_blank");
        toast.success("Forhåndsvisning åpnet i ny fane");
      } else {
        doc.save(filename);
        toast.success("IK-håndbok lastet ned!");
      }

    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Kunne ikke generere PDF. Prøv igjen.");
    } finally {
      setIsGenerating(false);
      setIsPreviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Statusoversikt
          </CardTitle>
          <CardDescription>
            Alle steg må være fullført for å generere en komplett håndbok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {completionStatus.goals ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Mål</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {goals.length} mål definert
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {completionStatus.organization ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Organisering</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {completionStatus.organization ? "Fullført" : "Mangler"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {completionStatus.riskAssessment ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Risikoer</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {riskAssessment?.risks.length || 0} registrert
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {completionStatus.routines ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Rutiner</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {routines?.routines.length || 0} rutiner
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Bedriftslogo</h3>
        <LogoUpload
          currentLogoUrl={logoUrl}
          companyId={companyInfo?.id || null}
          onLogoChange={setLogoUrl}
        />
      </div>

      <Separator />

      {/* Generate PDF Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generer IK-håndbok</CardTitle>
          <CardDescription>
            Lag en profesjonell PDF-dokumentasjon av ditt internkontrollsystem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Håndboken vil inneholde:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Forside med bedriftsinformasjon</li>
              <li>• Innholdsfortegnelse</li>
              <li>• Mål for internkontroll</li>
              <li>• Organisering og ansvarsfordeling</li>
              <li>• Risikovurdering med tiltak</li>
              <li>• Rutiner og prosedyrer</li>
            </ul>
          </div>

          {!allComplete && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-warning-foreground">
                <strong>Merk:</strong> Noen steg er ikke fullført. Du kan fortsatt generere håndboken, 
                men den vil være ufullstendig.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => generatePDF(true)}
              disabled={isPreviewing || isGenerating}
              className="flex-1"
            >
              {isPreviewing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Forhåndsvis
            </Button>
            <Button 
              onClick={() => generatePDF(false)}
              disabled={isGenerating || isPreviewing}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Last ned PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Håndboken er utarbeidet i henhold til forskrift om systematisk 
          helse-, miljø- og sikkerhetsarbeid i virksomheter (Internkontrollforskriften).
        </p>
      </div>
    </div>
  );
}
