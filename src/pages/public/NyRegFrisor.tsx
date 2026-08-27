import {
  ShieldCheck,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Users,
  Smartphone,
  Globe,
  Scissors,
} from "lucide-react";
import { NyRegLanding } from "@/components/public/NyRegLanding";

const NyRegFrisor = () => (
  <NyRegLanding
    source="nyreggfrisor"
    path="/nyreggfrisor"
    seoTitle="Gratis HMS-system for nye frisørsalonger | Total-IK"
    seoDescription="Ny frisørsalong? Få Total-IK med HMS-håndbok, kjemikalieregister, avvik og nettside gratis i 6 måneder. Ingen betalingsinfo."
    heading="Gratulerer med ny frisørsalong!"
    subheading="Få Total-IK – 6 måneder helt gratis"
    intro="Total-IK er et komplett digitalt HMS- og styringssystem tilpasset frisørsalonger. Dere får HMS-håndbok, risikovurderinger, avviksbehandling, sjekklister, personaladministrasjon og en profesjonell nettside – uten kostnad i 6 måneder."
    benefits={[
      { icon: Scissors, text: "Komplett digitalt HMS- og styringssystem" },
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
      "Internkontrollforskriften §4 og §5: Dokumentert HMS-system påkrevd for alle virksomheter med ansatte",
      "Kjemikalieforskriften: Register over farlige kjemikalier og vernedatablad",
    ]}
    termsPath="/vilkar"
  />
);

export default NyRegFrisor;
