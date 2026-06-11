import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, Search, Loader2 } from "lucide-react";
import { useCompanyKsChecklistTemplates, CompanyKsChecklistTemplate } from "@/hooks/useCompanyKsChecklistTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (templates: CompanyKsChecklistTemplate[]) => Promise<void> | void;
  isSaving?: boolean;
}

export function ImportCompanyChecklistsDialog({ open, onOpenChange, onImport, isSaving }: Props) {
  const { templates, isLoading } = useCompanyKsChecklistTemplates();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch("");
    }
  }, [open]);

  const filtered = templates.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.template_name.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    const chosen = templates.filter((t) => selected.has(t.id));
    if (chosen.length === 0) return;
    await onImport(chosen);
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
            Hent sjekklister fra firmabiblioteket
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i firmaets sjekkliste-maler..."
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
              {templates.length === 0
                ? "Ingen sjekkliste-maler i firmabiblioteket ennå. Opprett maler under KS → Sjekklister i hovedmenyen."
                : "Ingen treff på søket"}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((t) => {
                const isSelected = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-md border transition-colors ${
                      isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/50 border-transparent"
                    }`}
                  >
                    <Checkbox checked={isSelected} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{t.template_name}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {t.checkpoints.length} punkter
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <span className="text-sm text-muted-foreground">{selected.size} valgt</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Avbryt
            </Button>
            <Button onClick={handleImport} disabled={selected.size === 0 || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Legg til i prosjekt
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
