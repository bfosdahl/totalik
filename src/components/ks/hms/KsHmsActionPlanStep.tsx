import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KsProjectAction, KsProjectRisk } from "@/hooks/useKsHmsPlan";
import { Badge } from "@/components/ui/badge";

interface ActionForm {
  description: string;
  risk_id: string | null;
  responsible: string;
  deadline: string;
  status: string;
  priority: string;
}

interface KsHmsActionPlanStepProps {
  actions: KsProjectAction[];
  risks: KsProjectRisk[];
  onSave: (actions: Omit<KsProjectAction, 'id' | 'project_id'>[]) => Promise<void>;
}

export function KsHmsActionPlanStep({ actions: existingActions, risks, onSave }: KsHmsActionPlanStepProps) {
  const [actions, setActions] = useState<ActionForm[]>([]);

  useEffect(() => {
    if (existingActions.length > 0) {
      setActions(existingActions.map(a => ({
        description: a.description,
        risk_id: a.risk_id,
        responsible: a.responsible || "",
        deadline: a.deadline || "",
        status: a.status,
        priority: a.priority,
      })));
    } else {
      // Add one empty action
      setActions([{
        description: "",
        risk_id: null,
        responsible: "",
        deadline: "",
        status: "pending",
        priority: "medium",
      }]);
    }
  }, [existingActions]);

  const addAction = () => {
    setActions(prev => [...prev, {
      description: "",
      risk_id: null,
      responsible: "",
      deadline: "",
      status: "pending",
      priority: "medium",
    }]);
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof ActionForm, value: any) => {
    setActions(prev => prev.map((action, i) =>
      i === index ? { ...action, [field]: value } : action
    ));
  };

  const handleSave = async () => {
    const validActions = actions.filter(a => a.description.trim());
    await onSave(validActions);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Handlingsplanen definerer konkrete tiltak for å redusere risiko og forbedre HMS i prosjektet.
            Tiltakene kan knyttes til spesifikke risikoer fra risikovurderingen.
          </p>
        </CardContent>
      </Card>

      {actions.map((action, index) => (
        <Card key={index}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Tiltak #{index + 1}</CardTitle>
                <Badge variant={getPriorityColor(action.priority)}>
                  {action.priority === 'high' ? 'Høy' : action.priority === 'medium' ? 'Middels' : 'Lav'} prioritet
                </Badge>
              </div>
              {actions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Beskrivelse av tiltak *</Label>
              <Textarea
                value={action.description}
                onChange={(e) => updateAction(index, "description", e.target.value)}
                placeholder="Beskriv tiltaket som skal gjennomføres..."
                className="min-h-[80px]"
              />
            </div>

            {risks.length > 0 && (
              <div className="space-y-2">
                <Label>Kobling til risiko (valgfritt)</Label>
                <Select
                  value={action.risk_id || "none"}
                  onValueChange={(value) => updateAction(index, "risk_id", value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg risiko..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen kobling</SelectItem>
                    {risks.map((risk) => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.hazard} (Risiko: {risk.risk_score})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Prioritet</Label>
                <Select
                  value={action.priority}
                  onValueChange={(value) => updateAction(index, "priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Høy</SelectItem>
                    <SelectItem value="medium">Middels</SelectItem>
                    <SelectItem value="low">Lav</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ansvarlig</Label>
                <Input
                  value={action.responsible}
                  onChange={(e) => updateAction(index, "responsible", e.target.value)}
                  placeholder="Navn"
                />
              </div>

              <div className="space-y-2">
                <Label>Frist</Label>
                <Input
                  type="date"
                  value={action.deadline}
                  onChange={(e) => updateAction(index, "deadline", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addAction} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Legg til tiltak
      </Button>

      <Button onClick={handleSave} className="w-full">
        Lagre handlingsplan og fullfør
      </Button>
    </div>
  );
}