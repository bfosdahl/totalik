import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DeviationComment {
  id: string;
  deviation_id: string;
  company_id: string;
  user_id: string | null;
  user_name: string;
  content: string;
  created_at: string;
}

export function useDeviationComments(deviationId: string | undefined) {
  const [comments, setComments] = useState<DeviationComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { profile, user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!deviationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deviation_comments')
        .select('*')
        .eq('deviation_id', deviationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Kunne ikke laste kommentarer');
    } finally {
      setIsLoading(false);
    }
  }, [deviationId]);

  const addComment = useCallback(async (content: string) => {
    if (!deviationId || !profile?.company_id || !content.trim()) return;

    setIsSaving(true);
    try {
      const userName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Ukjent bruker';
      
      const { data, error } = await supabase
        .from('deviation_comments')
        .insert({
          deviation_id: deviationId,
          company_id: profile.company_id,
          user_id: user?.id,
          user_name: userName,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => [...prev, data]);
      toast.success('Kommentar lagt til');
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Kunne ikke legge til kommentar');
    } finally {
      setIsSaving(false);
    }
  }, [deviationId, profile, user]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('deviation_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Kommentar slettet');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Kunne ikke slette kommentar');
    }
  }, []);

  return {
    comments,
    isLoading,
    isSaving,
    fetchComments,
    addComment,
    deleteComment
  };
}
