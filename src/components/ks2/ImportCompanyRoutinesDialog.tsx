import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, Search, Loader2, Check } from "lucide-react";
import { useCompanyKsRoutines, CompanyKsRoutine } from "@/hooks/useCompanyKsRoutines";

interface ImportCompanyRoutinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs of company_ks_routines already imported into this project (disables checkbox) */
  alreadyImportedIds?: Set<string>;
  onImport: (selectedIds: string[]) => Promise<void> | void;
  isSaving?: boolean;
}

export function ImportCompanyRoutinesDialog({
  open,
  onOpenChange,
  alreadyImportedIds = new Set(),
  onImport,
  isSaving = false,
}: ImportCompanyRoutinesDialogProps) {
  const { routines, isLoading } = useCompanyKsRoutines(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch("");
    }
  }, [open]);

  const filtered: CompanyKsRoutine[] = routines.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.routine_name.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    await onImport(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Hent rutiner fra firmabiblioteket
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i firmaets rutiner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {routines.length === 0
                ? "Ingen rutiner i firmabiblioteket ennå. Opprett rutiner under KS-Rutiner i hovedmenyen."
                : "Ingen treff på søket"}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((r) => {
                const isImported = alreadyImportedIds.has(r.id);
                const isSelected = selected.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={isImported}
                    onClick={() => !isImported && toggle(r.id)}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-md border transition-colors ${
                      isImported
                        ? "opacity-60 bg-muted/30 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50 border-transparent"
                    }`}
                  >
                    {isImported ? (
                      <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                    ) : (
                      <Checkbox checked={isSelected} className="mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.routine_number && (
                          <Badge variant="outline" className="text-xs font-mono shrink-0">
                            {r.routine_number}
                          </Badge>
                        )}
                        <p className="font-medium text-sm">{r.routine_name}</p>
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {r.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                        {isImported && (
                          <span className="text-xs text-green-600">Allerede importert</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {selected.size} valgt
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Avbryt
            </Button>
            <Button
              onClick={handleImport}
              disabled={selected.size === 0 || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Importer til prosjekt
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
