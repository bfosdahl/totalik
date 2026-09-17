import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface WelcomePackageTermsDialogProps {
  open: boolean;
  trialEndsOn: string | null;
  onAccept: () => Promise<void>;
  isAccepting: boolean;
}

const formatNo = (value: string | null) => {
  if (!value) return "180 dager etter opprettelsen";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
};

export const WelcomePackageTermsDialog = ({
  open,
  trialEndsOn,
  onAccept,
  isAccepting,
}: WelcomePackageTermsDialogProps) => {
  const [hasRead, setHasRead] = useState(false);

  const handleAccept = async () => {
    try {
      await onAccept();
      toast.success("Vilkår for velkomstpakken godkjent");
    } catch (error) {
      console.error("Error accepting welcome package terms:", error);
      toast.error("Kunne ikke lagre godkjenningen. Prøv igjen.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Vilkår for velkomstpakken – 6 måneder gratis</DialogTitle>
          <DialogDescription>
            Les og godkjenn vilkårene for gratisperioden før dere tar systemet i bruk.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[360px] border rounded-md p-4">
          <div className="pr-4 space-y-4 text-sm leading-relaxed">
            <p>
              <strong>Gratisperiode:</strong> Dere har full tilgang til Total-IK helt gratis i
              6 måneder (180 dager) fra systemet ble opprettet. Ingen betalingsinformasjon kreves,
              og det faktureres ikke i gratisperioden.
            </p>
            <p>
              <strong>Frist for oppsigelse:</strong> Dersom dere ikke ønsker å fortsette, må dere si
              opp skriftlig på e-post til{" "}
              <a className="underline" href="mailto:post@athenahms.no">
                post@athenahms.no
              </a>{" "}
              innen 180 dager etter opprettelsen av systemet – senest{" "}
              <strong>{formatNo(trialEndsOn)}</strong>.
            </p>
            <p>
              <strong>Hvis dere ikke sier opp:</strong> Abonnementet løper automatisk videre, og
              dere binder dere til minimum 12 måneder til rabattert pris{" "}
              <strong>kr 6 990,- per år</strong> (fritatt mva). Ordinær pris for IK/HMS er
              kr 9 990,- per år.
            </p>
            <p>
              <strong>Nettside:</strong> Nettsiden er inkludert så lenge abonnementet løper. Ønsker
              dere kun å beholde nettsiden etter oppsigelse, koster den kr 2 990,-.
            </p>
            <p>
              <strong>Etter bindingstiden:</strong> Avtalen fornyes automatisk for ny periode
              dersom skriftlig oppsigelse ikke er sendt innen fristen i de ordinære avtalevilkårene.
              Prisene justeres årlig med 5 %.
            </p>
            <p>
              <strong>Leverandør:</strong> Athena Kurs og Internkontroll AS, org.nr 934606450,
              Grønland 1, 1767 Halden.
            </p>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-3 mt-4">
          <Checkbox
            id="welcome-terms-read"
            checked={hasRead}
            onCheckedChange={(checked) => setHasRead(checked === true)}
          />
          <label htmlFor="welcome-terms-read" className="text-sm cursor-pointer leading-relaxed">
            Jeg har lest og forstått vilkårene for velkomstpakken, inkludert at vi må si opp
            skriftlig innen 180 dager for å unngå 12 måneders binding til kr 6 990,- per år.
          </label>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleAccept} disabled={!hasRead || isAccepting}>
            {isAccepting ? "Lagrer..." : "Godkjenn vilkår"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
