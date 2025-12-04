import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FolderKanban, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useKsModule2Projects, NewKsModule2ProjectInput, KsModule2Project } from "@/hooks/useKsModule2Projects";
import { NewProjectDialog } from "@/components/ks2/NewProjectDialog";
import { ProjectCard } from "@/components/ks2/ProjectCard";
import { CopyProjectDialog } from "@/components/ks2/CopyProjectDialog";

type FilterType = "all" | "mine" | "active" | "completed" | "with_deviations";

export default function Ks2Dashboard() {
  const navigate = useNavigate();
  const { isCompanyAdmin, isSystemAdmin } = useAuth();
  const { projects, isLoading, isSaving, createProject, toggleFavorite, refetch } = useKsModule2Projects();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [copyProject, setCopyProject] = useState<KsModule2Project | null>(null);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "all", label: "Alle" },
    { key: "mine", label: "Mine" },
    { key: "active", label: "Aktive" },
    { key: "completed", label: "Fullførte" },
    { key: "with_deviations", label: "Med åpne avvik" },
  ];

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.project_name.toLowerCase().includes(query) ||
          p.project_number.toLowerCase().includes(query) ||
          (p.address && p.address.toLowerCase().includes(query))
      );
    }

    // Status filter
    switch (activeFilter) {
      case "active":
        result = result.filter((p) => p.status === "active");
        break;
      case "completed":
        result = result.filter((p) => p.status === "completed");
        break;
      // TODO: Implement "mine" and "with_deviations" when we have user assignment and deviations
      default:
        break;
    }

    // Sort: favorites first, then by updated_at
    result.sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) {
        return a.is_favorite ? -1 : 1;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return result;
  }, [projects, searchQuery, activeFilter]);

  const handleCreateProject = async (data: NewKsModule2ProjectInput) => {
    await createProject(data);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/ks2/project/${projectId}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">KS Modul #2 – Mine prosjekter</h1>
            <p className="text-muted-foreground mt-1">
              Kvalitetssikring for bygg og anlegg
            </p>
          </div>
          <div className="flex gap-2">
            {(isCompanyAdmin || isSystemAdmin) && (
              <Button variant="outline" onClick={() => navigate("/ks2/admin")} className="shrink-0">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button onClick={() => setIsNewProjectOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nytt prosjekt
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i prosjektnavn, nummer eller adresse"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <Button
                key={btn.key}
                variant={activeFilter === btn.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(btn.key)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects grid or empty state */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
                onToggleFavorite={toggleFavorite}
                onCopy={(p) => setCopyProject(p)}
                openDeviationsCount={0} // TODO: Implement deviation counting
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <FolderKanban className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || activeFilter !== "all"
                  ? "Ingen prosjekter funnet"
                  : "Opprett ditt første prosjekt"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {searchQuery || activeFilter !== "all"
                  ? "Prøv å endre søk eller filter"
                  : "Start med å opprette et nytt prosjekt for å komme i gang med kvalitetssikring"}
              </p>
              {!searchQuery && activeFilter === "all" && (
                <Button onClick={() => setIsNewProjectOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt prosjekt
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New project dialog */}
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onSubmit={handleCreateProject}
        isSaving={isSaving}
      />

      {/* Copy project dialog */}
      {copyProject && (
        <CopyProjectDialog
          open={!!copyProject}
          onOpenChange={(open) => !open && setCopyProject(null)}
          sourceProject={copyProject}
          onSuccess={() => {
            setCopyProject(null);
            refetch();
          }}
        />
      )}
    </AppLayout>
  );
}
