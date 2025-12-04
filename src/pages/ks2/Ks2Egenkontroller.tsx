import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  ClipboardCheck,
  Clock,
  FileDown,
  Upload,
  AlertCircle,
  Library,
} from "lucide-react";
import { useKsModule2Checklists, KsModule2Checklist } from "@/hooks/useKsModule2Checklists";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { Ks2ChecklistWizard } from "@/components/ks2/Ks2ChecklistWizard";
import { PaperChecklistUpload } from "@/components/ks2/PaperChecklistUpload";
import { format, parseISO, isPast, isThisWeek } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

type FilterType = "all" | "mine" | "incomplete" | "this_week" | "paper";

export default function Ks2Egenkontroller() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checklists, stats, isLoading, refetch } = useKsModule2Checklists(projectId || "");
  const { checklistTemplates, isLoading: isLoadingTemplates } = useKsModule2ProjectTemplates(projectId);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [uploadChecklist, setUploadChecklist] = useState<KsModule2Checklist | null>(null);

  // Open wizard if ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowWizard(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredChecklists = checklists.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    switch (filter) {
      case "mine":
        return true;
      case "incomplete":
        return c.status !== "completed";
      case "this_week":
        if (!c.deadline_date) return false;
        return isThisWeek(parseISO(c.deadline_date), { locale: nb });
      case "paper":
        return c.is_paper_version && !c.paper_uploaded;
      default:
        return true;
    }
  });

  const getStatusBadge = (checklist: KsModule2Checklist) => {
    if (checklist.status === "completed") {
      return <Badge className="bg-green-500">Fullført</Badge>;
    }
    if (checklist.is_paper_version && !checklist.paper_uploaded) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Venter på papir</Badge>;
    }
    if (checklist.deadline_date && isPast(parseISO(checklist.deadline_date))) {
      return <Badge variant="destructive">Overskredet</Badge>;
    }
    if (checklist.status === "in_progress") {
      return <Badge variant="secondary">Pågår</Badge>;
    }
    return <Badge variant="outline">Planlagt</Badge>;
  };

  const hasProjectTemplates = checklistTemplates.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Egenkontroller</h1>
          <p className="text-muted-foreground">
            {stats.completed} fullført, {stats.planned + stats.inProgress} gjenstår
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Last ned PDF-mal
          </Button>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ny egenkontroll
          </Button>
        </div>
      </div>

      {/* Info banner if no templates added */}
      {!isLoadingTemplates && !hasProjectTemplates && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Ingen sjekkliste-maler lagt til i prosjektet
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Gå til Malbibliotek for å legge til sjekkliste-maler som skal brukes i dette prosjektet.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-amber-500/50"
                  onClick={() => navigate(`/ks2/project/${projectId}/malbibliotek`)}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Gå til Malbibliotek
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project templates summary */}
      {hasProjectTemplates && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Library className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{checklistTemplates.length} sjekkliste-maler tilgjengelig</p>
                  <p className="text-sm text-muted-foreground">
                    Fra Malbibliotek for dette prosjektet
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/ks2/project/${projectId}/malbibliotek`)}
              >
                Legg til flere
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i egenkontroller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "all", label: "Alle" },
                { id: "incomplete", label: "Ufullførte" },
                { id: "this_week", label: "Denne uken" },
                { id: "paper", label: "Venter på papir", count: stats.waitingPaper },
              ].map((f) => (
                <Button
                  key={f.id}
                  variant={filter === f.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.id as FilterType)}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <Badge variant="secondary" className="ml-2">{f.count}</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : filteredChecklists.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen egenkontroller ennå</h3>
            <p className="text-muted-foreground mb-6">
              {hasProjectTemplates 
                ? "Opprett din første egenkontroll for å komme i gang"
                : "Legg til sjekkliste-maler i Malbibliotek først"
              }
            </p>
            {hasProjectTemplates ? (
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ny egenkontroll
              </Button>
            ) : (
              <Button onClick={() => navigate(`/ks2/project/${projectId}/malbibliotek`)}>
                <Library className="h-4 w-4 mr-2" />
                Gå til Malbibliotek
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredChecklists.map((checklist) => (
            <Card
              key={checklist.id}
              className={cn(
                "cursor-pointer hover:border-primary/50 transition-colors",
                checklist.status === "completed" && "bg-green-500/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg",
                      checklist.status === "completed" ? "bg-green-500/10" : "bg-primary/10"
                    )}>
                      <ClipboardCheck className={cn(
                        "h-5 w-5",
                        checklist.status === "completed" ? "text-green-500" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{checklist.title}</h3>
                        {getStatusBadge(checklist)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {checklist.template_name}
                        {checklist.responsible_user_name && ` • ${checklist.responsible_user_name}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {checklist.deadline_date && (
                          <span className={cn(
                            "flex items-center gap-1",
                            isPast(parseISO(checklist.deadline_date)) && checklist.status !== "completed"
                              ? "text-red-500"
                              : "text-muted-foreground"
                          )}>
                            <Clock className="h-4 w-4" />
                            {format(parseISO(checklist.deadline_date), "d. MMM yyyy", { locale: nb })}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {checklist.progress_percent}% fullført
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checklist.is_paper_version && !checklist.paper_uploaded && (
                      <Button variant="outline" size="sm" onClick={() => setUploadChecklist(checklist)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Last opp
                      </Button>
                    )}
                    {!checklist.is_paper_version && checklist.status !== "completed" && (
                      <Button size="sm">Fortsett</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wizard Dialog */}
      {showWizard && (
        <Ks2ChecklistWizard
          projectId={projectId || ""}
          onClose={() => {
            setShowWizard(false);
            refetch();
          }}
        />
      )}

      {/* Paper Upload Dialog */}
      {uploadChecklist && (
        <PaperChecklistUpload
          checklist={uploadChecklist}
          projectId={projectId || ""}
          onClose={() => {
            setUploadChecklist(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
