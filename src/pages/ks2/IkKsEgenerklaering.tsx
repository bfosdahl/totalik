import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useKsDeclarations } from "@/hooks/useKsDeclarations";
import { KsSelfDeclarationDialog } from "@/components/ks/KsSelfDeclarationDialog";
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
    doc.text("Egenerklæring om kvalitetssikringssystem", pageWidth / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("for ytelsen som skal leveres", pageWidth / 2, y, { align: "center" });
    y += 15;

    // Company info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bedrift:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(selfDeclaration.company_name || "", 60, y);
    y += 7;

    if (selfDeclaration.company_address) {
      doc.setFont("helvetica", "bold");
      doc.text("Adresse:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(selfDeclaration.company_address, 60, y);
      y += 7;
    }

    if (selfDeclaration.postal_code || selfDeclaration.city) {
      doc.setFont("helvetica", "bold");
      doc.text("Postnr./-sted:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text([selfDeclaration.postal_code, selfDeclaration.city].filter(Boolean).join(" "), 60, y);
      y += 7;
    }

    y += 8;

    // Declaration text
    doc.setFontSize(10);
    const texts = [
      "Det kreves at tilbyder har et godt og velfungerende kvalitetssikringssystem / styringssystem samt helse, miljø og sikkerhetspolicy for ytelsen som skal leveres. Tilbyder skal sørge for til enhver tid å ha et oppdatert kvalitetssikringssystem, samt sørge for at ansatte i egen organisasjon kjenner til og utfører sitt arbeid i henhold til dette.",
      "",
      "Kvalitetssikringssystemet skal være utarbeidet i den form og det omfang som er nødvendig på bakgrunn av virksomhetens art, aktiviteter, risikoforhold og størrelse.",
      "",
      "Kvalitetssikringssystemet skal være i henhold til enhver tid gjeldende lover og forskrifter.",
      "",
      "Tilbyder skal på anmodning legge fram dokumentasjon på kvalitetssikringssystemet.",
      "",
      "Oppdragsgiver stiller krav om at bekreftelsen signeres.",
      "",
      "Undertegnende leverandør erklærer med dette at nevnte forpliktelser vil bli overholdt.",
    ];

    texts.forEach(text => {
      if (text === "") {
        y += 4;
      } else {
        const lines = doc.splitTextToSize(text, pageWidth - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }
    });

    y += 15;

    // Signature section
    doc.setFontSize(11);
    doc.text(`Sted: ${selfDeclaration.city || "_____________"}`, 20, y);
    doc.text(`Dato: ${formatDate(selfDeclaration.manager_signed_at)}`, 110, y);
    y += 15;

    doc.text("Underskrift:", 20, y);
    y += 5;

    if (selfDeclaration.manager_signature) {
      try {
        doc.addImage(selfDeclaration.manager_signature, "PNG", 20, y, 60, 25);
        y += 30;
      } catch {
        y += 5;
      }
    }

    doc.text(`${selfDeclaration.manager_name || ""}`, 20, y);

    doc.save(`Egenerklaering_KS_${selfDeclaration.company_name?.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/ks")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Tilbake
      </Button>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 shadow-card"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Egenerklæring om kvalitetssikringssystem</h2>
            <p className="text-muted-foreground text-sm">
              Bekreftelse på at bedriften har et godt og velfungerende kvalitetssikringssystem 
              for ytelsen som skal leveres. Denne erklæringen inkluderes automatisk i prosjektrapporter.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KS Self Declaration Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasSelfDeclaration ? "bg-success/10" : "bg-warning/10"}`}>
                  {hasSelfDeclaration ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Egenerklæring KS</CardTitle>
                  <CardDescription>
                    Bekreftelse på kvalitetssikringssystem iht. gjeldende lover og forskrifter
                  </CardDescription>
                </div>
              </div>
              <Badge variant={hasSelfDeclaration ? "default" : "secondary"}>
                {hasSelfDeclaration ? "Signert" : "Ikke signert"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasSelfDeclaration && selfDeclaration ? (
              <>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Bedrift:</span>
                    <span className="font-medium">{selfDeclaration.company_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Signert av:</span>
                    <span className="font-medium">{selfDeclaration.manager_name || "Ikke angitt"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Signert dato:</span>
                    <span className="font-medium">{formatDate(selfDeclaration.manager_signed_at)}</span>
                  </div>
                </div>

                {selfDeclaration.manager_signature && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Signatur:</p>
                      <div className="bg-muted/30 rounded-lg p-2 inline-block border">
                        <img 
                          src={selfDeclaration.manager_signature} 
                          alt="Signatur" 
                          className="max-h-20"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDialog(true)}
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    Signer på nytt
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPdf}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Last ned PDF
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Egenerklæring om kvalitetssikringssystem er ikke signert ennå. 
                  Denne dokumentasjonen bekrefter at bedriften har et velfungerende KS-system.
                </p>
                <Button onClick={() => setShowDialog(true)}>
                  <PenLine className="w-4 h-4 mr-2" />
                  Signer egenerklæring
                </Button>
              </div>
            )}
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
  );
}
