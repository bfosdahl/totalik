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
import { safeFormatDate } from "@/utils/safeFormatDate";
import { t } from "@/i18n/t";

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

  const formatDate = (dateString: string | null) => safeFormatDate(dateString, "d. MMMM yyyy", dateString || "Ikke angitt");

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
            <h2 className="text-lg font-semibold mb-1">{t("auto.hms_erklaeringer")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("auto.her_finner_du_og_kan_signere_de_obligato")}
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
                  <CardTitle className="text-lg">{t("auto.egenerklaering_om_hms")}</CardTitle>
                  <CardDescription>
                    {t("auto.bekreftelse_paa_systematisk_hms_arbeid_i")}
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
                    <span className="text-muted-foreground">{t("auto.bedrift_3")}</span>
                    <span className="font-medium">{selfDeclaration.company_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("auto.signert_av")}</span>
                    <span className="font-medium">{selfDeclaration.manager_name || "Ikke angitt"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("auto.signert_dato")}</span>
                    <span className="font-medium">{formatDate(selfDeclaration.manager_signed_at)}</span>
                  </div>
                </div>

                {selfDeclaration.manager_signature && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t("auto.signatur_2")}</p>
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
                    {t("auto.signer_paa_nytt")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {t("auto.egenerklaering_om_hms_er_ikke_signert_en")}
                </p>
                <Button onClick={() => setShowSelfDeclarationDialog(true)}>
                  <PenLine className="w-4 h-4 mr-2" />
                  {t("auto.signer_egenerklaering")}
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
