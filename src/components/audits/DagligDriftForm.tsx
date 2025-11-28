import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuditFormResponses, type AuditFormResponse } from '@/hooks/useAuditFormResponses';
import type { Json } from '@/integrations/supabase/types';
import SavedFormsList from './SavedFormsList';
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
  Save,
  Loader2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

type YesNoNa = 'yes' | 'no' | 'na' | '';

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

const DagligDriftForm = () => {
  const { company } = useAuth();
  const { responses, saveFormResponse, deleteFormResponse, isSaving } = useAuditFormResponses();
  const [existingId, setExistingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const getInitialFormData = (): FormData => ({
    companyName: company?.name || '',
    date: new Date().toISOString().split('T')[0],
    participants: '',
    auditor: '',
    checklistAnswers: initializeChecklistAnswers(),
    otherComments: '',
    auditorSignature: '',
    managerSignature: '',
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const formTypeResponses = responses.filter(r => r.form_type === "daglig_drift");

  const handleCreateNew = () => {
    setFormData(getInitialFormData());
    setExistingId(undefined);
    setShowForm(true);
  };

  const handleSelectResponse = (response: AuditFormResponse) => {
    if (response.form_data) {
      const savedData = response.form_data as unknown as FormData;
      setFormData({
        ...getInitialFormData(),
        ...savedData,
        companyName: savedData.companyName || company?.name || "",
      });
    }
    setExistingId(response.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFormResponse(id);
    if (existingId === id) {
      setExistingId(undefined);
      setShowForm(false);
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
  };

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

  const handleSaveDraft = async () => {
    await saveFormResponse(
      "daglig_drift",
      formData as unknown as Json,
      {
        revision_date: formData.date,
        participants: formData.participants,
        auditor_name: formData.auditor,
        manager_name: formData.managerSignature,
      },
      "draft",
      existingId
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveFormResponse(
      "daglig_drift",
      formData as unknown as Json,
      {
        revision_date: formData.date,
        participants: formData.participants,
        auditor_name: formData.auditor,
        manager_name: formData.managerSignature,
      },
      "completed",
      existingId
    );
    if (result) {
      setExistingId(result.id);
    }
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

  if (!showForm) {
    return (
      <SavedFormsList
        responses={formTypeResponses}
        onDelete={handleDelete}
        onSelect={handleSelectResponse}
        onCreateNew={handleCreateNew}
        isDeleting={isSaving}
        title="Daglig drift"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBackToList} className="gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Tilbake til oversikt
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Kartlegging av daglig drift</CardTitle>
            <CardDescription>
              Kartlegging av den daglige driften i bedriften
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

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" size="lg" className="gap-2" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lagre utkast
          </Button>
          <Button type="submit" size="lg" className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Fullfør og lagre i handbok
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DagligDriftForm;
