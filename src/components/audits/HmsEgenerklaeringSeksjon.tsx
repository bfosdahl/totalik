import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useHmsDeclarations } from "@/hooks/useHmsDeclarations";
import { HmsSelfDeclarationDialog } from "@/components/setup/HmsSelfDeclarationDialog";
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
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function HmsEgenerklaeringSeksjon() {
  const { company } = useAuth();
  const { selfDeclaration, isLoading, hasSelfDeclaration, refetch } = useHmsDeclarations();
  
  const [showSelfDeclarationDialog, setShowSelfDeclarationDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ikke angitt";
    try {
      return format(new Date(dateString), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
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
            <h2 className="text-lg font-semibold mb-1">HMS Erklæringer</h2>
            <p className="text-muted-foreground text-sm">
              Her finner du og kan signere de obligatoriske HMS-erklæringene for din bedrift. 
              Disse dokumentene bekrefter at virksomheten arbeider systematisk med helse, miljø og sikkerhet.
            </p>
          </div>
        </div>
      </motion.div>

      {/* HMS Self Declaration Card */}
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
                  <CardTitle className="text-lg">Egenerklæring om HMS</CardTitle>
                  <CardDescription>
                    Bekreftelse på systematisk HMS-arbeid iht. Internkontrollforskriften
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
                    onClick={() => setShowSelfDeclarationDialog(true)}
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    Signer på nytt
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Egenerklæring om HMS er ikke signert ennå. 
                  Denne dokumentasjonen er viktig for å bekrefte at bedriften arbeider systematisk med HMS.
                </p>
                <Button onClick={() => setShowSelfDeclarationDialog(true)}>
                  <PenLine className="w-4 h-4 mr-2" />
                  Signer egenerklæring
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* HMS Self Declaration Dialog */}
      {company && (
        <HmsSelfDeclarationDialog
          open={showSelfDeclarationDialog}
          onOpenChange={setShowSelfDeclarationDialog}
          companyId={company.id}
          companyName={company.name}
          companyAddress={company.address || undefined}
          postalCode={company.postal_code || undefined}
          city={company.city || undefined}
          onComplete={() => {
            setShowSelfDeclarationDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
