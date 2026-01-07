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

  const defaultTerms = `AVTALEVILKÅR

DEFINISJONER
Alle skriftlige henvendelser fra leverandøren til kunden foretas normalt via e-post. Dette inkluderer informasjon om prisendringer, produktendringer, fakturaer, samt eventuelle purringer og inkassovarsler. Inkassovarsler sendes i tillegg per post.

Kunden har ansvar for å oppgi korrekt e-postadresse og holde denne oppdatert. Dersom kunden ikke mottar produktet, må kunden gi beskjed slik at leverandøren kan rette opp eventuelle feil.

Kunden har ansvar for å gi leverandøren de til enhver tid korrekte opplysninger som trengs for at tjenester skal kunne utføres tilfredsstillende.

Kunden plikter å levere nødvendig informasjon som leverandøren trenger for å fullføre sitt arbeid. Dersom signaturer til bedriftshelsetjeneste-kontrakter eller informasjon til andre produkter uteblir, vil leverandøren kunne fakturere ordren etter 60 dager med et bruddgebyr som fratar kunden retten til å bruke produktet. Gebyret er på 40 % av totalsummen.

INNGÅELSE AV AVTALEN
Avtalen anses som inngått når kunden bekrefter sin avtale ved godkjenning via SMS, e-post eller taleopptak.

Ved inngåelse av avtalen bekrefter kunden å ha den nødvendige retten til å inngå avtalen på virksomhetens vegne.

Leveransen anses som gjennomført og ordren som fakturerbar når kunden har mottatt brukernavn/passord til tjenesten, eller mottatt informasjonsmateriale om søknadsprosesser, ID-kort eller lignende.

OPPSIGELSE AV AVTALEN
Alle IK-systemer og kurslisenser krever skriftlig oppsigelse. Kunden må sende en e-post til post@athenahms.no eller til post@kurskontoret.no for å varsle oppsigelsen innen fristen. Dersom oppsigelse ikke skjer innen fristen, fornyes avtalen automatisk for samme periode som avtalt ved inngåelsen.

Oppsigelsesfrister:
• IK-system: 6 måneder.
• Kurslisenser: 3 måneder.

Kunden kan årlig endre navn/ansatt tilknyttet kurslisensen. Nye kurs inkluderes i lisensen.

KUNDENS RETTIGHETER OG PLIKTER
Kunden får tilgang til produkter via internett ved avtaleinngåelse.

Kunden må selv administrere, vedlikeholde og nyttiggjøre seg av produktene.

Kunden eier og kan fritt disponere data i produktene.

Abonnementet fornyes automatisk dersom kunden ikke sier opp skriftlig minst 6 måneder før avtaleperiodens utløp.

Nettsiden kan være utilgjengelig i korte perioder grunnet oppdateringer, teknisk vedlikehold eller feil.

Leverandøren forbeholder seg retten til å forbedre produkter uten å informere kunden på forhånd.

Prisendringer meddeles kunden minst en måned før endringene trer i kraft, unntatt ved prisreduksjoner.

Leverandøren skal sikre at internettjenester betjenes via en egen webtjener eller samarbeidspartnere.

LEVERANDØRENS PLIKTER
Leverandøren forplikter seg til å ikke gi uvedkommende opplysninger om kunden som mottas i forbindelse med avtalen.

Leverandørens erstatningsansvar overfor kunden følger til enhver tid gjeldende regler.

Leverandøren fraskriver seg ansvar for direkte og indirekte tap (som tap av inntekter) som skyldes feil på webtjenesten eller nedetid.

FORCE MAJEURE
Leverandøren kan ikke holdes ansvarlig for endringer forårsaket av forhold utenfor deres kontroll, som streik, lockout, krig, politiske eller offentlige bestemmelser.

BETALINGSBETINGELSER
Kunden betaler gjeldende priser for tjenester levert av leverandøren. Forfall på faktura er 10 dager dersom annet ikke er avtalt.

Avtalen gjelder for perioden som er avtalt mellom kunden og leverandøren. Dersom skriftlig oppsigelse ikke er sendt til leverandøren minst 6 måneder før periodens utløp, fornyes avtalen automatisk for like lang periode.

TVISTER
Ved tvist mellom kunden og leverandøren kan saken bringes inn for Halden Forliksråd.

Eventuelt erstatningsansvar er begrenset oppad til kontraktsverdien.

Klager må fremmes senest to måneder etter at forholdet ble kjent for partene, eller senest en måned etter at uenigheten ble påvist gjennom korrespondanse eller møter.

ÅRLIG PRISØKNING
Prisene økes årlig med 5 %. Andre prisjusteringer kan forekomme, men dersom kunden ikke informeres om annet, gjelder en årlig prisøkning på 5 %.
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
