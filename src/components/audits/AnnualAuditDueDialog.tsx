import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

export function AnnualAuditDueDialog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: pendingAudit } = useQuery({
    queryKey: ["annual-audit-pending", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!profile?.company_id) return null;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("audits")
        .select("id, audit_number, title, scheduled_date, trigger_source, assistance_status, dismissed_until")
        .eq("company_id", profile.company_id)
        .eq("trigger_source", "annual_auto")
        .eq("status", "pending")
        .eq("assistance_requested", false)
        .or(`dismissed_until.is.null,dismissed_until.lt.${today}`)
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (pendingAudit) setOpen(true);
  }, [pendingAudit]);

  if (!pendingAudit) return null;

  const handleSelfService = () => {
    setOpen(false);
    navigate(`/audits`);
  };

  const handleBookAssistance = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("request-audit-assistance", {
        body: { auditId: pendingAudit.id },
      });
      if (error) throw error;
      toast.success("Bestillingen er sendt — vi tar kontakt!");
      await qc.invalidateQueries({ queryKey: ["annual-audit-pending"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Klarte ikke sende bestillingen");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemindLater = async () => {
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    await supabase.from("audits").update({ dismissed_until: in7 }).eq("id", pendingAudit.id);
    await qc.invalidateQueries({ queryKey: ["annual-audit-pending"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* blocked: must choose */ }}>
      <DialogContent
        className="max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Tid for årlig HMS-revisjon</DialogTitle>
          <DialogDescription>
            Den årlige gjennomgangen av HMS-systemet ditt forfaller nå. Velg hvordan du vil gjennomføre den.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 my-4">
          <Card className="p-5 border-2 hover:border-primary cursor-pointer transition" onClick={handleSelfService}>
            <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-lg mb-1">Gjør det selv</h3>
            <p className="text-2xl font-bold text-primary mb-2">Gratis</p>
            <p className="text-sm text-muted-foreground mb-4">
              Logg deg inn, svar på 8 punkter, signer. Tar 30–60 min.
            </p>
            <Button className="w-full" variant="outline">Start revisjon</Button>
          </Card>

          <Card className="p-5 border-2 border-orange-300 hover:border-orange-500 cursor-pointer transition bg-orange-50/40 dark:bg-orange-950/20">
            <Sparkles className="h-8 w-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-lg mb-1">La Total-IK gjøre jobben</h3>
            <p className="text-2xl font-bold text-orange-600 mb-2">990,- <span className="text-sm font-normal">eks. mva</span></p>
            <p className="text-sm text-muted-foreground mb-4">
              Vi gjennomgår, dokumenterer og sender deg den ferdige revisjonen. Faktureres etter levering.
            </p>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={(e) => { e.stopPropagation(); handleBookAssistance(); }}
              disabled={submitting}
            >
              {submitting ? "Sender..." : "Bestill bistand 990,-"}
            </Button>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleRemindLater}>
            <Clock className="h-4 w-4 mr-2" />
            Påminn meg om 7 dager
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
