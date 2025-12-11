import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus, Trash2, Loader2, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by_name: string;
}

interface SimpleProjectNotesProps {
  projectId: string;
}

export function SimpleProjectNotes({ projectId }: SimpleProjectNotesProps) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewNote, setShowNewNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_module2_project_notes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [projectId, profile?.company_id]);

  const handleSaveNew = async () => {
    if (!newContent.trim() || !profile?.company_id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("ks_module2_project_notes").insert({
        project_id: projectId,
        company_id: profile.company_id,
        title: newTitle || "Notat",
        content: newContent,
        created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Ukjent",
      });

      if (error) throw error;

      toast.success("Notat lagret");
      setShowNewNote(false);
      setNewTitle("");
      setNewContent("");
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Kunne ikke lagre notat");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (note: Note) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ks_module2_project_notes")
        .update({ title: newTitle, content: newContent })
        .eq("id", note.id);

      if (error) throw error;

      toast.success("Notat oppdatert");
      setEditingId(null);
      fetchNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Kunne ikke oppdatere notat");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("ks_module2_project_notes").delete().eq("id", id);

      if (error) throw error;

      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notat slettet");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Kunne ikke slette notat");
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setNewTitle(note.title);
    setNewContent(note.content);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Notater
        </CardTitle>
        <Button className="gap-2" onClick={() => setShowNewNote(true)}>
          <Plus className="w-4 h-4" />
          Nytt notat
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Note Form */}
        {showNewNote && (
          <div className="border rounded-lg p-4 space-y-3 bg-accent/30">
            <Input
              placeholder="Tittel (valgfritt)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Skriv notat..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewNote(false);
                  setNewTitle("");
                  setNewContent("");
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Avbryt
              </Button>
              <Button size="sm" onClick={handleSaveNew} disabled={isSaving || !newContent.trim()}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Lagre
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 && !showNewNote ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <StickyNote className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ingen notater ennå</p>
            <p className="text-sm text-muted-foreground">Opprett notater for å logge hendelser</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <Textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4 mr-1" />
                        Avbryt
                      </Button>
                      <Button size="sm" onClick={() => handleUpdate(note)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                        Lagre
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{note.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.created_by_name} • {format(new Date(note.created_at), "d. MMM yyyy HH:mm", { locale: nb })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(note)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{note.content}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
