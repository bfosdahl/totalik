import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlkoholGoal {
  id: string;
  company_id: string;
  goal_text: string;
  description: string | null;
  kpi_metric: string | null;
  kpi_target: string | null;
  kpi_current: string | null;
  responsible_id: string | null;
  responsible_name: string | null;
  period: string | null;
  deadline: string | null;
  status: string;
  actions: string[] | null;
  is_predefined: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const GOAL_STATUSES = [
  { value: 'on_track', label: 'På sporet', color: 'bg-green-100 text-green-800' },
  { value: 'at_risk', label: 'Risiko', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'off_track', label: 'Avvik', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Fullført', color: 'bg-blue-100 text-blue-800' },
];

export const GOAL_PERIODS = [
  { value: 'monthly', label: 'Månedlig' },
  { value: 'quarterly', label: 'Kvartalsvis' },
  { value: 'yearly', label: 'Årlig' },
];

export const DEFAULT_GOALS: Omit<AlkoholGoal, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'responsible_id' | 'responsible_name'>[] = [
  {
    goal_text: '0 brudd på alderskontroll',
    description: 'Ingen tilfeller der mindreårige serveres eller selges alkohol',
    kpi_metric: 'Antall hendelser med mindreårig + tiltak',
    kpi_target: '0',
    kpi_current: null,
    period: 'yearly',
    deadline: null,
    status: 'on_track',
    actions: ['Skjerpe legitimasjonskontroll', 'Opplæring av nye ansatte'],
    is_predefined: true,
    sort_order: 1,
  },
  {
    goal_text: '0 skjenking til åpenbart påvirket',
    description: 'Ingen tilfeller der åpenbart påvirkede serveres',
    kpi_metric: 'Antall nekt-hendelser vs. avvik',
    kpi_target: '0 avvik',
    kpi_current: null,
    period: 'yearly',
    deadline: null,
    status: 'on_track',
    actions: ['Bevisstgjøring om tegn på beruselse', 'Tydelige retningslinjer for nektelse'],
    is_predefined: true,
    sort_order: 2,
  },
  {
    goal_text: '100% opplæring før første vakt',
    description: 'Alle ansatte skal ha fullført opplæring før de begynner å jobbe',
    kpi_metric: 'Opplæringsstatus per ansatt/rolle',
    kpi_target: '100%',
    kpi_current: null,
    period: 'yearly',
    deadline: null,
    status: 'on_track',
    actions: ['Etablere onboarding-program', 'Dokumentere opplæring'],
    is_predefined: true,
    sort_order: 3,
  },
  {
    goal_text: 'Hendelser loggføres innen 24 timer',
    description: 'Alle hendelser skal dokumenteres samme dag eller senest neste dag',
    kpi_metric: 'Andel hendelser logget innen frist',
    kpi_target: '100%',
    kpi_current: null,
    period: 'yearly',
    deadline: null,
    status: 'on_track',
    actions: ['Forenkle loggføring', 'Påminnelser til ansatte'],
    is_predefined: true,
    sort_order: 4,
  },
  {
    goal_text: 'Kvartalsvis revisjon gjennomført',
    description: 'Internkontroll gjennomgås minimum hvert kvartal',
    kpi_metric: 'Gjennomføringsgrad revisjoner',
    kpi_target: '4 per år',
    kpi_current: null,
    period: 'quarterly',
    deadline: null,
    status: 'on_track',
    actions: ['Sette faste datoer', 'Delegere ansvar'],
    is_predefined: true,
    sort_order: 5,
  },
  {
    goal_text: 'Redusere konfliktnivå',
    description: 'Færre alvorlige konflikter og bortvisninger',
    kpi_metric: 'Antall bortvisninger / hendelser med vakt/politi',
    kpi_target: 'Reduksjon på 20%',
    kpi_current: null,
    period: 'yearly',
    deadline: null,
    status: 'on_track',
    actions: ['Forbedre konflikthåndtering', 'Øke bemanning i risikoperioder'],
    is_predefined: true,
    sort_order: 6,
  },
];

export const useIkAlkoholGoals = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['ik-alkohol-goals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_alkohol_goals')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');
      if (error) throw error;
      return data as AlkoholGoal[];
    },
    enabled: !!companyId,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: {
      goal_text: string;
      description?: string;
      kpi_metric?: string;
      kpi_target?: string;
      responsible_name?: string;
      period?: string;
      deadline?: string;
      actions?: string[];
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase
        .from('ik_alkohol_goals')
        .insert({
          company_id: companyId,
          ...goal,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-goals'] });
      toast.success('Mål opprettet');
    },
    onError: () => toast.error('Kunne ikke opprette mål'),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('ik_alkohol_goals')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-goals'] });
      toast.success('Mål oppdatert');
    },
    onError: () => toast.error('Kunne ikke oppdatere mål'),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_alkohol_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-goals'] });
      toast.success('Mål slettet');
    },
    onError: () => toast.error('Kunne ikke slette mål'),
  });

  const initializeDefaultGoals = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const goalsToInsert = DEFAULT_GOALS.map(g => ({
        ...g,
        company_id: companyId,
      }));
      const { error } = await supabase
        .from('ik_alkohol_goals')
        .insert(goalsToInsert as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-goals'] });
      toast.success('Standardmål lagt til');
    },
    onError: () => toast.error('Kunne ikke legge til standardmål'),
  });

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    initializeDefaultGoals,
  };
};
