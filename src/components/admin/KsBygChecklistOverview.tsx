import { useState } from "react";
import { useAdminKsTemplates, CHECKLIST_CATEGORIES } from "@/hooks/useAdminKsTemplates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import {
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { KsBygChecklistEditDialog } from "./KsBygChecklistEditDialog";
import type { AdminChecklistTemplate } from "@/hooks/useAdminKsTemplates";
import { t } from "@/i18n/t";

export function KsBygChecklistOverview() {
  const { checklistTemplates, isLoading, deleteChecklistTemplate } = useAdminKsTemplates();
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<AdminChecklistTemplate | null>(null);

  const filtered = checklistTemplates.filter(
    (t) =>
      !search ||
      t.template_name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, t) => {
    const cat = t.category || "Ukategorisert";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-sm">{t("auto.sjekklistemaler")}</h3>
          <Badge variant="secondary" className="text-xs">
            {checklistTemplates.length}
          </Badge>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("auto.soek_i_maler")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("auto.ingen_sjekklistemaler_funnet")}
        </p>
      ) : (
        <div className="space-y-1.5">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, templates]) => {
              const isOpen = expandedCategories.has(category);
              return (
                <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1">{category}</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {templates.length}
                      </Badge>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 space-y-1 pb-1">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/40 group text-sm"
                        >
                          <FileCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{tpl.template_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tpl.checkpoints?.length || 0} sjekkpunkter
                              {tpl.version && ` • v${tpl.version}`}
                              {tpl.created_at &&
                                ` • ${format(new Date(tpl.created_at), "d. MMM yyyy", { locale: nb })}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {tpl.is_mandatory && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                {t("auto.obligatorisk")}
                              </Badge>
                            )}
                            {tpl.is_active ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px] h-4 px-1.5">
                                {t("auto.aktiv")}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                {t("auto.inaktiv")}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={() => setEditTemplate(tpl)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(tpl.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auto.slett_sjekklistemal")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auto.denne_handlingen_kan_ikke_angres_malen_v")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteChecklistTemplate.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              {t("auto.slett")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <KsBygChecklistEditDialog
        template={editTemplate}
        open={!!editTemplate}
        onOpenChange={(open) => !open && setEditTemplate(null)}
      />
    </div>
  );
}
