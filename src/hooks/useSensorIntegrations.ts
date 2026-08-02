import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SensorIntegration {
  id: string;
  company_id: string;
  endpoint_id: string | null;
  provider: string;
  display_name: string | null;
  mode: 'webhook' | 'api';
  base_url: string | null;
  poll_interval_minutes: number;
  is_active: boolean;
  config: Record<string, unknown>;
  has_credentials: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SensorPayloadLog {
  id: string;
  company_id: string;
  endpoint_id: string | null;
  integration_id: string | null;
  direction: string;
  source: string | null;
  http_status: number | null;
  status: string;
  reading_count: number;
  error: string | null;
  headers: Record<string, string> | null;
  payload: unknown;
  created_at: string;
}

export interface ProviderDefinition {
  id: string;
  label: string;
  mode: 'webhook' | 'api';
  credentialFields: { key: string; label: string; secret: boolean }[];
  docs?: string;
  defaultBaseUrl?: string;
}

const INTEGRATION_COLUMNS =
  'id, company_id, endpoint_id, provider, display_name, mode, base_url, poll_interval_minutes, is_active, config, has_credentials, last_sync_at, last_sync_status, last_error, created_at, updated_at';

export function useSensorIntegrations() {
  const { company } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ik-mat-sensor-integrations'] });
    queryClient.invalidateQueries({ queryKey: ['ik-mat-sensor-payload-log'] });
  };

  const providersQuery = useQuery({
    queryKey: ['ik-mat-sensor-providers'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ik-mat-sensor-integrations', {
        body: { action: 'providers' },
      });
      if (error) throw error;
      return (data?.providers ?? []) as ProviderDefinition[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const integrationsQuery = useQuery({
    queryKey: ['ik-mat-sensor-integrations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_mat_sensor_integrations')
        .select(INTEGRATION_COLUMNS)
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SensorIntegration[];
    },
    enabled: !!companyId,
  });

  const logQuery = useQuery({
    queryKey: ['ik-mat-sensor-payload-log', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('ik_mat_sensor_payload_log')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as SensorPayloadLog[];
    },
    enabled: !!companyId,
    refetchInterval: 60_000,
  });

  const createIntegration = useMutation({
    mutationFn: async (input: {
      provider: string;
      display_name?: string;
      mode: 'webhook' | 'api';
      base_url?: string | null;
      endpoint_id?: string | null;
      poll_interval_minutes?: number;
    }) => {
      if (!companyId) throw new Error('Ingen bedrift valgt');
      const { data, error } = await supabase
        .from('ik_mat_sensor_integrations')
        .insert({
          company_id: companyId,
          provider: input.provider,
          display_name: input.display_name || null,
          mode: input.mode,
          base_url: input.base_url || null,
          endpoint_id: input.endpoint_id ?? null,
          poll_interval_minutes: input.poll_interval_minutes ?? 15,
        })
        .select(INTEGRATION_COLUMNS)
        .single();
      if (error) throw error;
      return data as unknown as SensorIntegration;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Integrasjon opprettet');
    },
    onError: (e: Error) => toast.error('Kunne ikke opprette integrasjon: ' + e.message),
  });

  const updateIntegration = useMutation({
    mutationFn: async (patch: Partial<SensorIntegration> & { id: string }) => {
      const { id, ...rest } = patch;
      if (!companyId) throw new Error('Ingen bedrift valgt');
      const { error } = await supabase
        .from('ik_mat_sensor_integrations')
        .update(rest as never)
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
    },

    onSuccess: () => {
      invalidate();
      toast.success('Integrasjon oppdatert');
    },
    onError: (e: Error) => toast.error('Kunne ikke oppdatere: ' + e.message),
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      if (!companyId) throw new Error('Ingen bedrift valgt');
      const { error } = await supabase
        .from('ik_mat_sensor_integrations')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Integrasjon slettet');
    },
    onError: (e: Error) => toast.error('Kunne ikke slette: ' + e.message),
  });

  const saveCredentials = useMutation({
    mutationFn: async (input: { integration_id: string; credentials: Record<string, string> }) => {
      const { data, error } = await supabase.functions.invoke('ik-mat-sensor-integrations', {
        body: { action: 'save_credentials', ...input },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Nøkler lagret sikkert');
    },
    onError: (e: Error) => toast.error('Kunne ikke lagre nøkler: ' + e.message),
  });

  const clearCredentials = useMutation({
    mutationFn: async (integration_id: string) => {
      const { error } = await supabase.functions.invoke('ik-mat-sensor-integrations', {
        body: { action: 'clear_credentials', integration_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Nøkler slettet');
    },
    onError: (e: Error) => toast.error('Kunne ikke slette nøkler: ' + e.message),
  });

  const testIntegration = useMutation({
    mutationFn: async (integration_id: string) => {
      const { data, error } = await supabase.functions.invoke('ik-mat-sensor-integrations', {
        body: { action: 'test', integration_id },
      });
      if (error) throw error;
      return data as { ok: boolean; status: number; error: string | null; preview: string };
    },
    onSuccess: (data) => {
      invalidate();
      if (data?.ok) toast.success('Kobling OK – data mottatt fra leverandøren');
      else toast.error('Kobling feilet: ' + (data?.error || 'ukjent feil'));
    },
    onError: (e: Error) => toast.error('Test feilet: ' + e.message),
  });

  const syncNow = useMutation({
    mutationFn: async (integration_id?: string) => {
      const { data, error } = await supabase.functions.invoke('ik-mat-sensor-poll', {
        body: { integration_id, force: true },
      });
      if (error) throw error;
      return data as { polled: number; results: unknown[] };
    },
    onSuccess: (data) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['ik-mat-sensors'] });
      toast.success(`Henting fullført (${data?.polled ?? 0} integrasjoner)`);
    },
    onError: (e: Error) => toast.error('Kunne ikke hente data: ' + e.message),
  });

  return {
    providers: providersQuery.data ?? [],
    integrations: integrationsQuery.data ?? [],
    payloadLog: logQuery.data ?? [],
    isLoading: integrationsQuery.isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    saveCredentials,
    clearCredentials,
    testIntegration,
    syncNow,
  };
}
