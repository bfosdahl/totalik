import { motion } from "framer-motion";
import { Clock, Mail, LogOut, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function PendingApproval() {
  const { user, signOut, refreshProfile, refreshCompany, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");

  const needsCompanySetup = useMemo(() => {
    return Boolean(profile && !profile.company_id);
  }, [profile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);

    if (profile?.status === "active") {
      window.location.reload();
    } else {
      toast.info("Kontoen venter fortsatt på godkjenning");
    }
  };

  const handleCompleteSetup = async () => {
    if (!user) return;

    const trimmed = companyName.trim();
    const trimmedOrg = orgNumber.trim();
    
    if (trimmed.length < 2) {
      toast.error("Skriv inn et gyldig bedriftsnavn");
      return;
    }
    
    if (!/^\d{9}$/.test(trimmedOrg)) {
      toast.error("Organisasjonsnummer må være 9 siffer");
      return;
    }

    setIsCompleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("complete-pending-signup", {
        body: { companyName: trimmed, orgNumber: trimmedOrg },
      });

      if (error || (data as any)?.error) {
        const msg = (data as any)?.error || error?.message || "Kunne ikke fullføre registreringen";
        throw new Error(msg);
      }

      await Promise.all([refreshProfile(), refreshCompany()]);
      toast.success("Bedrift opprettet og konto aktivert");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err?.message || "En feil oppstod");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {needsCompanySetup ? "Fullfør registreringen" : "Venter på godkjenning"}
          </h1>

          <p className="text-muted-foreground mb-6">
            {needsCompanySetup
              ? "Kontoen din er opprettet, men du må opprette bedriften din for å få tilgang."
              : "Din brukerkonto er opprettet, men må godkjennes av en administrator før du får tilgang til systemet."}
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="text-left">
                <p className="text-muted-foreground">Logget inn som</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {needsCompanySetup ? (
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="companyName">Bedriftsnavn</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10"
                    placeholder="Din bedrift AS"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="orgNumber"
                    value={orgNumber}
                    onChange={(e) => setOrgNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="pl-10"
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
              </div>

              <Button onClick={handleCompleteSetup} className="w-full" disabled={isCompleting}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isCompleting ? "animate-spin" : ""}`} />
                {isCompleting ? "Oppretter bedrift..." : "Opprett bedrift og aktiver konto"}
              </Button>

              <Button onClick={signOut} className="w-full" variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logg ut
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleRefresh} className="w-full" variant="default" disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Sjekker status..." : "Sjekk status på nytt"}
              </Button>

              <Button onClick={signOut} className="w-full" variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logg ut
              </Button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              {needsCompanySetup
                ? "Etter at bedriften er opprettet får du tilgang med en gang."
                : "Du vil få tilgang til systemet så snart en administrator godkjenner kontoen din. Ta kontakt med din leder hvis du trenger hjelp."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

