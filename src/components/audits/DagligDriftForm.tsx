import {
  MessageSquare,
  Users,
  TrendingUp,
  FileText,
  Clock,
  Shield,
  GraduationCap,
  AlertCircle,
  UserCheck,
  Briefcase,
  FileQuestion,
} from 'lucide-react';
import { t } from "@/i18n/t";
import {
  ChecklistAuditForm,
  type ChecklistAuditSection,
} from './ChecklistAuditForm';

// Define all sections with their default questions
const sections: ChecklistAuditSection[] = [
  {
    id: 'informasjon',
    title: '1. Informasjon og kommunikasjon i bedriften',
    icon: MessageSquare,
    questions: [
      { id: 'q1', question: 'Er den daglige kontakt og kommunikasjon i bedriften god?' },
      { id: 'q2', question: 'Er det språklige barrierer i kommunikasjonen – i så fall hvordan løses det?' },
      { id: 'q3', question: 'Gjennomføres det medarbeidersamtaler minst en gang per år?' },
      { id: 'q4', question: 'Gjennomføres det personalmøter?' },
    ]
  },
  {
    id: 'samarbeid',
    title: '2. Samarbeid og beslutninger i bedriften',
    icon: Users,
    questions: [
      { id: 'q1', question: 'Blir ansatte tatt med på råd vedr. endringer i hvert enkeltes arbeidsområde?' },
      { id: 'q2', question: 'Er samarbeidet mellom de ansatte og arbeidsgiver tilfredsstillende?' },
    ]
  },
  {
    id: 'produktivitet',
    title: '3. Vurdering av produktivitet og effektivitet',
    icon: TrendingUp,
    questions: [
      { id: 'q1', question: 'Er de ansatte produktive og effektive?' },
      { id: 'q2', question: 'Er den daglige drift effektiv og produktiv?' },
      { id: 'q3', question: 'Er maskiner og utstyr slik at man kan drive effektivt og produktivt?' },
    ]
  },
  {
    id: 'arbeidsavtaler',
    title: '4. Arbeidsavtaler og arbeidsreglement',
    icon: FileText,
    questions: [
      { id: 'q1', question: 'Har de ansatte tilfredsstillende arbeidsavtaler i henhold til Arbeidsmiljøloven § 14-5 og 14-6?' },
      { id: 'q2', question: 'Inneholder arbeidsavtalene en beskrivelse av stillingen til den ansatte?' },
      { id: 'q3', question: 'Har bedriften utarbeidet arbeidsreglement og utlevert det til de ansatte – i henhold til Arbeidsmiljøloven § 14-16 og 14-17?' },
    ]
  },
  {
    id: 'arbeidstid',
    title: '5. Arbeidstidsbestemmelser',
    subtitle: 'i.h.t. Arbeidsmiljøloven kap. 10',
    icon: Clock,
    questions: [
      { id: 'q1', question: 'Gjennomfører bedriften normal arbeidstid i.h.t. Arbeidsmiljøloven § 10-4?' },
      { id: 'q2', question: 'Brukes det overtidsarbeid utover det som tillates i Arbeidsmiljøloven § 10-6?' },
      { id: 'q3', question: 'Føres det en liste over arbeidstiden til hver enkelt ansatt i.h.t. bestemmelsene i Arbeidsmiljøloven § 10-7?' },
      { id: 'q4', question: 'Fremkommer eventuell overtid av lønningslistene?' },
    ]
  },
  {
    id: 'hms',
    title: '6. Organisering av bedriftens HMS-arbeid',
    subtitle: 'i.h.t. Arbeidsmiljøloven § 3-1',
    icon: Shield,
    questions: [
      { id: 'q1', question: 'Gjennomgås Internkontrollsystemet jevnlig for å sikre at det fungerer i.h.t. målsettingen?' },
      { id: 'q2', question: 'Er det utarbeidet målsetting for bedriftens HMS-arbeid?' },
      { id: 'q3', question: 'Har det blitt utarbeidet en generell risikovurdering?' },
    ]
  },
  {
    id: 'kompetanse',
    title: '7. Yrkesrettet kompetanse og opplæring',
    icon: GraduationCap,
    questions: [
      { id: 'q1', question: 'Får hver ansatt den opplæring som er nødvendig for å utføre sine arbeidsoppgaver?' },
      { id: 'q2', question: 'Bruker bedriften både intern og ekstern kompetanse i opplæringen?' },
      { id: 'q3', question: 'Legger bedriften til rette for at de ansatte har tilbud som hjelper dem til å være faglig oppdatert?' },
    ]
  },
  {
    id: 'registrering',
    title: '8. Registrering av yrkessykdommer, skader og nestenulykker',
    icon: AlertCircle,
    questions: [
      { id: 'q1', question: 'Arbeider bedriften aktivt for å minimalisere sykefraværet?' },
      { id: 'q2', question: 'Registreres sykefravær i.h.t Arbeidsmiljøloven § 5-1?' },
      { id: 'q3', question: 'Registreres og innrapporteres skader, ulykker og nestenulykker i.h.t. Arbeidsmiljøloven § 5-2?' },
      { id: 'q4', question: 'Revideres arbeidsbeskrivelsene jevnlig – for eksempel hvert år?' },
    ]
  },
  {
    id: 'vernetjeneste',
    title: '9. Organisering av bedriftens vernetjeneste',
    icon: UserCheck,
    questions: [
      { id: 'q1', question: 'Har bedriftens nøkkelpersonell gjennomgått nødvendig opplæring i.h.t. Arbeidsmiljøloven § 5-1 og 6-1?' },
      { id: 'q2', question: 'Gjennomføres det jevnlige vernerunder i bedriften?' },
      { id: 'q3', question: 'Har bedriften valgt verneombud i.h.t. Arbeidsmiljøloven § 6-1?' },
      { id: 'q4', question: 'Er bedriften pålagt bedriftshelsetjeneste? I så fall har bedriften tilknytning til sådan i.h.t Arbeidsmiljøloven § 3-3?' },
    ]
  },
  {
    id: 'forsikringer',
    title: '10. Forsikringer i bedriften',
    icon: Briefcase,
    questions: [
      { id: 'q1', question: 'Er alle forsikringer tilpasset virksomhetens behov?' },
      { id: 'q2', question: 'Er yrkesskadeforsikring tegnet på alle ansatte?' },
    ]
  },
  {
    id: 'annet',
    title: '11. Andre ting som bør kartlegges',
    subtitle: 'angående den daglige driften',
    icon: FileQuestion,
    questions: []
  },
];

const DagligDriftForm = () => (
  <ChecklistAuditForm
    config={{
      formType: 'daglig_drift',
      formLabel: 'Daglig drift',
      logName: 'DagligDriftForm',
      sections,
      listTitle: t("auto.daglig_drift"),
      cardTitle: t("auto.kartlegging_av_daglig_drift"),
      cardDescription: t("auto.kartlegging_av_den_daglige_driften_i_bed"),
    }}
  />
);

export default DagligDriftForm;
