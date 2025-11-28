import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KsProjectGoal {
  id: string;
  project_id: string;
  goal_text: string;
  is_predefined: boolean;
  sort_order: number;
}

export interface KsProjectRisk {
  id: string;
  project_id: string;
  hazard: string;
  consequence: number;
  probability: number;
  risk_score: number;
  measures: string | null;
  responsible: string | null;
  deadline: string | null;
  status: string;
}

export interface KsProjectAction {
  id: string;
  project_id: string;
  risk_id: string | null;
  description: string;
  responsible: string | null;
  deadline: string | null;
  status: string;
  priority: string;
}

export interface KsSja {
  id: string;
  project_id: string;
  title: string;
  work_description: string | null;
  location: string | null;
  participants: string | null;
  date: string | null;
  hazards_json: any;
  status: string;
  created_by_user_id: string | null;
}

export interface HmsPlanProgress {
  current_step: number;
  completed_steps: string[];
  is_completed: boolean;
}

export function useKsHmsPlan(projectId: string | null) {
  const [goals, setGoals] = useState<KsProjectGoal[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [risks, setRisks] = useState<KsProjectRisk[]>([]);
  const [actions, setActions] = useState<KsProjectAction[]>([]);
  const [sjaList, setSjaList] = useState<KsSja[]>([]);
  const [progress, setProgress] = useState<HmsPlanProgress>({
    current_step: 0,
    completed_steps: [],
    is_completed: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      // Fetch progress
      const { data: progressData } = await supabase
        .from('ks_hms_plan_progress')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (progressData) {
        setProgress({
          current_step: progressData.current_step,
          completed_steps: progressData.completed_steps || [],
          is_completed: progressData.is_completed,
        });
      }

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('ks_project_goals')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      setGoals(goalsData || []);

      // Fetch organization
      const { data: orgData } = await supabase
        .from('ks_project_organization')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      setOrganization(orgData?.content || null);

      // Fetch risks
      const { data: risksData } = await supabase
        .from('ks_project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('risk_score', { ascending: false });
      setRisks(risksData || []);

      // Fetch actions
      const { data: actionsData } = await supabase
        .from('ks_project_actions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setActions(actionsData || []);

      // Fetch SJA
      const { data: sjaData } = await supabase
        .from('ks_sja')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      setSjaList(sjaData || []);
    } catch (error) {
      console.error('Error fetching HMS plan data:', error);
      toast.error('Kunne ikke hente HMS-plan data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchAll();
    }
  }, [fetchAll, projectId]);

  const saveProgress = useCallback(async (newProgress: Partial<HmsPlanProgress>) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('ks_hms_plan_progress')
        .upsert({
          project_id: projectId,
          ...newProgress,
        });

      if (error) throw error;
      
      setProgress(prev => ({ ...prev, ...newProgress }));
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Kunne ikke lagre fremdrift');
    }
  }, [projectId]);

  const saveGoals = useCallback(async (newGoals: Array<{ goal_text: string; is_predefined: boolean }>) => {
    if (!projectId) return;

    try {
      // Delete existing goals
      await supabase
        .from('ks_project_goals')
        .delete()
        .eq('project_id', projectId);

      // Insert new goals
      const goalsToInsert = newGoals.map((goal, index) => ({
        project_id: projectId,
        goal_text: goal.goal_text,
        is_predefined: goal.is_predefined,
        sort_order: index,
      }));

      const { data, error } = await supabase
        .from('ks_project_goals')
        .insert(goalsToInsert)
        .select();

      if (error) throw error;
      
      setGoals(data || []);
      toast.success('Mål lagret');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Kunne ikke lagre mål');
    }
  }, [projectId]);

  const saveOrganization = useCallback(async (orgContent: any) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('ks_project_organization')
        .upsert({
          project_id: projectId,
          content: orgContent,
        });

      if (error) throw error;
      
      setOrganization(orgContent);
      toast.success('Organisering lagret');
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Kunne ikke lagre organisering');
    }
  }, [projectId]);

  const saveRisks = useCallback(async (newRisks: Omit<KsProjectRisk, 'id' | 'project_id' | 'risk_score'>[]) => {
    if (!projectId) return;

    try {
      // Delete existing risks
      await supabase
        .from('ks_project_risks')
        .delete()
        .eq('project_id', projectId);

      // Insert new risks
      const risksToInsert = newRisks.map(risk => ({
        project_id: projectId,
        ...risk,
      }));

      const { data, error } = await supabase
        .from('ks_project_risks')
        .insert(risksToInsert)
        .select();

      if (error) throw error;
      
      setRisks(data || []);
      toast.success('Risikovurdering lagret');
    } catch (error) {
      console.error('Error saving risks:', error);
      toast.error('Kunne ikke lagre risikovurdering');
    }
  }, [projectId]);

  const saveActions = useCallback(async (newActions: Omit<KsProjectAction, 'id' | 'project_id'>[]) => {
    if (!projectId) return;

    try {
      // Delete existing actions
      await supabase
        .from('ks_project_actions')
        .delete()
        .eq('project_id', projectId);

      // Insert new actions
      const actionsToInsert = newActions.map(action => ({
        project_id: projectId,
        ...action,
      }));

      const { data, error } = await supabase
        .from('ks_project_actions')
        .insert(actionsToInsert)
        .select();

      if (error) throw error;
      
      setActions(data || []);
      toast.success('Handlingsplan lagret');
    } catch (error) {
      console.error('Error saving actions:', error);
      toast.error('Kunne ikke lagre handlingsplan');
    }
  }, [projectId]);

  const createSja = useCallback(async (sjaData: Omit<KsSja, 'id' | 'project_id' | 'created_by_user_id' | 'created_at' | 'updated_at'>) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase
        .from('ks_sja')
        .insert({
          project_id: projectId,
          ...sjaData,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSjaList(prev => [data, ...prev]);
      toast.success('SJA opprettet');
      return data;
    } catch (error) {
      console.error('Error creating SJA:', error);
      toast.error('Kunne ikke opprette SJA');
      return null;
    }
  }, [projectId]);

  return {
    goals,
    organization,
    risks,
    actions,
    sjaList,
    progress,
    isLoading,
    saveProgress,
    saveGoals,
    saveOrganization,
    saveRisks,
    saveActions,
    createSja,
    refetch: fetchAll,
  };
}