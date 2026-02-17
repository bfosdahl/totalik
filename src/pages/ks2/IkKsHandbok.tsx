import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useKsDeclarations } from "@/hooks/useKsDeclarations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Target,
  Users,
  FileText,
  ClipboardList,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import jsPDF from "jspdf";

export default function IkKsHandbok() {
  const { company, profile } = useAuth();
  const navigate = useNavigate();
  const companyId = profile?.company_id;
  const { selfDeclaration, hasSelfDeclaration } = useKsDeclarations();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch KS goals
  const { data: goals } = useQuery({
    queryKey: ["ks-goals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_ks_goals")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order");
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch KS system goals (målsetting)
  const { data: systemGoals } = useQuery({
    queryKey: ["ks-system-goals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_ks_system_goals")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order");
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch KS organization
  const { data: organization } = useQuery({
    queryKey: ["ks-organization", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("company_ks_organization")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch KS routines
  const { data: routines } = useQuery({
    queryKey: ["ks-routines", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_ks_routines")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!companyId,
  });

  const sections = [
    {
      title: "Målsetting",
      icon: Target,
      status: (systemGoals?.length || 0) > 0,
      count: systemGoals?.length || 0,
    },
    {
      title: "Kvalitetsmål",
      icon: Target,
      status: (goals?.length || 0) > 0,
      count: goals?.length || 0,
    },
    {
      title: "Organisasjonsplan",
      icon: Users,
      status: !!organization?.custom_content,
      count: organization ? 1 : 0,
    },
    {
      title: "Rutiner",
      icon: ClipboardList,
      status: (routines?.length || 0) > 0,
      count: routines?.length || 0,
    },
    {
      title: "Egenerklæring KS",
      icon: FileText,
      status: hasSelfDeclaration,
      count: hasSelfDeclaration ? 1 : 0,
    },
  ];

  const completedSections = sections.filter(s => s.status).length;

  const handleGeneratePdf = async () => {
    if (!company) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;

      // Construction theme colors (RGB)
      const COLORS = {
        darkBlue: [30, 58, 82] as [number, number, number],       // Steel blue - headers
        orange: [232, 119, 34] as [number, number, number],        // Construction orange - accents
        lightGray: [240, 243, 246] as [number, number, number],    // Background tint
        medGray: [180, 190, 200] as [number, number, number],      // Subtle lines
        white: [255, 255, 255] as [number, number, number],
        textDark: [33, 37, 41] as [number, number, number],
      };

      // Load company logo if available
      let logoImg: string | null = null;
      if (company.logo_url) {
        try {
          const response = await fetch(company.logo_url);
          const blob = await response.blob();
          logoImg = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Could not load company logo for PDF:", e);
        }
      }

      // Helper: add colored header bar + footer to current page
      const addPageDecoration = (isFirstPage = false) => {
        // Top bar
        doc.setFillColor(...COLORS.darkBlue);
        doc.rect(0, 0, pageWidth, 8, 'F');
        // Orange accent stripe
        doc.setFillColor(...COLORS.orange);
        doc.rect(0, 8, pageWidth, 2, 'F');

        // Footer
        doc.setFillColor(...COLORS.darkBlue);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.white);
        doc.text(company.name, 15, pageHeight - 4.5);
        doc.text("KS Håndbok – Kvalitetssikringssystem", pageWidth / 2, pageHeight - 4.5, { align: "center" });
        doc.text(`Side ${doc.getNumberOfPages()}`, pageWidth - 15, pageHeight - 4.5, { align: "right" });
        // Reset text color
        doc.setTextColor(...COLORS.textDark);
      };

      // Overridden addPage that includes decoration
      const addNewPage = () => {
        doc.addPage();
        addPageDecoration();
        y = 22;
      };

      const addPageIfNeeded = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - 25) {
          addNewPage();
        }
      };

      const addSectionTitle = (title: string, sectionNum: number) => {
        addPageIfNeeded(25);
        // Section header with colored background
        doc.setFillColor(...COLORS.darkBlue);
        doc.roundedRect(15, y - 5, pageWidth - 30, 12, 2, 2, 'F');
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.white);
        doc.text(`${sectionNum}. ${title}`, 20, y + 3);
        doc.setTextColor(...COLORS.textDark);
        y += 14;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };

      // ---- Cover page ----
      addPageDecoration(true);

      // Large colored area for cover
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(0, 10, pageWidth, 80, 'F');

      // Logo
      if (logoImg) {
        try {
          doc.addImage(logoImg, "PNG", pageWidth / 2 - 20, 18, 40, 40);
        } catch {
          // Skip if logo fails
        }
      }

      const coverTextStart = logoImg ? 65 : 35;

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.darkBlue);
      doc.text("KS Håndbok", pageWidth / 2, coverTextStart, { align: "center" });
      
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.orange);
      doc.text("Kvalitetssikringssystem for bygg og anlegg", pageWidth / 2, coverTextStart + 12, { align: "center" });

      // Orange divider line
      doc.setDrawColor(...COLORS.orange);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 40, coverTextStart + 20, pageWidth / 2 + 40, coverTextStart + 20);

      doc.setTextColor(...COLORS.textDark);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(company.name, pageWidth / 2, coverTextStart + 35, { align: "center" });
      
      if (company.org_number) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Org.nr: ${company.org_number}`, pageWidth / 2, coverTextStart + 43, { align: "center" });
      }

      if (company.address) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const addrY = company.org_number ? coverTextStart + 51 : coverTextStart + 43;
        doc.text(company.address, pageWidth / 2, addrY, { align: "center" });
        if (company.postal_code || company.city) {
          doc.text(
            [company.postal_code, company.city].filter(Boolean).join(" "),
            pageWidth / 2, addrY + 6, { align: "center" }
          );
        }
      }

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.medGray);
      doc.text(
        `Generert: ${format(new Date(), "d. MMMM yyyy", { locale: nb })}`,
        pageWidth / 2, pageHeight - 30, { align: "center" }
      );
      doc.setTextColor(...COLORS.textDark);

      // ---- Section 1: Målsetting ----
      addNewPage();
      let sectionNum = 1;

      addSectionTitle("Målsetting", sectionNum++);
      if (systemGoals && systemGoals.length > 0) {
        systemGoals.forEach((goal: any) => {
          addPageIfNeeded(12);
          const lines = doc.splitTextToSize(`• ${goal.goal_text}`, pageWidth - 45);
          doc.text(lines, 25, y);
          y += lines.length * 5 + 3;
          if (goal.description) {
            const descLines = doc.splitTextToSize(goal.description, pageWidth - 50);
            doc.setFont("helvetica", "italic");
            doc.text(descLines, 30, y);
            doc.setFont("helvetica", "normal");
            y += descLines.length * 5 + 3;
          }
        });
      } else {
        doc.text("Ingen målsetting definert.", 25, y);
        y += 8;
      }
      y += 5;

      // ---- Section 2: Kvalitetsmål ----
      addSectionTitle("Kvalitetsmål", sectionNum++);
      if (goals && goals.length > 0) {
        goals.forEach((goal: any) => {
          addPageIfNeeded(12);
          const lines = doc.splitTextToSize(`• ${goal.goal_text}`, pageWidth - 45);
          doc.text(lines, 25, y);
          y += lines.length * 5 + 3;
        });
      } else {
        doc.text("Ingen kvalitetsmål definert.", 25, y);
        y += 8;
      }
      y += 5;

      // ---- Section 3: Organisasjonsplan ----
      addSectionTitle("Organisasjonsplan", sectionNum++);
      if (organization?.custom_content) {
        // Try to parse as JSON roles array
        let roles: any[] = [];
        try {
          const parsed = JSON.parse(organization.custom_content);
          if (parsed?.roles && Array.isArray(parsed.roles)) {
            roles = parsed.roles;
          } else if (Array.isArray(parsed)) {
            roles = parsed;
          }
        } catch {
          // Not JSON, treat as plain text
        }

        if (roles.length > 0) {
          // Sort by sortOrder
          roles.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          
          doc.text("Virksomheten har definert følgende roller og ansvarsfordeling:", 25, y);
          y += 7;

          roles.forEach((role: any) => {
            addPageIfNeeded(18);
            doc.setFont("helvetica", "bold");
            const title = role.title || "Ukjent rolle";
            const person = role.personName ? ` – ${role.personName}` : "";
            doc.text(`${title}${person}`, 25, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            if (role.description) {
              const descLines = doc.splitTextToSize(role.description, pageWidth - 50);
              descLines.forEach((line: string) => {
                addPageIfNeeded(6);
                doc.text(line, 30, y);
                y += 5;
              });
            }
            y += 3;
          });
        } else {
          // Fallback: render as plain text (strip HTML)
          const plainText = organization.custom_content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const lines = doc.splitTextToSize(plainText, pageWidth - 40);
          lines.forEach((line: string) => {
            addPageIfNeeded(7);
            doc.text(line, 25, y);
            y += 5;
          });
        }
      } else {
        doc.text("Ingen organisasjonsplan definert.", 25, y);
        y += 8;
      }
      y += 5;

      // ---- Section 4: Rutiner ----
      addSectionTitle("Rutiner", sectionNum++);
      if (routines && routines.length > 0) {
        routines.forEach((routine: any, idx: number) => {
          addPageIfNeeded(20);
          doc.setFont("helvetica", "bold");
          doc.text(`${idx + 1}. ${routine.routine_name}`, 25, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          
          if (routine.description) {
            const descLines = doc.splitTextToSize(routine.description, pageWidth - 50);
            doc.text(descLines, 30, y);
            y += descLines.length * 5 + 3;
          }

          if (routine.content) {
            // Parse content: split by numbered items, headings, or paragraph breaks
            let contentText = routine.content;
            // Replace HTML block elements with newlines
            contentText = contentText.replace(/<br\s*\/?>/gi, '\n');
            contentText = contentText.replace(/<\/(p|div|li|h[1-6])>/gi, '\n');
            contentText = contentText.replace(/<(p|div|li|h[1-6])[^>]*>/gi, '');
            contentText = contentText.replace(/<[^>]*>/g, '');
            // Decode HTML entities
            contentText = contentText.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
            
            // Split into paragraphs by newlines or numbered pattern (e.g. "1. ", "2. ")
            const paragraphs = contentText
              .split(/\n+/)
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0);

            // Further split paragraphs that contain inline numbered items like "1. ... 2. ..."
            const finalParagraphs: string[] = [];
            paragraphs.forEach((p: string) => {
              // Split on patterns like " 1. " or " 2. " that appear mid-sentence (numbered steps)
              const parts = p.split(/(?<=\.)\s+(?=\d+\.\s)/);
              if (parts.length > 1) {
                parts.forEach((part: string) => finalParagraphs.push(part.trim()));
              } else {
                finalParagraphs.push(p);
              }
            });

            finalParagraphs.forEach((paragraph: string) => {
              if (paragraph.length === 0) return;
              
              // Check if it's a labeled section like "Formål:" or "Sjekkliste:"
              const isHeading = /^[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]+:/.test(paragraph) && paragraph.indexOf(':') < 40;
              // Check if it starts with a number like "1. " 
              const isNumbered = /^\d+\.\s/.test(paragraph);
              
              const indent = isNumbered ? 35 : 30;
              const maxWidth = pageWidth - indent - 15;
              
              if (isHeading && !isNumbered) {
                // Render heading part bold, rest normal
                const colonIdx = paragraph.indexOf(':');
                const headingPart = paragraph.substring(0, colonIdx + 1);
                const restPart = paragraph.substring(colonIdx + 1).trim();
                
                addPageIfNeeded(12);
                doc.setFont("helvetica", "bold");
                doc.text(headingPart, 30, y);
                y += 5;
                doc.setFont("helvetica", "normal");
                
                if (restPart) {
                  const restLines = doc.splitTextToSize(restPart, maxWidth);
                  restLines.forEach((line: string) => {
                    addPageIfNeeded(6);
                    doc.text(line, 30, y);
                    y += 5;
                  });
                }
                y += 2;
              } else {
                const wrappedLines = doc.splitTextToSize(paragraph, maxWidth);
                wrappedLines.forEach((line: string) => {
                  addPageIfNeeded(6);
                  doc.text(line, indent, y);
                  y += 5;
                });
                y += 2;
              }
            });
          }
          y += 5;
        });
      } else {
        doc.text("Ingen rutiner definert.", 25, y);
        y += 8;
      }

      // ---- Section 5: Egenerklæring ----
      addNewPage();

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.darkBlue);
      doc.text("EGENERKLÆRING – KVALITETSSIKRINGSSYSTEM", pageWidth / 2, y, { align: "center" });
      doc.setTextColor(...COLORS.textDark);
      y += 12;

      // Company info block
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const companyInfo = [
        `Virksomhet: ${company.name}`,
        `Organisasjonsnummer: ${company.org_number || "___________________________"}`,
        `Adresse: ${company.address || "____________________________________"}`,
        `Postnr./sted: ${[company.postal_code, company.city].filter(Boolean).join(" ") || "________________________________"}`,
      ];
      companyInfo.forEach(line => {
        doc.text(line, 20, y);
        y += 6;
      });
      y += 4;

      // Section 1: Formål
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("1. FORMÅL", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const purposeText = "Denne egenerklæringen bekrefter at virksomheten har etablert, tatt i bruk og vedlikeholder et kvalitetssikringssystem (KS-system) som skal sikre at arbeid, tjenester og leveranser planlegges, gjennomføres og dokumenteres i samsvar med gjeldende lover, forskrifter og kontraktskrav.";
      const purposeLines = doc.splitTextToSize(purposeText, pageWidth - 40);
      doc.text(purposeLines, 20, y);
      y += purposeLines.length * 4.5 + 3;

      const qualityPoints = [
        "Riktig kvalitet på utført arbeid",
        "Forutsigbar gjennomføring av oppdrag",
        "Sporbar dokumentasjon",
        "Kontinuerlig forbedring av virksomheten",
        "Etterlevelse av myndighetskrav",
      ];
      doc.text("Kvalitetssystemet skal bidra til:", 20, y);
      y += 5;
      qualityPoints.forEach(point => {
        addPageIfNeeded(6);
        doc.text(`• ${point}`, 25, y);
        y += 5;
      });
      y += 4;

      // Section 2: Omfang
      addPageIfNeeded(40);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("2. OMFANG", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Kvalitetssikringssystemet gjelder for alle virksomhetens aktiviteter innen:", 20, y);
      y += 5;
      const scopeItems = ["Prosjektering", "Utførelse av arbeid", "Leveranser og tjenester", "Innkjøp og bruk av underleverandører", "Kontroll, dokumentasjon og overlevering"];
      scopeItems.forEach(item => {
        doc.text(`☐ ${item}`, 25, y);
        y += 5;
      });
      y += 2;
      doc.setFont("helvetica", "italic");
      doc.text("(Systemet tilpasses virksomhetens størrelse og risikobilde.)", 20, y);
      doc.setFont("helvetica", "normal");
      y += 8;

      // Section 3: Organisering og ansvar
      addPageIfNeeded(50);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("3. ORGANISERING OG ANSVAR", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Virksomheten har definert ansvar og myndighet for kvalitetssikring:", 20, y);
      y += 6;

      // Simple table
      const roles = [
        ["Rolle", "Ansvar"],
        ["Daglig leder", "Overordnet ansvar for kvalitetssystemet"],
        ["Faglig ansvarlig", "Sikrer faglig utførelse iht. regelverk"],
        ["Prosjekt-/arbeidsleder", "Planlegging, gjennomføring og kontroll"],
        ["Ansatte", "Utfører arbeid iht. rutiner og melder avvik"],
      ];
      doc.setFont("helvetica", "bold");
      doc.text(roles[0][0], 25, y);
      doc.text(roles[0][1], 80, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      roles.slice(1).forEach(row => {
        doc.text(row[0], 25, y);
        doc.text(row[1], 80, y);
        y += 5;
      });
      y += 3;
      doc.text("Alle ansatte er gjort kjent med relevante rutiner og krav.", 20, y);
      y += 8;

      // Section 4: Sentrale rutiner
      addPageIfNeeded(50);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("4. SENTRALE RUTINER I KVALITETSSYSTEMET", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Virksomheten har etablerte rutiner for:", 20, y);
      y += 5;
      const routinePoints = [
        "Planlegging av oppdrag og arbeidsprosesser",
        "Kompetansesikring og opplæring av ansatte",
        "Risikovurdering før og under arbeid",
        "Kontroll av arbeid og leveranser",
        "Dokumentstyring og arkivering",
        "Avviksbehandling og korrigerende tiltak",
        "Bruk og oppfølging av underleverandører",
        "Sluttkontroll og overlevering",
        "Periodisk gjennomgang av systemet",
      ];
      routinePoints.forEach(point => {
        addPageIfNeeded(6);
        doc.text(`• ${point}`, 25, y);
        y += 5;
      });
      y += 4;

      // Section 5: Avvik og forbedring
      addPageIfNeeded(30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("5. AVVIK OG FORBEDRING", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Virksomheten har system for registrering og behandling av:", 20, y);
      y += 5;
      ["Avvik fra krav og spesifikasjoner", "Uønskede hendelser og feil", "Forbedringsforslag"].forEach(p => {
        doc.text(`• ${p}`, 25, y);
        y += 5;
      });
      y += 2;
      const improvText = "Avvik behandles systematisk for å hindre gjentakelse og sikre kontinuerlig forbedring.";
      doc.text(doc.splitTextToSize(improvText, pageWidth - 40), 20, y);
      y += 8;

      // Section 6: Dokumentasjon
      addPageIfNeeded(35);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("6. DOKUMENTASJON", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Alle relevante aktiviteter dokumenteres der det er nødvendig, herunder:", 20, y);
      y += 5;
      ["Sjekklister og kontroller", "Prosjektdokumentasjon", "Samsvarserklæringer / sluttdokumentasjon", "Opplæringsoversikt", "Avviksbehandling"].forEach(p => {
        doc.text(`• ${p}`, 25, y);
        y += 5;
      });
      y += 2;
      doc.text("Dokumentasjon oppbevares i virksomhetens system for internkontroll og kvalitetssikring.", 20, y);
      y += 8;

      // Section 7: Lover
      addPageIfNeeded(30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("7. ETTERLEVELSE AV LOVER OG FORSKRIFTER", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Kvalitetssystemet er etablert med grunnlag i relevante krav, blant annet:", 20, y);
      y += 5;
      ["Plan- og bygningsloven (PBL)", "Byggesaksforskriften (SAK10) – der relevant", "Internkontrollforskriften", "Arbeidsmiljøloven", "Eventuelle bransjespesifikke forskrifter"].forEach(p => {
        doc.text(`• ${p}`, 25, y);
        y += 5;
      });
      y += 4;

      // Section 8: Gjennomgang
      addPageIfNeeded(30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("8. GJENNOMGANG OG VEDLIKEHOLD", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Kvalitetssystemet gjennomgås jevnlig og oppdateres ved:", 20, y);
      y += 5;
      ["Endringer i regelverk", "Nye arbeidsområder", "Erfaring fra avvik eller prosjekter", "Organisatoriske endringer"].forEach(p => {
        doc.text(`• ${p}`, 25, y);
        y += 5;
      });
      y += 4;

      // Section 9: Erklæring
      addPageIfNeeded(50);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("9. ERKLÆRING", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const erklText1 = "Vi bekrefter at virksomheten har et fungerende og implementert kvalitetssikringssystem som brukes aktivt i den daglige driften.";
      const erklLines1 = doc.splitTextToSize(erklText1, pageWidth - 40);
      doc.text(erklLines1, 20, y);
      y += erklLines1.length * 4.5 + 3;
      const erklText2 = "Systemet er tilpasset virksomhetens størrelse, aktiviteter og risiko, og etterleves av ansatte og ledelse.";
      const erklLines2 = doc.splitTextToSize(erklText2, pageWidth - 40);
      doc.text(erklLines2, 20, y);
      y += erklLines2.length * 4.5 + 8;

      // Signature area
      if (selfDeclaration) {
        doc.text(`Sted: ${company.city || "___________________________"}`, 20, y);
        doc.text(`Dato: ${selfDeclaration.manager_signed_at ? format(new Date(selfDeclaration.manager_signed_at), "d. MMMM yyyy", { locale: nb }) : "___________________________"}`, 110, y);
        y += 12;
        doc.text("For virksomheten", 20, y);
        y += 8;
        doc.text(`Navn: ${selfDeclaration.manager_name || ""}`, 20, y);
        y += 6;
        doc.text("Stilling: Daglig leder", 20, y);
        y += 6;
        doc.text("Signatur:", 20, y);
        y += 5;
        if (selfDeclaration.manager_signature) {
          try {
            doc.addImage(selfDeclaration.manager_signature, "PNG", 20, y, 60, 25);
            y += 30;
          } catch {
            // Skip if signature image fails
          }
        }
      } else {
        doc.text("Sted: ___________________________", 20, y);
        doc.text("Dato: ___________________________", 110, y);
        y += 12;
        doc.text("For virksomheten", 20, y);
        y += 8;
        doc.text("Navn:", 20, y);
        y += 6;
        doc.text("Stilling:", 20, y);
        y += 6;
        doc.text("Signatur:", 20, y);
      }

      doc.save(`KS_Handbok_${company.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating KS handbook:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/ks")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Tilbake
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 shadow-card"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">KS Håndbok</h2>
              <p className="text-muted-foreground text-sm">
                Last ned bedriftens samlede kvalitetssikringshåndbok som PDF. 
                Håndboken inneholder målsetting, organisering, rutiner og egenerklæring.
              </p>
            </div>
          </div>
          <Button onClick={handleGeneratePdf} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Last ned KS Håndbok
          </Button>
        </div>
      </motion.div>

      {/* Sections overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Innhold i håndboken</CardTitle>
            <CardDescription>
              {completedSections} av {sections.length} seksjoner har innhold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.status ? "bg-success/10" : "bg-muted/50"}`}>
                      {section.status ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.status ? `${section.count} ${section.count === 1 ? "element" : "elementer"}` : "Ikke utfylt"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={section.status ? "default" : "secondary"} className="text-xs">
                    {section.status ? "Klar" : "Mangler"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
