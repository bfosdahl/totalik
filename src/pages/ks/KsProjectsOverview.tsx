import { AppLayout } from "@/components/layout/AppLayout";
import { useKsProjects } from "@/hooks/useKsProjects";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderKanban, CheckCircle2, AlertCircle, TrendingUp, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function KsProjectsOverview() {
  const navigate = useNavigate();
  const { projects, isLoading } = useKsProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Calculate stats
  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0, planned: 0 };
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === "pågår").length,
      completed: projects.filter(p => p.status === "ferdig").length,
      planned: projects.filter(p => p.status === "planlagt").length,
    };
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.project_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planlagt": return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "pågår": return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "ferdig": return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
      case "arkivert": return "bg-orange-500/10 text-orange-700 dark:text-orange-300";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planlagt": return "Planlagt";
      case "pågår": return "Pågår";
      case "ferdig": return "Ferdig";
      case "arkivert": return "Arkivert";
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Laster prosjektoversikt...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Prosjektoversikt</h1>
          <p className="text-muted-foreground">
            Oversikt over alle KS Bygg prosjekter med status og fremdrift
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totalt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planlagt</p>
                <p className="text-2xl font-bold">{stats.planned}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktive</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-500/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fullført</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter prosjektnavn eller nummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="planlagt">Planlagt</SelectItem>
                <SelectItem value="pågår">Pågår</SelectItem>
                <SelectItem value="ferdig">Ferdig</SelectItem>
                <SelectItem value="arkivert">Arkivert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Projects List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Ingen prosjekter matcher søket"
                  : "Ingen prosjekter ennå"}
              </p>
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/ks/projects/${project.id}`)}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

interface ProjectCardProps {
  project: any;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

function ProjectCard({ project, onClick, getStatusColor, getStatusLabel }: ProjectCardProps) {
  // Calculate checklist progress from project data (if available)
  const checklistProgress = useMemo(() => {
    // For now, return 0 - can be enhanced later with actual checklist data
    return 0;
  }, []);

  const openAvvikCount = 0; // Placeholder - can be enhanced with actual data

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="font-mono text-xs">
              {project.project_number}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold mb-1">{project.name}</h3>
          {project.address && (
            <p className="text-sm text-muted-foreground">{project.address}</p>
          )}
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
          {/* Checklist Progress */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Fremdrift</p>
              <p className="text-lg font-semibold">{checklistProgress}%</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray={`${checklistProgress}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Åpne avvik</p>
              <p className={`text-lg font-semibold ${openAvvikCount > 0 ? 'text-red-600' : ''}`}>
                {openAvvikCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
