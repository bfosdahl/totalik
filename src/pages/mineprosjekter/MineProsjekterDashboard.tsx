import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Star, StarOff, Building2, Calendar, Loader2, FolderOpen } from "lucide-react";
import { useSimpleProjects, SimpleProject } from "@/hooks/useSimpleProjects";
import { NewSimpleProjectDialog } from "@/components/mineprosjekter/NewSimpleProjectDialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  planned: "Planlagt",
  active: "Aktiv",
  handover: "Overlevering",
  warranty: "Garanti",
  completed: "Ferdig",
};

const statusColors: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  active: "bg-primary text-primary-foreground",
  handover: "bg-amber-500 text-white",
  warranty: "bg-purple-500 text-white",
  completed: "bg-green-500 text-white",
};

export default function MineProsjekterDashboard() {
  const navigate = useNavigate();
  const { projects, isLoading, isSaving, createProject, toggleFavorite } = useSimpleProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(query) ||
        p.project_number?.toLowerCase().includes(query) ||
        p.client_name?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleCreateProject = async (data: any) => {
    const result = await createProject(data);
    if (result) {
      setDialogOpen(false);
      navigate(`/ks/smaaprosjekter/${result.id}`);
    }
  };

  const handleProjectClick = (project: SimpleProject) => {
    navigate(`/ks/smaaprosjekter/${project.id}`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Småprosjekter</h1>
            <p className="text-muted-foreground mt-1">
              Enkel prosjektstyring for mindre jobber
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nytt prosjekt
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Søk etter prosjekt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty state */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ingen prosjekter ennå</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Opprett ditt første prosjekt for å komme i gang med enkel prosjektstyring.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Opprett prosjekt
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleProjectClick(project)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                        {project.project_name}
                      </CardTitle>
                      {project.project_number && (
                        <p className="text-sm text-muted-foreground">
                          #{project.project_number}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(project.id, project.is_favorite);
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {project.is_favorite ? (
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge className={statusColors[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>

                  {project.client_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{project.client_name}</span>
                    </div>
                  )}

                  {project.address && (
                    <p className="text-sm text-muted-foreground truncate">
                      {project.address}
                    </p>
                  )}

                  {project.planned_start_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {format(new Date(project.planned_start_date), "d. MMM yyyy", { locale: nb })}
                        {project.planned_end_date && (
                          <> - {format(new Date(project.planned_end_date), "d. MMM yyyy", { locale: nb })}</>
                        )}
                      </span>
                    </div>
                  )}

                  {project.contract_sum && (
                    <p className="text-sm font-medium">
                      Kr {project.contract_sum.toLocaleString("nb-NO")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NewSimpleProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateProject}
        isSaving={isSaving}
      />
    </AppLayout>
  );
}
