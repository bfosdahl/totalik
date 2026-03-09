import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BookOpen, Plus, Save, Trash2, ChevronDown, ChevronUp, 
  Edit3, Eye, GripVertical, CheckCircle2, Search, Printer,
  FileText, Download, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultPersonalhandbokChapters } from "@/lib/personalhandbokDefaults";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Chapter {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  content: string;
  sort_order: number;
  icon: string;
  is_active: boolean;
  is_default: boolean;
  version: number;
  last_edited_by_name: string | null;
  updated_at: string;
}

interface Confirmation {
  id: string;
  user_id: string;
  confirmed_at: string;
  handbook_version: number;
}

const PersonalhandbokPage = () => {
  const { company, profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmations, setConfirmations] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = isCompanyAdmin || isSystemAdmin;

  useEffect(() => {
    if (company?.id) {
      fetchChapters();
      fetchConfirmation();
      if (isAdmin) fetchAllConfirmations();
    }
  }, [company?.id]);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("personalhandbok_chapters")
        .select("*")
        .eq("company_id", company!.id)
        .order("sort_order");

      if (error) throw error;

      if (data && data.length > 0) {
        setChapters(data as Chapter[]);
        if (!selectedChapter) setSelectedChapter(data[0] as Chapter);
      } else {
        // Seed default chapters
        await seedDefaultChapters();
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      toast.error("Kunne ikke laste kapitler");
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultChapters = async () => {
    try {
      const chaptersToInsert = defaultPersonalhandbokChapters.map(ch => ({
        company_id: company!.id,
        title: ch.title,
        slug: ch.slug,
        content: ch.content,
        sort_order: ch.sort_order,
        icon: ch.icon,
        is_default: true,
        is_active: true,
        version: 1,
      }));

      const { data, error } = await supabase
        .from("personalhandbok_chapters")
        .insert(chaptersToInsert)
        .select();

      if (error) throw error;
      if (data) {
        setChapters(data as Chapter[]);
        setSelectedChapter(data[0] as Chapter);
      }
    } catch (error) {
      console.error("Error seeding chapters:", error);
    }
  };

  const fetchConfirmation = async () => {
    if (!profile?.id || !company?.id) return;
    try {
      const { data } = await supabase
        .from("personalhandbok_confirmations")
        .select("*")
        .eq("company_id", company.id)
        .eq("user_id", profile.id)
        .order("confirmed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setConfirmation(data as Confirmation | null);
    } catch (error) {
      console.error("Error fetching confirmation:", error);
    }
  };

  const fetchAllConfirmations = async () => {
    if (!company?.id) return;
    try {
      const { data } = await supabase
        .from("personalhandbok_confirmations")
        .select("*")
        .eq("company_id", company.id)
        .order("confirmed_at", { ascending: false });
      setConfirmations(data || []);
    } catch (error) {
      console.error("Error fetching confirmations:", error);
    }
  };

  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("personalhandbok_chapters")
        .update({
          title: editingChapter.title,
          content: editingChapter.content,
          is_active: editingChapter.is_active,
          last_edited_by_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          last_edited_by_id: profile?.id,
          version: editingChapter.version + 1,
        })
        .eq("id", editingChapter.id);

      if (error) throw error;
      toast.success("Kapittel lagret");
      setEditingChapter(null);
      fetchChapters();
    } catch (error) {
      console.error("Error saving chapter:", error);
      toast.error("Kunne ikke lagre kapittel");
    } finally {
      setSaving(false);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    try {
      const slug = newChapterTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-æøå]/g, '');
      const { error } = await supabase
        .from("personalhandbok_chapters")
        .insert({
          company_id: company!.id,
          title: newChapterTitle,
          slug,
          content: `<h2>${newChapterTitle}</h2>\n<p>Fyll inn innhold her...</p>`,
          sort_order: chapters.length,
          is_default: false,
          is_active: true,
        });

      if (error) throw error;
      toast.success("Kapittel lagt til");
      setShowAddDialog(false);
      setNewChapterTitle("");
      fetchChapters();
    } catch (error) {
      console.error("Error adding chapter:", error);
      toast.error("Kunne ikke legge til kapittel");
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Er du sikker på at du vil slette dette kapittelet?")) return;
    try {
      const { error } = await supabase
        .from("personalhandbok_chapters")
        .delete()
        .eq("id", chapterId);

      if (error) throw error;
      toast.success("Kapittel slettet");
      if (selectedChapter?.id === chapterId) setSelectedChapter(null);
      fetchChapters();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Kunne ikke slette kapittel");
    }
  };

  const handleConfirmRead = async () => {
    try {
      const maxVersion = Math.max(...chapters.map(c => c.version), 1);
      const { error } = await supabase
        .from("personalhandbok_confirmations")
        .insert({
          company_id: company!.id,
          user_id: profile!.id,
          handbook_version: maxVersion,
        });

      if (error) throw error;
      toast.success("Du har bekreftet at du har lest personalhåndboken");
      setShowConfirmDialog(false);
      fetchConfirmation();
      if (isAdmin) fetchAllConfirmations();
    } catch (error) {
      console.error("Error confirming:", error);
      toast.error("Kunne ikke bekrefte");
    }
  };

  const filteredChapters = chapters.filter(ch => 
    ch.is_active && ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentVersion = Math.max(...chapters.map(c => c.version), 1);
  const hasConfirmedCurrentVersion = confirmation && confirmation.handbook_version >= currentVersion;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Personalhåndbok</h1>
              <p className="text-sm text-muted-foreground">
                {company?.name} • Versjon {currentVersion}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <>
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <Eye className="w-4 h-4 mr-1.5" /> : <Edit3 className="w-4 h-4 mr-1.5" />}
                  {editMode ? "Forhåndsvisning" : "Rediger"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nytt kapittel
                </Button>
              </>
            )}
            {!hasConfirmedCurrentVersion && (
              <Button size="sm" onClick={() => setShowConfirmDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Bekreft lest
              </Button>
            )}
            {hasConfirmedCurrentVersion && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Bekreftet {format(new Date(confirmation!.confirmed_at), "dd.MM.yyyy", { locale: nb })}
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk i kapitler..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Chapter navigation */}
          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                Innholdsfortegnelse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredChapters.map((chapter, idx) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setSelectedChapter(chapter);
                      setEditingChapter(null);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 border-l-2",
                      selectedChapter?.id === chapter.id
                        ? "bg-primary/10 border-primary text-primary font-medium"
                        : "border-transparent hover:bg-muted/50 text-foreground/70"
                    )}
                  >
                    <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                    <span className="truncate">{chapter.title}</span>
                  </button>
                ))}
              </div>

              {/* Admin stats */}
              {isAdmin && (
                <div className="border-t p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{confirmations.length} bekreftelser totalt</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chapter content */}
          <div>
            {selectedChapter && !editingChapter ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{selectedChapter.title}</CardTitle>
                    {isAdmin && editMode && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingChapter({ ...selectedChapter })}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Rediger
                        </Button>
                        {!selectedChapter.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteChapter(selectedChapter.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedChapter.last_edited_by_name && (
                    <p className="text-xs text-muted-foreground">
                      Sist redigert av {selectedChapter.last_edited_by_name} • {format(new Date(selectedChapter.updated_at), "dd.MM.yyyy", { locale: nb })}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedChapter.content }}
                  />
                </CardContent>
              </Card>
            ) : editingChapter ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rediger kapittel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tittel</label>
                    <Input
                      value={editingChapter.title}
                      onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Innhold (HTML)</label>
                    <Textarea
                      value={editingChapter.content}
                      onChange={(e) => setEditingChapter({ ...editingChapter, content: e.target.value })}
                      rows={20}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveChapter} disabled={saving}>
                      <Save className="w-4 h-4 mr-1.5" />
                      {saving ? "Lagrer..." : "Lagre"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingChapter(null)}>
                      Avbryt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center py-20">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Velg et kapittel fra innholdsfortegnelsen</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add chapter dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til nytt kapittel</DialogTitle>
            <DialogDescription>Gi kapittelet et navn. Du kan redigere innholdet etterpå.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Kapitteltittel..."
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Avbryt</Button>
            <Button onClick={handleAddChapter}>Legg til</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm read dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bekreft at du har lest personalhåndboken</DialogTitle>
            <DialogDescription>
              Ved å bekrefte bekrefter du at du har lest og forstått innholdet i personalhåndboken (versjon {currentVersion}).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Avbryt</Button>
            <Button onClick={handleConfirmRead} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Jeg bekrefter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PersonalhandbokPage;
