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
import { Loader2, ShieldCheck, Check, CalendarCheck, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface ModuleOrderConfig {
  moduleType: string;
  moduleName: string;
  description?: string;
  price: number;
  priceType: "monthly" | "yearly";
  bindingPeriodMonths?: number;
  cancellationNoticeMonths?: number;
  features?: string[];
  customTerms?: string;
}

interface UniversalOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ModuleOrderConfig;
  onOrderComplete?: () => void;
}

export function UniversalOrderDialog({
  open,
  onOpenChange,
  config,
  onOrderComplete,
}: UniversalOrderDialogProps) {
  const { profile, company } = useAuth();
  const isMobile = useIsMobile();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const {
    moduleType,
    moduleName,
    description,
    price,
    priceType,
    bindingPeriodMonths,
    cancellationNoticeMonths,
    features,
  } = config;

  const priceLabel = priceType === "yearly" ? "/år" : "/mnd";
  const hasBindingTerms = bindingPeriodMonths && bindingPeriodMonths > 0;
  const hasCancellationNotice = cancellationNoticeMonths && cancellationNoticeMonths > 0;

  const handleSubmitOrder = async () => {
    if (!termsAccepted || !profile || !company) return;

    setIsSubmitting(true);
    try {
      // 1. Create order record
      const { error: orderError } = await supabase
        .from("module_orders")
        .insert({
          company_id: company.id,
          module_type: moduleType,
          ordered_by_id: profile.user_id,
          ordered_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          ordered_by_email: profile.email,
          price_monthly: priceType === "monthly" ? price : Math.round(price / 12),
          terms_accepted: true,
        });

      if (orderError) throw orderError;

      // 2. Activate the module
      const settings = {
        subscription_started_at: new Date().toISOString(),
        price_type: priceType,
        price: price,
        ...(bindingPeriodMonths ? { binding_period_months: bindingPeriodMonths } : {}),
        ...(cancellationNoticeMonths ? { cancellation_notice_months: cancellationNoticeMonths } : {}),
      };

      const { error: moduleError } = await supabase
        .from("company_modules")
        .upsert([{
          company_id: company.id,
          module_type: moduleType,
          is_active: true,
          settings,
        }], {
          onConflict: "company_id,module_type"
        });

      if (moduleError) throw moduleError;

      // 3. Send confirmation email
      try {
        await supabase.functions.invoke("send-module-order-confirmation", {
          body: {
            recipientEmail: profile.email,
            recipientName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
            companyName: company.name,
            moduleName: moduleName,
            priceMonthly: priceType === "monthly" ? price : price,
            priceType: priceType,
            bindingPeriodMonths: bindingPeriodMonths,
            cancellationNoticeMonths: cancellationNoticeMonths,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      setOrderComplete(true);
      toast.success(`${moduleName} er aktivert!`);
      onOrderComplete?.();
    } catch (error: any) {
      console.error("Error ordering module:", error);
      toast.error("Kunne ikke fullføre bestillingen. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    setOrderComplete(false);
    onOpenChange(false);
  };

  const defaultTerms = `
1. Abonnement og fakturering
Ved å aktivere ${moduleName} godtar du et ${priceType === "yearly" ? "års" : "måneds"}abonnement på ${price.toLocaleString('nb-NO')} kr${priceLabel} ekskl. mva. Fakturering skjer ${priceType === "yearly" ? "årlig" : "månedlig"} forskuddsvis.

${hasBindingTerms ? `2. Bindingstid
Abonnementet har en bindingstid på ${bindingPeriodMonths} måneder fra aktiveringstidspunkt. Etter bindingstiden fornyes abonnementet automatisk.

3. Oppsigelse
Abonnementet kan sies opp med ${cancellationNoticeMonths || 1} måneders varsel. Oppsigelse må være skriftlig. Ved oppsigelse har du tilgang til systemet ut ${hasBindingTerms ? "bindingsperioden" : "inneværende faktureringsperiode"}.` : `2. Oppsigelse
Abonnementet kan sies opp når som helst med ${cancellationNoticeMonths || 1} måneders varsel. Ved oppsigelse har du tilgang til modulen ut inneværende faktureringsperiode.`}

${hasBindingTerms ? "4" : "3"}. Databehandling
Vi behandler personopplysninger i henhold til vår personvernerklæring og gjeldende GDPR-regelverk. Dine data tilhører deg.

${hasBindingTerms ? "5" : "4"}. Support og oppdateringer
Abonnementet inkluderer e-postsupport og alle fremtidige oppdateringer av systemet.
  `.trim();

  const content = (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-6 p-1">
        {orderComplete ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Bestilling bekreftet!</h3>
              <p className="text-muted-foreground mt-2">
                {moduleName} er nå aktivert for {company?.name}.
                Du vil motta en ordrebekreftelse på e-post.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Lukk
            </Button>
          </div>
        ) : (
          <>
            {/* Pricing highlight */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 text-center border border-primary/20">
              <h3 className="text-lg font-semibold mb-2">{moduleName}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-primary">{price.toLocaleString('nb-NO')},-</span>
                <span className="text-muted-foreground">{priceLabel}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">ekskl. mva</p>
              {description && (
                <p className="text-sm text-muted-foreground mt-3">{description}</p>
              )}
            </div>

            {/* Binding terms cards */}
            {(hasBindingTerms || hasCancellationNotice) && (
              <div className="grid grid-cols-2 gap-3">
                {hasBindingTerms && (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <CalendarCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">{bindingPeriodMonths} mnd</p>
                    <p className="text-xs text-muted-foreground">Bindingstid</p>
                  </div>
                )}
                {hasCancellationNotice && (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">{cancellationNoticeMonths} mnd</p>
                    <p className="text-xs text-muted-foreground">Oppsigelsesfrist</p>
                  </div>
                )}
              </div>
            )}

            {/* Included features */}
            {features && features.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Inkludert i abonnementet:</h4>
                <div className="space-y-1.5 text-sm">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Avtalevilkår</h4>
              <div className="text-xs text-muted-foreground space-y-2 bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto whitespace-pre-line">
                {config.customTerms || defaultTerms}
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                  Jeg aksepterer avtalevilkårene og godkjenner at {company?.name || 'bedriften'} binder seg til et {moduleName}-abonnement på {price.toLocaleString('nb-NO')},-{priceLabel}
                  {hasBindingTerms && ` med ${bindingPeriodMonths} måneders bindingstid`}
                  {hasCancellationNotice && ` og ${cancellationNoticeMonths} måneders oppsigelsesfrist`}.
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
          </>
        )}
      </div>
    </ScrollArea>
  );

  const actionButtons = !orderComplete && (
    <div className="flex gap-3 pt-4 border-t mt-4">
      <Button variant="outline" onClick={handleClose} className="flex-1">
        Avbryt
      </Button>
      <Button
        onClick={handleSubmitOrder}
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
            <DrawerTitle>Bestill {moduleName}</DrawerTitle>
            <DrawerDescription>
              Godkjenn vilkårene for å aktivere
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
          <DialogTitle>Bestill {moduleName}</DialogTitle>
          <DialogDescription>
            Godkjenn vilkårene for å aktivere
          </DialogDescription>
        </DialogHeader>
        {content}
        {actionButtons}
      </DialogContent>
    </Dialog>
  );
}
