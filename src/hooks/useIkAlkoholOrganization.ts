import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlkoholOrganization {
  id: string;
  company_id: string;
  license_id: string | null;
  role_type: string;
  user_id: string | null;
  employee_name: string;
  phone: string | null;
  email: string | null;
  responsibilities: string[] | null;
  is_active: boolean;
  confirmed_at: string | null;
  confirmed_signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftResponsibility {
  id: string;
  company_id: string;
  shift_date: string;
  shift_time: string | null;
  styrer_id: string | null;
  styrer_name: string;
  stedfortreder_id: string | null;
  stedfortreder_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_TYPES = [
  { 
    value: 'bevillingshaver', 
    label: 'Bevillingshaver', 
    description: 'Juridisk ansvar for bevillingen',
    responsibilities: [
      'Juridisk ansvar for at driften er i samsvar med alkoholloven',
      'Ansvar for at internkontrollen er etablert og følges',
      'Ansvar for å melde endringer til kommunen',
    ]
  },
  { 
    value: 'daglig_leder', 
    label: 'Daglig leder', 
    description: 'Operativt ansvar for virksomheten',
    responsibilities: [
      'Daglig oppfølging av driften',
      'Ansvar for at rutiner følges',
      'Personalansvar',
    ]
  },
  { 
    value: 'styrer', 
    label: 'Styrer', 
    description: 'Ansvarlig for skjenkebevillingen',
    responsibilities: [
      'Ansvar for at skjenking skjer forsvarlig',
      'Tilstede eller tilgjengelig i åpningstiden',
      'Opplæringsansvar for ansatte',
      'Ansvar for hendelseslogg',
    ]
  },
  { 
    value: 'stedfortreder', 
    label: 'Stedfortreder', 
    description: 'Stedfortreder for styrer',
    responsibilities: [
      'Trer inn når styrer ikke er tilstede',
      'Samme ansvar som styrer i styrers fravær',
      'Holdes oppdatert på rutiner og hendelser',
    ]
  },
  { 
    value: 'skjenkeansvarlig', 
    label: 'Skjenkeansvarlig (vakt)', 
    description: 'Ansvarlig for skjenking på aktuell vakt',
    responsibilities: [
      'Kontrollere at alderskontroll gjennomføres',
      'Sikre at påvirkede ikke serveres',
      'Rapportere hendelser til styrer',
    ]
  },
  { 
    value: 'kasseansvarlig', 
    label: 'Kasseansvarlig', 
    description: 'Ansvarlig for kasse ved salgssted',
    responsibilities: [
      'Gjennomføre alderskontroll ved salg',
      'Følge kasseprompt for alkoholvarer',
      'Avvise salg til mindreårige/påvirkede',
    ]
  },
  { 
    value: 'vaktsjef', 
    label: 'Vaktsjef / Ordensvakt', 
    description: 'Ansvarlig for orden og sikkerhet',
    responsibilities: [
      'Inngangskontroll og aldersverifisering',
      'Konflikthåndtering',
      'Bortvisning av uønskede gjester',
      'Samarbeid med politi ved behov',
    ]
  },
  { 
    value: 'bartender', 
    label: 'Bartender', 
    description: 'Hovedansvarlig for bardrift og drinktilberedning',
    responsibilities: [
      'Blande drinker og ta imot bestillinger',
      'Anbefale drikkevarer til gjester',
      'Sørge for at baren er ren og ryddig',
      'Gjennomføre alderskontroll ved servering',
    ]
  },
  { 
    value: 'barback', 
    label: 'Barback (Assistent)', 
    description: 'Støtterolle som sikrer effektiv bardrift',
    responsibilities: [
      'Sørge for at bartenderne har nok is, glass, garnityr og drikkevarer',
      'Rydde glass og assistere med oppvask',
      'Etterfylle forsyninger under travle perioder',
    ]
  },
  { 
    value: 'servitor', 
    label: 'Servitør / Bar Staff', 
    description: 'Ansvarlig for bordbetjening og servering',
    responsibilities: [
      'Ta imot bestillinger ved bordene',
      'Servere drikke og mat',
      'Rydde bord og holde serveringsområdet rent',
      'Gjennomføre alderskontroll ved bestilling',
    ]
  },
  { 
    value: 'barsjef', 
    label: 'Barsjef / Bar Manager', 
    description: 'Overordnet ansvar for barens drift',
    responsibilities: [
      'Utarbeide og administrere vaktlister',
      'Bestilling av varer og lagerstyring',
      'Menyutvikling og sortimentsplanlegging',
      'Personalansvar og opplæring av ansatte',
    ]
  },
  { 
    value: 'oppvaskhjelp', 
    label: 'Oppvaskhjelp / Glassvasker', 
    description: 'Ansvarlig for rent glass og utstyr',
    responsibilities: [
      'Holde glass og utstyr rent til enhver tid',
      'Sikre god flyt i glasshåndtering under travle perioder',
      'Sortere og vedlikeholde glassvaskmaskin',
    ]
  },
];

export const useIkAlkoholOrganization = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  // Organization roles
  const { data: organization = [], isLoading: isLoadingOrg } = useQuery({
    queryKey: ['ik-alkohol-organization', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_alkohol_organization')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('role_type');
      if (error) throw error;
      return data as AlkoholOrganization[];
    },
    enabled: !!companyId,
  });

  // Shift responsibilities
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ['ik-alkohol-shifts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_alkohol_shift_responsibilities')
        .select('*')
        .eq('company_id', companyId)
        .order('shift_date', { ascending: false });
      if (error) throw error;
      return data as ShiftResponsibility[];
    },
    enabled: !!companyId,
  });

  const createRole = useMutation({
    mutationFn: async (role: {
      role_type: string;
      employee_name: string;
      phone?: string;
      email?: string;
      responsibilities?: string[];
      license_id?: string;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase
        .from('ik_alkohol_organization')
        .insert({
          company_id: companyId,
          ...role,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-organization'] });
      toast.success('Rolle opprettet');
    },
    onError: () => toast.error('Kunne ikke opprette rolle'),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholOrganization> & { id: string }) => {
      const { data, error } = await supabase
        .from('ik_alkohol_organization')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-organization'] });
      toast.success('Rolle oppdatert');
    },
    onError: () => toast.error('Kunne ikke oppdatere rolle'),
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_alkohol_organization')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-organization'] });
      toast.success('Rolle fjernet');
    },
    onError: () => toast.error('Kunne ikke fjerne rolle'),
  });

  const confirmRole = useMutation({
    mutationFn: async ({ id, signature }: { id: string; signature: string }) => {
      const { data, error } = await supabase
        .from('ik_alkohol_organization')
        .update({
          confirmed_at: new Date().toISOString(),
          confirmed_signature: signature,
        } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-organization'] });
      toast.success('Rolle bekreftet med signatur');
    },
    onError: () => toast.error('Kunne ikke bekrefte rolle'),
  });

  // Shift operations
  const createShift = useMutation({
    mutationFn: async (shift: {
      shift_date: string;
      shift_time?: string;
      styrer_name: string;
      styrer_id?: string;
      stedfortreder_name?: string;
      stedfortreder_id?: string;
      notes?: string;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase
        .from('ik_alkohol_shift_responsibilities')
        .insert({
          company_id: companyId,
          ...shift,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-shifts'] });
      toast.success('Vaktplan registrert');
    },
    onError: () => toast.error('Kunne ikke registrere vaktplan'),
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_alkohol_shift_responsibilities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-shifts'] });
      toast.success('Vaktplan slettet');
    },
    onError: () => toast.error('Kunne ikke slette vaktplan'),
  });

  return {
    organization,
    shifts,
    isLoading: isLoadingOrg || isLoadingShifts,
    createRole,
    updateRole,
    deleteRole,
    confirmRole,
    createShift,
    deleteShift,
  };
};
