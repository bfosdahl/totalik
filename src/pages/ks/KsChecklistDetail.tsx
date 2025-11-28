import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  Save,
  HelpCircle,
  Camera,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useKsChecklistItems, KsChecklist, KsTemplate } from "@/hooks/useKsProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "OK", label: "OK", icon: CheckCircle2, color: "text-green-600" },
  { value: "AVVIK", label: "Avvik", icon: XCircle, color: "text-destructive" },
  { value: "IKKE_AKTUELT", label: "Ikke aktuelt", icon: MinusCircle, color: "text-muted-foreground" },
];

export default function KsChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<(KsChecklist & { template: KsTemplate }) | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});

  const { items, isLoading: itemsLoading, updateItem } = useKsChecklistItems(id || null);

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('ks_checklists')
          .select(`
            *,
            template:ks_templates(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setChecklist(data);
        setProjectId(data.project_id);
      } catch (error) {
        console.error('Error fetching checklist:', error);
        toast.error('Kunne ikke hente sjekkliste');
        navigate('/ks/projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
  }, [id, navigate]);

  // Initialize comments from items
  useEffect(() => {
    const initialComments: Record<string, string> = {};
    items.forEach(item => {
      if (item.comment) {
        initialComments[item.id] = item.comment;
      }
    });
    setComments(initialComments);
  }, [items]);

  const handleStatusChange = async (itemId: string, status: string) => {
    await updateItem(itemId, { status });
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setComments(prev => ({ ...prev, [itemId]: comment }));
  };

  const handleSaveComment = async (itemId: string) => {
    const comment = comments[itemId] || "";
    await updateItem(itemId, { comment });
    toast.success("Kommentar lagret");
  };

  const completedCount = items.filter(i => i.status !== 'pending').length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!checklist) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Sjekkliste ikke funnet</p>
          <Button onClick={() => navigate('/ks/projects')} className="mt-4">
            Tilbake til prosjekter
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.template_item?.category || "Generelt";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/ks/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{checklist.template?.name}</h1>
              <p className="text-muted-foreground">
                {checklist.phase && `${checklist.phase} • `}
                Opprettet {new Date(checklist.created_at).toLocaleDateString("nb-NO")}
              </p>
            </div>
          </div>

          {/* Progress Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Fremdrift</CardTitle>
                  <CardDescription>{completedCount} av {totalCount} punkter utfylt</CardDescription>
                </div>
                <span className="text-2xl font-bold">{progressPercentage}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* Checklist Items */}
          {itemsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryItems
                      .sort((a, b) => (a.template_item?.order_index || 0) - (b.template_item?.order_index || 0))
                      .map((item, index) => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "p-4 border rounded-lg space-y-3",
                            item.status === 'OK' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
                            item.status === 'AVVIK' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
                            item.status === 'IKKE_AKTUELT' && "bg-muted/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {index + 1}.
                                </span>
                                <p className="font-medium">{item.template_item?.text}</p>
                                {item.template_item?.help_text && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{item.template_item.help_text}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = item.status === option.value;
                                return (
                                  <Tooltip key={option.value}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={isSelected ? "secondary" : "ghost"}
                                        size="icon"
                                        className={cn(
                                          "h-9 w-9",
                                          isSelected && option.color
                                        )}
                                        onClick={() => handleStatusChange(item.id, option.value)}
                                      >
                                        <Icon className={cn("h-5 w-5", isSelected && option.color)} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{option.label}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Comment section - always visible when AVVIK */}
                          {(item.status === 'AVVIK' || comments[item.id]) && (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Legg til kommentar..."
                                value={comments[item.id] || ""}
                                onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSaveComment(item.id)}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Lagre
                                </Button>
                                <Button size="sm" variant="outline" disabled>
                                  <Camera className="h-4 w-4 mr-1" />
                                  Last opp bilde
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}