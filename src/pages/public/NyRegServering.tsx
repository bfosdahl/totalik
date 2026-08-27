import {
  ShieldCheck,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Users,
  Smartphone,
  Globe,
  UtensilsCrossed,
} from "lucide-react";
import { NyRegLanding } from "@/components/public/NyRegLanding";

const NyRegServering = () => (
  <NyRegLanding
    source="nyreggservering"
    path="/nyreggservering"
    seoTitle="Gratis HMS-system for nye serveringssteder | Total-IK"
    seoDescription="Nytt serveringssted? Få Total-IK med HMS-håndbok, avvik, sjekklister og nettside gratis i 6 måneder. Ingen betalingsinfo."
    heading="Gratulerer med nytt serveringssted!"
    subheading="Få Total-IK – 6 måneder helt gratis"
    intro="Total-IK er et komplett digitalt HMS- og styringssystem tilpasset serveringsbransjen. Dere får HMS-håndbok, risikovurderinger, avviksbehandling, sjekklister, personaladministrasjon og en profesjonell nettside – uten kostnad i 6 måneder."
    benefits={[
      { icon: UtensilsCrossed, text: "Komplett digitalt HMS- og styringssystem" },
      { icon: FileText, text: "Full digital HMS-håndbok med rutiner og prosedyrer" },
      { icon: AlertTriangle, text: "Risikovurderinger og handlingsplaner" },
      { icon: ShieldCheck, text: "Sikker jobbanalyse (SJA)" },
      { icon: AlertTriangle, text: "Avviksbehandling med automatisk oppfølging via e-post" },
      { icon: ClipboardCheck, text: "Digitale sjekklister for vernerunder og inspeksjoner" },
      { icon: Users, text: "Personaladministrasjon med ansatte, avtaler og timeregistrering" },
      { icon: Smartphone, text: "App for mobil og nettbrett" },
      { icon: Globe, text: "Profesjonell nettside inkludert (verdi 2 990 kr)" },
    ]}
    lawPoints={[
      "Internkontrollforskriften §4 og §5: Dokumentert HMS-system påkrevd",
      "Serveringssteder har i tillegg krav fra Mattilsynet og brannvesenet – Total-IK dekker HMS-delen",
    ]}
    termsPath="/vilkar"
  />
);

export default NyRegServering;
