import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useHmsDeclarations } from "@/hooks/useHmsDeclarations";
import { useVerneombudAgreement } from "@/hooks/useVerneombudAgreement";
import { useEmployees } from "@/hooks/useEmployees";
import { VerneombudExemptionDialog } from "@/components/setup/VerneombudExemptionDialog";
import { VerneombudAgreementDialog } from "@/components/setup/VerneombudAgreementDialog";
import ForsvarlighetsvurderingForm from "@/components/audits/ForsvarlighetsvurderingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertCircle, 
  PenLine, 
  Calendar,
  User,
  Shield,
  Users,
  UserCheck,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function VerneombudSeksjon() {
  const { profile, company } = useAuth();
  const { verneombudExemption, isLoading, hasVerneombudExemption, refetch } = useHmsDeclarations();
  const { verneombudAgreement, verneombudFromProfile, isLoading: isLoadingVerneombud, hasVerneombudAgreement, hasVerneombudFromProfile, hasAnyVerneombud, refetch: refetchVerneombud } = useVerneombudAgreement();
  const { employees } = useEmployees();
  
  // Determine if company needs verneombud (5+ employees) or can use exemption (<5 employees)
  const employeeCount = company?.employee_count ?? employees?.length ?? 0;
  const requiresVerneombud = employeeCount >= 5;
  
  const [showVerneombudDialog, setShowVerneombudDialog] = useState(false);
  const [showVerneombudAgreementDialog, setShowVerneombudAgreementDialog] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("dokumenter");

  if (isLoading || isLoadingVerneombud) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
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
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Verneombud</h2>
            <p className="text-muted-foreground text-sm">
              Her finner du dokumentasjon knyttet til verneombud, inkludert valg av verneombud, 
              avtale om fritak, og forsvarlighetsvurdering iht. Arbeidsmiljøloven.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sub-tabs for Verneombud section */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dokumenter" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Dokumenter
          </TabsTrigger>
          <TabsTrigger value="forsvarlig" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Forsvarlighetsvurdering
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dokumenter" className="space-y-6">
          {/* Verneombud Agreement Card - for companies with 5+ employees */}
          {requiresVerneombud && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${hasAnyVerneombud ? "bg-success/10" : "bg-warning/10"}`}>
                        {hasAnyVerneombud ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Valg av verneombud</CardTitle>
                        <CardDescription>
                          Påkrevd for bedrifter med 5 eller flere ansatte
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={hasAnyVerneombud ? "default" : "secondary"}>
                      {hasVerneombudAgreement ? "Registrert" : hasVerneombudFromProfile ? "Fra organisering" : "Ikke registrert"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasVerneombudAgreement && verneombudAgreement ? (
                    <>
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Verneombud:</span>
                          <span className="font-medium">{verneombudAgreement.verneombud_name}</span>
                        </div>
                        {verneombudAgreement.election_method && (
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Valgmetode:</span>
                            <span className="font-medium">
                              {verneombudAgreement.election_method === "election" ? "Valg blant ansatte" :
                               verneombudAgreement.election_method === "appointment" ? "Utpekt av arbeidsgiver" :
                               verneombudAgreement.election_method === "volunteer" ? "Frivillig" : 
                               verneombudAgreement.election_method}
                            </span>
                          </div>
                        )}
                        {verneombudAgreement.term_end && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Funksjonsperiode til:</span>
                            <span className="font-medium">{formatDate(verneombudAgreement.term_end)}</span>
                          </div>
                        )}
                        {verneombudAgreement.training_completed && (
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-success font-medium">Opplæring gjennomført</span>
                          </div>
                        )}
                      </div>

                      {verneombudAgreement.verneombud_signature && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Verneombudets signatur:</p>
                            <div className="bg-muted/30 rounded-lg p-2 inline-block border">
                              <img 
                                src={verneombudAgreement.verneombud_signature} 
                                alt="Verneombud signatur" 
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
                          onClick={() => setShowVerneombudAgreementDialog(true)}
                        >
                          <PenLine className="w-4 h-4 mr-2" />
                          Oppdater verneombud
                        </Button>
                      </div>
                    </>
                  ) : hasVerneombudFromProfile && verneombudFromProfile ? (
                    // Show verneombud from profile (set via Organisering page)
                    <>
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Verneombud:</span>
                          <span className="font-medium">
                            {[verneombudFromProfile.first_name, verneombudFromProfile.last_name].filter(Boolean).join(" ") || "Ukjent"}
                          </span>
                        </div>
                        {verneombudFromProfile.email && (
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">E-post:</span>
                            <span className="font-medium">{verneombudFromProfile.email}</span>
                          </div>
                        )}
                        {verneombudFromProfile.phone && (
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Telefon:</span>
                            <span className="font-medium">{verneombudFromProfile.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                        <p>
                          Verneombud er registrert via Organisering-siden. For komplett dokumentasjon 
                          med signatur og opplæringsstatus, registrer en formell verneombudsavtale.
                        </p>
                      </div>

                      <Separator />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setShowVerneombudAgreementDialog(true)}
                        >
                          <PenLine className="w-4 h-4 mr-2" />
                          Opprett formell avtale
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <UserCheck className="w-12 h-12 text-warning mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground mb-4">
                        Bedriften har {employeeCount} ansatte og må ha verneombud. 
                        Registrer valg av verneombud for å dokumentere dette i HMS-håndboken.
                      </p>
                      <Button onClick={() => setShowVerneombudAgreementDialog(true)}>
                        <PenLine className="w-4 h-4 mr-2" />
                        Registrer verneombud
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Verneombud Exemption Card - for companies with <5 employees */}
          {!requiresVerneombud && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${hasVerneombudExemption ? "bg-success/10" : "bg-muted"}`}>
                        {hasVerneombudExemption ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Shield className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Avtale om fritak fra verneombud</CardTitle>
                        <CardDescription>
                          For bedrifter med færre enn 5 ansatte
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={hasVerneombudExemption ? "default" : "outline"}>
                      {hasVerneombudExemption ? "Signert" : "Valgfri"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasVerneombudExemption && verneombudExemption ? (
                    <>
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Antall ansatte:</span>
                          <span className="font-medium">{verneombudExemption.total_employees || "Ikke angitt"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Arbeidsgiver:</span>
                          <span className="font-medium">{verneombudExemption.employer_name || "Ikke angitt"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Gyldig til:</span>
                          <span className="font-medium">{formatDate(verneombudExemption.valid_until)}</span>
                        </div>
                      </div>

                      {verneombudExemption.employer_signature && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Arbeidsgiver signatur:</p>
                            <div className="bg-muted/30 rounded-lg p-2 inline-block border">
                              <img 
                                src={verneombudExemption.employer_signature} 
                                alt="Arbeidsgiver signatur" 
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
                          onClick={() => setShowVerneombudDialog(true)}
                        >
                          <PenLine className="w-4 h-4 mr-2" />
                          Oppdater avtale
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground mb-4">
                        Hvis bedriften har færre enn 5 ansatte, kan dere inngå en skriftlig avtale om 
                        å ikke ha verneombud. Alle ansatte må være enige om denne avtalen.
                      </p>
                      <Button variant="outline" onClick={() => setShowVerneombudDialog(true)}>
                        <PenLine className="w-4 h-4 mr-2" />
                        Opprett avtale om fritak
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="forsvarlig">
          <ForsvarlighetsvurderingForm />
        </TabsContent>
      </Tabs>

      {/* Verneombud Exemption Dialog */}
      {company && (
        <VerneombudExemptionDialog
          open={showVerneombudDialog}
          onOpenChange={setShowVerneombudDialog}
          companyId={company.id}
          companyName={company.name}
          totalEmployees={employeeCount}
          onComplete={() => {
            setShowVerneombudDialog(false);
            refetch();
          }}
        />
      )}

      {/* Verneombud Agreement Dialog */}
      {company && (
        <VerneombudAgreementDialog
          open={showVerneombudAgreementDialog}
          onOpenChange={setShowVerneombudAgreementDialog}
          companyId={company.id}
          companyName={company.name}
          onComplete={() => {
            setShowVerneombudAgreementDialog(false);
            refetchVerneombud();
          }}
        />
      )}
    </div>
  );
}
