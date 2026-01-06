import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check, AlertCircle, CalendarCheck, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubscriptionAcceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function SubscriptionAcceptDialog({
  open,
  onOpenChange,
  onAccept,
}: SubscriptionAcceptDialogProps) {
  const { profile, company } = useAuth();
  const isMobile = useIsMobile();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SUBSCRIPTION_PRICE = 3990;
  const BINDING_PERIOD_MONTHS = 12;
  const CANCELLATION_NOTICE_MONTHS = 6;

  const handleAcceptSubscription = async () => {
    if (!termsAccepted || !profile || !company) return;

    setIsSubmitting(true);
    try {
      // Create subscription acceptance record
      const { error: orderError } = await supabase
        .from("module_orders")
        .insert({
          company_id: company.id,
          module_type: "IK_HMS",
          ordered_by_id: profile.user_id,
          ordered_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          ordered_by_email: profile.email,
          price_monthly: SUBSCRIPTION_PRICE,
          terms_accepted: true,
        });

      if (orderError) throw orderError;

      // Activate the IK_HMS module
      const { error: moduleError } = await supabase
        .from("company_modules")
        .upsert({
          company_id: company.id,
          module_type: "IK_HMS",
          is_active: true,
          settings: {
            subscription_started_at: new Date().toISOString(),
            binding_period_months: BINDING_PERIOD_MONTHS,
            cancellation_notice_months: CANCELLATION_NOTICE_MONTHS,
            price_yearly: SUBSCRIPTION_PRICE,
          },
        }, {
          onConflict: "company_id,module_type"
        });

      if (moduleError) throw moduleError;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-module-order-confirmation", {
          body: {
            recipientEmail: profile.email,
            recipientName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
            companyName: company.name,
            moduleName: "IK/HMS Internkontrollsystem",
            priceMonthly: SUBSCRIPTION_PRICE,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      toast.success("Abonnement aktivert! Velkommen til IK/HMS.");
      onAccept();
    } catch (error: any) {
      console.error("Error accepting subscription:", error);
      toast.error("Kunne ikke aktivere abonnementet. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    onOpenChange(false);
  };

  const content = (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-6 p-1">
        {/* Pricing highlight */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 text-center border border-primary/20">
          <h3 className="text-lg font-semibold mb-2">IK/HMS Internkontrollsystem</h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-primary">{SUBSCRIPTION_PRICE.toLocaleString('nb-NO')},-</span>
            <span className="text-muted-foreground">/år</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">ekskl. mva</p>
        </div>

        {/* Key terms cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <CalendarCheck className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">{BINDING_PERIOD_MONTHS} mnd</p>
            <p className="text-xs text-muted-foreground">Bindingstid</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">{CANCELLATION_NOTICE_MONTHS} mnd</p>
            <p className="text-xs text-muted-foreground">Oppsigelsesfrist</p>
          </div>
        </div>

        {/* Included features */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Inkludert i abonnementet:</h4>
          <div className="space-y-1.5 text-sm">
            {[
              "Komplett HMS-system tilpasset din bedrift",
              "AI-assistert oppsett og rådgivning",
              "Risikovurdering og handlingsplaner",
              "Avvikshåndtering og oppfølging",
              "Automatiske påminnelser og varsler",
              "Ubegrenset antall brukere",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Avtalevilkår</h4>
          <div className="text-xs text-muted-foreground space-y-2 bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p><strong>1. Abonnement og fakturering</strong></p>
            <p>Ved å aktivere IK/HMS godtar du et årsabonnement på {SUBSCRIPTION_PRICE.toLocaleString('nb-NO')} kr/år ekskl. mva. Fakturering skjer årlig forskuddsvis.</p>
            
            <p><strong>2. Bindingstid</strong></p>
            <p>Abonnementet har en bindingstid på {BINDING_PERIOD_MONTHS} måneder fra aktiveringstidspunkt. Etter bindingstiden fornyes abonnementet automatisk.</p>
            
            <p><strong>3. Oppsigelse</strong></p>
            <p>Abonnementet kan sies opp med {CANCELLATION_NOTICE_MONTHS} måneders varsel. Oppsigelse må være skriftlig. Ved oppsigelse har du tilgang til systemet ut bindingsperioden.</p>
            
            <p><strong>4. Databehandling</strong></p>
            <p>Vi behandler personopplysninger i henhold til vår personvernerklæring og gjeldende GDPR-regelverk. Dine data tilhører deg.</p>
            
            <p><strong>5. Support og oppdateringer</strong></p>
            <p>Abonnementet inkluderer e-postsupport og alle fremtidige oppdateringer av systemet.</p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
              Jeg aksepterer avtalevilkårene og godkjenner at {company?.name || 'bedriften'} binder seg til et IK/HMS-abonnement på {SUBSCRIPTION_PRICE.toLocaleString('nb-NO')},-/år med {BINDING_PERIOD_MONTHS} måneder bindingstid og {CANCELLATION_NOTICE_MONTHS} måneders oppsigelsesfrist.
            </label>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium">Ordrebekreftelse sendes til:</p>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const actionButtons = (
    <div className="flex gap-3 pt-4 border-t mt-4">
      <Button variant="outline" onClick={handleClose} className="flex-1">
        Avbryt
      </Button>
      <Button
        onClick={handleAcceptSubscription}
        disabled={!termsAccepted || isSubmitting}
        className="flex-1"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Aktiverer...
          </>
        ) : (
          "Godkjenn og start"
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Aktiver IK/HMS-abonnement</DrawerTitle>
            <DrawerDescription>
              Godkjenn vilkårene for å starte oppsettet
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
            {actionButtons}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aktiver IK/HMS-abonnement</DialogTitle>
          <DialogDescription>
            Godkjenn vilkårene for å starte oppsettet
          </DialogDescription>
        </DialogHeader>
        {content}
        {actionButtons}
      </DialogContent>
    </Dialog>
  );
}
