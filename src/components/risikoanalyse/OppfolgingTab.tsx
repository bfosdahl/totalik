import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  CalendarCheck, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bell,
  Calendar,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useActionPlanFollowups } from "@/hooks/useActionPlanFollowups";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { nb } from "date-fns/locale";

const FOLLOWUP_TYPES = [
  { value: "status_check", label: "Statussjekk", icon: Clock },
  { value: "verification", label: "Verifisering", icon: CheckCircle2 },
  { value: "audit", label: "Revisjon", icon: FileText },
  { value: "review", label: "Gjennomgang", icon: CalendarCheck },
];

interface ActionItem {
  id: string;
  action_description: string;
  risk_description?: string;
  status: string;
  deadline?: string;
}

export function OppfolgingTab() {
  const { company } = useAuth();
  const { 
    followups, 
    upcomingFollowups, 
    overdueFollowups,
    isLoading, 
    createFollowup, 
    completeFollowup,
    deleteFollowup 
  } = useActionPlanFollowups();
  
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  
  const [newFollowup, setNewFollowup] = useState({
    action_id: "",
    action_description: "",
    risk_description: "",
    followup_date: "",
    followup_type: "status_check" as const,
    notes: "",
    reminder_enabled: true,
    reminder_days_before: 7,
  });

  // Load actions from company_action_plans
  useEffect(() => {
    const loadActions = async () => {
      if (!company?.id) return;
      
      const { data } = await supabase
        .from("company_action_plans")
        .select("actions")
        .eq("company_id", company.id)
        .single();
      
      if (data?.actions) {
        setActions(data.actions as unknown as ActionItem[]);
      }
    };
    
    loadActions();
  }, [company?.id]);

  const handleCreate = async () => {
    if (!newFollowup.action_id || !newFollowup.followup_date) {
      toast.error("Velg tiltak og dato");
      return;
    }

    await createFollowup.mutateAsync({
      action_id: newFollowup.action_id,
      action_description: newFollowup.action_description,
      risk_description: newFollowup.risk_description,
      followup_date: newFollowup.followup_date,
      followup_type: newFollowup.followup_type,
      notes: newFollowup.notes,
      reminder_enabled: newFollowup.reminder_enabled,
      reminder_days_before: newFollowup.reminder_days_before,
    });

    setShowNewDialog(false);
    setNewFollowup({
      action_id: "",
      action_description: "",
      risk_description: "",
      followup_date: "",
      followup_type: "status_check",
      notes: "",
      reminder_enabled: true,
      reminder_days_before: 7,
    });
  };

  const handleComplete = async () => {
    if (!selectedFollowup) return;
    
    await completeFollowup.mutateAsync({
      id: selectedFollowup,
      notes: completeNotes,
    });

    setShowCompleteDialog(false);
    setSelectedFollowup(null);
    setCompleteNotes("");
  };

  const getStatusBadge = (status: string, date: string) => {
    const followupDate = new Date(date);
    
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-700">Fullført</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="secondary">Avbrutt</Badge>;
    }
    if (isPast(followupDate) && !isToday(followupDate)) {
      return <Badge className="bg-red-100 text-red-700">Forfalt</Badge>;
    }
    if (isToday(followupDate)) {
      return <Badge className="bg-orange-100 text-orange-700">I dag</Badge>;
    }
    
    const daysUntil = differenceInDays(followupDate, new Date());
    if (daysUntil <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-700">Om {daysUntil} dager</Badge>;
    }
    
    return <Badge variant="outline">Planlagt</Badge>;
  };

  const pendingFollowups = followups.filter(f => f.status === "pending");
  const completedFollowups = followups.filter(f => f.status === "completed");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{followups.length}</div>
            <div className="text-sm text-muted-foreground">Totalt oppfølginger</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{overdueFollowups.length}</div>
            <div className="text-sm text-muted-foreground">Forfalt</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{upcomingFollowups.length}</div>
            <div className="text-sm text-muted-foreground">Neste 7 dager</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{completedFollowups.length}</div>
            <div className="text-sm text-muted-foreground">Fullført</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for overdue */}
      {overdueFollowups.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />
              {overdueFollowups.length} forfalte oppfølginger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueFollowups.slice(0, 3).map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.action_description}</p>
                    <p className="text-xs text-muted-foreground">
                      Forfalt {format(new Date(f.followup_date), "d. MMMM", { locale: nb })}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setSelectedFollowup(f.id);
                      setShowCompleteDialog(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Fullfør
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New followup button */}
      <div className="flex justify-end">
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny oppfølging
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny oppfølging</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Velg tiltak å følge opp *</label>
                <Select 
                  value={newFollowup.action_id} 
                  onValueChange={(v) => {
                    const action = actions.find(a => a.id === v);
                    setNewFollowup(p => ({ 
                      ...p, 
                      action_id: v,
                      action_description: action?.action_description || "",
                      risk_description: action?.risk_description || "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg tiltak" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map(action => (
                      <SelectItem key={action.id} value={action.id}>
                        {action.action_description || "Ukjent tiltak"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Type oppfølging</label>
                <Select 
                  value={newFollowup.followup_type} 
                  onValueChange={(v: any) => setNewFollowup(p => ({ ...p, followup_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOWUP_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Dato for oppfølging *</label>
                <Input 
                  type="date" 
                  value={newFollowup.followup_date}
                  onChange={(e) => setNewFollowup(p => ({ ...p, followup_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notater</label>
                <Textarea 
                  placeholder="Eventuelle notater..."
                  value={newFollowup.notes}
                  onChange={(e) => setNewFollowup(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="reminder" 
                  checked={newFollowup.reminder_enabled}
                  onChange={(e) => setNewFollowup(p => ({ ...p, reminder_enabled: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="reminder" className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Send påminnelse
                </label>
                {newFollowup.reminder_enabled && (
                  <Select 
                    value={newFollowup.reminder_days_before.toString()}
                    onValueChange={(v) => setNewFollowup(p => ({ ...p, reminder_days_before: parseInt(v) }))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dag før</SelectItem>
                      <SelectItem value="3">3 dager før</SelectItem>
                      <SelectItem value="7">7 dager før</SelectItem>
                      <SelectItem value="14">14 dager før</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Avbryt</Button>
              <Button onClick={handleCreate} disabled={createFollowup.isPending}>
                {createFollowup.isPending ? "Oppretter..." : "Opprett"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Followup list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-yellow-500" />
              Ventende oppfølginger ({pendingFollowups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingFollowups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Ingen ventende oppfølginger</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pendingFollowups
                  .sort((a, b) => new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime())
                  .map(followup => {
                    const type = FOLLOWUP_TYPES.find(t => t.value === followup.followup_type);
                    const TypeIcon = type?.icon || CalendarCheck;

                    return (
                      <div key={followup.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">{followup.action_description}</span>
                          </div>
                          {getStatusBadge(followup.status, followup.followup_date)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(followup.followup_date), "d. MMMM yyyy", { locale: nb })}
                          <span>•</span>
                          <span>{type?.label}</span>
                        </div>

                        {followup.notes && (
                          <p className="text-xs text-muted-foreground">{followup.notes}</p>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedFollowup(followup.id);
                              setShowCompleteDialog(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Fullfør
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteFollowup.mutateAsync(followup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Fullførte oppfølginger ({completedFollowups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedFollowups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Ingen fullførte oppfølginger ennå</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {completedFollowups
                  .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
                  .map(followup => (
                    <div key={followup.id} className="border rounded-lg p-3 bg-green-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm">{followup.action_description}</span>
                        <Badge className="bg-green-100 text-green-700">Fullført</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Fullført {followup.completed_at && format(new Date(followup.completed_at), "d. MMMM yyyy", { locale: nb })}
                        {followup.completed_by_name && ` av ${followup.completed_by_name}`}
                      </div>
                      {followup.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{followup.notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fullfør oppfølging</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notater fra oppfølgingen</label>
              <Textarea 
                placeholder="Hva ble gjort? Eventuelle funn eller kommentarer..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Avbryt</Button>
            <Button onClick={handleComplete} disabled={completeFollowup.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {completeFollowup.isPending ? "Fullfører..." : "Fullfør oppfølging"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
