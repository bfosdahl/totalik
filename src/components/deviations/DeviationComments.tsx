import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useDeviationComments } from '@/hooks/useDeviationComments';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DeviationCommentsProps {
  deviationId: string;
}

export function DeviationComments({ deviationId }: DeviationCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const { comments, isLoading, isSaving, fetchComments, addComment, deleteComment } = useDeviationComments(deviationId);
  const { user, isCompanyAdmin, isSystemAdmin } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await addComment(newComment);
    setNewComment('');
  };

  const canDeleteComment = (commentUserId: string | null) => {
    return commentUserId === user?.id || isCompanyAdmin || isSystemAdmin;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd. MMM yyyy, HH:mm', { locale: nb });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">Kommentarer ({comments.length})</h4>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Ingen kommentarer ennå</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{comment.user_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  {canDeleteComment(comment.user_id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Skriv en kommentar..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={!newComment.trim() || isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Legg til kommentar
        </Button>
      </form>
    </div>
  );
}
