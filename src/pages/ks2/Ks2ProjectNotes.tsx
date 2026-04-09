import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProjectNote {
  id: string;
  title: string;
  content: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export default function Ks2ProjectNotes() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["project-notes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simple_project_notes" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectNote[];
    },
    enabled: !!projectId,
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("simple_project_notes" as any).insert({
        project_id: projectId,
        company_id: profile?.company_id,
        title,
        content,
        created_by_id: profile?.user_id,
        created_by_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notes", projectId] });
      setShowDialog(false);
      setTitle("");
      setContent("");
      toast.success("Notat opprettet");
    },
    onError: () => toast.error("Kunne ikke opprette notat"),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simple_project_notes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notes", projectId] });
      toast.success("Notat slettet");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <StickyNote className="h-6 w-6" />
          Notater
        </h2>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nytt notat
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <StickyNote className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ingen notater ennå</p>
            <p className="text-sm text-muted-foreground">Legg til notater for å holde oversikt over prosjektet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{note.title || "Uten tittel"}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.created_by_name} · {format(new Date(note.created_at), "d. MMM yyyy HH:mm", { locale: nb })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteNote.mutate(note.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nytt notat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Tittel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Skriv notatet ditt her..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
            <Button onClick={() => createNote.mutate()} disabled={!content.trim() || createNote.isPending}>
              {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
