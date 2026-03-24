import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ClipboardCheck, Loader2, Search, Calendar, User, 
  CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronRight, 
  Minus, Download, FolderOpen, Play
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { generateFilledChecklistPdf } from "@/utils/ksFilledChecklistPdf";
import { toast } from "sonner";
import { ContinueChecklistDialog } from "@/components/ks/ContinueChecklistDialog";

interface FilledChecklist {
  id: string;
  project_id: string;
  company_id: string;
  title: string;
  template_name: string;
  responsible_user_name: string | null;
  status: string;
  progress_percent: number;
  completed_at: string | null;
  created_at: string;
  checklist_items: any[];
}

interface ProjectInfo {
  id: string;
  project_name: string;
  project_number: string | null;
}

export default function KsUtfylteSjekklister() {
  const { profile } = useAuth();
  const [checklists, setChecklists] = useState<FilledChecklist[]>([]);
  const [projects, setProjects] = useState<Record<string, ProjectInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingProject, setDownloadingProject] = useState<string | null>(null);
  const [continueChecklist, setContinueChecklist] = useState<FilledChecklist | null>(null);

  useEffect(() => {
    if (!profile?.company_id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      
      const [checklistRes, projectRes] = await Promise.all([
        supabase
          .from("ks_module2_checklists" as any)
          .select("*")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false }) as any,
        supabase
          .from("ks_module2_projects" as any)
          .select("id, project_name, project_number")
          .eq("company_id", profile.company_id) as any,
      ]);

      if (!checklistRes.error && checklistRes.data) {
        setChecklists(checklistRes.data as FilledChecklist[]);
      }
      if (!projectRes.error && projectRes.data) {
        const map: Record<string, ProjectInfo> = {};
        for (const p of projectRes.data) map[p.id] = p;
        setProjects(map);
        // Expand all project groups by default
        setExpandedProjects(new Set(projectRes.data.map((p: any) => p.id)));
      }
      setIsLoading(false);
    };
    fetchData();
  }, [profile?.company_id]);

  const filtered = checklists.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.template_name.toLowerCase().includes(search.toLowerCase()) ||
    (projects[c.project_id]?.project_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped = useMemo(() => {
    const map = new Map<string, FilledChecklist[]>();
    const noProject: FilledChecklist[] = [];
    for (const c of filtered) {
      if (c.project_id && projects[c.project_id]) {
        if (!map.has(c.project_id)) map.set(c.project_id, []);
        map.get(c.project_id)!.push(c);
      } else {
        noProject.push(c);
      }
    }
    return { byProject: map, noProject };
  }, [filtered, projects]);

  const completedCount = checklists.filter(c => c.status === "completed").length;
  const inProgressCount = checklists.filter(c => c.status === "in_progress").length;

  const downloadSingle = async (checklist: FilledChecklist) => {
    setDownloadingId(checklist.id);
    try {
      const projectInfo = projects[checklist.project_id];
      await generateFilledChecklistPdf(checklist, projectInfo || null);
      toast.success("PDF lastet ned");
    } catch {
      toast.error("Kunne ikke generere PDF");
    }
    setDownloadingId(null);
  };

  const downloadProjectAll = async (projectId: string) => {
    const items = grouped.byProject.get(projectId);
    if (!items || items.length === 0) return;
    setDownloadingProject(projectId);
    try {
      const projectInfo = projects[projectId];
      for (const checklist of items) {
        await generateFilledChecklistPdf(checklist, projectInfo || null);
        await new Promise(r => setTimeout(r, 300)); // small delay between downloads
      }
      toast.success(`${items.length} PDF-er lastet ned`);
    } catch {
      toast.error("Kunne ikke generere PDF-er");
    }
    setDownloadingProject(null);
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Fullført</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Under arbeid</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  const renderChecklistRow = (checklist: FilledChecklist) => (
    <Card key={checklist.id} className="overflow-hidden">
      <Collapsible open={expandedId === checklist.id} onOpenChange={() => setExpandedId(expandedId === checklist.id ? null : checklist.id)}>
        <div className="flex items-center gap-3 px-4 py-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-muted/50 -m-3 p-3 rounded transition-colors">
              <div className="shrink-0">
                {expandedId === checklist.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
              <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{checklist.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(checklist.created_at), "dd. MMM yyyy", { locale: nb })}
                  {checklist.responsible_user_name && (
                    <>
                      <span>•</span>
                      <User className="w-3 h-3" />
                      {checklist.responsible_user_name}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(checklist.status)}
                <Badge variant="secondary" className="text-xs">{checklist.progress_percent}%</Badge>
              </div>
            </div>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={downloadingId === checklist.id}
            onClick={(e) => { e.stopPropagation(); downloadSingle(checklist); }}
            title="Last ned PDF"
          >
            {downloadingId === checklist.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </div>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 border-t">
            <div className="pt-3 space-y-2">
              {(checklist.checklist_items || []).map((item: any, idx: number) => {
                const isOk = item.value === true || item.value === "yes";
                const isNotOk = item.value === false || item.value === "no";
                return (
                  <div key={idx} className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-muted/30">
                    <span className="text-xs text-muted-foreground w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{item.text}</span>
                      {item.comment && <p className="text-xs text-muted-foreground mt-0.5">💬 {item.comment}</p>}
                    </div>
                    <div className="shrink-0">
                      {isOk && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {isNotOk && <AlertTriangle className="w-4 h-4 text-destructive" />}
                      {!isOk && !isNotOk && <Minus className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Utfylte sjekklister</h1>
          <p className="text-muted-foreground mt-1">Alle gjennomførte og pågående egenkontroller</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{checklists.length} totalt</span>
          <span>•</span>
          <span className="text-green-600">{completedCount} fullført</span>
          <span>•</span>
          <span className="text-amber-600">{inProgressCount} pågående</span>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Søk i sjekklister eller prosjekter..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">
                {checklists.length === 0 ? "Ingen utfylte sjekklister ennå" : "Ingen treff"}
              </h3>
              <p className="text-muted-foreground">
                {checklists.length === 0 ? 'Gå til Sjekklistemaler og klikk "Gjennomfør" for å fylle ut en sjekkliste' : "Prøv å endre søket ditt"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.byProject.entries()).map(([projectId, items]) => {
              const project = projects[projectId];
              const isExpanded = expandedProjects.has(projectId);
              return (
                <div key={projectId} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleProject(projectId)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <FolderOpen className="w-4 h-4 text-primary" />
                      {project?.project_number && <span className="text-muted-foreground">{project.project_number}</span>}
                      <span>{project?.project_name || "Ukjent prosjekt"}</span>
                      <Badge variant="secondary" className="text-xs ml-1">{items.length}</Badge>
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={downloadingProject === projectId}
                      onClick={() => downloadProjectAll(projectId)}
                      className="text-xs"
                    >
                      {downloadingProject === projectId ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                      Last ned alle ({items.length})
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="space-y-2 pl-2">
                      {items.map(renderChecklistRow)}
                    </div>
                  )}
                </div>
              );
            })}

            {grouped.noProject.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FolderOpen className="w-4 h-4" />
                  <span>Uten prosjekt</span>
                  <Badge variant="secondary" className="text-xs">{grouped.noProject.length}</Badge>
                </div>
                <div className="space-y-2 pl-2">
                  {grouped.noProject.map(renderChecklistRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
