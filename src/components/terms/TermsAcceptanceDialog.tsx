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

interface TermsAcceptanceDialogProps {
  open: boolean;
  onAccept: () => Promise<void>;
  isAccepting: boolean;
}

const termsContent = `
AVTALEVILKÅR

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

Prisene økes årlig med 5 %. Andre prisjusteringer kan forekomme, men dersom kunden ikke informeres om annet, gjelder en årlig prisøkning på 5 %. Dette gjelder alle avtaler med leverandøren (org.nr. 934606450) for produktene Total-IK og Kurskontoret, unntatt bedriftshelsetjeneste som styres av Vitamedica eller BHT bergen eller andre samarbeidspartnere.
`;

export const TermsAcceptanceDialog = ({
  open,
  onAccept,
  isAccepting,
}: TermsAcceptanceDialogProps) => {
  const [hasRead, setHasRead] = useState(false);

  const handleAccept = async () => {
    try {
      await onAccept();
      toast.success("Vilkår godkjent");
    } catch (error) {
      console.error("Error accepting terms:", error);
      toast.error("Kunne ikke lagre godkjenning. Prøv igjen.");
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
          <DialogTitle>Avtalevilkår</DialogTitle>
        <DialogDescription>
          Vennligst les og godkjenn avtalevilkårene for å fortsette.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="h-[400px] border rounded-md p-4">
        <div className="pr-4">
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
            {termsContent}
          </pre>
        </div>
        </ScrollArea>

        <div className="flex items-start gap-3 mt-4">
          <Checkbox
            id="terms-read"
            checked={hasRead}
            onCheckedChange={(checked) => setHasRead(checked === true)}
          />
          <label
            htmlFor="terms-read"
            className="text-sm cursor-pointer leading-relaxed"
          >
            Jeg har lest og forstått avtalevilkårene, og godtar disse på vegne
            av min virksomhet.
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
