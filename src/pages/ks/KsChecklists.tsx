import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, Loader2, FileCheck, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function KsChecklists() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Read project from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const projectFromUrl = searchParams.get("project");
  
  const [selectedProject, setSelectedProject] = useState<string>(projectFromUrl || "all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  // Fetch all checklists with related data
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['ks-all-checklists', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('ks_checklists')
        .select(`
          *,
          template:ks_templates(*),
          project:ks_projects(
            id,
            name,
            project_number,
            address
          ),
          items:ks_checklist_items(
            id,
            status
          )
        `)
        .eq('project.company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch projects for filter
  const { data: projects } = useQuery({
    queryKey: ['ks-projects-filter', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('ks_projects')
        .select('id, name, project_number')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Filter checklists
  const filteredChecklists = checklists?.filter(checklist => {
    const matchesSearch = 
      checklist.template?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.project?.project_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProject = selectedProject === "all" || checklist.project_id === selectedProject;
    const matchesPhase = selectedPhase === "all" || checklist.phase === selectedPhase;
    
    return matchesSearch && matchesProject && matchesPhase;
  });

  // Calculate completion percentage
  const getCompletionPercentage = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    const completedItems = items.filter(item => 
      item.status && item.status !== 'pending'
    ).length;
    return Math.round((completedItems / items.length) * 100);
  };

  // Get unique phases
  const phases = Array.from(new Set(checklists?.map(c => c.phase).filter(Boolean))) as string[];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Sjekklister</h1>
            <p className="text-muted-foreground mt-2">
              Oversikt over alle utførte og pågående sjekklister
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Alle sjekklister
            </CardTitle>
            <CardDescription>
              Filtrer og søk i sjekklister for alle prosjekter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter sjekkliste eller prosjekt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle prosjekter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle prosjekter</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_number} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle faser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle faser</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredChecklists && filteredChecklists.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="border rounded-lg hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sjekkliste</TableHead>
                        <TableHead>Prosjekt</TableHead>
                        <TableHead>Fase</TableHead>
                        <TableHead>Opprettet</TableHead>
                        <TableHead>Utført dato</TableHead>
                        <TableHead>Fremdrift</TableHead>
                        <TableHead className="text-right">Handling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChecklists.map((checklist) => {
                        const completion = getCompletionPercentage(checklist.items || []);
                        
                        return (
                          <TableRow key={checklist.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                                {checklist.template?.name || "Ukjent mal"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {checklist.project?.name || "-"}
                                </div>
                                {checklist.project?.project_number && (
                                  <Badge variant="outline" className="text-xs">
                                    {checklist.project.project_number}
                                  </Badge>
                                 )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {checklist.phase ? (
                                <Badge variant="secondary">{checklist.phase}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(checklist.created_at), "dd.MM.yyyy", { locale: nb })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {checklist.filled_at ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  {format(new Date(checklist.filled_at), "dd.MM.yyyy HH:mm", { locale: nb })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Ikke utført</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${completion}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium min-w-[3ch]">
                                  {completion}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/ks/checklists/${checklist.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Åpne
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-3 md:hidden">
                  {filteredChecklists.map((checklist) => {
                    const completion = getCompletionPercentage(checklist.items || []);
                    
                    return (
                      <div 
                        key={checklist.id} 
                        className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/ks/checklists/${checklist.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{checklist.template?.name || "Ukjent mal"}</span>
                          </div>
                          {checklist.phase && (
                            <Badge variant="secondary" className="text-xs">{checklist.phase}</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{checklist.project?.name || "-"}</span>
                          {checklist.project?.project_number && (
                            <Badge variant="outline" className="text-xs">
                              {checklist.project.project_number}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(checklist.created_at), "dd.MM.yyyy", { locale: nb })}
                          </div>
                          {checklist.filled_at ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Utført</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Ikke utført</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{completion}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen sjekklister funnet</p>
                {(searchQuery || selectedProject !== "all" || selectedPhase !== "all") && (
                  <p className="text-sm mt-2">Prøv å justere filtrene dine</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
