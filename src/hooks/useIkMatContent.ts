import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IkMatGoal {
  id: string;
  text: string;
}

export interface IkMatOrganizationRole {
  id: string;
  title: string;
  personName: string;
  personId?: string;
  description: string;
  sortOrder: number;
}

export interface IkMatOrganization {
  roles: IkMatOrganizationRole[];
}

export interface IkMatRisk {
  id: string;
  hazard: string;
  consequence: number; // 1-5
  probability: number; // 1-5
  riskLevel: number; // 1-25 (auto-calculated: probability * consequence)
  measures: string;
  isHaccp: boolean; // HACCP kritisk kontrollpunkt
  controlDate?: string; // Dato for kontroll
  frequency?: string; // Hyppighet: daily, weekly, monthly, quarterly, yearly
  // New fields for enhanced risk assessment
  isAcceptable?: boolean; // Akseptabel risiko?
  justification?: string; // Begrunnelse/vurdering
  criticalLimit?: string; // Kritisk grense (for HACCP)
  controlMethod?: string; // Kontrollmetode
  // Residual risk (after measures)
  residualProbability?: number;
  residualConsequence?: number;
  residualRiskLevel?: number;
  // Status tracking
  status?: 'open' | 'in_progress' | 'closed'; // Overall risk status
  closedAt?: string;
  closedBy?: string;
}

export interface IkMatActionItem {
  id: string;
  riskId?: string; // Link to risk that triggered this action
  action: string;
  responsible: string;
  responsibleName?: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: string;
  notes?: string;
  // Enhanced action tracking
  actionType: 'preventive' | 'corrective'; // Forebyggende eller korrigerende
  effectOnProbability?: boolean; // Reduserer sannsynlighet
  effectOnConsequence?: boolean; // Reduserer konsekvens
  newProbability?: number; // Ny sannsynlighet etter tiltak (1-5)
  newConsequence?: number; // Ny konsekvens etter tiltak (1-5)
}

export interface IkMatHaccp {
  id: string;
  step: string;
  hazard: string;
  criticalLimit: string;
  monitoring: string;
  correctiveAction: string;
  verification: string;
}

export interface IkMatRoutine {
  id: string;
  name: string;
  description: string;
  frequency: string;
  responsible: string;
  routineNumber?: string;
  templateNumber?: string;
  subcategory?: string;
  createdAt?: string;
  lastRevisedAt?: string;
  revisedBy?: string;
  revisionCount?: number;
}

// HACCP Control log entry
export interface IkMatControlLog {
  id: string;
  riskId: string;
  controlDate: string;
  controlTime?: string;
  result: 'ok' | 'deviation';
  value?: string; // e.g., temperature reading
  comment?: string;
  imagePath?: string;
  performedBy: string;
  performedByName?: string;
  createdAt: string;
  // If deviation, link to action created
  deviationActionId?: string;
}

export interface IkMatContent {
  goals: IkMatGoal[];
  organization: IkMatOrganization;
  risks: IkMatRisk[];
  haccp: IkMatHaccp[];
  routines: IkMatRoutine[];
  actionPlan: IkMatActionItem[];
  controlLogs: IkMatControlLog[];
}

// Helper function to calculate risk level
export const calculateRiskLevel = (probability: number, consequence: number): number => {
  return probability * consequence;
};

// Traffic light system for IK/MAT
export type TrafficLight = 'green' | 'yellow' | 'red';

export const getTrafficLight = (riskLevel: number): TrafficLight => {
  if (riskLevel <= 4) return 'green';
  if (riskLevel <= 9) return 'yellow';
  return 'red';
};

export const getTrafficLightLabel = (light: TrafficLight): string => {
  switch (light) {
    case 'green': return 'Akseptabel';
    case 'yellow': return 'Tiltak nødvendig';
    case 'red': return 'Umiddelbar handling';
  }
};

export const getTrafficLightDescription = (light: TrafficLight): string => {
  switch (light) {
    case 'green': return 'Risikoen er akseptabel. Overvåk og vurder jevnlig.';
    case 'yellow': return 'Tiltak må iverksettes innen rimelig tid for å redusere risikoen.';
    case 'red': return 'Umiddelbar handling påkrevd. Risikoen må reduseres før aktiviteten kan fortsette.';
  }
};

// Helper function to get risk level label
export const getRiskLevelLabel = (level: number): string => {
  const light = getTrafficLight(level);
  return getTrafficLightLabel(light);
};

// Helper function to get risk level color variant
export const getRiskLevelVariant = (level: number): 'secondary' | 'default' | 'destructive' => {
  if (level <= 4) return 'secondary';
  if (level <= 9) return 'default';
  return 'destructive';
};

// Get action plan status for a risk
export type ActionPlanStatus = 'none' | 'in_progress' | 'overdue' | 'completed';

export const getActionPlanStatus = (actions: IkMatActionItem[], riskId: string): ActionPlanStatus => {
  const riskActions = actions.filter(a => a.riskId === riskId);
  if (riskActions.length === 0) return 'none';
  
  const today = new Date().toISOString().split('T')[0];
  const hasOverdue = riskActions.some(a => 
    a.status !== 'completed' && a.deadline && a.deadline < today
  );
  if (hasOverdue) return 'overdue';
  
  const allCompleted = riskActions.every(a => a.status === 'completed');
  if (allCompleted) return 'completed';
  
  return 'in_progress';
};

export const getActionPlanStatusLabel = (status: ActionPlanStatus): string => {
  switch (status) {
    case 'none': return 'Ingen tiltak';
    case 'in_progress': return 'Tiltak pågår';
    case 'overdue': return 'Tiltak forfalt';
    case 'completed': return 'Lukket';
  }
};

export const useIkMatContent = () => {
  const { company } = useAuth();
  const [content, setContent] = useState<IkMatContent>({
    goals: [],
    organization: { roles: [] },
    risks: [],
    haccp: [],
    routines: [],
    actionPlan: [],
    controlLogs: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    if (!company?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_modules')
        .select('settings')
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT')
        .single();

      if (error) throw error;

      const settings = data?.settings as any;
      const generated = settings?.generatedContent || {};
      const manual = settings?.manualContent || {};

      // Merge generated and manual content, prioritizing manual
      setContent({
        goals: manual.goals?.length > 0 ? manual.goals : 
          (generated.goals || []).map((g: string, i: number) => ({ id: `gen-${i}`, text: g })),
        organization: manual.organization || { roles: [] },
        risks: manual.risks?.length > 0 ? manual.risks :
          (generated.risks || []).map((r: any, i: number) => ({ 
            id: `gen-${i}`, 
            ...r, 
            isHaccp: false,
            status: 'open',
          })),
        haccp: manual.haccp?.length > 0 ? manual.haccp :
          (generated.haccp || []).map((h: any, i: number) => ({ id: `gen-${i}`, ...h })),
        routines: manual.routines?.length > 0 ? manual.routines :
          (generated.routines || []).map((r: any, i: number) => ({ id: `gen-${i}`, ...r })),
        actionPlan: (manual.actionPlan || []).map((a: any) => ({
          ...a,
          actionType: a.actionType || 'corrective',
        })),
        controlLogs: manual.controlLogs || [],
      });
    } catch (error) {
      console.error('Error fetching IK/MAT content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const saveContent = async (section: keyof IkMatContent, data: any) => {
    if (!company?.id) return false;

    try {
      setIsSaving(true);

      // First get current settings
      const { data: current, error: fetchError } = await supabase
        .from('company_modules')
        .select('settings')
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT')
        .single();

      if (fetchError) throw fetchError;

      const settings = current?.settings as any || {};
      const manualContent = settings.manualContent || {};

      // Update the specific section
      const updatedManualContent = {
        ...manualContent,
        [section]: data,
      };

      // Save back to database
      const { error: saveError } = await supabase
        .from('company_modules')
        .update({
          settings: {
            ...settings,
            manualContent: updatedManualContent,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT');

      if (saveError) throw saveError;

      // Update local state
      setContent(prev => ({
        ...prev,
        [section]: data,
      }));

      toast.success('Endringer lagret');
      return true;
    } catch (error) {
      console.error('Error saving IK/MAT content:', error);
      toast.error('Kunne ikke lagre endringer');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to add action item for a specific risk
  const addActionForRisk = async (risk: IkMatRisk, actionText?: string, actionType: 'preventive' | 'corrective' = 'corrective') => {
    const newAction: IkMatActionItem = {
      id: `action-${Date.now()}`,
      riskId: risk.id,
      action: actionText || `Tiltak for: ${risk.hazard}`,
      responsible: '',
      deadline: '',
      status: 'pending',
      actionType,
    };
    
    const updatedActionPlan = [...content.actionPlan, newAction];
    await saveContent('actionPlan', updatedActionPlan);
    return newAction;
  };

  // Add control log entry
  const addControlLog = async (log: Omit<IkMatControlLog, 'id' | 'createdAt'>) => {
    const newLog: IkMatControlLog = {
      ...log,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedLogs = [...content.controlLogs, newLog];
    await saveContent('controlLogs', updatedLogs);
    return newLog;
  };

  return {
    content,
    isLoading,
    isSaving,
    saveContent,
    refetch: fetchContent,
    addActionForRisk,
    addControlLog,
  };
};
