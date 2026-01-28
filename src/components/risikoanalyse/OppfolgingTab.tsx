import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Save,
  Trash2,
  Edit,
  X,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { nb } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface ActionItem {
  id: string;
  risk_id: string;
  event_id: string;
  risk_source: string;
  event_description: string;
  action_description: string;
  action_type: string;
  responsible: string;
  deadline: string;
  status: "planlagt" | "pågår" | "utført";
  priority: "lav" | "medium" | "høy" | "kritisk";
  notes?: string;
  completed_at?: string;
  completed_by?: string;
}

export function OppfolgingTab() {
  const { company, profile } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"alle" | "åpne" | "forfalt" | "utført">("åpne");

  const currentUserName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  // Convert setup wizard format to full format
  const convertSetupWizardAction = (action: any): ActionItem => {
    // Check if already in OppfolgingTab format (has action_description and risk_source)
    if (action.action_description && action.risk_source !== undefined) {
      return action as ActionItem;
    }
    
    // Convert from setup wizard format:
    // { id, risk_id, risk_description, action_description (or description), responsible, deadline, status, priority, comments }
    // Status mapping: "ikke_startet" -> "planlagt", "pågår" -> "pågår", "fullført" -> "utført"
    const statusMap: Record<string, "planlagt" | "pågår" | "utført"> = {
      "ikke_startet": "planlagt",
      "pågår": "pågår",
      "fullført": "utført",
      "planlagt": "planlagt",
      "utført": "utført",
      "pending": "planlagt",
      "in_progress": "pågår",
      "completed": "utført",
    };

    return {
      id: action.id || crypto.randomUUID(),
      risk_id: action.risk_id || "",
      event_id: action.event_id || "",
      risk_source: action.risk_description || action.risk_source || "Manuelt tiltak",
      event_description: action.event_description || action.risk_description || "",
      action_description: action.action_description || action.description || "",
      action_type: action.action_type || "forebyggende",
      responsible: action.responsible || "",
      deadline: action.deadline || "",
      status: statusMap[action.status] || "planlagt",
      priority: action.priority || "medium",
      notes: action.comments || action.notes || "",
      completed_at: action.completed_at,
      completed_by: action.completed_by,
    };
  };

  // Load actions
  useEffect(() => {
    const loadActions = async () => {
      if (!company?.id) return;
      
      try {
        const { data } = await supabase
          .from("company_action_plans")
          .select("actions")
          .eq("company_id", company.id)
          .single();
        
        if (data?.actions) {
          const rawActions = data.actions as unknown as any[];
          // Convert all actions to full format
          const convertedActions = rawActions.map(a => convertSetupWizardAction(a));
          setActions(convertedActions);
        }
      } catch (error) {
        console.error("Error loading actions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadActions();
  }, [company?.id]);

  // Save actions
  const handleSave = async () => {
    if (!company?.id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("company_action_plans")
        .upsert([{
          company_id: company.id,
          actions: actions as unknown as Json,
          updated_at: new Date().toISOString(),
        }], { onConflict: "company_id" });

      if (error) throw error;
      toast.success("Lagret");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  // Update action
  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    setActions(actions.map(a => {
      if (a.id === id) {
        // If marking as utført, add completion info
        if (updates.status === "utført" && a.status !== "utført") {
          return { 
            ...a, 
            ...updates, 
            completed_at: new Date().toISOString(),
            completed_by: currentUserName
          };
        }
        return { ...a, ...updates };
      }
      return a;
    }));
  };

  // Delete action
  const deleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
    toast.success("Tiltak slettet");
  };

  // Quick complete
  const quickComplete = (id: string) => {
    updateAction(id, { status: "utført" });
    toast.success("Tiltak fullført");
  };

  // Helper to safely parse dates
  const safeParseDate = (dateString: string | undefined | null): Date | null => {
    if (!dateString || dateString.trim() === "") return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Get status info
  const getStatusInfo = (action: ActionItem) => {
    if (action.status === "utført") {
      return { label: "Utført", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" };
    }
    const deadlineDate = safeParseDate(action.deadline);
    if (deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate)) {
      return { label: "Forfalt", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" };
    }
    if (action.status === "pågår") {
      return { label: "Pågår", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" };
    }
    return { label: "Planlagt", icon: Calendar, color: "text-muted-foreground", bg: "bg-muted/50" };
  };

  // Filter actions
  const filteredActions = actions.filter(action => {
    const deadlineDate = safeParseDate(action.deadline);
    const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate) && action.status !== "utført";
    
    switch (filter) {
      case "åpne":
        return action.status !== "utført";
      case "forfalt":
        return isOverdue;
      case "utført":
        return action.status === "utført";
      default:
        return true;
    }
  });

  // Stats
  const stats = {
    total: actions.length,
    open: actions.filter(a => a.status !== "utført").length,
    overdue: actions.filter(a => {
      const deadlineDate = safeParseDate(a.deadline);
      return a.status !== "utført" && deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);
    }).length,
    completed: actions.filter(a => a.status === "utført").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={cn("cursor-pointer transition-colors", filter === "alle" && "ring-2 ring-primary")}
          onClick={() => setFilter("alle")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totalt tiltak</div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer transition-colors border-l-4 border-l-orange-500", filter === "åpne" && "ring-2 ring-primary")}
          onClick={() => setFilter("åpne")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Åpne</div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer transition-colors border-l-4 border-l-red-500", filter === "forfalt" && "ring-2 ring-primary")}
          onClick={() => setFilter("forfalt")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Forfalt</div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer transition-colors border-l-4 border-l-green-500", filter === "utført" && "ring-2 ring-primary")}
          onClick={() => setFilter("utført")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Fullført</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700">
              <strong>{stats.overdue} tiltak</strong> har gått over frist og må følges opp
            </span>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Lagrer..." : "Lagre endringer"}
        </Button>
      </div>

      {/* Actions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filter === "alle" ? "Alle tiltak" : 
             filter === "åpne" ? "Åpne tiltak" :
             filter === "forfalt" ? "Forfalte tiltak" :
             "Fullførte tiltak"} ({filteredActions.length})
          </CardTitle>
          <CardDescription>Klikk på et tiltak for å redigere</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Ingen tiltak å vise</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map(action => {
                const statusInfo = getStatusInfo(action);
                const isEditing = editingId === action.id;
                const StatusIcon = statusInfo.icon;

                return (
                  <div 
                    key={action.id} 
                    className={cn(
                      "border rounded-lg p-4 transition-colors",
                      statusInfo.bg,
                      isEditing && "ring-2 ring-primary"
                    )}
                  >
                    {isEditing ? (
                      // Edit mode
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Tiltak</label>
                          <Textarea 
                            value={action.action_description}
                            onChange={(e) => updateAction(action.id, { action_description: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <Select value={action.status} onValueChange={(v: any) => updateAction(action.id, { status: v })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planlagt">Planlagt</SelectItem>
                                <SelectItem value="pågår">Pågår</SelectItem>
                                <SelectItem value="utført">Utført</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Ansvarlig</label>
                            <Input 
                              value={action.responsible || ""}
                              onChange={(e) => updateAction(action.id, { responsible: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Frist</label>
                            <Input 
                              type="date"
                              value={action.deadline || ""}
                              onChange={(e) => updateAction(action.id, { deadline: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Prioritet</label>
                            <Select value={action.priority || "medium"} onValueChange={(v: any) => updateAction(action.id, { priority: v })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lav">Lav</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="høy">Høy</SelectItem>
                                <SelectItem value="kritisk">Kritisk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Notater</label>
                          <Textarea 
                            placeholder="Legg til notater om oppfølging..."
                            value={action.notes || ""}
                            onChange={(e) => updateAction(action.id, { notes: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-between">
                          <Button variant="destructive" size="sm" onClick={() => deleteAction(action.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Slett
                          </Button>
                          <Button size="sm" onClick={() => setEditingId(null)}>
                            <Check className="h-4 w-4 mr-1" />
                            Ferdig
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div 
                        className="cursor-pointer"
                        onClick={() => setEditingId(action.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={cn("h-4 w-4 flex-shrink-0", statusInfo.color)} />
                              <p className="font-medium text-sm">{action.action_description}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              {action.risk_source}: {action.event_description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {action.status !== "utført" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickComplete(action.id);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3 ml-6 text-xs">
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          {action.responsible && (
                            <Badge variant="secondary">{action.responsible}</Badge>
                          )}
                          {action.deadline && safeParseDate(action.deadline) && (
                            <Badge variant="secondary">
                              Frist: {format(safeParseDate(action.deadline)!, "d. MMM yyyy", { locale: nb })}
                            </Badge>
                          )}
                          {action.priority && action.priority !== "medium" && (
                            <Badge 
                              className={cn(
                                action.priority === "kritisk" && "bg-red-100 text-red-700",
                                action.priority === "høy" && "bg-orange-100 text-orange-700",
                                action.priority === "lav" && "bg-gray-100 text-gray-700"
                              )}
                            >
                              {action.priority}
                            </Badge>
                          )}
                        </div>

                        {action.notes && (
                          <p className="text-xs text-muted-foreground mt-2 ml-6 italic">
                            {action.notes}
                          </p>
                        )}

                        {action.completed_at && safeParseDate(action.completed_at) && (
                          <p className="text-xs text-green-600 mt-2 ml-6">
                            ✓ Fullført {format(safeParseDate(action.completed_at)!, "d. MMM yyyy", { locale: nb })} av {action.completed_by}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
