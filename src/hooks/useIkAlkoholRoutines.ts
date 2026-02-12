import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlkoholRoutine {
  id: string;
  company_id: string;
  category: string;
  venue_type: string | null;
  routine_name: string;
  description: string | null;
  content: string;
  is_mandatory: boolean;
  is_active: boolean;
  sort_order: number;
  last_reviewed_at: string | null;
  reviewed_by_id: string | null;
  reviewed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export const ROUTINE_CATEGORIES = [
  { value: 'alderskontroll', label: 'Alderskontroll', icon: 'IdCard' },
  { value: 'pavirket', label: 'Åpenbart påvirket / nekt', icon: 'Ban' },
  { value: 'konflikt', label: 'Konflikthåndtering', icon: 'Shield' },
  { value: 'risikoperioder', label: 'Risikoperioder / drift', icon: 'Clock' },
  { value: 'medbrakt', label: 'Medbrakt alkohol / rusmidler', icon: 'Package' },
  { value: 'skilting', label: 'Skilting og informasjon', icon: 'FileText' },
  { value: 'dokumentasjon', label: 'Dokumentasjon og revisjon', icon: 'ClipboardList' },
];

export const VENUE_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'nattklubb', label: 'Nattklubb' },
  { value: 'hotell', label: 'Hotell' },
  { value: 'event', label: 'Event/Festival' },
  { value: 'butikk', label: 'Butikk (salg)' },
];

export const DEFAULT_ROUTINES: Omit<AlkoholRoutine, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'last_reviewed_at' | 'reviewed_by_id' | 'reviewed_by_name'>[] = [
  // Alderskontroll
  {
    category: 'alderskontroll',
    venue_type: null,
    routine_name: 'Legitimasjonskontroll',
    description: 'Rutine for når og hvordan legitimasjon skal kreves',
    content: `## Når skal legitimasjon kreves?
- Alle som ser ut til å være under 25 år skal alltid spørres om legitimasjon
- Ved minste tvil - spør alltid

## Godkjent legitimasjon
- Norsk pass
- Norsk førerkort
- Nasjonalt ID-kort med bilde
- Bankkort med bilde (norsk)

## Kontroll av legitimasjon
1. Sjekk at bildet stemmer med personen
2. Kontroller fødselsdato nøye
3. Sjekk utløpsdato - ugyldig legitimasjon aksepteres ikke
4. Hold kortet opp mot lyset for å se sikkerhetsmerker
5. Ved tvil - avvis salg/servering

## Ved falsk legitimasjon
- Dokumentet skal ikke konfiskeres
- Noter hendelsen i logg
- Vurder å kontakte politi`,
    is_mandatory: false,
    is_active: true,
    sort_order: 1,
  },
  {
    category: 'alderskontroll',
    venue_type: 'event',
    routine_name: 'Armbånd/stempel ved arrangement',
    description: 'Rutine for aldersmerking ved arrangementer',
    content: `## Formål
Sikre effektiv alderskontroll ved store arrangementer

## Prosedyre
1. Alderskontroll utføres ved inngang
2. Personer over 18 år får armbånd/stempel
3. Armbånd skal være vanskelig å fjerne og overføre
4. Ulike farger for 18+ og 20+ hvis aktuelt

## Barpersonalet
- Ingen servering uten armbånd
- Armbånd kontrolleres ved hver bestilling
- Ødelagt/manglende armbånd = ny legitimasjonskontroll`,
    is_mandatory: false,
    is_active: true,
    sort_order: 2,
  },
  // Åpenbart påvirket
  {
    category: 'pavirket',
    venue_type: null,
    routine_name: 'Identifisering av beruselse',
    description: 'Tegn på åpenbar påvirkning og vurdering',
    content: `## Tegn på åpenbar påvirkning

### Fysiske tegn
- Ustø gange, vaklende
- Glassaktige/røde øyne
- Sløret tale
- Problemer med motorikk (søler, taper ting)
- Lukt av alkohol

### Atferdsmessige tegn
- Høylytt, aggressiv eller upassende oppførsel
- Problemer med å fokusere
- Gjentatte bestillinger på kort tid
- Sovner/dupper av

## Vurdering
Ved tvil om påvirkning - stopp servering og konsulter med kollega eller leder`,
    is_mandatory: false,
    is_active: true,
    sort_order: 1,
  },
  {
    category: 'pavirket',
    venue_type: null,
    routine_name: 'Nektelse av servering/salg',
    description: 'Hvordan avvise påvirkede gjester profesjonelt',
    content: `## Kommunikasjon
Vær alltid:
- Rolig og bestemt
- Høflig men tydelig
- Ikke moraliserende

### Eksempelsetninger
- "Jeg beklager, men jeg kan dessverre ikke servere deg mer i kveld"
- "Vi har et ansvar for alle våre gjester, og jeg ser at du har fått nok"
- "Kan jeg bestille en taxi til deg?"

## Praktisk håndtering
1. Tilby vann og noe å spise
2. Tilby å bestille taxi
3. Sørg for at gjesten kommer seg trygt hjem
4. Informer kolleger om avslaget

## Ved allerede betalt
- Tilby refusjon eller byttekvittering
- Dokumenter i hendelseslogg`,
    is_mandatory: false,
    is_active: true,
    sort_order: 2,
  },
  // Konflikt
  {
    category: 'konflikt',
    venue_type: null,
    routine_name: 'Konfliktnedtrapping',
    description: 'Trinnvis håndtering av konfliktsituasjoner',
    content: `## Trinn 1: Forebygging
- Vær observant på stemningen
- Grip inn tidlig ved tegn på uro
- Skill gjester som virker anspente

## Trinn 2: De-eskalering
- Snakk rolig med lav stemme
- Lytt aktivt til gjesten
- Vis forståelse uten å gi etter
- Tilby løsninger ("La oss finne en løsning")

## Trinn 3: Advarsel
- Gi klar beskjed om konsekvenser
- "Hvis du ikke roer deg, må vi be deg forlate stedet"

## Trinn 4: Bortvisning
- Gjennomfør rolig og bestemt
- Følg gjesten til utgangen
- Dokumenter hendelsen

## Trinn 5: Ekstern hjelp
- Ring vaktselskap/politi ved behov
- Prioriter alltid sikkerheten til ansatte og andre gjester`,
    is_mandatory: false,
    is_active: true,
    sort_order: 1,
  },
  // Risikoperioder
  {
    category: 'risikoperioder',
    venue_type: null,
    routine_name: 'Bemanning i høyrisikoperioder',
    description: 'Ekstra tiltak ved høy aktivitet',
    content: `## Høyrisikoperioder
- Fredag og lørdag kveld/natt
- Julebordsesong (november-desember)
- Nyttårsaften
- Store sportsarrangementer
- Lokale festivaler/events

## Tiltak
- Økt bemanning (minimum 2 på bar)
- Dedikert dørvakt/ordensvakt
- Hyppigere runder i lokalet
- Kortere intervaller mellom serveringsstopp-vurderinger
- Ledelse/styrer tilgjengelig på telefon

## Shots/runder-policy
- Maks 2 shots per person per bestilling
- Ingen "runder til bordet" uten alderskontroll av alle`,
    is_mandatory: false,
    is_active: true,
    sort_order: 1,
  },
  // Skilting
  {
    category: 'skilting',
    venue_type: null,
    routine_name: 'Påkrevd skilting',
    description: 'Obligatoriske oppslag og informasjon',
    content: `## Påkrevde skilt (synlig for gjester)

### Ved inngang
- "Vi krever gyldig legitimasjon ved minste tvil"
- "Åpenbart berusede personer nektes adgang/servering"

### I serveringsområdet
- Aldersgrense for alkoholservering (18/20 år)
- "Falskt ID anmeldes til politiet"

### Ved kasse (salgssted)
- Aldersgrense for alkoholsalg
- Salgstider

## Interne oppslag (personalrom/bak bar)
- Rutinekort for legitimasjonskontroll
- Kontaktliste (styrer, vakt, politi, ambulanse)
- Eskaleringsprosedyre`,
    is_mandatory: false,
    is_active: true,
    sort_order: 1,
  },
  // Dokumentasjon
  {
    category: 'dokumentasjon',
    venue_type: null,
    routine_name: 'Årlig revisjon av internkontroll',
    description: 'Gjennomgang og oppdatering av IK-system',
    content: `## Årlig revisjon

### Hvem deltar
- Daglig leder
- Styrer/stedfortreder
- HMS-ansvarlig (hvis relevant)

### Gjennomgang
1. Er alle rutiner oppdaterte og relevante?
2. Har det vært hendelser som krever rutineendring?
3. Er all opplæring gjennomført?
4. Er bevillingsdokumenter oppdatert?

### Dokumentasjon
- Dato for revisjon
- Deltakere
- Endringer gjort
- Signatur fra ansvarlig

### Oppbevaring
- Revisjonslogg oppbevares i minimum 3 år
- Tilgjengelig for kommunal kontroll`,
    is_mandatory: false,
    is_active: true,
    sort_order: 1,
  },
];

export const useIkAlkoholRoutines = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['ik-alkohol-routines', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_alkohol_routines')
        .select('*')
        .eq('company_id', companyId)
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as AlkoholRoutine[];
    },
    enabled: !!companyId,
  });

  const createRoutine = useMutation({
    mutationFn: async (routine: {
      company_id: string;
      category: string;
      routine_name: string;
      content: string;
      description?: string;
      venue_type?: string | null;
      is_mandatory?: boolean;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('ik_alkohol_routines')
        .insert(routine as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-routines'] });
      toast.success('Rutine opprettet');
    },
    onError: () => toast.error('Kunne ikke opprette rutine'),
  });

  const updateRoutine = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholRoutine> & { id: string }) => {
      const { data, error } = await supabase
        .from('ik_alkohol_routines')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-routines'] });
      toast.success('Rutine oppdatert');
    },
    onError: () => toast.error('Kunne ikke oppdatere rutine'),
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_alkohol_routines')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-routines'] });
      toast.success('Rutine slettet');
    },
    onError: () => toast.error('Kunne ikke slette rutine'),
  });

  const initializeDefaultRoutines = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const routinesToInsert = DEFAULT_ROUTINES.map(r => ({
        ...r,
        company_id: companyId,
      }));
      const { error } = await supabase
        .from('ik_alkohol_routines')
        .insert(routinesToInsert as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-routines'] });
      toast.success('Standardrutiner lagt til');
    },
    onError: () => toast.error('Kunne ikke legge til standardrutiner'),
  });

  return {
    routines,
    isLoading,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    initializeDefaultRoutines,
  };
};
