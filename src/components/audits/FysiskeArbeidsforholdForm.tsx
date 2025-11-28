import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  Building2, 
  Zap, 
  Wind, 
  DoorOpen, 
  Flame, 
  Package, 
  Trash2, 
  Monitor, 
  HardHat, 
  Volume2,
  Wrench,
  ArrowUp,
  Beaker,
  Heart,
  Truck,
  Pickaxe,
  Bomb,
  AlertTriangle,
  Car,
  Clock,
  FileQuestion
} from 'lucide-react';

type YesNoNa = 'yes' | 'no' | 'na' | '';

interface ChecklistRow {
  id: string;
  question: string;
}

interface ChecklistAnswer {
  answer: YesNoNa;
  comment: string;
}

interface ChecklistAnswers {
  [sectionId: string]: {
    [questionId: string]: ChecklistAnswer;
  };
}

interface FormData {
  companyName: string;
  date: string;
  participants: string;
  auditor: string;
  checklistAnswers: ChecklistAnswers;
  otherComments: string;
  auditorSignature: string;
  managerSignature: string;
}

// Define all sections with their questions
const sections = [
  {
    id: 'arbeidslokaler',
    title: '1. Arbeidslokaler',
    subtitle: 'i.h.t. Arbeidsmiljøloven kapittel 4',
    icon: Building2,
    questions: [
      { id: 'q1', question: 'Er arbeidslokalene hensiktsmessig tilpasset den virksomhet vi driver?' },
      { id: 'q2', question: 'Er sanitæranlegg og spiserom i lokalene tilfredsstillende?' },
      { id: 'q3', question: 'Har vi gode nok lysforhold i lokalene, både dagslys og kunstig lys?' },
    ]
  },
  {
    id: 'elektrisk',
    title: '2. Elektriske anlegg og utstyr',
    icon: Zap,
    questions: [
      { id: 'q1', question: 'Er det synlige feil eller mangler ved vårt elektriske anlegg?' },
      { id: 'q2', question: 'Benytter vi autorisert installatør ved behov for elektriske endringer?' },
      { id: 'q3', question: 'Foretar vi egenkontroll på vårt elektriske anlegg?' },
      { id: 'q4', question: 'Bruker vi mye (for mye) skjøteledninger?' },
    ]
  },
  {
    id: 'inneklima',
    title: '3. Inneklima - lokaler',
    icon: Wind,
    questions: [
      { id: 'q1', question: 'Spesialavsug i områder hvor dette er påkrevet skal fungere tilfredsstillende. Gjør det?' },
      { id: 'q2', question: 'Har vi god nok ventilasjon?' },
      { id: 'q3', question: 'Er det jevn temperatur i lokalene både sommer og vinter?' },
    ]
  },
  {
    id: 'romningsveier',
    title: '4. Rømningsveier / Nødutganger',
    icon: DoorOpen,
    questions: [
      { id: 'q1', question: 'Finnes det tilgjengelige rømningsveier i lokalene?' },
      { id: 'q2', question: 'Fører rømningsveiene helt ut?' },
      { id: 'q3', question: 'Holdes rømningsveiene ryddige?' },
      { id: 'q4', question: 'Er rømningsveiene god nok merket?' },
    ]
  },
  {
    id: 'brannsikkerhet',
    title: '5. Brannsikkerhet - lokaler',
    icon: Flame,
    questions: [
      { id: 'q1', question: 'Gjennomføres brann- og rømningsøvelser jevnlig?' },
      { id: 'q2', question: 'Er brann og røykvarslingsutstyr montert?' },
      { id: 'q3', question: 'Er branninstruks utarbeidet og oppslått på et lett synlig sted?' },
      { id: 'q4', question: 'Er brannslukningsutstyr utplassert og tilpasset lokalene?' },
      { id: 'q5', question: 'Blir brannslukningsutstyret sjekket regelmessig?' },
    ]
  },
  {
    id: 'brannfarlig',
    title: '6. Oppbevaring av brann- og eksplosjonsfarlige varer',
    icon: AlertTriangle,
    questions: [
      { id: 'q1', question: 'Er oppbevaringen av brann- og eksplosjonsfarlige varer forsvarlig merket?' },
      { id: 'q2', question: 'Har vi tillatelse for å oppbevare brann- og eksplosjonsfarlige varer?' },
    ]
  },
  {
    id: 'varehandtering',
    title: '7. Varehåndtering / lager',
    icon: Package,
    questions: [
      { id: 'q1', question: 'Er lageret godt tilrettelagt for mottak og uttak av varer?' },
      { id: 'q2', question: 'Kan varemottak / uttak skje uten unødvendig risiko for belastninger?' },
      { id: 'q3', question: 'Har vi nødvendig utstyr for å håndtere varelageret på en forsvarlig måte?' },
      { id: 'q4', question: 'Tilstreber vi minimalt med tunge løft der det er fare for belastningsskader?' },
    ]
  },
  {
    id: 'orden',
    title: '8. Orden og renhold i lokaler',
    icon: Building2,
    questions: [
      { id: 'q1', question: 'Er de ansatte bevisste på sitt eget ansvar når det gjelder orden og renhold i lokalene?' },
      { id: 'q2', question: 'Rengjøres arbeidslokalene regelmessig?' },
      { id: 'q3', question: 'Har vi gode nok rutiner for orden og renhold i lokalene?' },
    ]
  },
  {
    id: 'avfall',
    title: '9. Avfallshåndtering i bedriften',
    icon: Trash2,
    questions: [
      { id: 'q1', question: 'Finnes det egnede beholdere for ulik avfall som skal kastes?' },
      { id: 'q2', question: 'Skjer håndtering av spesialavfall i.h.t til Forurensingsloven § 28?' },
      { id: 'q3', question: 'Følger vi kommunale ordninger for avfallssortering?' },
      { id: 'q4', question: 'Har vi gode rutiner for returavfall?' },
    ]
  },
  {
    id: 'dataskjerm',
    title: '10. Arbeid foran dataskjermen',
    icon: Monitor,
    questions: [
      { id: 'q1', question: 'Er datamaskinene av nyere dato og følger standarden for lavstråling?' },
      { id: 'q2', question: 'Finnes det sjenerende skriverstøy på noen av kontorene?' },
      { id: 'q3', question: 'Har noen av de ansatte klaget i forbindelse med arbeid foran dataskjermen?' },
    ]
  },
  {
    id: 'asbest',
    title: '11. Arbeid med asbestholdig materiale',
    icon: AlertTriangle,
    questions: [
      { id: 'q1', question: 'Har vi gjennomført asbestsaneringskurs?' },
      { id: 'q2', question: 'Er bedriften godkjent for innvendig og utvendig asbestsanering?' },
      { id: 'q3', question: 'Pakkes og leveres det asbestholdige materiale i.h.t. bestemmelsene?' },
      { id: 'q4', question: 'Er område for asbestarbeid merket?' },
      { id: 'q5', question: 'Finnes det personlig verneutstyr tilgjengelig for de som skal utføre asbestarbeid?' },
    ]
  },
  {
    id: 'eksterne',
    title: '12. Eksterne arbeidsforhold',
    icon: Building2,
    questions: [
      { id: 'q1', question: 'Kartlegger vi alltid nye arbeidsplasser m.h.t. helse, miljø og sikkerhet?' },
      { id: 'q2', question: 'Påser vi at bedriftens ansatte er kjent med byggeplassens HMS-plan før oppstart?' },
      { id: 'q3', question: 'Sørger vi for at det er tilgjengelig hvile- / spisebrakke på nye anlegg?' },
    ]
  },
  {
    id: 'ergonomi',
    title: '13. Ergonomi – belastninger i arbeidsutførelsen',
    icon: HardHat,
    questions: [
      { id: 'q1', question: 'Er maskiner og utstyr plassert og tilpasset slik at belastninger unngås?' },
      { id: 'q2', question: 'Er vi flere personer ved spesielt tunge / krevende arbeidsoppgaver?' },
      { id: 'q3', question: 'Prøver vi å unngå statiske arbeidsoperasjoner?' },
      { id: 'q4', question: 'Er vi bevisste på å rullere arbeidsoppgaver?' },
    ]
  },
  {
    id: 'verneutstyr',
    title: '14. Bruk av personlig verneutstyr i bedriften',
    icon: HardHat,
    questions: [
      { id: 'q1', question: 'Sørger vi for å bruke hjelm der det er et behov?' },
      { id: 'q2', question: 'Sørger vi for å bruke hørselsvern der det er et behov?' },
      { id: 'q3', question: 'Sørger vi for å bruke kneputer der det er et behov?' },
    ]
  },
  {
    id: 'stoy',
    title: '15. Støyeksponering',
    icon: Volume2,
    questions: [
      { id: 'q1', question: 'Jobber vi aktivt og regelmessig med å redusere støy fra maskiner og utstyr?' },
      { id: 'q2', question: 'Utsettes noen for sjenerende støy fra våre maskiner / eller generelt i arbeidslokalene?' },
    ]
  },
  {
    id: 'arbeidsutstyr',
    title: '16. Bruk av arbeidsutstyr og maskiner i bedriften',
    icon: Wrench,
    questions: [
      { id: 'q1', question: 'Er elektrisk utstyr og verktøy uten feil og mangler?' },
      { id: 'q2', question: 'Er maskiner, utstyr og verktøy godkjent og utstyrt med nødvendig verneutstyr?' },
      { id: 'q3', question: 'Fungerer nødstoppere der de er montert?' },
      { id: 'q4', question: 'Har vi hensiktsmessig service på utstyr som krever det?' },
    ]
  },
  {
    id: 'hoyden',
    title: '17. Arbeid i høyden',
    icon: ArrowUp,
    questions: [
      { id: 'q1', question: 'Er personlifter som brukes i bedriften godkjent / sertifisert?' },
      { id: 'q2', question: 'Tilfredsstiller stillaser, stiger og trapper industristandard?' },
      { id: 'q3', question: 'Er stillaskurs gjennomført der bedriften setter opp høye stillaser?' },
      { id: 'q4', question: 'Ved alt arbeid i høyden skal det brukes sikringsutstyr for personell og utstyr. Blir dette fulgt?' },
    ]
  },
  {
    id: 'kjemisk',
    title: '18. Arbeid med kjemiske stoffer, løsemidler og gasser',
    icon: Beaker,
    questions: [
      { id: 'q1', question: 'Finnes HMS-datablad på alle produkter med kjemisk eller annen helsefare?' },
      { id: 'q2', question: 'Oppbevares HMS-databladene i et stoffkartotek og er de tilgjengelig for alle?' },
      { id: 'q3', question: 'Ved utvikling av farlig gass skal det besørges tilstrekkelig ventilasjon. Følges det?' },
    ]
  },
  {
    id: 'forstehjelp',
    title: '19. Førstehjelp og brannsikkerhet på anlegg',
    icon: Heart,
    questions: [
      { id: 'q1', question: 'Har alle fått tilstrekkelig opplæring i bruk av brann og førstehjelpsutstyr?' },
      { id: 'q2', question: 'Sjekkes brann og førstehjelpsutstyr regelmessig?' },
      { id: 'q3', question: 'Er det alltid tilgjengelig brannslukningsutstyr på anlegg?' },
      { id: 'q4', question: 'Er det alltid tilgjengelig førstehjelpsutstyr på anlegg?' },
    ]
  },
  {
    id: 'sikring',
    title: '20. Sikring av last på tilhenger, lasteplan og på tak',
    icon: Truck,
    questions: [
      { id: 'q1', question: 'Blir sikringsmateriellet for transport av løsgods sjekket regelmessig?' },
      { id: 'q2', question: 'Benyttes det alltid godkjent sikringsmateriell ved transport av løsgods?' },
      { id: 'q3', question: 'Har vi gode rutiner på sikring av løsgods på tilhenger, tak og lasteplan?' },
    ]
  },
  {
    id: 'lasting',
    title: '21. Lasting og lossing av varer',
    icon: Package,
    questions: [
      { id: 'q1', question: 'Er alt utstyr for lasting og lossing godkjent evt. sertifisert?' },
      { id: 'q2', question: 'Benyttes det alltid hjelpemidler ved lasting og lossing av tunge kolli?' },
      { id: 'q3', question: 'Er laste- og losseutstyret tilpasset varene for å forhindre belastningsskader?' },
    ]
  },
  {
    id: 'graving',
    title: '22. Gravearbeider',
    icon: Pickaxe,
    questions: [
      { id: 'q1', question: 'Sikres grøften hvis den blir stående åpen, uten tilsyn?' },
      { id: 'q2', question: 'Skrånes grøftekantene for å unngå ras i grøften?' },
      { id: 'q3', question: 'Godkjennes grøften alltid av ADK-personell der det er behov?' },
      { id: 'q4', question: 'Sikres området rundt gravemaskinen ved gravemaskinarbeid i trafikkerte områder?' },
    ]
  },
  {
    id: 'sprengning',
    title: '23. Sprengningsarbeider',
    icon: Bomb,
    questions: [
      { id: 'q1', question: 'Er nødvendig personlig verneutstyr tilgjengelig ved sprengningsarbeider?' },
      { id: 'q2', question: 'Oppbevares sprengstoff i godkjente kasser?' },
      { id: 'q3', question: 'Sørger vi alltid for å være minst to mann når vi sprenger?' },
      { id: 'q4', question: 'Har vi gode rutiner for å varsle omgivelsene når vi sprenger?' },
      { id: 'q5', question: 'Har vi godkjent personell til å utføre sprengningsarbeid?' },
    ]
  },
  {
    id: 'adr',
    title: '24. ADR-transport / transport av farlig gods',
    icon: Truck,
    questions: [
      { id: 'q1', question: 'Er bedriften godkjent for ADR-transport?' },
      { id: 'q2', question: 'Er brannslukningsutstyr alltid tilpasset der ADR-gods fraktes?' },
    ]
  },
  {
    id: 'adr_uhell',
    title: '25. Uhell / ulykke ved ADR-transport',
    icon: AlertTriangle,
    questions: [
      { id: 'q1', question: 'Kjenner ADR-sjåfører til hvilke øyeblikkelige tiltak som skal utføres ved et eventuelt uhell / en ulykke?' },
      { id: 'q2', question: 'Er det alltid nødvendig utstyr for håndtering av ADR-ulykker tilgjengelig?' },
      { id: 'q3', question: 'Rapporterte ADR-ulykker skal alltid revideres for å forhindre gjentakelse. Følges dette?' },
      { id: 'q4', question: 'Har vi gode rutiner for å forhindre at ADR-ulykker / uhell skjer?' },
    ]
  },
  {
    id: 'ergonomi_kjoretoy',
    title: '26. Ergonomi i store kjøretøy',
    icon: Car,
    questions: [
      { id: 'q1', question: 'Er det registrert plager mtp. utformingen av førerplassene i våre maskiner?' },
    ]
  },
  {
    id: 'hviletid',
    title: '27. Kjøre- og hviletid',
    icon: Clock,
    questions: [
      { id: 'q1', question: 'Blir eventuelle avvik fra kjøre- og hviletiden umiddelbart tatt opp med rette vedkommende?' },
      { id: 'q2', question: 'Sjekkes ferdskrivere og skiver jevnlig for å avdekke avvik fra bestemmelsene?' },
      { id: 'q3', question: 'Holdes kjøre- og hviletider i henhold til forskriftens krav?' },
    ]
  },
  {
    id: 'annet',
    title: '28. Andre ting som bør kartlegges',
    subtitle: 'angående de fysiske arbeidsforholdene',
    icon: FileQuestion,
    questions: []
  },
];

function initializeChecklistAnswers(): ChecklistAnswers {
  const answers: ChecklistAnswers = {};
  sections.forEach(section => {
    answers[section.id] = {};
    section.questions.forEach(q => {
      answers[section.id][q.id] = { answer: '', comment: '' };
    });
  });
  return answers;
}

const FysiskeArbeidsforholdForm = () => {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    date: new Date().toISOString().split('T')[0],
    participants: '',
    auditor: '',
    checklistAnswers: initializeChecklistAnswers(),
    otherComments: '',
    auditorSignature: '',
    managerSignature: '',
  });

  const updateChecklistAnswer = (sectionId: string, questionId: string, field: 'answer' | 'comment', value: string) => {
    setFormData(prev => ({
      ...prev,
      checklistAnswers: {
        ...prev.checklistAnswers,
        [sectionId]: {
          ...prev.checklistAnswers[sectionId],
          [questionId]: {
            ...prev.checklistAnswers[sectionId][questionId],
            [field]: value
          }
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    toast.success('Kartlegging av fysiske arbeidsforhold lagret');
  };

  const renderChecklistSection = (section: typeof sections[0]) => {
    const SectionIcon = section.icon;
    
    return (
      <Card key={section.id} className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SectionIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.subtitle && (
                <CardDescription>{section.subtitle}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.questions.length > 0 ? (
            section.questions.map((q, index) => (
              <div key={q.id} className="space-y-3 pb-4 border-b border-border last:border-0 last:pb-0">
                <p className="font-medium text-sm">{index + 1}. {q.question}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <RadioGroup
                    value={formData.checklistAnswers[section.id]?.[q.id]?.answer || ''}
                    onValueChange={(value) => updateChecklistAnswer(section.id, q.id, 'answer', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${section.id}-${q.id}-yes`} />
                      <Label htmlFor={`${section.id}-${q.id}-yes`} className="text-sm">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${section.id}-${q.id}-no`} />
                      <Label htmlFor={`${section.id}-${q.id}-no`} className="text-sm">Nei</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id={`${section.id}-${q.id}-na`} />
                      <Label htmlFor={`${section.id}-${q.id}-na`} className="text-sm">Ikke aktuelt</Label>
                    </div>
                  </RadioGroup>
                  <Input
                    placeholder="Kommentar"
                    value={formData.checklistAnswers[section.id]?.[q.id]?.comment || ''}
                    onChange={(e) => updateChecklistAnswer(section.id, q.id, 'comment', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            ))
          ) : (
            <Textarea
              placeholder="Skriv inn andre ting som bør kartlegges..."
              value={formData.otherComments}
              onChange={(e) => setFormData(prev => ({ ...prev, otherComments: e.target.value }))}
              rows={4}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Kartlegging av fysiske arbeidsforhold</CardTitle>
          <CardDescription>
            Kartlegging av bedriftens fysiske arbeidsforhold i.h.t. Arbeidsmiljøloven
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Bedriftsnavn</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Dato</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">Deltakere</Label>
            <Input
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditor">Utført av</Label>
            <Input
              id="auditor"
              value={formData.auditor}
              onChange={(e) => setFormData(prev => ({ ...prev, auditor: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* All Checklist Sections */}
      {sections.map(section => renderChecklistSection(section))}

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signaturer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auditorSignature">Kartleggers signatur</Label>
            <Input
              id="auditorSignature"
              value={formData.auditorSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, auditorSignature: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerSignature">Daglig leders signatur</Label>
            <Input
              id="managerSignature"
              value={formData.managerSignature}
              onChange={(e) => setFormData(prev => ({ ...prev, managerSignature: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Lagre kartlegging
        </Button>
      </div>
    </form>
  );
};

export default FysiskeArbeidsforholdForm;
