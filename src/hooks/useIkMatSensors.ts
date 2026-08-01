import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SensorEndpoint {
  id: string;
  company_id: string;
  department_id: string | null;
  token: string;
  name: string | null;
  alert_emails: string[];
  is_active: boolean;
  last_received_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface IkMatSensor {
  id: string;
  company_id: string;
  department_id: string | null;
  endpoint_id: string | null;
  equipment_id: string | null;
  external_id: string;
  name: string | null;
  provider: string | null;
  location: string | null;
  is_active: boolean;
  is_offline: boolean;
  last_reading_at: string | null;
  last_temperature: number | null;
  last_battery: number | null;
  alert_emails: string[];
  min_temp_override: number | null;
  max_temp_override: number | null;
  breach_grace_minutes: number;
  offline_after_minutes: number;
  low_battery_threshold: number;
  breach_started_at: string | null;
  last_temp_alert_at: string | null;
  last_offline_alert_at: string | null;
  last_battery_alert_at: string | null;
  created_at: string;
}

export interface SensorAlert {
  id: string;
  company_id: string;
  sensor_id: string | null;
  equipment_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  temperature: number | null;
  deviation_number: string | null;
  recipients: string[];
  email_status: string | null;
  created_at: string;
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-mat-sensor-webhook`;

export function getWebhookUrl(token: string) {
  return `${FUNCTIONS_BASE}/${token}`;
}

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

export function useIkMatSensors() {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();

  const endpointQuery = useQuery({
    queryKey: ['ik-mat-sensor-endpoint', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      const { data, error } = await supabase
        .from('ik_mat_sensor_endpoints')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as SensorEndpoint) ?? null;
    },
    enabled: !!company?.id,
  });

  const sensorsQuery = useQuery({
    queryKey: ['ik-mat-sensors', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('ik_mat_sensors')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as IkMatSensor[];
    },
    enabled: !!company?.id,
    refetchInterval: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ['ik-mat-sensor-alerts', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('ik_mat_sensor_alerts')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SensorAlert[];
    },
    enabled: !!company?.id,
    refetchInterval: 60_000,
  });

  const runWatchdog = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ik-mat-sensor-watchdog', { body: {} });
      if (error) throw error;
      return data as { checked: number; results: unknown[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensors'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensor-alerts'] });
      toast.success(`Sensorsjekk fullført (${data?.checked ?? 0} sensorer kontrollert)`);
    },
    onError: (e: Error) => toast.error('Kunne ikke kjøre sensorsjekk: ' + e.message),
  });

  const createEndpoint = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('Ingen bedrift valgt');
      const { data, error } = await supabase
        .from('ik_mat_sensor_endpoints')
        .insert({
          company_id: company.id,
          token: generateToken(),
          created_by: profile?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SensorEndpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensor-endpoint'] });
      toast.success('Sensor-endepunkt opprettet');
    },
    onError: (e: Error) => toast.error('Kunne ikke opprette endepunkt: ' + e.message),
  });

  const updateEndpoint = useMutation({
    mutationFn: async (patch: Partial<SensorEndpoint> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from('ik_mat_sensor_endpoints').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensor-endpoint'] });
      toast.success('Endepunkt oppdatert');
    },
    onError: (e: Error) => toast.error('Kunne ikke oppdatere: ' + e.message),
  });

  const regenerateToken = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_mat_sensor_endpoints')
        .update({ token: generateToken() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensor-endpoint'] });
      toast.success('Ny nøkkel generert - husk å oppdatere hos sensorleverandøren');
    },
    onError: (e: Error) => toast.error('Kunne ikke generere ny nøkkel: ' + e.message),
  });

  const addSensor = useMutation({
    mutationFn: async (input: { external_id: string; name?: string; provider?: string; equipment_id?: string | null }) => {
      if (!company?.id) throw new Error('Ingen bedrift valgt');
      const { error } = await supabase.from('ik_mat_sensors').insert({
        company_id: company.id,
        endpoint_id: endpointQuery.data?.id ?? null,
        external_id: input.external_id.trim(),
        name: input.name?.trim() || null,
        provider: input.provider?.trim() || null,
        equipment_id: input.equipment_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensors'] });
      toast.success('Sensor lagt til');
    },
    onError: (e: Error) => toast.error('Kunne ikke legge til sensor: ' + e.message),
  });

  const updateSensor = useMutation({
    mutationFn: async (patch: Partial<IkMatSensor> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from('ik_mat_sensors').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensors'] });
      toast.success('Sensor oppdatert');
    },
    onError: (e: Error) => toast.error('Kunne ikke oppdatere sensor: ' + e.message),
  });

  const deleteSensor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ik_mat_sensors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensors'] });
      toast.success('Sensor fjernet');
    },
    onError: (e: Error) => toast.error('Kunne ikke fjerne sensor: ' + e.message),
  });

  return {
    endpoint: endpointQuery.data ?? null,
    sensors: sensorsQuery.data ?? [],
    isLoading: endpointQuery.isLoading || sensorsQuery.isLoading,
    createEndpoint,
    updateEndpoint,
    regenerateToken,
    addSensor,
    updateSensor,
    deleteSensor,
  };
}
