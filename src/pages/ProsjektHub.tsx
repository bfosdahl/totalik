import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Search,
  Building2,
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
  HardHat,
  FileText,
  Clock,
  Image as ImageIcon,
  LayoutDashboard,
  FlaskConical,
  ArrowLeft,
  Loader2,
  Star,
  ChevronsUpDown,
  Check,
  Plus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useKsModule2Projects, KsModule2Project } from "@/hooks/useKsModule2Projects";
import { cn } from "@/lib/utils";
import { Ks2NewTimeEntryDialog } from "@/components/ks2/Ks2NewTimeEntryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { CreateTimeEntry } from "@/hooks/useTimeEntries";

interface Shortcut {
  id: string;
  label: string;
  icon: typeof ClipboardCheck;
  path: string;
  color: string;
}

const allShortcuts: Shortcut[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "", color: "bg-slate-500" },
  { id: "timer", label: "Timer", icon: Clock, path: "/timeregistrering", color: "bg-primary" },
  { id: "sjekklister", label: "Sjekklister", icon: ClipboardCheck, path: "/sjekklister", color: "bg-sky-500" },
  { id: "sja", label: "SJA", icon: FileText, path: "/hms/sja", color: "bg-emerald-500" },
  { id: "avvik", label: "Avvik", icon: AlertTriangle, path: "/avvik", color: "bg-orange-500" },
  { id: "vernerunde", label: "Vernerunde", icon: HardHat, path: "/hms/vernerunder", color: "bg-blue-500" },
  { id: "dagsrapport", label: "Dagsrapport", icon: FileText, path: "/dagsrapport", color: "bg-indigo-500" },
  { id: "bilder", label: "Bilder", icon: ImageIcon, path: "/bilder", color: "bg-pink-500" },
  { id: "stoff", label: "Stoffkartotek", icon: FlaskConical, path: "/hms/stoffkartotek", color: "bg-amber-600" },
];

// Hvilke snarveier som vises per prosjekttype/entreprenørrolle.
// Standard prosjekt har alt; mini/small har en redusert meny i tråd med
// Ks2ProjectSidebar (smallProjectItems / miniProjectItems).
const SHORTCUTS_BY_TYPE: Record<string, string[]> = {
  mini: ["dashboard", "sjekklister", "avvik", "bilder"],
  small: ["dashboard", "timer", "sjekklister", "dagsrapport", "bilder"],
};

function getAvailableShortcuts(project: KsModule2Project): Shortcut[] {
  const type = ((project as any).project_type as string) || "standard";
  const contractor = project.contractor_type;
  const allowed = SHORTCUTS_BY_TYPE[type];
  let list = allowed
    ? allShortcuts.filter((s) => allowed.includes(s.id))
    : allShortcuts.slice();
  // Underentreprenører bruker sjelden vernerunde/stoffkartotek på eget prosjekt.
  if (type === "standard" && contractor === "under") {
    list = list.filter((s) => s.id !== "vernerunde");
  }
  return list;
}

const statusLabel: Record<string, string> = {
  planned: "Planlagt",
  active: "Aktiv",
  handover: "Overlevering",
  warranty: "Garanti",
  completed: "Ferdig",
};

interface ProjectRowProps {
  project: KsModule2Project;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  compact?: boolean;
  hasDraft?: boolean;
}

function ProjectRow({ project, onSelect, onToggleFavorite, compact, hasDraft }: ProjectRowProps) {
  return (
    <button onClick={onSelect} className="w-full text-left">
      <Card className={cn("hover:bg-accent transition-colors active:scale-[0.99]", compact ? "p-2.5" : "p-3")}>
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg bg-primary/10 flex items-center justify-center shrink-0", compact ? "h-8 w-8" : "h-10 w-10")}>
            <Building2 className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{project.project_number}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {statusLabel[project.status] || project.status}
              </Badge>
              {hasDraft && (
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 hover:bg-amber-500 text-white">
                  Utkast
                </Badge>
              )}
            </div>
            <div className="font-medium text-sm line-clamp-1">{project.project_name}</div>

            {!compact && project.client_name && (
              <div className="text-xs text-muted-foreground line-clamp-1">{project.client_name}</div>
            )}
          </div>
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-md hover:bg-muted shrink-0"
            aria-label={project.is_favorite ? "Fjern favoritt" : "Marker som favoritt"}
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                project.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )}
            />
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </button>
  );
}

const DRAFTS_KEY = "prosjekt-hub:pending-time-drafts"; // map<projectId, PendingDraft>
const LEGACY_DRAFT_KEY = "prosjekt-hub:pending-time-draft"; // gammel enkelt-nøkkel
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type PendingDraft = {
  projectId: string;
  projectName: string;
  projectNumber: string;
  openedAt: number;
};

type DraftMap = Record<string, PendingDraft>;

function readDrafts(): DraftMap {
  try {
    // Migrer gammel enkelt-nøkkel hvis den finnes
    const legacy = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (legacy) {
      try {
        const d: PendingDraft = JSON.parse(legacy);
        if (d?.projectId) {
          const current = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}") as DraftMap;
          if (!current[d.projectId]) {
            current[d.projectId] = d;
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(current));
          }
        }
      } catch {
        /* ignore */
      }
      localStorage.removeItem(LEGACY_DRAFT_KEY);
    }
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw) as DraftMap;
    // Rens utløpte
    const now = Date.now();
    let changed = false;
    for (const id of Object.keys(map)) {
      if (now - (map[id]?.openedAt ?? 0) > DRAFT_TTL_MS) {
        delete map[id];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(DRAFTS_KEY, JSON.stringify(map));
    return map;
  } catch {
    return {};
  }
}

function writeDrafts(map: DraftMap) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(map));
}

function upsertDraft(draft: PendingDraft) {
  const map = readDrafts();
  map[draft.projectId] = draft;
  writeDrafts(map);
}

function removeDraft(projectId: string) {
  const map = readDrafts();
  if (map[projectId]) {
    delete map[projectId];
    writeDrafts(map);
  }
}

export default function ProsjektHub() {
  const navigate = useNavigate();
  const { projects, isLoading, toggleFavorite } = useKsModule2Projects();
  const { createEntry } = useTimeEntries();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KsModule2Project | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherSearch, setSwitcherSearch] = useState("");
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  // Sett med projectId som har et utkast – brukt for badges i UI
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());

  // Sporing av ulagrede tidsregistreringer
  const justSubmittedRef = useRef(false);
  const draftChecked = useRef(false);

  const refreshDraftIds = () => {
    setDraftIds(new Set(Object.keys(readDrafts())));
  };

  // Intercept lukking av timedialogen for å bekrefte mot ulagrede endringer
  const handleTimeDialogOpenChange = (next: boolean) => {
    if (next) {
      setTimeDialogOpen(true);
      return;
    }
    if (justSubmittedRef.current || !timeDialogOpen) {
      setTimeDialogOpen(false);
      return;
    }
    setConfirmCloseOpen(true);
  };

  const handleKeepDraft = () => {
    // Behold utkast for valgt prosjekt
    setConfirmCloseOpen(false);
    setTimeDialogOpen(false);
    refreshDraftIds();
  };

  const handleDiscardDraft = () => {
    if (selected) removeDraft(selected.id);
    justSubmittedRef.current = true; // hindre påminnelse-toast denne gangen
    setConfirmCloseOpen(false);
    setTimeDialogOpen(false);
    refreshDraftIds();
  };

  // Sjekk for ulagrede utkast ved oppstart
  useEffect(() => {
    if (draftChecked.current) return;
    if (isLoading || projects.length === 0) return;
    draftChecked.current = true;

    const drafts = readDrafts();
    const list = Object.values(drafts)
      .filter((d) => projects.some((p) => p.id === d.projectId))
      .sort((a, b) => b.openedAt - a.openedAt);

    setDraftIds(new Set(list.map((d) => d.projectId)));
    if (list.length === 0) return;

    const mostRecent = list[0];
    const extra = list.length - 1;
    toast({
      title: list.length > 1 ? `${list.length} ulagrede timeføringer` : "Ulagret timeføring",
      description:
        list.length > 1
          ? `Sist: ${mostRecent.projectName}${extra > 0 ? ` (+${extra} til)` : ""}. Velg prosjekt for å fortsette.`
          : `Du åpnet timedialogen for ${mostRecent.projectName} uten å lagre. Vil du fullføre nå?`,
      action: (
        <ToastAction
          altText="Fullfør"
          onClick={() => {
            const proj = projects.find((p) => p.id === mostRecent.projectId);
            if (proj) {
              setSelected(proj);
              setTimeDialogOpen(true);
            } else {
              removeDraft(mostRecent.projectId);
              refreshDraftIds();
            }
          }}
        >
          Fullfør
        </ToastAction>
      ),
    });
  }, [isLoading, projects, toast]);

  // Lagre/fjern utkast når timedialogen åpnes/lukkes
  useEffect(() => {
    if (timeDialogOpen && selected) {
      // Bevar opprinnelig openedAt hvis utkast finnes fra før
      const existing = readDrafts()[selected.id];
      upsertDraft({
        projectId: selected.id,
        projectName: selected.project_name,
        projectNumber: selected.project_number,
        openedAt: existing?.openedAt ?? Date.now(),
      });
      justSubmittedRef.current = false;
      refreshDraftIds();
    } else if (!timeDialogOpen && selected) {
      if (justSubmittedRef.current) {
        // submit-sti rydder selv – ingenting å gjøre her
      } else if (readDrafts()[selected.id]) {
        toast({
          title: "Påminnelse",
          description: `Utkast beholdt for ${selected.project_name}. Klikk for å fortsette.`,
          action: (
            <ToastAction altText="Fortsett" onClick={() => setTimeDialogOpen(true)}>
              Fortsett
            </ToastAction>
          ),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeDialogOpen]);

  const active = useMemo(
    () => projects.filter((p) => p.status !== "completed"),
    [projects]
  );

  const favorites = useMemo(
    () => active.filter((p) => p.is_favorite).sort((a, b) => a.project_name.localeCompare(b.project_name, "nb")),
    [active]
  );

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...active].sort((a, b) => a.project_name.localeCompare(b.project_name, "nb"));
    if (!q) return base;
    return base.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.project_number?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
    );
  }, [active, search]);

  const switcherList = useMemo(() => {
    const q = switcherSearch.trim().toLowerCase();
    const base = [...active].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return a.project_name.localeCompare(b.project_name, "nb");
    });
    if (!q) return base;
    return base.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.project_number?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q)
    );
  }, [active, switcherSearch]);

  const go = (shortcut: Shortcut) => {
    if (!selected) return;
    if (shortcut.id === "timer") {
      setTimeDialogOpen(true);
      return;
    }
    navigate(`/ks/project/${selected.id}${shortcut.path}`);
  };

  const handleSwitch = (p: KsModule2Project) => {
    setSelected(p);
    setSwitcherOpen(false);
    setSwitcherSearch("");
  };

  const handleTimeSubmit = async (entry: CreateTimeEntry): Promise<boolean> => {
    if (!selected) return false;
    const ok = await createEntry({
      ...entry,
      ks_project_id: selected.id,
      project_name: selected.project_name,
    });
    if (ok) {
      justSubmittedRef.current = true;
      removeDraft(selected.id);
      refreshDraftIds();
    }
    return ok;
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2">
          {selected && (
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Tilbake">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              {selected ? "Snarveier" : "Mine prosjekter"}
            </h1>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {selected
                ? `${selected.project_number} · ${selected.project_name}`
                : "Velg prosjekt for å registrere timer, sjekklister, SJA og mer"}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Søk på prosjekt, nummer, kunde, adresse"
                  className="pl-10 h-11"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Favoritter */}
                  {favorites.length > 0 && !search.trim() && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <h2 className="text-sm font-semibold">Favoritter</h2>
                        <span className="text-xs text-muted-foreground">({favorites.length})</span>
                      </div>
                      <div className="space-y-2">
                        {favorites.map((p) => (
                          <ProjectRow
                            key={p.id}
                            project={p}
                            hasDraft={draftIds.has(p.id)}
                            onSelect={() => setSelected(p)}
                            onToggleFavorite={(e) => {
                              e.stopPropagation();
                              toggleFavorite(p.id, p.is_favorite);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alle */}
                  <div className="space-y-2">
                    {favorites.length > 0 && !search.trim() && (
                      <h2 className="text-sm font-semibold px-1 pt-2">Alle prosjekter</h2>
                    )}
                    {filteredList.length === 0 ? (
                      <Card className="p-8 text-center text-sm text-muted-foreground">
                        {active.length === 0
                          ? "Du har ingen aktive prosjekter ennå."
                          : "Ingen prosjekter matcher søket."}
                      </Card>
                    ) : (
                      filteredList.map((p) => (
                        <ProjectRow
                          key={p.id}
                          project={p}
                          onSelect={() => setSelected(p)}
                          onToggleFavorite={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p.id, p.is_favorite);
                          }}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Project switcher */}
              <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
                <SheetTrigger asChild>
                  <button className="w-full text-left">
                    <Card className="p-3 bg-gradient-to-br from-primary/5 to-transparent hover:bg-accent transition-colors active:scale-[0.99]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Aktivt prosjekt
                            </p>
                            {selected.is_favorite && (
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            )}
                          </div>
                          <p className="font-semibold text-sm line-clamp-1">
                            {selected.project_name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {selected.project_number}
                            {selected.client_name ? ` · ${selected.client_name}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          Bytt
                          <ChevronsUpDown className="h-4 w-4" />
                        </div>
                      </div>
                    </Card>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85vh] rounded-t-2xl p-0 flex flex-col"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <SheetHeader className="px-4 pt-4 pb-2">
                    <SheetTitle>Bytt prosjekt</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={switcherSearch}
                        onChange={(e) => setSwitcherSearch(e.target.value)}
                        placeholder="Søk prosjekt"
                        className="pl-10 h-10"
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                    {switcherList.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        Ingen treff.
                      </p>
                    ) : (
                      switcherList.map((p) => {
                        const isCurrent = p.id === selected.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSwitch(p)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                              isCurrent ? "bg-primary/10 border-primary/30" : "hover:bg-accent"
                            )}
                          >
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {p.project_number}
                                </span>
                                {p.is_favorite && (
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                )}
                              </div>
                              <div className="font-medium text-sm line-clamp-1">
                                {p.project_name}
                              </div>
                              {p.client_name && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {p.client_name}
                                </div>
                              )}
                            </div>
                            {isCurrent && <Check className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Favoritt-snarveier */}
              {favorites.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Hopp til favoritt
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {favorites.map((p) => {
                      const isCurrent = p.id === selected.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className={cn(
                            "shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors",
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-accent border-border"
                          )}
                        >
                          <span className="font-mono text-[10px] opacity-70 mr-1.5">
                            {p.project_number}
                          </span>
                          {p.project_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick time entry CTA – kun når timer er tilgjengelig for prosjekttypen */}
              {getAvailableShortcuts(selected).some((s) => s.id === "timer") && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setTimeDialogOpen(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-sm hover:shadow transition-all active:scale-[0.98]"
                >
                  <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Registrer timer</div>
                    <div className="text-[11px] text-primary-foreground/80">
                      Før timer direkte på {selected.project_name}
                    </div>
                  </div>
                  <Clock className="ml-auto h-5 w-5 opacity-70 shrink-0" />
                </motion.button>
              )}

              {/* Snarvei-grid – tilpasset prosjektets moduler */}
              {(() => {
                const available = getAvailableShortcuts(selected).filter((s) => s.id !== "timer");
                const hasTimer = getAvailableShortcuts(selected).some((s) => s.id === "timer");
                return (
                  <>
                    {!hasTimer && null}
                    <div className="grid grid-cols-3 gap-3">
                      {available.map((s, i) => (
                        <motion.button
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                          onClick={() => go(s)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-accent transition-colors active:scale-[0.97]"
                        >
                          <div
                            className={cn(
                              "h-11 w-11 rounded-xl flex items-center justify-center text-white",
                              s.color
                            )}
                          >
                            <s.icon className="h-5 w-5" />
                          </div>
                          <span className="text-[11px] font-medium text-center leading-tight">
                            {s.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Snarveier vises basert på prosjekttypen ({((selected as any).project_type as string) || "standard"}).
                    </p>
                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selected.id, selected.is_favorite)}
                >
                  <Star
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.is_favorite && "fill-amber-400 text-amber-400"
                    )}
                  />
                  {selected.is_favorite ? "Favoritt" : "Marker favoritt"}
                </Button>
                <Button onClick={() => navigate(`/ks/project/${selected.id}`)}>
                  Åpne prosjekt
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {/* Quick time entry dialog */}
              {selected && (
                <Ks2NewTimeEntryDialog
                  open={timeDialogOpen}
                  onOpenChange={handleTimeDialogOpenChange}
                  onSubmit={handleTimeSubmit}
                  projectId={selected.id}
                  projectName={selected.project_name}
                />
              )}

              {/* Bekreftelse ved lukking med ulagrede endringer */}
              <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lukke uten å lagre?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Du har påbegynt en timeføring{selected ? ` på ${selected.project_name}` : ""}. Velg om du vil lagre utkastet for å fortsette senere, forkaste det, eller gå tilbake til skjemaet.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="sm:mr-auto">
                      Tilbake til skjema
                    </AlertDialogCancel>
                    <Button variant="outline" onClick={handleDiscardDraft}>
                      Forkast
                    </Button>
                    <AlertDialogAction onClick={handleKeepDraft}>
                      Lagre utkast og lukk
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
