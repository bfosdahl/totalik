import { useState } from "react";
import { motion } from "framer-motion";
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
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import jsPDF from "jspdf";

export default function IkKsHandbok() {
  const { company, profile } = useAuth();
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

      const addPageIfNeeded = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };

      const addSectionTitle = (title: string, sectionNum: number) => {
        addPageIfNeeded(20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`${sectionNum}. ${title}`, 20, y);
        y += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };

      // ---- Cover page ----
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("KS Håndbok", pageWidth / 2, 60, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Kvalitetssikringssystem", pageWidth / 2, 75, { align: "center" });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(company.name, pageWidth / 2, 100, { align: "center" });
      
      if (company.address) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(company.address, pageWidth / 2, 112, { align: "center" });
        if (company.postal_code || company.city) {
          doc.text(
            [company.postal_code, company.city].filter(Boolean).join(" "),
            pageWidth / 2, 119, { align: "center" }
          );
        }
      }

      doc.setFontSize(10);
      doc.text(
        `Generert: ${format(new Date(), "d. MMMM yyyy", { locale: nb })}`,
        pageWidth / 2, 140, { align: "center" }
      );

      // ---- Section 1: Målsetting ----
      doc.addPage();
      y = 20;
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
        // Strip HTML tags for PDF
        const plainText = organization.custom_content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const lines = doc.splitTextToSize(plainText, pageWidth - 40);
        lines.forEach((line: string) => {
          addPageIfNeeded(7);
          doc.text(line, 25, y);
          y += 5;
        });
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
            const contentPlain = routine.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (contentPlain.length > 0) {
              const contentLines = doc.splitTextToSize(contentPlain, pageWidth - 50);
              contentLines.forEach((line: string) => {
                addPageIfNeeded(7);
                doc.text(line, 30, y);
                y += 5;
              });
            }
          }
          y += 5;
        });
      } else {
        doc.text("Ingen rutiner definert.", 25, y);
        y += 8;
      }

      // ---- Section 5: Egenerklæring ----
      addSectionTitle("Egenerklæring om kvalitetssikringssystem", sectionNum++);
      if (selfDeclaration) {
        const declTexts = [
          `Bedrift: ${selfDeclaration.company_name}`,
          "",
          "Det kreves at tilbyder har et godt og velfungerende kvalitetssikringssystem / styringssystem samt helse, miljø og sikkerhetspolicy for ytelsen som skal leveres.",
          "",
          "Undertegnende leverandør erklærer med dette at nevnte forpliktelser vil bli overholdt.",
          "",
          `Signert av: ${selfDeclaration.manager_name || "Ikke angitt"}`,
          `Dato: ${selfDeclaration.manager_signed_at ? format(new Date(selfDeclaration.manager_signed_at), "d. MMMM yyyy", { locale: nb }) : "Ikke angitt"}`,
        ];

        declTexts.forEach(text => {
          if (text === "") { y += 4; return; }
          addPageIfNeeded(7);
          const lines = doc.splitTextToSize(text, pageWidth - 40);
          doc.text(lines, 25, y);
          y += lines.length * 5 + 2;
        });

        if (selfDeclaration.manager_signature) {
          addPageIfNeeded(35);
          y += 5;
          try {
            doc.addImage(selfDeclaration.manager_signature, "PNG", 25, y, 60, 25);
            y += 30;
          } catch {
            // Skip if signature image fails
          }
        }
      } else {
        doc.text("Egenerklæring er ikke signert.", 25, y);
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
