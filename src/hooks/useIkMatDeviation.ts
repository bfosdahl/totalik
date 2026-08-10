import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getLocalDateString } from "@/lib/dateUtils";

// IK-MAT specific deviation categories
export type IkMatDeviationCategory = 
  | 'temperature'      // Temperaturavvik
  | 'cleaning'         // Renholdsavvik  
  | 'pest_control'     // Skadedyr
  | 'allergen'         // Allergenhåndtering
  | 'traceability'     // Sporbarhet/varemottak
  | 'hygiene'          // Personlig hygiene
  | 'equipment'        // Utstyrsfeil
  | 'storage'          // Lagring
  | 'other';           // Annet

export interface CreateIkMatDeviationParams {
  category: IkMatDeviationCategory;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  incidentLocation?: string;
  immediateActions?: string;
  additionalInfo?: string;
}

/**
 * Hook for creating IK-MAT specific deviations from control functions
 * These deviations are stored with type='ik_mat' to separate them from HMS deviations
 */
export function useIkMatDeviation() {
  const { profile, company } = useAuth();
  const queryClient = useQueryClient();

  const createDeviation = useCallback(async (params: CreateIkMatDeviationParams): Promise<boolean> => {
    if (!company?.id || !profile) {
      console.error('Missing company or profile for IK-MAT deviation');
      return false;
    }

    try {
      const reporterName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ') || profile.email || 'Ukjent';

      // Calculate due date (7 days from now for IK-MAT deviations)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      // Deviation number is assigned by the DB trigger (race-safe)
      const { data: inserted, error } = await supabase
        .from('deviations')
        .insert({
          company_id: company.id,
          deviation_number: null,
          title: params.title,
          description: params.description,
          category: params.category,
          type: 'ik_mat', // Critical: marks this as IK-MAT deviation
          priority: params.priority || 'medium',
          status: 'open',
          reporter_id: profile.id,
          reporter_name: reporterName,
          due_date: getLocalDateString(dueDate),
          incident_location: params.incidentLocation || null,
          immediate_actions: params.immediateActions || null,
          additional_info: params.additionalInfo || null,
          department_id: profile.primary_department_id || null,
        })
        .select('deviation_number')
        .single();

      if (error) throw error;

      const deviationNumber = inserted?.deviation_number ?? '';

      // Invalidate deviations cache to refresh lists
      queryClient.invalidateQueries({ queryKey: ['deviations'] });

      toast.success(
        deviationNumber ? `Avvik opprettet automatisk: ${deviationNumber}` : 'Avvik opprettet automatisk',
        {
          description: params.title,
          duration: 5000,
        }
      );

      return true;
    } catch (error) {
      console.error('Error creating IK-MAT deviation:', error);
      return false;
    }
  }, [company?.id, profile, queryClient]);


  // Specific deviation creators for different control types
  const createTemperatureDeviation = useCallback(async (
    equipmentName: string,
    temperature: number,
    minTemp: number | null,
    maxTemp: number | null,
    correctiveAction?: string
  ) => {
    let description = `Temperaturmåling utenfor akseptabelt område.\n\n`;
    description += `Utstyr: ${equipmentName}\n`;
    description += `Målt temperatur: ${temperature}°C\n`;
    if (minTemp !== null) description += `Min. tillatt: ${minTemp}°C\n`;
    if (maxTemp !== null) description += `Maks. tillatt: ${maxTemp}°C\n`;

    return createDeviation({
      category: 'temperature',
      title: `Temperaturavvik: ${equipmentName} (${temperature}°C)`,
      description,
      priority: 'high',
      immediateActions: correctiveAction,
    });
  }, [createDeviation]);

  const createCleaningDeviation = useCallback(async (
    area: string,
    frequencyType: string,
    notes?: string
  ) => {
    let description = `Renholdsoppgave ikke fullført.\n\n`;
    description += `Område: ${area}\n`;
    description += `Frekvens: ${frequencyType}\n`;
    if (notes) description += `Merknader: ${notes}\n`;

    return createDeviation({
      category: 'cleaning',
      title: `Renholdsavvik: ${area}`,
      description,
      priority: 'medium',
      incidentLocation: area,
    });
  }, [createDeviation]);

  const createChecklistDeviation = useCallback(async (
    checklistName: string,
    failedCheckpoints: { checkpoint: string; comment?: string }[]
  ) => {
    let description = `Sjekklistekontroll med avvik.\n\n`;
    description += `Sjekkliste: ${checklistName}\n\n`;
    description += `Punkter med avvik:\n`;
    failedCheckpoints.forEach((cp, idx) => {
      description += `${idx + 1}. ${cp.checkpoint}`;
      if (cp.comment) description += ` - ${cp.comment}`;
      description += '\n';
    });

    return createDeviation({
      category: 'hygiene', // Default for checklist issues
      title: `Sjekklisteavvik: ${checklistName} (${failedCheckpoints.length} punkt${failedCheckpoints.length === 1 ? '' : 'er'})`,
      description,
      priority: failedCheckpoints.length > 2 ? 'high' : 'medium',
    });
  }, [createDeviation]);

  const createTraceabilityDeviation = useCallback(async (
    productName: string,
    supplierName: string,
    issue: string,
    receiptTemperature?: number
  ) => {
    let description = `Problem ved varemottak.\n\n`;
    description += `Produkt: ${productName}\n`;
    description += `Leverandør: ${supplierName}\n`;
    description += `Problem: ${issue}\n`;
    if (receiptTemperature !== undefined) {
      description += `Mottakstemperatur: ${receiptTemperature}°C\n`;
    }

    return createDeviation({
      category: 'traceability',
      title: `Mottaksavvik: ${productName}`,
      description,
      priority: 'high',
    });
  }, [createDeviation]);

  return {
    createDeviation,
    createTemperatureDeviation,
    createCleaningDeviation,
    createChecklistDeviation,
    createTraceabilityDeviation,
  };
}
