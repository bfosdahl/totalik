import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDepartmentContext } from '@/contexts/DepartmentContext';
import { toast } from 'sonner';

import { EQUIPMENT_TYPE_DEFAULTS } from '@/lib/temperatureGuidelines';
import { useIkMatDeviation } from './useIkMatDeviation';
import { getLocalDayStartISO, getLocalDayEndISO } from '@/lib/dateUtils';

export interface TemperatureEquipment {
  id: string;
  company_id: string;
  name: string;
  equipment_type: 'fridge' | 'freezer' | 'hot_display' | 'cold_display' | 'hot_holding' | 'heat_treatment' | 'dishwasher_home' | 'dishwasher_pro';
  location: string | null;
  min_temp: number | null;
  max_temp: number | null;
  measurement_frequency: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemperatureLog {
  id: string;
  company_id: string;
  equipment_id: string;
  temperature: number;
  is_acceptable: boolean;
  measured_by_id: string | null;
  measured_by_name: string;
  measured_at: string;
  measurement_time: string | null;
  notes: string | null;
  corrective_action: string | null;
  corrective_action_by: string | null;
  created_at: string;
  equipment?: TemperatureEquipment;
}

export function useIkMatTemperature() {
  const { company, profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();
  const { createTemperatureDeviation } = useIkMatDeviation();

  // Fetch equipment
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['ik-mat-temperature-equipment', company?.id, filterDepartmentId],
    queryFn: async () => {
      if (!company?.id) return [];
      let query = supabase
        .from('ik_mat_temperature_equipment')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true);
      if (filterDepartmentId) {
        query = query.eq('department_id', filterDepartmentId);
      } else {
        query = query.is('department_id', null);
      }
      const { data, error } = await query.order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as TemperatureEquipment[];
    },
    enabled: !!company?.id,
  });

  // Fetch today's logs
  const { data: todaysLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['ik-mat-temperature-logs-today', company?.id, filterDepartmentId],
    queryFn: async () => {
      if (!company?.id) return [];
      // Use LOCAL day boundaries so "today" matches Norwegian time, not UTC.
      const dayStart = getLocalDayStartISO();
      const dayEnd = getLocalDayEndISO();
      let query = supabase
        .from('ik_mat_temperature_logs')
        .select('*, equipment:ik_mat_temperature_equipment(*)')
        .eq('company_id', company.id)
        .gte('measured_at', dayStart)
        .lte('measured_at', dayEnd);
      if (filterDepartmentId) {
        query = query.eq('department_id', filterDepartmentId);
      } else {
        query = query.is('department_id', null);
      }
      const { data, error } = await query.order('measured_at', { ascending: false });
      
      if (error) throw error;
      return data as TemperatureLog[];
    },
    enabled: !!company?.id,
  });

  // Fetch all logs (for history)
  const fetchLogs = async (startDate?: string, endDate?: string) => {
    if (!company?.id) return [];
    
    let query = supabase
      .from('ik_mat_temperature_logs')
      .select('*, equipment:ik_mat_temperature_equipment(*)')
      .eq('company_id', company.id)
      .order('measured_at', { ascending: false });

    if (filterDepartmentId) {
      query = query.eq('department_id', filterDepartmentId);
    } else {
      query = query.is('department_id', null);
    }
    
    if (startDate) {
      // Treat the YYYY-MM-DD as a local date and convert to start-of-day ISO.
      query = query.gte('measured_at', getLocalDayStartISO(new Date(`${startDate}T00:00:00`)));
    }
    if (endDate) {
      query = query.lte('measured_at', getLocalDayEndISO(new Date(`${endDate}T00:00:00`)));
    }
    
    const { data, error } = await query.limit(500);
    if (error) throw error;
    return data as TemperatureLog[];
  };

  // Add equipment
  const addEquipment = useMutation({
    mutationFn: async (data: {
      name: string;
      equipment_type: string;
      location?: string;
      min_temp?: number;
      max_temp?: number;
      measurement_frequency?: string;
    }) => {
      if (!company?.id) throw new Error('Ingen bedrift valgt');
      
      const defaults = EQUIPMENT_TYPE_DEFAULTS[data.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS];
      
      const { data: result, error } = await supabase
        .from('ik_mat_temperature_equipment')
        .insert({
          company_id: company.id,
          name: data.name,
          equipment_type: data.equipment_type,
          location: data.location || null,
          min_temp: data.min_temp ?? defaults?.min ?? null,
          max_temp: data.max_temp ?? defaults?.max ?? null,
          measurement_frequency: data.measurement_frequency || 'daily',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-temperature-equipment'] });
      toast.success('Utstyr lagt til');
    },
    onError: (error) => {
      toast.error('Kunne ikke legge til utstyr: ' + error.message);
    },
  });

  // Update equipment
  const updateEquipment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TemperatureEquipment> & { id: string }) => {
      const { error } = await supabase
        .from('ik_mat_temperature_equipment')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-temperature-equipment'] });
      toast.success('Utstyr oppdatert');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere utstyr: ' + error.message);
    },
  });

  // Delete equipment
  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_mat_temperature_equipment')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-temperature-equipment'] });
      toast.success('Utstyr fjernet');
    },
    onError: (error) => {
      toast.error('Kunne ikke fjerne utstyr: ' + error.message);
    },
  });

  // Log temperature
  const logTemperature = useMutation({
    mutationFn: async (data: {
      equipment_id: string;
      temperature: number;
      measurement_time?: string;
      notes?: string;
      corrective_action?: string;
    }) => {
      if (!company?.id || !profile) throw new Error('Ikke logget inn');
      
      // Find equipment to check limits
      const equip = equipment.find(e => e.id === data.equipment_id);
      let isAcceptable = true;
      
      if (equip) {
        if (equip.min_temp !== null && data.temperature < equip.min_temp) {
          isAcceptable = false;
        }
        if (equip.max_temp !== null && data.temperature > equip.max_temp) {
          isAcceptable = false;
        }
      }
      
      const { data: result, error } = await supabase
        .from('ik_mat_temperature_logs')
        .insert({
          company_id: company.id,
          equipment_id: data.equipment_id,
          temperature: data.temperature,
          is_acceptable: isAcceptable,
          measured_by_id: profile.id,
          measured_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
          measurement_time: data.measurement_time || null,
          notes: data.notes || null,
          corrective_action: data.corrective_action || null,
          corrective_action_by: data.corrective_action ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Auto-create deviation if temperature is outside acceptable range
      if (!isAcceptable && equip) {
        await createTemperatureDeviation(
          equip.name,
          data.temperature,
          equip.min_temp,
          equip.max_temp,
          data.corrective_action
        );
      }
      
      return { result, isAcceptable };
    },
    onSuccess: ({ isAcceptable }) => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-temperature-logs-today'] });
      if (isAcceptable) {
        toast.success('Temperatur registrert');
      } else {
        toast.warning('Temperatur registrert - Avvik opprettet automatisk');
      }
    },
    onError: (error) => {
      toast.error('Kunne ikke registrere temperatur: ' + error.message);
    },
  });

  // Update temperature log
  const updateTemperatureLog = useMutation({
    mutationFn: async (data: {
      id: string;
      equipment_id: string;
      temperature: number;
      notes?: string;
      corrective_action?: string;
    }) => {
      if (!company?.id || !profile) throw new Error('Ikke logget inn');

      const equip = equipment.find(e => e.id === data.equipment_id);
      let isAcceptable = true;

      if (equip) {
        if (equip.min_temp !== null && data.temperature < equip.min_temp) isAcceptable = false;
        if (equip.max_temp !== null && data.temperature > equip.max_temp) isAcceptable = false;
      }

      const { error } = await supabase
        .from('ik_mat_temperature_logs')
        .update({
          temperature: data.temperature,
          is_acceptable: isAcceptable,
          notes: data.notes || null,
          corrective_action: data.corrective_action || null,
          corrective_action_by: data.corrective_action ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
        })
        .eq('id', data.id);

      if (error) throw error;
      return { isAcceptable };
    },
    onSuccess: ({ isAcceptable }) => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-temperature-logs-today'] });
      toast.success(isAcceptable ? 'Måling oppdatert' : 'Måling oppdatert - Avvik');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere måling: ' + error.message);
    },
  });

  // Check which equipment needs logging today
  const getEquipmentNeedingLog = () => {
    return equipment.filter(equip => {
      const hasLogToday = todaysLogs.some(log => log.equipment_id === equip.id);
      return !hasLogToday;
    });
  };

  // Check if all daily logs are complete
  const isDailyLogComplete = () => {
    const dailyEquipment = equipment.filter(e => e.measurement_frequency === 'daily');
    return dailyEquipment.every(equip => 
      todaysLogs.some(log => log.equipment_id === equip.id)
    );
  };

  return {
    equipment,
    todaysLogs,
    isLoading: equipmentLoading || logsLoading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    logTemperature,
    updateTemperatureLog,
    fetchLogs,
    getEquipmentNeedingLog,
    isDailyLogComplete,
    EQUIPMENT_TYPE_DEFAULTS,
  };
}
