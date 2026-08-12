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
import { Loader2, ShieldCheck, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getModuleDefaultSettings } from "@/lib/moduleDefaults";
import { t } from "@/i18n/t";

interface ModulePricing {
  module_type: string;
  module_name: string;
  description: string;
  price_monthly: number;
}

interface OrderModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleType: string;
  pricing?: ModulePricing | null;
  onOrderComplete?: () => void;
}

export function OrderModuleDialog({
  open,
  onOpenChange,
  moduleType,
  pricing,
  onOrderComplete,
}: OrderModuleDialogProps) {
  const { profile, company } = useAuth();
  const isMobile = useIsMobile();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const handleSubmitOrder = async () => {
    if (!termsAccepted || !profile || !company || !pricing) return;

    setIsSubmitting(true);
    try {
      // 1. Create order record
      const { error: orderError } = await supabase
        .from("module_orders")
        .insert({
          company_id: company.id,
          module_type: moduleType,
          ordered_by_id: profile.user_id,
          ordered_by_name: `${profile.first_name} ${profile.last_name}`,
          ordered_by_email: profile.email,
          price_monthly: pricing.price_monthly,
          terms_accepted: true,
        });

      if (orderError) throw orderError;

      // 2. Activate the module
      const { data: existingModule, error: existingError } = await supabase
        .from("company_modules")
        .select("id")
        .eq("company_id", company.id)
        .eq("module_type", moduleType)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingModule?.id) {
        const { error: moduleError } = await supabase
          .from("company_modules")
          .update({ is_active: true })
          .eq("id", existingModule.id);
        if (moduleError) throw moduleError;
      } else {
        const { error: moduleError } = await supabase.from("company_modules").insert({
          company_id: company.id,
          module_type: moduleType,
          is_active: true,
          settings: getModuleDefaultSettings(moduleType),
        });
        if (moduleError) throw moduleError;
      }

      // 3. Send confirmation email
      const { error: emailError } = await supabase.functions.invoke("send-module-order-confirmation", {
        body: {
          recipientEmail: profile.email,
          recipientName: `${profile.first_name} ${profile.last_name}`,
          companyName: company.name,
          moduleName: pricing.module_name,
          priceMonthly: pricing.price_monthly,
        },
      });

      if (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the order if email fails
      }

      setOrderComplete(true);
      toast.success(t("auto.modulen_er_aktivert"));
      onOrderComplete?.();
    } catch (error: any) {
      console.error("Error ordering module:", error);
      toast.error(t("auto.kunne_ikke_fullfoere_bestillingen_proev_"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    setOrderComplete(false);
    onOpenChange(false);
  };

  const scrollContent = (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-6 p-1">
        {orderComplete ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{t("auto.bestilling_bekreftet")}</h3>
              <p className="text-muted-foreground mt-2">
                {pricing?.module_name} er nå aktivert for {company?.name}.
                Du vil motta en ordrebekreftelse på e-post.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              {t("auto.lukk")}
            </Button>
          </div>
        ) : (
          <>
            {/* Module info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{pricing?.module_name}</span>
                <Badge variant="secondary" className="text-lg font-semibold">
                  {pricing?.price_monthly} kr/mnd
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {pricing?.description}
              </p>
            </div>

            {/* Terms */}
            <div className="space-y-4">
              <h4 className="font-medium">{t("auto.avtalevilkaar")}</h4>
              <div className="text-sm text-muted-foreground space-y-2 bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p><strong>{t("auto.1_abonnement_og_fakturering")}</strong></p>
                <p>Ved å aktivere denne modulen godtar du et løpende månedsabonnement på {pricing?.price_monthly} kr/mnd ekskl. mva. Fakturering skjer månedlig forskuddsvis.</p>
                
                <p><strong>{t("auto.2_oppsigelse")}</strong></p>
                <p>{t("auto.abonnementet_kan_sies_opp_naar_som_helst")}</p>
                
                <p><strong>{t("auto.3_databehandling")}</strong></p>
                <p>{t("auto.vi_behandler_personopplysninger_i_henhol")}</p>
                
                <p><strong>{t("auto.4_tilgjengelighet")}</strong></p>
                <p>{t("auto.vi_tilstreber_99_9_oppetid_planlagt_vedl")}</p>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  Jeg godtar avtalevilkårene og bestiller {pricing?.module_name} for {company?.name}
                </label>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">{t("auto.ordrebekreftelse_sendes_til")}</p>
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
        {t("auto.avbryt")}
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
          "Bestill og aktiver"
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Bestill {pricing?.module_name}</DrawerTitle>
            <DrawerDescription>
              {t("auto.aktiver_modulen_for_din_bedrift")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {scrollContent}
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
          <DialogTitle>Bestill {pricing?.module_name}</DialogTitle>
          <DialogDescription>
            {t("auto.aktiver_modulen_for_din_bedrift")}
          </DialogDescription>
        </DialogHeader>
        {scrollContent}
        {actionButtons}
      </DialogContent>
    </Dialog>
  );
}
