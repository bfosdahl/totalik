import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKsModule2Projects, KsModule2Project } from "@/hooks/useKsModule2Projects";
import { cn } from "@/lib/utils";

interface Shortcut {
  id: string;
  label: string;
  icon: typeof ClipboardCheck;
  path: string;
  color: string;
}

const shortcuts: Shortcut[] = [
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

const statusLabel: Record<string, string> = {
  planned: "Planlagt",
  active: "Aktiv",
  handover: "Overlevering",
  warranty: "Garanti",
  completed: "Ferdig",
};

export default function ProsjektHub() {
  const navigate = useNavigate();
  const { projects, isLoading } = useKsModule2Projects();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KsModule2Project | null>(null);

  const filtered = useMemo(() => {
    const visible = projects.filter((p) => p.status !== "completed");
    const sorted = [...visible].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return a.project_name.localeCompare(b.project_name, "nb");
    });
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.project_number?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const go = (shortcut: Shortcut) => {
    if (!selected) return;
    navigate(`/ks/project/${selected.id}${shortcut.path}`);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          {selected && (
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Tilbake">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">
              {selected ? selected.project_name : "Mine prosjekter"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selected
                ? `${selected.project_number}${selected.client_name ? ` · ${selected.client_name}` : ""}`
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
              className="space-y-3"
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
              ) : filtered.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  {projects.length === 0
                    ? "Du har ingen prosjekter ennå."
                    : "Ingen prosjekter matcher søket."}
                </Card>
              ) : (
                <div className="space-y-2">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="w-full text-left"
                    >
                      <Card className="p-3 hover:bg-accent transition-colors active:scale-[0.99]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {p.project_number}
                              </span>
                              {p.is_favorite && (
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              )}
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {statusLabel[p.status] || p.status}
                              </Badge>
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
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
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
                <p className="text-xs text-muted-foreground mb-1">Snarveier i</p>
                <p className="font-semibold">{selected.project_name}</p>
              </Card>

              <div className="grid grid-cols-3 gap-3">
                {shortcuts.map((s, i) => (
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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/ks/project/${selected.id}`)}
              >
                Åpne hele prosjektet
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
