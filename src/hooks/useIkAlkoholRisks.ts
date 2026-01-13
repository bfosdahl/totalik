import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlkoholRisk {
  id: string;
  company_id: string;
  risk_area: string;
  risk_description: string;
  probability: number;
  consequence: number;
  penalty_points: number | null;
  risk_level: string;
  existing_controls: string | null;
  planned_measures: string[] | null;
  measure_responsible_id: string | null;
  measure_responsible_name: string | null;
  measure_deadline: string | null;
  measure_status: string;
  residual_probability: number | null;
  residual_consequence: number | null;
  is_risk_period: boolean;
  risk_period_days: string[] | null;
  risk_period_times: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const RISK_AREAS = [
  { value: 'alderskontroll', label: 'Alderskontroll', points: 8 },
  { value: 'pavirket', label: 'Åpenbart påvirket', points: 8 },
  { value: 'dokumentasjon', label: 'Mangelfull dokumentasjon', points: 2 },
  { value: 'bemanning', label: 'Underbemanning', points: 2 },
  { value: 'turnover', label: 'Høy turnover / uerfarne ansatte', points: 2 },
  { value: 'lokale', label: 'Dårlig oversikt i lokalet', points: 1 },
  { value: 'arrangement', label: 'Store arrangementer', points: 2 },
  { value: 'netthandel', label: 'Nett-/hjemlevering', points: 4 },
  { value: 'medbrakt', label: 'Medbrakt alkohol / rusmidler', points: 2 },
  { value: 'konflikt', label: 'Konflikter / vold', points: 4 },
];

export const PROBABILITY_LEVELS = [
  { value: 1, label: 'Svært lav', description: 'Skjer sjelden eller aldri' },
  { value: 2, label: 'Lav', description: 'Kan skje, men usannsynlig' },
  { value: 3, label: 'Middels', description: 'Skjer av og til' },
  { value: 4, label: 'Høy', description: 'Skjer regelmessig' },
  { value: 5, label: 'Svært høy', description: 'Skjer ofte / nesten alltid' },
];

export const CONSEQUENCE_LEVELS = [
  { value: 1, label: 'Ubetydelig', description: '1 prikk', points: 1 },
  { value: 2, label: 'Liten', description: '2 prikker', points: 2 },
  { value: 3, label: 'Moderat', description: '4 prikker', points: 4 },
  { value: 4, label: 'Alvorlig', description: '8 prikker', points: 8 },
  { value: 5, label: 'Kritisk', description: 'Inndragning av bevilling', points: 12 },
];

export const RISK_LEVEL_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Lav risiko' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Middels risiko' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Høy risiko' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Kritisk risiko' },
};

export const MEASURE_STATUSES = [
  { value: 'planned', label: 'Planlagt', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'Pågår', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Fullført', color: 'bg-green-100 text-green-800' },
];

export const DEFAULT_RISKS: Omit<AlkoholRisk, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'risk_level' | 'last_reviewed_at' | 'measure_responsible_id'>[] = [
  {
    risk_area: 'alderskontroll',
    risk_description: 'Mindreårig serveres/selges alkohol',
    probability: 2,
    consequence: 4,
    penalty_points: 8,
    existing_controls: 'Legitimasjonskontroll ved tvil',
    planned_measures: ['Skjerpe "under 25"-regelen', 'Oppfriskningskurs for ansatte'],
    measure_responsible_name: null,
    measure_deadline: null,
    measure_status: 'planned',
    residual_probability: null,
    residual_consequence: null,
    is_risk_period: false,
    risk_period_days: null,
    risk_period_times: null,
  },
  {
    risk_area: 'pavirket',
    risk_description: 'Åpenbart beruset person serveres',
    probability: 3,
    consequence: 4,
    penalty_points: 8,
    existing_controls: 'Muntlig instruks til ansatte',
    planned_measures: ['Skriftlig rutine for nektelse', 'Øvelse i de-eskalering'],
    measure_responsible_name: null,
    measure_deadline: null,
    measure_status: 'planned',
    residual_probability: null,
    residual_consequence: null,
    is_risk_period: true,
    risk_period_days: ['friday', 'saturday'],
    risk_period_times: '22:00-03:00',
  },
  {
    risk_area: 'dokumentasjon',
    risk_description: 'Mangelfull internkontrolldokumentasjon',
    probability: 2,
    consequence: 2,
    penalty_points: 2,
    existing_controls: 'Årlig gjennomgang',
    planned_measures: ['Implementere digitalt IK-system', 'Kvartalsvis revisjon'],
    measure_responsible_name: null,
    measure_deadline: null,
    measure_status: 'in_progress',
    residual_probability: null,
    residual_consequence: null,
    is_risk_period: false,
    risk_period_days: null,
    risk_period_times: null,
  },
  {
    risk_area: 'bemanning',
    risk_description: 'For få ansatte på høytrafikkdager',
    probability: 3,
    consequence: 2,
    penalty_points: 2,
    existing_controls: 'Vaktliste',
    planned_measures: ['Minimum 2 på bar i helger', 'Tilkallingsvakt tilgjengelig'],
    measure_responsible_name: null,
    measure_deadline: null,
    measure_status: 'planned',
    residual_probability: null,
    residual_consequence: null,
    is_risk_period: true,
    risk_period_days: ['friday', 'saturday'],
    risk_period_times: '20:00-03:00',
  },
  {
    risk_area: 'konflikt',
    risk_description: 'Konflikter mellom gjester eskalerer',
    probability: 2,
    consequence: 3,
    penalty_points: 4,
    existing_controls: 'Ordensvakt i helger',
    planned_measures: ['Konflikthåndteringskurs', 'Tydelig eskaleringsprosedyre'],
    measure_responsible_name: null,
    measure_deadline: null,
    measure_status: 'planned',
    residual_probability: null,
    residual_consequence: null,
    is_risk_period: true,
    risk_period_days: ['friday', 'saturday'],
    risk_period_times: '23:00-03:00',
  },
];

export const useIkAlkoholRisks = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['ik-alkohol-risks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_alkohol_risks')
        .select('*')
        .eq('company_id', companyId)
        .order('risk_level', { ascending: false });
      if (error) throw error;
      return data as AlkoholRisk[];
    },
    enabled: !!companyId,
  });

  const createRisk = useMutation({
    mutationFn: async (risk: {
      risk_area: string;
      risk_description: string;
      probability: number;
      consequence: number;
      penalty_points?: number;
      existing_controls?: string;
      planned_measures?: string[];
      measure_responsible_name?: string;
      measure_deadline?: string;
      is_risk_period?: boolean;
      risk_period_days?: string[];
      risk_period_times?: string;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase
        .from('ik_alkohol_risks')
        .insert({
          company_id: companyId,
          ...risk,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-risks'] });
      toast.success('Risiko opprettet');
    },
    onError: () => toast.error('Kunne ikke opprette risiko'),
  });

  const updateRisk = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholRisk> & { id: string }) => {
      const { data, error } = await supabase
        .from('ik_alkohol_risks')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-risks'] });
      toast.success('Risiko oppdatert');
    },
    onError: () => toast.error('Kunne ikke oppdatere risiko'),
  });

  const deleteRisk = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_alkohol_risks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-risks'] });
      toast.success('Risiko slettet');
    },
    onError: () => toast.error('Kunne ikke slette risiko'),
  });

  const initializeDefaultRisks = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const risksToInsert = DEFAULT_RISKS.map(r => ({
        ...r,
        company_id: companyId,
      }));
      const { error } = await supabase
        .from('ik_alkohol_risks')
        .insert(risksToInsert as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-alkohol-risks'] });
      toast.success('Standard risikoanalyse lagt til');
    },
    onError: () => toast.error('Kunne ikke legge til standard risikoanalyse'),
  });

  return {
    risks,
    isLoading,
    createRisk,
    updateRisk,
    deleteRisk,
    initializeDefaultRisks,
  };
};
