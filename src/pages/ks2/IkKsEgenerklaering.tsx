import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useKsDeclarations } from "@/hooks/useKsDeclarations";
import { KsSelfDeclarationDialog } from "@/components/ks/KsSelfDeclarationDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  PenLine, 
  Calendar,
  User,
  Building2,
  Download,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import jsPDF from "jspdf";

export default function IkKsEgenerklaering() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { selfDeclaration, isLoading, hasSelfDeclaration, refetch } = useKsDeclarations();
  const [showDialog, setShowDialog] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ikke angitt";
    try {
      return format(new Date(dateString), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateString;
    }
  };

  const handleDownloadPdf = () => {
    if (!selfDeclaration) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("EGENERKLÆRING – KVALITETSSIKRINGSSYSTEM", pageWidth / 2, y, { align: "center" });
    y += 15;

    // Company info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Virksomhet: ${selfDeclaration.company_name || ""}`, 20, y);
    y += 6;
    doc.text(`Organisasjonsnummer: ${company?.org_number || "___________________________"}`, 20, y);
    y += 12;

    // Declaration body
    const bodyTexts = [
      "Vi erklærer med dette at virksomheten har etablert og tatt i bruk et kvalitetssikringssystem (Total IK – med modul IK/Bygg) som benyttes i den daglige driften.",
      "",
      "Systemet er tilpasset virksomhetens størrelse og aktiviteter, og skal sikre at arbeid planlegges, utføres og dokumenteres i samsvar med gjeldende lover, forskrifter og krav til kvalitet.",
      "",
      "Kvalitetssikringssystemet omfatter blant annet:",
    ];

    bodyTexts.forEach(text => {
      if (text === "") {
        y += 4;
      } else {
        const lines = doc.splitTextToSize(text, pageWidth - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }
    });
    y += 3;

    // Bullet points
    const bullets = [
      "Klare ansvarsforhold og rutiner for gjennomføring av arbeid",
      "Kontroll og dokumentasjon av utført arbeid",
      "Håndtering av avvik og forbedringstiltak",
      "Jevnlig gjennomgang og oppdatering av systemet",
    ];
    bullets.forEach(b => {
      doc.text(`• ${b}`, 25, y);
      y += 6;
    });
    y += 4;

    const closingText = "Systemet er gjort kjent for ansatte og brukes aktivt i virksomhetens prosjekter og leveranser.";
    const closingLines = doc.splitTextToSize(closingText, pageWidth - 40);
    doc.text(closingLines, 20, y);
    y += closingLines.length * 5 + 15;

    // Signature section
    doc.setFontSize(10);
    doc.text(`Sted: ${selfDeclaration.city || "___________________________"}`, 20, y);
    doc.text(`Dato: ${formatDate(selfDeclaration.manager_signed_at)}`, 110, y);
    y += 15;

    doc.text(`Navn: ${selfDeclaration.manager_name || ""}`, 20, y);
    y += 6;
    doc.text("Stilling: Daglig leder", 20, y);
    y += 8;
    doc.text("Signatur:", 20, y);
    y += 5;

    if (selfDeclaration.manager_signature) {
      try {
        doc.addImage(selfDeclaration.manager_signature, "PNG", 20, y, 60, 25);
        y += 30;
      } catch {
        y += 5;
      }
    }

    doc.save(`Egenerklaering_KS_${selfDeclaration.company_name?.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="space-y-6">

      {/* Declaration Document */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6 md:p-10">
            {/* Status + actions bar */}
            <div className="flex items-center justify-between mb-6">
              <Badge variant={hasSelfDeclaration ? "default" : "secondary"} className="text-xs">
                {hasSelfDeclaration ? "Signert" : "Ikke signert"}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDialog(true)}>
                  <PenLine className="w-4 h-4 mr-2" />
                  {hasSelfDeclaration ? "Signer på nytt" : "Signer"}
                </Button>
                {hasSelfDeclaration && (
                  <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                    <Download className="w-4 h-4 mr-2" />
                    Last ned PDF
                  </Button>
                )}
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Document content */}
            <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
              <h2 className="text-center text-base font-bold tracking-wide">
                EGENERKLÆRING – KVALITETSSIKRINGSSYSTEM
              </h2>

              <div className="space-y-1 text-muted-foreground">
                <p>Virksomhet: <span className="font-medium text-foreground">{company?.name || "_________________________________"}</span></p>
                <p>Organisasjonsnummer: <span className="font-medium text-foreground">{company?.org_number || "_________________________"}</span></p>
              </div>

              <Separator />

              <p>
                Vi erklærer med dette at virksomheten har etablert og tatt i bruk et kvalitetssikringssystem 
                (Total IK – med modul IK/Bygg) som benyttes i den daglige driften.
              </p>

              <p>
                Systemet er tilpasset virksomhetens størrelse og aktiviteter, og skal sikre at arbeid 
                planlegges, utføres og dokumenteres i samsvar med gjeldende lover, forskrifter og krav til kvalitet.
              </p>

              <p className="font-medium">Kvalitetssikringssystemet omfatter blant annet:</p>

              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Klare ansvarsforhold og rutiner for gjennomføring av arbeid</li>
                <li>Kontroll og dokumentasjon av utført arbeid</li>
                <li>Håndtering av avvik og forbedringstiltak</li>
                <li>Jevnlig gjennomgang og oppdatering av systemet</li>
              </ul>

              <p>
                Systemet er gjort kjent for ansatte og brukes aktivt i virksomhetens prosjekter og leveranser.
              </p>

              <Separator />

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Sted</p>
                  <p className="font-medium border-b border-border pb-1 min-h-[1.5rem]">
                    {selfDeclaration?.city || ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Dato</p>
                  <p className="font-medium border-b border-border pb-1 min-h-[1.5rem]">
                    {selfDeclaration?.manager_signed_at ? formatDate(selfDeclaration.manager_signed_at) : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Navn</p>
                  <p className="font-medium border-b border-border pb-1 min-h-[1.5rem]">
                    {selfDeclaration?.manager_name || ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Stilling</p>
                  <p className="font-medium border-b border-border pb-1 min-h-[1.5rem]">
                    Daglig leder
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Signatur</p>
                  <div className="border-b border-border pb-1 min-h-[3rem]">
                    {selfDeclaration?.manager_signature && (
                      <img 
                        src={selfDeclaration.manager_signature} 
                        alt="Signatur" 
                        className="max-h-16"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog */}
      {company && (
        <KsSelfDeclarationDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          companyId={company.id}
          companyName={company.name}
          companyAddress={company.address || undefined}
          postalCode={company.postal_code || undefined}
          city={company.city || undefined}
          onComplete={() => {
            setShowDialog(false);
            refetch();
          }}
        />
      )}
    </div>
    </AppLayout>
  );
}
