import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Loader2,
  ClipboardList,
  Settings,
  ImageIcon,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyLawsRegulations } from "@/hooks/useCompanyLawsRegulations";
import { useHmsDeclarations, HmsSelfDeclaration, VerneombudExemptionAgreement } from "@/hooks/useHmsDeclarations";
import { useAuditFormResponses } from "@/hooks/useAuditFormResponses";
import {
  sanitizeGoals,
  sanitizeOrganization,
  sanitizeRisks,
  sanitizeActions,
  sanitizeRoutines,
  sanitizeLaws,
  sanitizeCompanyInfo,
  getRiskLevelText,
  getRiskLevelColor,
  formatDateForPdf,
  loadImageAsBase64,
} from "@/utils/handbookPdfSanitizer";

interface GoalData {
  id: string;
  goal_text: string;
  is_predefined: boolean;
}

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  description: string;
  sortOrder: number;
  electionDate?: string;
  electedBy?: string;
}

interface OrganizationData {
  roles: OrganizationRole[];
  description: string;
}

interface RiskItem {
  id: string;
  description: string;
  probability: number;
  consequence: number;
  existing_measures: string;
  planned_measures: string;
}

interface RiskAssessmentData {
  risks: RiskItem[];
}

interface ActionItem {
  id: string;
  risk_id: string | null;
  risk_description: string;
  action_description: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
  priority: "lav" | "medium" | "høy" | "kritisk";
  comments: string;
}

interface ActionPlanData {
  actions: ActionItem[];
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
  actionPlan: ActionPlanData | null;
  routines: RoutinesData | null;
  companyInfo: CompanyInfo | null;
}

export function HandbookStep({ 
  goals, 
  organization, 
  riskAssessment, 
  actionPlan,
  routines,
  companyInfo
}: HandbookStepProps) {
  const navigate = useNavigate();
  const { savedLaws } = useCompanyLawsRegulations();
  const { selfDeclaration, verneombudExemption } = useHmsDeclarations();
  const { completedForms } = useAuditFormResponses();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(companyInfo?.logo_url || null);
  const [currentCompanyInfo, setCurrentCompanyInfo] = useState(companyInfo);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Refresh company info to get latest logo
  const refreshCompanyInfo = async () => {
    if (!companyInfo?.id) return;
    
    setIsRefreshing(true);
    try {
      const { data } = await supabase
        .from("companies")
        .select("id, name, org_number, address, postal_code, city, phone, email, logo_url")
        .eq("id", companyInfo.id)
        .maybeSingle();
      
      if (data) {
        setLogoUrl(data.logo_url);
        setCurrentCompanyInfo({
          id: data.id,
          name: data.name,
          org_number: data.org_number || undefined,
          address: data.address || undefined,
          postal_code: data.postal_code || undefined,
          city: data.city || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          logo_url: data.logo_url,
        });
        toast.success("Bedriftsinformasjon oppdatert");
      }
    } catch (error) {
      console.error("Error refreshing company info:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh on mount to get latest data
  useEffect(() => {
    if (companyInfo?.id) {
      refreshCompanyInfo();
    }
  }, [companyInfo?.id]);

  useEffect(() => {
    setLogoUrl(companyInfo?.logo_url || null);
    setCurrentCompanyInfo(companyInfo);
  }, [companyInfo]);

  const completionStatus = {
    goals: goals.length > 0,
    organization: organization && ((organization.roles?.length ?? 0) > 0 || organization.description?.trim() !== ""),
    riskAssessment: riskAssessment && riskAssessment.risks.length > 0,
    actionPlan: actionPlan && actionPlan.actions.length > 0,
    routines: routines && routines.routines.length > 0,
  };

  const allComplete = Object.values(completionStatus).every(Boolean);

  // Helper functions now imported from handbookPdfSanitizer

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
      const companyName = currentCompanyInfo?.name || "Bedriftsnavn";
      const nameY = logoBase64 ? 130 : 110;
      doc.text(companyName, pageWidth / 2, nameY, { align: "center" });

      // Company details
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let detailsY = logoBase64 ? 145 : 125;
      
      if (currentCompanyInfo?.org_number) {
        doc.text(`Org.nr: ${currentCompanyInfo.org_number}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (currentCompanyInfo?.address) {
        doc.text(currentCompanyInfo.address, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (currentCompanyInfo?.postal_code && currentCompanyInfo?.city) {
        doc.text(`${currentCompanyInfo.postal_code} ${currentCompanyInfo.city}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (currentCompanyInfo?.phone) {
        doc.text(`Tlf: ${currentCompanyInfo.phone}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (currentCompanyInfo?.email) {
        doc.text(`E-post: ${currentCompanyInfo.email}`, pageWidth / 2, detailsY, { align: "center" });
      }

      // Date
      doc.setFontSize(12);
      doc.text(`Dato: ${formatDateForPdf(new Date())}`, pageWidth / 2, pageHeight - 40, { align: "center" });

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
      
      // Build dynamic TOC based on available content
      let sectionNumber = 1;
      let currentPage = 3;
      const tocItems: { title: string; page: number }[] = [];
      
      // Required sections
      tocItems.push({ title: `${sectionNumber}. Mål for internkontroll`, page: currentPage++ });
      sectionNumber++;
      
      tocItems.push({ title: `${sectionNumber}. Organisering og ansvar`, page: currentPage++ });
      sectionNumber++;
      
      // HMS Egenerklæring (if exists)
      if (selfDeclaration) {
        tocItems.push({ title: `${sectionNumber}. Egenerklæring om HMS`, page: currentPage++ });
        sectionNumber++;
      }
      
      // Verneombud (if exists)  
      if (verneombudExemption) {
        tocItems.push({ title: `${sectionNumber}. Fritak fra verneombud`, page: currentPage++ });
        sectionNumber++;
      }
      
      tocItems.push({ title: `${sectionNumber}. Risikovurdering`, page: currentPage++ });
      sectionNumber++;
      
      tocItems.push({ title: `${sectionNumber}. Handlingsplan`, page: currentPage++ });
      sectionNumber++;
      
      tocItems.push({ title: `${sectionNumber}. Rutiner og prosedyrer`, page: currentPage++ });
      sectionNumber++;
      
      tocItems.push({ title: `${sectionNumber}. Lover og forskrifter`, page: currentPage++ });
      sectionNumber++;
      
      // Completed audit forms
      const formTypeLabels: Record<string, string> = {
        annual_hms: "Årlig HMS-revisjon",
        elkontroll: "El-Kontroll",
        fysiske_forhold: "Fysiske arbeidsforhold",
        daglig_drift: "Daglig drift",
        vernerunde: "Vernerunde",
      };
      
      completedForms.forEach((form) => {
        tocItems.push({ 
          title: `${sectionNumber}. ${formTypeLabels[form.form_type] || form.form_type}`, 
          page: currentPage++ 
        });
        sectionNumber++;
      });

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

      if (organization && ((organization.roles?.length ?? 0) > 0 || organization.description)) {
        const orgData = organization;

        if (orgData.roles && orgData.roles.length > 0) {
          // Draw visual org chart
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Organisasjonskart", margin, yPos);
          yPos += 10;
          
          const boxWidth = 80;
          const boxHeight = 20;
          const centerX = pageWidth / 2;
          const indentPerLevel = 15;
          
          const levelLastY: Record<number, number> = {};
          
          orgData.roles.forEach((role, index) => {
            const depth = (role as any).depth ?? 0;
            checkPageBreak(35);
            
            if (index > 0) {
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              const lineX = centerX - boxWidth / 2 + depth * indentPerLevel - 5;
              const parentY = levelLastY[depth - 1] ?? (yPos - 5);
              if (depth > 0) {
                doc.line(lineX, parentY, lineX, yPos + boxHeight / 2);
                doc.line(lineX, yPos + boxHeight / 2, centerX - boxWidth / 2 + depth * indentPerLevel, yPos + boxHeight / 2);
              } else {
                doc.line(centerX, yPos - 5, centerX, yPos);
              }
            }
            
            const boxX = centerX - boxWidth / 2 + depth * indentPerLevel;
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, "FD");
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            const titleText = role.title || "Uten tittel";
            doc.text(titleText, boxX + boxWidth / 2, yPos + 8, { align: "center" });
            
            if (role.personName) {
              doc.setFontSize(8);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 100, 100);
              doc.text(role.personName, boxX + boxWidth / 2, yPos + 14, { align: "center" });
            }
            
            doc.setTextColor(0, 0, 0);
            levelLastY[depth] = yPos + boxHeight;
            yPos += boxHeight + 10;
          });
          
          yPos += 10;
          
          // Draw role descriptions
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Roller og ansvar", margin, yPos);
          yPos += 8;
          
          orgData.roles.forEach((role) => {
            if (role.title && role.description) {
              checkPageBreak(25);
              
              // Role title with person name
              doc.setFontSize(10);
              doc.setFont("helvetica", "bold");
              let roleHeader = role.title;
              if (role.personName) {
                roleHeader += ` (${role.personName})`;
              }
              doc.text(roleHeader, margin, yPos);
              yPos += 6;
              
              // Description
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              const descLines = doc.splitTextToSize(role.description, contentWidth - 5);
              descLines.forEach((line: string) => {
                checkPageBreak(6);
                doc.text(line, margin + 5, yPos);
                yPos += 5;
              });
              yPos += 5;
            }
          });
          
          // Add general description if exists
          if (orgData.description && orgData.description.trim()) {
            checkPageBreak(20);
            yPos += 5;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Generell beskrivelse", margin, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const descLines = doc.splitTextToSize(orgData.description, contentWidth);
            descLines.forEach((line: string) => {
              checkPageBreak(6);
              doc.text(line, margin, yPos);
              yPos += 5;
            });
          }
        } else if (orgData.description) {
          // Just description without roles
          const orgLines = doc.splitTextToSize(orgData.description, contentWidth);
          orgLines.forEach((line: string) => {
            checkPageBreak(8);
            doc.setFontSize(11);
            doc.text(line, margin, yPos);
            yPos += 6;
          });
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Organisasjonsstruktur er ikke definert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // Track current section number for dynamic headers
      let pdfSectionNumber = 2;

      // ============= SECTION: HMS SELF-DECLARATION =============
      if (selfDeclaration) {
        doc.addPage();
        yPos = margin;
        pdfSectionNumber++;

        addSectionHeader(`${pdfSectionNumber}. Egenerklæring om HMS`);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Egenerklæring om helse, miljø og sikkerhet i henhold til internkontrollforskriften.", margin, yPos);
        yPos += 12;

        // Declaration details
        if (selfDeclaration.declaration_date) {
          doc.setFont("helvetica", "bold");
          doc.text("Dato for erklæring:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(selfDeclaration.declaration_date)), margin + 45, yPos);
          yPos += 8;
        }

        if (selfDeclaration.company_name) {
          doc.setFont("helvetica", "bold");
          doc.text("Bedrift:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(selfDeclaration.company_name, margin + 45, yPos);
          yPos += 8;
        }

        if (selfDeclaration.company_address) {
          doc.setFont("helvetica", "bold");
          doc.text("Adresse:", margin, yPos);
          doc.setFont("helvetica", "normal");
          const address = `${selfDeclaration.company_address}${selfDeclaration.postal_code ? `, ${selfDeclaration.postal_code}` : ''}${selfDeclaration.city ? ` ${selfDeclaration.city}` : ''}`;
          doc.text(address, margin + 45, yPos);
          yPos += 12;
        }

        // Signatures
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Signaturer:", margin, yPos);
        yPos += 8;

        if (selfDeclaration.manager_name) {
          doc.setFont("helvetica", "normal");
          doc.text(`Daglig leder: ${selfDeclaration.manager_name}`, margin + 5, yPos);
          if (selfDeclaration.manager_signed_at) {
            doc.text(`(signert ${formatDateForPdf(new Date(selfDeclaration.manager_signed_at))})`, margin + 100, yPos);
          }
          yPos += 7;
        }

        if (selfDeclaration.employee_rep_name) {
          doc.text(`Ansatterepresentant: ${selfDeclaration.employee_rep_name}`, margin + 5, yPos);
          if (selfDeclaration.employee_rep_signed_at) {
            doc.text(`(signert ${formatDateForPdf(new Date(selfDeclaration.employee_rep_signed_at))})`, margin + 100, yPos);
          }
          yPos += 7;
        }
      }

      // ============= SECTION: VERNEOMBUD EXEMPTION =============
      if (verneombudExemption) {
        doc.addPage();
        yPos = margin;
        pdfSectionNumber++;

        addSectionHeader(`${pdfSectionNumber}. Fritak fra verneombud`);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Avtale om fritak fra kravet om verneombud i henhold til arbeidsmiljøloven.", margin, yPos);
        yPos += 12;

        if (verneombudExemption.total_employees) {
          doc.setFont("helvetica", "bold");
          doc.text("Antall ansatte:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(verneombudExemption.total_employees.toString(), margin + 40, yPos);
          yPos += 8;
        }

        if (verneombudExemption.agreement_date) {
          doc.setFont("helvetica", "bold");
          doc.text("Avtaledato:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(verneombudExemption.agreement_date)), margin + 40, yPos);
          yPos += 8;
        }

        if (verneombudExemption.valid_until) {
          doc.setFont("helvetica", "bold");
          doc.text("Gyldig til:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(verneombudExemption.valid_until)), margin + 40, yPos);
          yPos += 12;
        }

        // Signatures
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Signaturer:", margin, yPos);
        yPos += 8;

        if (verneombudExemption.employer_name) {
          doc.setFont("helvetica", "normal");
          doc.text(`Arbeidsgiver: ${verneombudExemption.employer_name}`, margin + 5, yPos);
          if (verneombudExemption.employer_signed_at) {
            doc.text(`(signert ${formatDateForPdf(new Date(verneombudExemption.employer_signed_at))})`, margin + 100, yPos);
          }
          yPos += 7;
        }

        if (verneombudExemption.employee_signatures && verneombudExemption.employee_signatures.length > 0) {
          doc.text("Ansatte:", margin + 5, yPos);
          yPos += 6;
          verneombudExemption.employee_signatures.forEach((sig) => {
            doc.text(`• ${sig.name}`, margin + 10, yPos);
            if (sig.signed_at) {
              doc.text(`(signert ${formatDateForPdf(new Date(sig.signed_at))})`, margin + 100, yPos);
            }
            yPos += 6;
          });
        }

        if (verneombudExemption.notes) {
          yPos += 5;
          doc.setFont("helvetica", "bold");
          doc.text("Merknad:", margin, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          const noteLines = doc.splitTextToSize(verneombudExemption.notes, contentWidth);
          noteLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
      }

      // ============= SECTION: RISK ASSESSMENT =============
      doc.addPage();
      yPos = margin;
      pdfSectionNumber++;

      addSectionHeader(`${pdfSectionNumber}. Risikovurdering`);

      doc.setFontSize(11);
      doc.text("Risiko = Sannsynlighet × Konsekvens (Arbeidstilsynets metodikk)", margin, yPos);
      yPos += 10;

      // Use sanitized risk data to prevent undefined errors
      const sanitizedRisks = sanitizeRisks(riskAssessment);
      if (sanitizedRisks.length > 0) {
        const riskTableData = sanitizedRisks.map(risk => [
          risk.description.substring(0, 80) + (risk.description.length > 80 ? "..." : ""),
          String(risk.probability),
          String(risk.consequence),
          String(risk.riskValue),
          risk.riskLevel
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Beskrivelse", "S", "K", "R", "Nivå"]],
          body: riskTableData,
          theme: "striped",
          headStyles: { 
            fillColor: [59, 130, 246],
            fontSize: 9,
            fontStyle: "bold"
          },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 25, halign: "center" }
          },
          margin: { left: margin, right: margin },
          didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === 4) {
              const riskValue = parseInt(riskTableData[data.row.index][3]);
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

      // ============= SECTION: ACTION PLAN =============
      doc.addPage();
      yPos = margin;
      pdfSectionNumber++;

      addSectionHeader(`${pdfSectionNumber}. Handlingsplan`);

      doc.setFontSize(11);
      doc.text("Handlingsplanen viser tiltak som skal gjennomføres for å redusere identifiserte risikoer.", margin, yPos);
      yPos += 10;

      // Use sanitized action data to prevent undefined errors
      const sanitizedActions = sanitizeActions(actionPlan);
      if (sanitizedActions.length > 0) {
        // Status summary
        const statusCounts = {
          ikke_startet: sanitizedActions.filter(a => a.status === "ikke_startet").length,
          pågår: sanitizedActions.filter(a => a.status === "pågår").length,
          fullført: sanitizedActions.filter(a => a.status === "fullført").length,
        };

        doc.setFont("helvetica", "bold");
        doc.text("Statusoversikt:", margin, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`• Ikke startet: ${statusCounts.ikke_startet}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`• Pågår: ${statusCounts.pågår}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`• Fullført: ${statusCounts.fullført}`, margin + 5, yPos);
        yPos += 10;

        const getPriorityText = (priority: string): string => {
          switch (priority) {
            case "lav": return "Lav";
            case "medium": return "Medium";
            case "høy": return "Høy";
            case "kritisk": return "Kritisk";
            default: return priority || "Medium";
          }
        };

        const getPriorityColor = (priority: string): [number, number, number] => {
          switch (priority) {
            case "lav": return [34, 197, 94];
            case "medium": return [234, 179, 8];
            case "høy": return [249, 115, 22];
            case "kritisk": return [239, 68, 68];
            default: return [0, 0, 0];
          }
        };

        const actionTableData = sanitizedActions.map(action => [
          action.action_description.substring(0, 40) + (action.action_description.length > 40 ? "..." : ""),
          action.responsible,
          action.deadline !== "-" && action.deadline ? new Date(action.deadline).toLocaleDateString("nb-NO") : "-",
          getPriorityText(action.priority),
          action.statusLabel
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Tiltak", "Ansvarlig", "Frist", "Prioritet", "Status"]],
          body: actionTableData,
          theme: "striped",
          headStyles: { 
            fillColor: [59, 130, 246],
            fontSize: 9,
            fontStyle: "bold"
          },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25, halign: "center" },
            3: { cellWidth: 25, halign: "center" },
            4: { cellWidth: 25, halign: "center" }
          },
          margin: { left: margin, right: margin },
          didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === 3) {
              const action = sanitizedActions[data.row.index];
              const color = getPriorityColor(action?.priority || "medium");
              doc.setTextColor(color[0], color[1], color[2]);
            }
          },
          willDrawCell: () => {
            doc.setTextColor(0, 0, 0);
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen handlinger er registrert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // ============= SECTION: ROUTINES =============
      doc.addPage();
      yPos = margin;
      pdfSectionNumber++;

      addSectionHeader(`${pdfSectionNumber}. Rutiner og prosedyrer`);

      // Use sanitized routines data to prevent undefined errors
      const sanitizedRoutinesList = sanitizeRoutines(routines);
      if (sanitizedRoutinesList.length > 0) {
        sanitizedRoutinesList.forEach((routine, index) => {
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

          // Purpose/Description
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

          // Procedure (abbreviated) - only if exists
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
          if (index < sanitizedRoutinesList.length - 1) {
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

      // ============= SECTION: LAWS AND REGULATIONS =============
      doc.addPage();
      yPos = margin;
      pdfSectionNumber++;

      addSectionHeader(`${pdfSectionNumber}. Lover og forskrifter`);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Oversikt over lover og forskrifter som gjelder for virksomheten:", margin, yPos);
      yPos += 10;

      // Use sanitized laws data to prevent undefined errors
      const sanitizedLawsList = sanitizeLaws(savedLaws);
      if (sanitizedLawsList.length > 0) {
        const lawTableData = sanitizedLawsList.map(law => [
          law.law_name,
          law.category,
          law.description,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Lov/forskrift", "Kategori", "Beskrivelse"]],
          body: lawTableData,
          theme: "striped",
          headStyles: { 
            fillColor: [59, 130, 246],
            fontSize: 9,
            fontStyle: "bold"
          },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 35 },
            2: { cellWidth: 75 }
          },
          margin: { left: margin, right: margin },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen lover og forskrifter er registrert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }

      // ============= SECTIONS: COMPLETED AUDIT FORMS =============
      const formTypeLabelsPdf: Record<string, string> = {
        annual_hms: "Årlig HMS-revisjon",
        elkontroll: "El-Kontroll",
        fysiske_forhold: "Fysiske arbeidsforhold",
        daglig_drift: "Daglig drift",
        vernerunde: "Vernerunde",
      };

      // Comprehensive section title mapping for all audit forms
      const sectionTitles: Record<string, string> = {
        // Daglig drift sections
        informasjon: "1. Informasjon og kommunikasjon",
        samarbeid: "2. Samarbeid og beslutninger",
        produktivitet: "3. Produktivitet og effektivitet",
        arbeidsavtaler: "4. Arbeidsavtaler og arbeidsreglement",
        arbeidstid: "5. Arbeidstidsbestemmelser",
        hms: "6. HMS-arbeid",
        kompetanse: "7. Kompetanse og opplæring",
        registrering: "8. Registrering og oppfølging",
        vernetjeneste: "9. Vernetjeneste",
        forsikringer: "10. Forsikringer",
        // Fysiske arbeidsforhold sections
        arbeidslokaler: "1. Arbeidslokaler",
        elektrisk: "2. Elektriske anlegg og utstyr",
        inneklima: "3. Inneklima - lokaler",
        romningsveier: "4. Rømningsveier / Nødutganger",
        brannsikkerhet: "5. Brannsikkerhet - lokaler",
        brannfarlig: "6. Oppbevaring av brann- og eksplosjonsfarlige varer",
        varehandtering: "7. Varehåndtering / lager",
        orden: "8. Orden og renhold",
        avfall: "9. Avfallshåndtering",
        dataskjerm: "10. Arbeid foran dataskjermen",
        asbest: "11. Arbeid med asbestholdig materiale",
        eksterne: "12. Eksterne arbeidsforhold",
        ergonomi: "13. Ergonomi – belastninger",
        verneutstyr: "14. Bruk av personlig verneutstyr",
        stoy: "15. Støyeksponering",
        arbeidsutstyr: "16. Bruk av arbeidsutstyr og maskiner",
        hoyden: "17. Arbeid i høyden",
        kjemisk: "18. Kjemiske stoffer og gasser",
        forstehjelp: "19. Førstehjelp og brannsikkerhet",
        sikring: "20. Sikring av last",
        lasting: "21. Lasting og lossing",
        graving: "22. Gravearbeider",
        sprengning: "23. Sprengningsarbeider",
        adr: "24. ADR-transport",
        adr_uhell: "25. Uhell ved ADR-transport",
        ergonomi_kjoretoy: "26. Ergonomi i kjøretøy",
        hviletid: "27. Kjøre- og hviletid",
        annet: "Andre forhold",
      };

      for (const form of completedForms) {
        doc.addPage();
        yPos = margin;
        pdfSectionNumber++;

        const formTitle = formTypeLabelsPdf[form.form_type] || form.form_type;
        addSectionHeader(`${pdfSectionNumber}. ${formTitle}`);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Form metadata
        if (form.completed_at) {
          doc.text(`Gjennomført: ${formatDateForPdf(new Date(form.completed_at))}`, margin, yPos);
          yPos += 6;
        }
        if (form.completed_by_name) {
          doc.text(`Utført av: ${form.completed_by_name}`, margin, yPos);
          yPos += 6;
        }
        if (form.participants) {
          doc.text(`Deltakere: ${form.participants}`, margin, yPos);
          yPos += 6;
        }
        yPos += 8;

        // Parse and render form data
        const formData = form.form_data as Record<string, unknown>;
        if (formData) {
          // Get section questions and answers
          const sectionQuestions = formData.sectionQuestions as Record<string, Array<{ id: string; question: string }>> | undefined;
          const checklistAnswers = formData.checklistAnswers as Record<string, Record<string, { answer?: string; comment?: string }>> | undefined;
          
          if (sectionQuestions && checklistAnswers) {
            // Get section order from the keys
            const sectionOrder = Object.keys(sectionQuestions).filter(
              key => sectionQuestions[key] && sectionQuestions[key].length > 0
            );

            sectionOrder.forEach((sectionId) => {
              const questions = sectionQuestions[sectionId];
              const answers = checklistAnswers[sectionId] || {};
              
              if (!questions || questions.length === 0) return;

              // Section header
              checkPageBreak(30);
              doc.setFillColor(240, 249, 255);
              doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F");
              doc.setFontSize(10);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(59, 130, 246);
              doc.text(sectionTitles[sectionId] || sectionId, margin + 3, yPos + 5.5);
              doc.setTextColor(0, 0, 0);
              yPos += 12;

              // Build table data for this section
              const tableData: string[][] = [];
              questions.forEach((q) => {
                const answer = answers[q.id];
                let answerText = "-";
                if (answer?.answer === "yes") answerText = "Ja";
                else if (answer?.answer === "no") answerText = "Nei";
                else if (answer?.answer === "na") answerText = "N/A";
                else if (answer?.answer) answerText = answer.answer;

                const row = [
                  q.question.length > 70 ? q.question.substring(0, 67) + "..." : q.question,
                  answerText,
                  answer?.comment || ""
                ];
                tableData.push(row);
              });

              // Draw table
              autoTable(doc, {
                startY: yPos,
                head: [["Sjekkpunkt", "Svar", "Kommentar"]],
                body: tableData,
                theme: "striped",
                headStyles: { 
                  fillColor: [59, 130, 246],
                  fontSize: 8,
                  fontStyle: "bold"
                },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                  0: { cellWidth: 95 },
                  1: { cellWidth: 20, halign: "center" },
                  2: { cellWidth: 50 }
                },
                margin: { left: margin, right: margin },
                didParseCell: (data) => {
                  // Color code answers
                  if (data.section === "body" && data.column.index === 1) {
                    const answer = data.cell.raw as string;
                    if (answer === "Ja") {
                      data.cell.styles.textColor = [34, 197, 94];
                      data.cell.styles.fontStyle = "bold";
                    } else if (answer === "Nei") {
                      data.cell.styles.textColor = [239, 68, 68];
                      data.cell.styles.fontStyle = "bold";
                    }
                  }
                }
              });

              yPos = (doc as any).lastAutoTable.finalY + 10;
            });

            // Summary statistics
            checkPageBreak(40);
            yPos += 5;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Oppsummering:", margin, yPos);
            yPos += 8;

            let totalYes = 0, totalNo = 0, totalNa = 0;
            Object.values(checklistAnswers).forEach((sectionAnswers) => {
              Object.values(sectionAnswers).forEach((answer) => {
                if (answer.answer === "yes") totalYes++;
                else if (answer.answer === "no") totalNo++;
                else if (answer.answer === "na") totalNa++;
              });
            });

            const total = totalYes + totalNo + totalNa;
            const completionPercent = total > 0 ? Math.round((totalYes / (totalYes + totalNo)) * 100) : 0;

            doc.setFont("helvetica", "normal");
            doc.setFillColor(34, 197, 94);
            doc.rect(margin, yPos - 3, 4, 4, "F");
            doc.text(`Ja: ${totalYes}`, margin + 7, yPos);
            
            doc.setFillColor(239, 68, 68);
            doc.rect(margin + 35, yPos - 3, 4, 4, "F");
            doc.text(`Nei: ${totalNo}`, margin + 42, yPos);
            
            doc.setFillColor(150, 150, 150);
            doc.rect(margin + 70, yPos - 3, 4, 4, "F");
            doc.text(`N/A: ${totalNa}`, margin + 77, yPos);
            
            doc.text(`Oppfyllelse: ${completionPercent}%`, margin + 110, yPos);
            yPos += 10;
          }

          // Signatures
          if (formData.auditorSignature || formData.managerSignature) {
            checkPageBreak(25);
            yPos += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Signaturer:", margin, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            if (formData.auditorSignature) {
              doc.text(`Revisjonsleder: ${formData.auditorSignature}`, margin + 5, yPos);
              yPos += 5;
            }
            if (formData.managerSignature) {
              doc.text(`Daglig leder: ${formData.managerSignature}`, margin + 5, yPos);
              yPos += 5;
            }
          }

          // Other comments
          if (formData.otherComments && typeof formData.otherComments === 'string' && formData.otherComments.trim()) {
            checkPageBreak(20);
            yPos += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Andre kommentarer:", margin, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            const commentLines = doc.splitTextToSize(formData.otherComments, contentWidth);
            commentLines.forEach((line: string) => {
              checkPageBreak(5);
              doc.text(line, margin, yPos);
              yPos += 5;
            });
          }
        }
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
        
        // Use embedded preview to avoid browser popup blockers
        setPreviewUrl(pdfUrl);
        setShowPreviewDialog(true);
        toast.success("Forhåndsvisning klar");
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              {completionStatus.actionPlan ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Handlinger</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {actionPlan?.actions.length || 0} tiltak
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

      {/* Logo Preview Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Bedriftslogo</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshCompanyInfo}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
              {logoUrl ? (
                <img
                  src={`${logoUrl}?t=${Date.now()}`}
                  alt="Bedriftslogo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                {logoUrl 
                  ? "Logoen vil vises på forsiden av håndboken."
                  : "Ingen logo lastet opp. Logoen vises på forsiden av håndboken."
                }
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                {logoUrl ? "Endre logo i innstillinger" : "Last opp logo i innstillinger"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {selfDeclaration && <li>• Egenerklæring om HMS</li>}
              {verneombudExemption && <li>• Fritak fra verneombud</li>}
              <li>• Risikovurdering med tiltak</li>
              <li>• Handlingsplan med status og frister</li>
              <li>• Rutiner og prosedyrer</li>
              <li>• Lover og forskrifter</li>
              {completedForms.length > 0 && (
                <>
                  {completedForms.map(form => {
                    const formLabels: Record<string, string> = {
                      annual_hms: "Årlig HMS-revisjon",
                      elkontroll: "El-Kontroll",
                      fysiske_forhold: "Fysiske arbeidsforhold",
                      daglig_drift: "Daglig drift",
                      vernerunde: "Vernerunde",
                    };
                    return <li key={form.id}>• {formLabels[form.form_type] || form.form_type}</li>;
                  })}
                </>
              )}
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

      {/* PDF Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={(open) => {
        setShowPreviewDialog(open);
        if (!open && previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Forhåndsvisning av IK-håndbok</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {previewUrl && (
              <iframe 
                src={previewUrl} 
                className="w-full h-full border rounded-lg"
                title="PDF Forhåndsvisning"
              />
            )}
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Lukk
            </Button>
            <Button onClick={() => generatePDF(false)}>
              <Download className="w-4 h-4 mr-2" />
              Last ned PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
