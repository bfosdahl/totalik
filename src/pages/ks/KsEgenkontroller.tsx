import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  MessageSquare,
  Signature,
  FileText,
  ChevronRight,
  X,
  Upload,
  Save,
  FolderOpen,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKsTemplates } from "@/hooks/useKsProjects";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Categories for filtering
const categories = [
  { id: "all", label: "Alle kategorier" },
  { id: "graving", label: "Graving" },
  { id: "fundament", label: "Fundament" },
  { id: "betong", label: "Betong" },
  { id: "tommer", label: "Tømrer" },
  { id: "vatrom", label: "Våtrom" },
  { id: "maler", label: "Maler" },
  { id: "sluttkontroll", label: "Sluttkontroll" },
  { id: "fdv", label: "FDV" },
];

// Filter options
const filterOptions = [
  { id: "all", label: "Vis alle" },
  { id: "mine", label: "Mine" },
  { id: "incomplete", label: "Ufullførte" },
  { id: "this-week", label: "Denne uken" },
  { id: "overdue", label: "Overskredet frist" },
];

// Status configuration
const statusConfig = {
  planlagt: { label: "Planlagt", color: "bg-gray-100 text-gray-700", icon: Clock },
  pabegynt: { label: "Påbegynt", color: "bg-blue-100 text-blue-700", icon: Clock },
  fullfort: { label: "Fullført", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  godkjent: { label: "Godkjent", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

interface Egenkontroll {
  id: string;
  title: string;
  responsible: string;
  company: string;
  deadline: string;
  status: keyof typeof statusConfig;
  progress: number;
  totalPoints: number;
  completedPoints: number;
  category: string;
  projectId?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  type: "yes_no" | "number" | "photo_required" | "photos" | "file" | "signature";
  value?: string | number | boolean;
  comment?: string;
  photos?: string[];
  required?: boolean;
}

export default function KsEgenkontroller() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { templates } = useKsTemplates();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedEgenkontroll, setSelectedEgenkontroll] = useState<Egenkontroll | null>(null);
  const [egenkontroller, setEgenkontroller] = useState<Egenkontroll[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Check URL params for project filter
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam) {
      setSelectedProject(projectParam);
    }
  }, [searchParams]);

  // Fetch projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ['ks-projects-list', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('ks_projects')
        .select('id, name, project_number')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch egenkontroller
  useEffect(() => {
    const fetchEgenkontroller = async () => {
      if (!profile?.company_id) return;

      try {
        const { data: checklists, error } = await supabase
          .from("ks_checklists")
          .select(`
            id,
            filled_at,
            created_at,
            phase,
            project_id,
            ks_templates(name),
            ks_checklist_items(id, status)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: Egenkontroll[] = (checklists || []).map((c: any) => {
          const items = c.ks_checklist_items || [];
          const completed = items.filter((i: any) => i.status === "OK").length;
          const total = items.length;
          
          return {
            id: c.id,
            title: c.ks_templates?.name || "Ukjent mal",
            responsible: "Ikke tildelt",
            company: "Intern",
            deadline: c.created_at,
            status: c.filled_at ? "fullfort" : total > 0 && completed > 0 ? "pabegynt" : "planlagt",
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            totalPoints: total,
            completedPoints: completed,
            category: "all",
            projectId: c.project_id,
          };
        });

        setEgenkontroller(mapped);
      } catch (error) {
        console.error("Error fetching egenkontroller:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEgenkontroller();
  }, [profile?.company_id]);

  // Fetch checklist items when egenkontroll is selected
  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (!selectedEgenkontroll) {
        setChecklistItems([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("ks_checklist_items")
          .select(`
            id,
            status,
            comment,
            ks_template_items(description)
          `)
          .eq("checklist_id", selectedEgenkontroll.id);

        if (error) throw error;

        const mapped: ChecklistItem[] = (data || []).map((item: any) => ({
          id: item.id,
          text: item.ks_template_items?.description || "Ukjent punkt",
          type: "yes_no",
          value: item.status === "OK" ? true : item.status === "AVVIK" ? false : undefined,
          comment: item.comment,
        }));

        setChecklistItems(mapped);
      } catch (error) {
        console.error("Error fetching checklist items:", error);
      }
    };

    fetchChecklistItems();
  }, [selectedEgenkontroll]);

  // Filter egenkontroller
  const filteredEgenkontroller = useMemo(() => {
    return egenkontroller.filter((e) => {
      // Project filter
      if (selectedProject !== "all" && e.projectId !== selectedProject) {
        return false;
      }

      // Search filter
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && e.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedFilter === "incomplete" && e.status === "fullfort") {
        return false;
      }
      if (selectedFilter === "overdue" && new Date(e.deadline) >= new Date()) {
        return false;
      }

      return true;
    });
  }, [egenkontroller, searchQuery, selectedCategory, selectedFilter, selectedProject]);

  const handleItemChange = async (itemId: string, value: boolean | string | number, field: "value" | "comment") => {
    // Update local state
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );

    // Save to database
    try {
      const updates: any = {};
      if (field === "value") {
        updates.status = value === true ? "OK" : value === false ? "AVVIK" : "IKKE_AKTUELT";
      } else {
        updates.comment = value;
      }

      await supabase
        .from("ks_checklist_items")
        .update(updates)
        .eq("id", itemId);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleCreateAvvik = () => {
    if (selectedEgenkontroll) {
      navigate(`/ks/avvik?project=${selectedEgenkontroll.projectId}&source=egenkontroll&sourceId=${selectedEgenkontroll.id}`);
    }
  };

  const handleCompleteEgenkontroll = async () => {
    if (!selectedEgenkontroll) return;

    try {
      await supabase
        .from("ks_checklists")
        .update({ filled_at: new Date().toISOString() })
        .eq("id", selectedEgenkontroll.id);

      toast.success("Egenkontroll fullført!");
      setSelectedEgenkontroll(null);
      
      // Refresh list
      setEgenkontroller((prev) =>
        prev.map((e) =>
          e.id === selectedEgenkontroll.id
            ? { ...e, status: "fullfort" as const }
            : e
        )
      );
    } catch (error) {
      console.error("Error completing egenkontroll:", error);
      toast.error("Kunne ikke fullføre egenkontroll");
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Left Column - Filters */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project filter */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  Prosjekt
                </p>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Velg prosjekt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle prosjekter</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.project_number ? `${p.project_number} - ` : ''}{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Visning
                </p>
                {/* Filter options */}
                <div className="space-y-2">
                  {filterOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={selectedFilter === option.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => setSelectedFilter(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Kategorier
                </p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - List */}
        <div className="flex-1 min-w-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Egenkontroller</CardTitle>
                <Button size="sm" onClick={() => navigate("/ks/sjekklister?tab=maler")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ny
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i egenkontroller..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-40 lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Laster...
                    </div>
                  ) : filteredEgenkontroller.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Ingen egenkontroller funnet</p>
                    </div>
                  ) : (
                    filteredEgenkontroller.map((egenkontroll) => {
                      const StatusIcon = statusConfig[egenkontroll.status]?.icon || Clock;
                      const isSelected = selectedEgenkontroll?.id === egenkontroll.id;
                      const isOverdue = new Date(egenkontroll.deadline) < new Date() && egenkontroll.status !== "fullfort";

                      return (
                        <div
                          key={egenkontroll.id}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedEgenkontroll(egenkontroll)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {egenkontroll.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {egenkontroll.responsible} • {egenkontroll.company}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge
                              className={cn(
                                "text-xs",
                                statusConfig[egenkontroll.status]?.color
                              )}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[egenkontroll.status]?.label}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overskredet
                              </Badge>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>
                                {egenkontroll.completedPoints} av {egenkontroll.totalPoints} punkter
                              </span>
                              <span>{egenkontroll.progress}%</span>
                            </div>
                            <Progress value={egenkontroll.progress} className="h-1.5" />
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Frist: {format(new Date(egenkontroll.deadline), "dd. MMM yyyy", { locale: nb })}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detail/Edit */}
        <div className="w-96 flex-shrink-0 hidden xl:block">
          <Card className="h-full flex flex-col">
            {selectedEgenkontroll ? (
              <>
                <CardHeader className="pb-3 flex-shrink-0 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedEgenkontroll.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedEgenkontroll(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Steg-for-steg utfylling
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {checklistItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <p className="text-sm font-medium mb-3">
                            {index + 1}. {item.text}
                          </p>

                          {/* Ja/Nei */}
                          {item.type === "yes_no" && (
                            <RadioGroup
                              value={
                                item.value === true
                                  ? "yes"
                                  : item.value === false
                                  ? "no"
                                  : ""
                              }
                              onValueChange={(val) =>
                                handleItemChange(
                                  item.id,
                                  val === "yes" ? true : false,
                                  "value"
                                )
                              }
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id={`${item.id}-yes`} />
                                <Label htmlFor={`${item.id}-yes`} className="text-sm">
                                  Ja
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id={`${item.id}-no`} />
                                <Label htmlFor={`${item.id}-no`} className="text-sm">
                                  Nei
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="na" id={`${item.id}-na`} />
                                <Label htmlFor={`${item.id}-na`} className="text-sm">
                                  N/A
                                </Label>
                              </div>
                            </RadioGroup>
                          )}

                          {/* Number input */}
                          {item.type === "number" && (
                            <Input
                              type="number"
                              placeholder="Verdi..."
                              value={item.value as number || ""}
                              onChange={(e) =>
                                handleItemChange(item.id, e.target.value, "value")
                              }
                            />
                          )}

                          {/* Comment */}
                          <Textarea
                            placeholder="Kommentar..."
                            className="mt-3 text-sm"
                            rows={2}
                            value={item.comment || ""}
                            onChange={(e) =>
                              handleItemChange(item.id, e.target.value, "comment")
                            }
                          />

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm">
                              <Camera className="h-4 w-4 mr-1" />
                              Bilde
                            </Button>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-1" />
                              Fil
                            </Button>
                          </div>

                          {/* Required photo warning */}
                          {item.type === "photo_required" && !item.photos?.length && (
                            <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              Obligatorisk bilde mangler
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className="p-4 border-t flex-shrink-0 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCreateAvvik}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Opprett avvik herfra
                  </Button>
                  <Button
                    className="w-full"
                    onClick={handleCompleteEgenkontroll}
                    disabled={selectedEgenkontroll.status === "fullfort"}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Fullfør egenkontroll
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Velg en egenkontroll for å se detaljer</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
