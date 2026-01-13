import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Edit, Trash2, Loader2, Sparkles } from "lucide-react";
import { useIkAlkoholGoals, GOAL_STATUSES, GOAL_PERIODS } from "@/hooks/useIkAlkoholGoals";
import { useCompanyModules } from "@/hooks/useCompanyModules";

const IkAlkoholMaal = () => {
  const navigate = useNavigate();
  const { modules, isLoading: modulesLoading } = useCompanyModules();
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, initializeDefaultGoals } = useIkAlkoholGoals();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    goal_text: '', description: '', kpi_metric: '', kpi_target: '', kpi_current: '',
    responsible_name: '', period: 'yearly', deadline: '', status: 'on_track', actions: [] as string[],
  });
  const [newAction, setNewAction] = useState('');

  const hasIkAlkohol = modules?.some(m => m.module_type === 'IK_ALKOHOL' && m.is_active);
  
  if (modulesLoading || isLoading) {
    return <AppLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!hasIkAlkohol) {
    navigate('/');
    return null;
  }

  const handleSave = async () => {
    if (!formData.goal_text) return;
    if (editingGoal) {
      await updateGoal.mutateAsync({ id: editingGoal.id, ...formData });
    } else {
      await createGoal.mutateAsync(formData);
    }
    setShowDialog(false);
    setEditingGoal(null);
    setFormData({ goal_text: '', description: '', kpi_metric: '', kpi_target: '', kpi_current: '', responsible_name: '', period: 'yearly', deadline: '', status: 'on_track', actions: [] });
  };

  const openEdit = (goal: any) => {
    setEditingGoal(goal);
    setFormData({
      goal_text: goal.goal_text, description: goal.description || '', kpi_metric: goal.kpi_metric || '',
      kpi_target: goal.kpi_target || '', kpi_current: goal.kpi_current || '', responsible_name: goal.responsible_name || '',
      period: goal.period || 'yearly', deadline: goal.deadline || '', status: goal.status, actions: goal.actions || [],
    });
    setShowDialog(true);
  };

  const addAction = () => {
    if (newAction.trim()) {
      setFormData({ ...formData, actions: [...formData.actions, newAction.trim()] });
      setNewAction('');
    }
  };

  const removeAction = (index: number) => {
    setFormData({ ...formData, actions: formData.actions.filter((_, i) => i !== index) });
  };

  const getStatusInfo = (status: string) => GOAL_STATUSES.find(s => s.value === status) || GOAL_STATUSES[0];

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Målsetting</h1>
            <p className="text-muted-foreground">Mål og KPI-er for alkoholkontroll</p>
          </div>
          <div className="flex gap-2">
            {goals.length === 0 && (
              <Button variant="outline" onClick={() => initializeDefaultGoals.mutate()} disabled={initializeDefaultGoals.isPending}>
                <Sparkles className="h-4 w-4 mr-2" />Legg til standardmål
              </Button>
            )}
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />Nytt mål
            </Button>
          </div>
        </div>

        {goals.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Ingen mål definert</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map(goal => {
              const statusInfo = getStatusInfo(goal.status);
              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base">{goal.goal_text}</CardTitle>
                      </div>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {goal.description && <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>}
                    
                    {goal.kpi_metric && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-muted-foreground">KPI: {goal.kpi_metric}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm">Mål: {goal.kpi_target}</span>
                          {goal.kpi_current && <span className="text-sm font-medium">Nå: {goal.kpi_current}</span>}
                        </div>
                      </div>
                    )}
                    
                    {goal.actions && goal.actions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Tiltak:</p>
                        <ul className="text-sm space-y-1">
                          {goal.actions.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-primary">•</span>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        {goal.responsible_name && <span>Ansvarlig: {goal.responsible_name}</span>}
                        {goal.period && <span className="ml-2">({GOAL_PERIODS.find(p => p.value === goal.period)?.label})</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(goal)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteGoal.mutate(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingGoal ? 'Rediger mål' : 'Nytt mål'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mål *</label>
                <Input value={formData.goal_text} onChange={(e) => setFormData({ ...formData, goal_text: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Beskrivelse</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">KPI / Målepunkt</label>
                  <Input value={formData.kpi_metric} onChange={(e) => setFormData({ ...formData, kpi_metric: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Målverdi</label>
                  <Input value={formData.kpi_target} onChange={(e) => setFormData({ ...formData, kpi_target: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Periode</label>
                  <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOAL_PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOAL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Ansvarlig</label>
                <Input value={formData.responsible_name} onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Tiltak</label>
                <div className="flex gap-2 mb-2">
                  <Input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Legg til tiltak" onKeyPress={(e) => e.key === 'Enter' && addAction()} />
                  <Button type="button" onClick={addAction}>Legg til</Button>
                </div>
                {formData.actions.length > 0 && (
                  <ul className="space-y-1">
                    {formData.actions.map((a, i) => (
                      <li key={i} className="flex items-center justify-between bg-muted/50 px-2 py-1 rounded text-sm">
                        {a}
                        <Button size="sm" variant="ghost" onClick={() => removeAction(i)}><Trash2 className="h-3 w-3" /></Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
              <Button onClick={handleSave}>Lagre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default IkAlkoholMaal;
