import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Library, Search, Download, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useRoutineLibrary, RoutineLibraryModule, RoutineTemplate } from "@/hooks/useRoutineLibrary";
import { DEFAULT_ROUTINES, ROUTINE_CATEGORIES } from "@/hooks/useIkAlkoholRoutines";
import { toast } from "sonner";

const FREQUENCY_LABELS: Record<string, string> = {
  daglig: "Daglig",
  ukentlig: "Ukentlig",
  maanedlig: "Månedlig",
  aarlig: "Årlig",
  ved_behov: "Ved behov",
};

// Convert DEFAULT_ROUTINES to RoutineTemplate format for the library
const BUILTIN_ALKOHOL_TEMPLATES: RoutineTemplate[] = DEFAULT_ROUTINES.map((r, i) => ({
  id: `_builtin_${i}`,
  title: r.routine_name,
  description: r.description || null,
  module: "ik_alkohol",
  subcategory: ROUTINE_CATEGORIES.find(c => c.value === r.category)?.label || r.category,
  frequency: null,
  purpose: r.content.substring(0, 200),
  steps: r.content.split("\n").filter(line => line.trim().startsWith("- ")).map(line => ({ text: line.replace(/^-\s*/, "").trim() })).slice(0, 8),
  legal_refs: null,
  target_roles: null,
  tags: r.venue_type ? [r.venue_type] : null,
  status: "published",
  version: 1,
  is_global_default: true,
  created_at: new Date().toISOString(),
}));

interface RoutineLibraryDialogProps {
  module: RoutineLibraryModule;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  /** Custom adopt handler. If provided, this is called instead of the default customer_routine_instances insert. */
  onAdopt?: (template: RoutineTemplate) => Promise<void>;
  /** Set of already-adopted template IDs from the parent (overrides internal tracking) */
  adoptedIds?: Set<string>;
}

export function RoutineLibraryDialog({ 
  module, 
  buttonLabel = "Rutinebibliotek",
  buttonVariant = "outline",
  onAdopt,
  adoptedIds: externalAdoptedIds,
}: RoutineLibraryDialogProps) {
  const { templates: adminTemplates, isLoading, adoptTemplate, adoptedTemplateIds: internalAdoptedIds } = useRoutineLibrary(module);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adopting, setAdopting] = useState(false);
  const [localAdopted, setLocalAdopted] = useState<Set<string>>(new Set());

  const adoptedTemplateIds = externalAdoptedIds || internalAdoptedIds;

  // Merge admin templates with built-in alkohol templates
  const templates = useMemo(() => {
    if (module === "ik_alkohol") {
      // Combine built-in templates with any admin-published templates
      const adminIds = new Set(adminTemplates.map(t => t.title.toLowerCase()));
      const uniqueBuiltins = BUILTIN_ALKOHOL_TEMPLATES.filter(t => !adminIds.has(t.title.toLowerCase()));
      return [...uniqueBuiltins, ...adminTemplates];
    }
    return adminTemplates;
  }, [module, adminTemplates]);

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.subcategory || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdopt = async (template: RoutineTemplate) => {
    setAdopting(true);
    try {
      if (onAdopt) {
        await onAdopt(template);
      } else {
        await adoptTemplate.mutateAsync(template);
      }
      setLocalAdopted(prev => new Set([...prev, template.id]));
    } catch {
      toast.error("Kunne ikke legge til rutine");
    } finally {
      setAdopting(false);
    }
  };

  const isTemplateAdopted = (id: string) => adoptedTemplateIds.has(id) || localAdopted.has(id);

  if (templates.length === 0 && !isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={buttonVariant}>
            <Library className="w-4 h-4 mr-2" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="w-5 h-5" />
              Rutinebibliotek
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground py-8">
            Ingen rutiner tilgjengelig i biblioteket ennå. Kontakt systemadministrator for å publisere maler.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          <Library className="w-4 h-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5" />
            Rutinebibliotek
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk i rutiner..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(85vh - 180px)" }}>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? "Ingen rutiner funnet" : "Ingen maler tilgjengelig for denne modulen ennå"}
            </p>
          ) : (
            <div className="space-y-2 pr-4 pb-2">
              {filtered.map((template) => {
                const isAdopted = isTemplateAdopted(template.id);
                const isExpanded = expandedId === template.id;
                const steps = Array.isArray(template.steps) ? template.steps : [];

                return (
                  <Collapsible
                    key={template.id}
                    open={isExpanded}
                    onOpenChange={() => setExpandedId(isExpanded ? null : template.id)}
                  >
                    <Card className="border">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                              )}
                              <div className="min-w-0">
                                <CardTitle className="text-sm font-medium truncate">{template.title}</CardTitle>
                                {template.description && (
                                  <CardDescription className="text-xs line-clamp-1">{template.description}</CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {template.subcategory && (
                                <Badge variant="outline" className="text-xs">{template.subcategory}</Badge>
                              )}
                              {template.frequency && (
                                <Badge variant="secondary" className="text-xs">
                                  {FREQUENCY_LABELS[template.frequency] || template.frequency}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-3 px-4 space-y-3">
                          {template.purpose && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Formål</p>
                              <p className="text-sm">{template.purpose}</p>
                            </div>
                          )}
                          {steps.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Sjekkliste</p>
                              <ul className="space-y-1">
                                {steps.map((step: any, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-muted-foreground">•</span>
                                    <span>{typeof step === "string" ? step : step.text || step.label || JSON.stringify(step)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {template.target_roles && template.target_roles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.target_roles.map(role => (
                                <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                              ))}
                            </div>
                          )}
                          <div className="pt-2 border-t">
                            <Button
                              size="sm"
                              disabled={isAdopted || adopting}
                              onClick={() => handleAdopt(template)}
                              variant={isAdopted ? "secondary" : "default"}
                            >
                              {isAdopted ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Allerede lagt til
                                </>
                              ) : adopting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Legger til...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-1" />
                                  Legg til rutine
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
