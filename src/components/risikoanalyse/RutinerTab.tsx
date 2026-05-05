import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Library, 
  ChevronDown, 
  ChevronRight,
  Search,
  Edit,
  Check,
  X,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface RoutineItem {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

// Predefined routines library based on Norwegian HMS standards
const PREDEFINED_ROUTINES: Omit<RoutineItem, 'id'>[] = [
  {
    routine_number: "1160",
    routine_name: "Arbeidsulykker og Skader",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre rask og korrekt håndtering av arbeidsulykker og skader for å minimere skadeomfang og ivareta helse og sikkerhet for alle ansatte.",
    responsibility: "Daglig leder har overordnet ansvar for at alle skader rapporteres og håndteres i tråd med rutinen.\n\nVerneombud og eventuelt leder på arbeidsstedet har ansvar for oppfølging på stedet.",
    procedure: `Rapportering av arbeidsulykker og skader
• Alle ansatte skal umiddelbart rapportere arbeidsulykker og skader til nærmeste leder.
• Avviksskjema fylles ut for å registrere ulykken eller skaden i HMS-systemet.

Førstehjelp og øyeblikkelige tiltak
• Gi nødvendig førstehjelp på stedet.
• Ved alvorlige skader, kontakt legevakt eller nødnummer 113 umiddelbart.

Undersøkelse og dokumentasjon
• Leder eller verneombud dokumenterer hendelsen (årsak, tidspunkt, skadens omfang, eventuelle vitner).
• Utfør undersøkelse for å fastslå årsak og identifisere tiltak som kan forhindre lignende hendelser.

Iverksetting av forebyggende tiltak
• Implementer forebyggende tiltak basert på resultatene fra undersøkelsen.
• Informer ansatte om tiltakene og oppdater relevante rutiner ved behov.

Oppfølging av skader og sykefravær
• Følg opp skadede ansatte og legg til rette for tilbakeføring til arbeid der det er mulig.
• Dokumenter sykefravær og eventuelle tilpasninger i HMS-systemet.`,
    examples: `• Kuttskader fra verktøy
• Fall- eller skliulykker
• Støt- og klemskader
• Eksponering for farlige kjemikalier
• Brannskader`,
    remember: "Alle arbeidsulykker og skader skal rapporteres og følges opp for å skape en trygg arbeidsplass og forhindre fremtidige hendelser.",
    is_predefined: true
  },
  {
    routine_number: "1121",
    routine_name: "Avvikshåndtering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at avvik i arbeidsprosesser identifiseres, rapporteres og behandles effektivt for å forbedre arbeidsmiljøet og redusere risiko for fremtidige hendelser.",
    responsibility: "Alle ansatte er ansvarlige for å rapportere avvik.\n\nLeder eller daglig leder har ansvar for oppfølging og iverksetting av tiltak.",
    procedure: `Identifisering av avvik
• Avvik er enhver uønsket hendelse, feil eller forhold som bryter med HMS-krav og prosedyrer.
• Ansatte skal rapportere avvik umiddelbart ved å fylle ut avviksskjema (digitalt eller papir).

Registrering av avvik
• Avviksskjema skal inneholde tidspunkt, sted, involverte personer og beskrivelse av avviket.
• Alle avvik registreres i HMS-systemet eller i HMS-perm (papirversjon).

Analyse og vurdering
• Leder eller daglig leder analyserer avviket for å identifisere årsaker og konsekvenser.
• Vurder om avviket krever umiddelbar handling eller inngår i rutinemessige forbedringstiltak.

Iverksetting av tiltak
• Foreslå og implementer tiltak for å korrigere og forhindre gjentakelse.
• Dokumenter tiltakene og informer relevante ansatte om endringer.

Oppfølging og læring
• Evaluer effekten av tiltakene gjennom oppfølging.
• Del erfaringer for å skape læring og forbedring i organisasjonen.`,
    examples: `• Manglende eller feil bruk av verneutstyr
• Feil lagring av kjemikalier eller farlige stoffer
• Brudd på sikkerhetsrutiner (f.eks. manglende merking av fareområder)
• Mangelfull opplæring i bruk av maskiner og utstyr
• Skader eller nestenulykker som kunne ført til skade
• Avvik fra fastsatte rutiner for renhold og hygiene`,
    remember: "Avvik skal alltid rapporteres for å sikre kontinuerlig forbedring og et trygt arbeidsmiljø.",
    is_predefined: true
  },
  {
    routine_number: "1150",
    routine_name: "Brannvern og Evakuering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte kjenner brannvernsrutiner og evakueringsprosedyrer for å kunne handle raskt og trygt ved brann eller andre nødsituasjoner.",
    responsibility: "Daglig leder har hovedansvar for brannvern og evakuering.\n\nBrannvernleder (hvis utpekt) har ansvar for brannøvelser og oppfølging av brannsikkerhetsutstyr.",
    procedure: `Opplæring i brannvern
• Alle ansatte skal ha grunnleggende opplæring i brannvern.
• Ansatte skal kjenne plassering av brannslokkingsutstyr, nødutganger og samlingsplass.
• Nyansatte får opplæring ved oppstart, og alle deltar i årlige brannøvelser.

Brannslokkingsutstyr og nødutganger
• Brannslukkere og annet utstyr skal være lett tilgjengelig og kontrolleres regelmessig.
• Nødutganger og rømningsveier skal holdes fri og være tydelig merket.

Evakueringsprosedyrer
• Ved brannalarm skal bygget evakueres umiddelbart til avtalt samlingsplass.
• Leder for hver avdeling skal sjekke at alle ansatte og besøkende er evakuert.

Brannøvelser
• Gjennomfør minst én brannøvelse årlig.
• Dokumenter øvelsen i HMS-systemet (dato, tid, funn og forbedringspunkter).

Oppfølging og vedlikehold av brannsikkerhet
• Utfør jevnlig kontroll og vedlikehold av brannslukkingsutstyr, røykvarslere og skilt.
• Registrer avvik i avviksskjema ved mangler på utstyr eller rutiner.`,
    examples: `• Brann i bygningen
• Røykutvikling
• Gasslekkasje
• Annen fare som krever evakuering`,
    remember: "Brannvern og evakueringsrutiner er kritiske for å beskytte liv og helse. Alle ansatte skal kjenne rutinene og vite hvordan de skal reagere.",
    is_predefined: true
  },
  {
    routine_number: "1180",
    routine_name: "Bruk av Verneutstyr",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte bruker nødvendig verneutstyr for å beskytte seg mot skader og farer i arbeidsmiljøet.",
    responsibility: "Daglig leder skal sikre at relevant verneutstyr er tilgjengelig og at ansatte får opplæring i bruk.\n\nVerneombud skal påse at verneutstyr brukes korrekt i det daglige.",
    procedure: `Identifisering av behov for verneutstyr
• Gjennomfør risikovurderinger for å identifisere krav til verneutstyr (hjelm, briller, hansker, hørselsvern m.m.).
• Oppdater behovet ved endringer i arbeidsoppgaver eller arbeidsmiljø.

Tilgjengelighet og kontroll
• Verneutstyr skal være lett tilgjengelig på relevante arbeidssteder.
• Utfør regelmessig kontroll og erstatt defekt utstyr umiddelbart.

Opplæring i bruk av verneutstyr
• Gi opplæring i korrekt bruk, vedlikehold og oppbevaring.
• Gjennomfør jevnlige oppfriskningskurs.

Påbud om bruk
• Ansatte skal benytte riktig verneutstyr ved risikofylte arbeidsoppgaver.
• Manglende bruk følges opp og korrigeres.

Rapportering av avvik
• Rapporter manglende bruk, defekt utstyr eller andre avvik via avviksskjema.
• Iverksett nødvendige tiltak.`,
    examples: `• Hodevern: hjelm
• Øyevern: vernebriller
• Hørselsvern: ørepropper eller hørselvern
• Håndvern: hansker
• Åndedrettsvern: masker`,
    remember: "Bruk av verneutstyr er obligatorisk. Alle skal bruke utstyret riktig og rapportere avvik.",
    is_predefined: true
  },
  {
    routine_number: "1210",
    routine_name: "Hygiene og Renhold",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Opprettholde god hygiene og renhold for å sikre et trygt, sunt og hygienisk arbeidsmiljø og redusere risiko for smittespredning.",
    responsibility: "Daglig leder har ansvar for at rutiner følges og at nødvendige ressurser er tilgjengelige.\n\nRenholdspersonell eller utpekte ansatte utfører renholdsoppgaver.",
    procedure: `Planlegging av renhold
• Utarbeid renholdsplan for alle områder, inkludert frekvens og metode.
• Egen plan for områder med særskilte krav (mat, helse m.m.).

Gjennomføring av renhold
• Utfør renhold i henhold til plan, inkludert daglig rengjøring av fellesområder, sanitær og kontaktflater.
• Bruk egnede rengjøringsmidler og følg sikkerhetsanvisninger.

Hygienetiltak for ansatte
• Oppfordre til god personlig hygiene og regelmessig håndvask.
• Sørg for tilgang til håndvask, såpe og tørkemuligheter.

Avfallshåndtering
• Søppel og avfall fjernes regelmessig og håndteres i henhold til miljøkrav.
• Søppelbøtter med lokk plasseres i fellesområder og tømmes daglig.

Rapportering av mangler
• Rapporter mangler innen hygiene og renhold via avviksskjema.
• Iverksett nødvendige tiltak.`,
    examples: `• Daglig rengjøring av arbeidsflater
• Regelmessig tømming av søppel
• Hånddesinfeksjonsstasjoner
• Daglig rengjøring av sanitærfasiliteter
• Rengjøring av kontaktpunkter`,
    remember: "God hygiene og renhold er grunnleggende for et trygt arbeidsmiljø. Alle ansatte skal bidra og rapportere mangler.",
    is_predefined: true
  },
  {
    routine_number: "1240",
    routine_name: "Førstehjelp",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte har grunnleggende kunnskap i førstehjelp og kan handle raskt og riktig ved ulykker eller skader.",
    responsibility: "Daglig leder skal sikre at førstehjelpsrutiner er på plass og at ansatte får opplæring.\n\nVerneombud skal påse at førstehjelpsutstyr er tilgjengelig og i god stand.",
    procedure: `Opplæring i førstehjelp
• Alle ansatte skal få grunnleggende førstehjelpsopplæring, inkludert HLR.
• Tilby jevnlige oppfriskningskurs.

Plassering og tilgjengelighet av utstyr
• Førstehjelpsutstyr og hjertestarter (der dette finnes) skal være lett tilgjengelig.
• Utpek ansvarlig per avdeling for kontroll av utstyret.

Håndtering av ulykker og skader
• Gi førstehjelp i henhold til opplæring.
• Ring 113 ved alvorlige skader eller kritisk tilstand.

Dokumentasjon og oppfølging
• Hendelser som krever førstehjelp dokumenteres i HMS-system eller avviksskjema.
• Følg opp den skadde ved behov.

Årlig kontroll av førstehjelpsutstyr
• Gjennomfør minst årlig kontroll av alt førstehjelpsutstyr.
• Erstatt brukt eller utgått utstyr.`,
    examples: `• Utføre HLR
• Stoppe blødninger
• Behandle sår og småskader
• Gi støtte og ro til skadet person`,
    remember: "Rask førstehjelp kan redde liv og redusere skadeomfang. Alle ansatte skal vite hvor utstyret er og ha grunnleggende ferdigheter.",
    is_predefined: true
  },
  {
    routine_number: "1270",
    routine_name: "EL-kontroll",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at elektriske anlegg og elektrisk utstyr kontrolleres regelmessig for å forebygge brann, personskader og driftsavbrudd, samt sikre etterlevelse av gjeldende lover og forskrifter.",
    responsibility: `Daglig leder / virksomhetsleder
Overordnet ansvar for at EL-kontroll gjennomføres.

IK-/HMS-ansvarlig
Planlegging, oppfølging og dokumentasjon av EL-kontroll.

Sertifisert elektrovirksomhet / kontrollør
Utfører EL-kontroll i henhold til gjeldende krav.`,
    procedure: `Omfang
Rutinen gjelder for:
• Alle faste elektriske installasjoner i virksomheten
• Elektrisk utstyr og maskiner tilkoblet anlegget
• Midlertidige installasjoner der dette er relevant

Grunnlag og regelverk
EL-kontroll utføres i henhold til:
• Internkontrollforskriften
• Forskrift om elektriske lavspenningsanlegg (FEL)
• NEK 405
• Krav fra myndigheter og forsikringsselskap

Frekvens
EL-kontroll gjennomføres minimum hvert 3.–5. år, eller oftere ved:
• Endringer i det elektriske anlegget
• Registrerte avvik eller hendelser
• Krav fra forsikringsselskap eller myndigheter

Gjennomføring
• EL-kontroll planlegges og avtales med kvalifisert elektrovirksomhet
• Nødvendig tilgang til anlegget sikres
• Kontrollør gjennomfører visuell kontroll, målinger og tester

Nettbasert EL-kontrollskjema
Internkontrollsystemet Total-IK inneholder et nettbasert skjema for EL-kontroll, tilgjengelig under «HMS-Aktiviteter».
Skjemaet benyttes til å:
• Dokumentere tilstanden på det elektriske anlegget i lokalet eller området kontrollen gjelder
• Registrere dato, kontrollør og kontrollomfang
• Beskrive avvik, mangler og risikoforhold
• Legge ved bilder og kommentarer
• Følge opp tiltak med ansvarlig person og frist

Det nettbaserte skjemaet kan:
• Lastes ned og arkiveres lokalt
• Legges inn som vedlegg i virksomhetens HMS-/IK-håndbok

Dette sikrer helhetlig dokumentasjon, sporbarhet og tilgjengelighet ved revisjon, tilsyn eller forsikringskontroll.

Avvik og tiltak
• Avvik registreres og følges opp i internkontrollsystemet
• Tiltak tildeles ansvarlig person med frist
• Avvik lukkes og dokumenteres før kontrollen anses som fullført

Dokumentasjon
Følgende dokumentasjon lagres i internkontrollsystemet:
• Utfylt nettbasert EL-kontrollskjema
• Kontrollrapporter
• Avviks- og tiltaksoversikt
• Dokumentasjon på utbedringer og samsvarserklæringer
Dokumentasjon oppbevares i minimum 5 år.`,
    examples: `• Kontroll av sikringsskap og tavler
• Kontroll av faste installasjoner (stikkontakter, brytere, kabler)
• Kontroll av elektrisk utstyr og maskiner
• Kontroll av dokumentasjon og samsvarserklæringer
• Termografering av elektriske anlegg`,
    remember: "EL-kontroll er lovpålagt og kritisk for brannsikkerhet. Rutinen gjennomgås årlig og oppdateres ved endringer i regelverk eller risikoforhold.",
    is_predefined: true
  }
];

const CATEGORIES = [
  "Helse, Miljø og Sikkerhet",
  "Kvalitetssikring",
  "Personaladministrasjon",
  "Generelt",
];

export const RutinerTab = () => {
  const { profile } = useAuth();
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile?.company_id) {
      fetchRoutines();
    }
  }, [profile?.company_id]);

  const fetchRoutines = async () => {
    if (!profile?.company_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_routines")
        .select("*")
        .eq("company_id", profile.company_id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching routines:", error);
        return;
      }

      if (data?.routines) {
        const routinesArray = Array.isArray(data.routines) ? data.routines : [];
        setRoutines(routinesArray as unknown as RoutineItem[]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.company_id) return;
    
    try {
      setSaving(true);
      
      // Check if record exists first
      const { data: existing } = await supabase
        .from("company_routines")
        .select("id")
        .eq("company_id", profile.company_id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("company_routines")
          .update({
            routines: JSON.parse(JSON.stringify(routines)),
            updated_at: new Date().toISOString()
          })
          .eq("company_id", profile.company_id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("company_routines")
          .insert([{
            company_id: profile.company_id,
            routines: JSON.parse(JSON.stringify(routines))
          }]);
        
        if (error) throw error;
      }
      
      setHasChanges(false);
      toast.success("Rutiner lagret");
    } catch (err) {
      console.error("Error saving routines:", err);
      toast.error("Kunne ikke lagre rutiner");
    } finally {
      setSaving(false);
    }
  };

  const addNewRoutine = () => {
    const newRoutine: RoutineItem = {
      id: crypto.randomUUID(),
      routine_number: `R${(routines.length + 1).toString().padStart(3, '0')}`,
      routine_name: "Ny rutine",
      category: "Helse, Miljø og Sikkerhet",
      purpose: "",
      responsibility: "",
      procedure: "",
      examples: "",
      remember: "",
      is_predefined: false
    };
    setRoutines([...routines, newRoutine]);
    setExpandedRoutines(new Set([...expandedRoutines, newRoutine.id]));
    setEditingId(newRoutine.id);
    setHasChanges(true);
  };

  const addFromLibrary = (predefined: Omit<RoutineItem, 'id'>) => {
    const existingNumbers = routines.map(r => r.routine_number);
    if (existingNumbers.includes(predefined.routine_number)) {
      toast.error("Denne rutinen er allerede lagt til");
      return;
    }
    
    const newRoutine: RoutineItem = {
      ...predefined,
      id: crypto.randomUUID()
    };
    setRoutines([...routines, newRoutine]);
    setExpandedRoutines(new Set([...expandedRoutines, newRoutine.id]));
    setHasChanges(true);
    toast.success(`"${predefined.routine_name}" lagt til`);
  };

  const updateRoutine = (id: string, field: keyof RoutineItem, value: string) => {
    setRoutines(routines.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
    setHasChanges(true);
  };

  const deleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
    setHasChanges(true);
    toast.success("Rutine slettet");
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRoutines(newExpanded);
  };

  const filteredRoutines = routines.filter(r => 
    r.routine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.routine_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLibraryRoutines = PREDEFINED_ROUTINES.filter(r =>
    r.routine_name.toLowerCase().includes(librarySearch.toLowerCase()) ||
    r.category.toLowerCase().includes(librarySearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                HMS-rutiner
              </CardTitle>
              <CardDescription>
                Administrer bedriftens HMS-rutiner og prosedyrer
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Library className="h-4 w-4 mr-2" />
                    Rutinebibliotek
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Rutinebibliotek</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Søk i rutinebiblioteket..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {filteredLibraryRoutines.map((routine) => (
                          <Card key={routine.routine_number} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {routine.routine_number}
                                  </Badge>
                                  <span className="font-medium truncate">
                                    {routine.routine_name}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {routine.purpose}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => addFromLibrary(routine)}
                                disabled={routines.some(r => r.routine_number === routine.routine_number)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" onClick={addNewRoutine}>
                <Plus className="h-4 w-4 mr-2" />
                Ny rutine
              </Button>
              {hasChanges && (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Lagrer..." : "Lagre"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i rutiner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Routines list */}
      {filteredRoutines.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ingen rutiner</h3>
          <p className="text-muted-foreground mb-4">
            Legg til rutiner fra biblioteket eller opprett egne
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setLibraryOpen(true)}>
              <Library className="h-4 w-4 mr-2" />
              Åpne bibliotek
            </Button>
            <Button onClick={addNewRoutine}>
              <Plus className="h-4 w-4 mr-2" />
              Ny rutine
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRoutines.map((routine) => (
            <Card key={routine.id}>
              <Collapsible 
                open={expandedRoutines.has(routine.id)}
                onOpenChange={() => toggleExpanded(routine.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedRoutines.has(routine.id) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {routine.routine_number}
                            </Badge>
                            {routine.is_predefined && (
                              <Badge variant="secondary" className="text-xs">
                                Standard
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              {routine.category}
                            </Badge>
                          </div>
                          <h3 className="font-medium mt-1">{routine.routine_name}</h3>
                          {routine.responsibility && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              Ansvar: {routine.responsibility.split("\n")[0]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(editingId === routine.id ? null : routine.id)}
                        >
                          {editingId === routine.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRoutine(routine.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {editingId === routine.id ? (
                      // Edit mode
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Rutine-nummer</label>
                            <Input
                              value={routine.routine_number}
                              onChange={(e) => updateRoutine(routine.id, "routine_number", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Navn</label>
                            <Input
                              value={routine.routine_name}
                              onChange={(e) => updateRoutine(routine.id, "routine_name", e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Formål</label>
                          <Textarea
                            value={routine.purpose}
                            onChange={(e) => updateRoutine(routine.id, "purpose", e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Ansvar</label>
                          <Textarea
                            value={routine.responsibility}
                            onChange={(e) => updateRoutine(routine.id, "responsibility", e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Fremgangsmåte</label>
                          <Textarea
                            value={routine.procedure}
                            onChange={(e) => updateRoutine(routine.id, "procedure", e.target.value)}
                            rows={6}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Eksempler</label>
                          <Textarea
                            value={routine.examples}
                            onChange={(e) => updateRoutine(routine.id, "examples", e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Husk</label>
                          <Textarea
                            value={routine.remember}
                            onChange={(e) => updateRoutine(routine.id, "remember", e.target.value)}
                            rows={2}
                          />
                        </div>
                      </>
                    ) : (
                      // View mode
                      <>
                        {routine.purpose && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Formål</h4>
                            <p className="text-sm whitespace-pre-wrap">{routine.purpose}</p>
                          </div>
                        )}
                        {routine.responsibility && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Ansvar</h4>
                            <p className="text-sm whitespace-pre-wrap">{routine.responsibility}</p>
                          </div>
                        )}
                        {routine.procedure && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Fremgangsmåte</h4>
                            <p className="text-sm whitespace-pre-wrap">{routine.procedure}</p>
                          </div>
                        )}
                        {routine.examples && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Eksempler</h4>
                            <p className="text-sm whitespace-pre-wrap">{routine.examples}</p>
                          </div>
                        )}
                        {routine.remember && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Husk</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{routine.remember}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
