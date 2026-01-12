import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Target, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  GripVertical,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useCompanyKsGoals, CompanyKsGoal } from "@/hooks/useCompanyKsGoals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DEFAULT_GOALS = [
  "Levere alle prosjekter innenfor avtalt tid og budsjett",
  "Oppnå null kritiske avvik ved sluttbefaring",
  "Sikre at alle ansatte har nødvendig kompetanse og sertifiseringer",
  "Gjennomføre systematisk egenkontroll på alle prosjekter",
  "Oppnå høy kundetilfredshet (>90%)",
];

export default function IkKsMaal() {
  const { goals, isLoading, isSaving, createGoal, updateGoal, deleteGoal, reorderGoals } = useCompanyKsGoals();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ goal_text: "", description: "" });

  const handleCreate = async () => {
    if (!newGoal.goal_text.trim()) return;
    await createGoal(newGoal.goal_text, newGoal.description);
    setNewGoal({ goal_text: "", description: "" });
    setShowNewDialog(false);
  };

  const handleAddDefault = async (text: string) => {
    await createGoal(text);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Kvalitetsmål</h1>
            <p className="text-muted-foreground mt-1">
              Bedriftens overordnede mål for kvalitetssikring
            </p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nytt mål
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Legg til kvalitetsmål</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Mål</label>
                  <Input
                    value={newGoal.goal_text}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_text: e.target.value })}
                    placeholder="Beskriv kvalitetsmålet..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Beskrivelse (valgfritt)</label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Utdypende beskrivelse..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreate} disabled={isSaving || !newGoal.goal_text.trim()}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Legg til
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick add default goals */}
        {goals.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Foreslåtte kvalitetsmål</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Klikk for å legge til et foreslått mål, eller opprett ditt eget:
              </p>
              <div className="space-y-2">
                {DEFAULT_GOALS.map((goal, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleAddDefault(goal)}
                    disabled={isSaving}
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-2">{goal}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goal list */}
        <div className="space-y-3">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Ingen kvalitetsmål ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Legg til bedriftens kvalitetsmål for KS-systemet
                </p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                isEditing={editingId === goal.id}
                onEdit={() => setEditingId(goal.id)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={updateGoal}
                onDelete={deleteGoal}
                isSaving={isSaving}
              />
            ))
          )}
        </div>

        {goals.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{goals.length} kvalitetsmål definert</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function GoalCard({
  goal,
  index,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  isSaving,
}: {
  goal: CompanyKsGoal;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, updates: Partial<CompanyKsGoal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [editData, setEditData] = useState({
    goal_text: goal.goal_text,
    description: goal.description || "",
  });

  const handleSave = async () => {
    await onUpdate(goal.id, editData);
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mål</label>
              <Input
                value={editData.goal_text}
                onChange={(e) => setEditData({ ...editData, goal_text: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Beskrivelse</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Avbryt
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-1" />
                Lagre
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GripVertical className="w-4 h-4 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
              {index + 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{goal.goal_text}</p>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(goal.id)}
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
