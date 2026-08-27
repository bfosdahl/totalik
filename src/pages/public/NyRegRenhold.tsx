import {
  ShieldCheck,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Users,
  Smartphone,
  Globe,
  Sparkles,
} from "lucide-react";
import { NyRegLanding } from "@/components/public/NyRegLanding";

const NyRegRenhold = () => (
  <NyRegLanding
    source="nyreggrenhold"
    path="/nyreggrenhold"
    seoTitle="Gratis HMS-system for nye renholdsbedrifter | Total-IK"
    seoDescription="Nyetablert renholdsbedrift? Få Total-IK med HMS-håndbok, avvik, sjekklister og nettside gratis i 6 måneder. Ingen betalingsinfo."
    heading="Gratulerer med ny renholdsbedrift!"
    subheading="Få Total-IK – 6 måneder helt gratis"
    intro="Total-IK er et komplett digitalt HMS- og styringssystem tilpasset renhold. Dere får HMS-håndbok, risikovurderinger, avviksbehandling, sjekklister, personaladministrasjon og en profesjonell nettside – uten kostnad i 6 måneder."
    benefits={[
      { icon: Sparkles, text: "Komplett digitalt HMS- og styringssystem tilpasset renhold" },
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
      "Internkontrollforskriften §4 og §5: Alle virksomheter med ansatte skal ha dokumentert internkontroll",
      "Manglende dokumentasjon kan medføre pålegg, tvangsmulkt og overtredelsesgebyr fra Arbeidstilsynet",
    ]}
    termsPath="/vilkar"
  />
);

export default NyRegRenhold;
