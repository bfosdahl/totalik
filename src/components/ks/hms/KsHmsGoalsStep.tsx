import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KsProjectGoal } from "@/hooks/useKsHmsPlan";

const predefinedGoals = [
  "Null arbeidsulykker eller personskader på prosjektet",
  "Sikre et godt og helsefremmende arbeidsmiljø for alle på byggeplassen",
  "Forebygge materielle skader og miljøulemper",
  "Sikre at alle ansatte og underleverandører følger HMS-rutiner",
  "Kontinuerlig forbedring av HMS-praksis gjennom prosjektet",
];

interface KsHmsGoalsStepProps {
  goals: KsProjectGoal[];
  onSave: (goals: Array<{ goal_text: string; is_predefined: boolean }>) => Promise<void>;
}

export function KsHmsGoalsStep({ goals: existingGoals, onSave }: KsHmsGoalsStepProps) {
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    if (existingGoals.length > 0) {
      const predefined = existingGoals
        .filter(g => g.is_predefined)
        .map(g => g.goal_text);
      const custom = existingGoals
        .filter(g => !g.is_predefined)
        .map(g => g.goal_text);
      
      setSelectedPredefined(predefined);
      setCustomGoals(custom);
    }
  }, [existingGoals]);

  const handleTogglePredefined = (goal: string) => {
    setSelectedPredefined(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleAddCustomGoal = () => {
    if (newGoal.trim()) {
      setCustomGoals(prev => [...prev, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const handleRemoveCustomGoal = (index: number) => {
    setCustomGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const allGoals = [
      ...selectedPredefined.map(text => ({ goal_text: text, is_predefined: true })),
      ...customGoals.map(text => ({ goal_text: text, is_predefined: false })),
    ];
    await onSave(allGoals);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forhåndsdefinerte HMS-mål</CardTitle>
          <CardDescription>Velg relevante mål for prosjektet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {predefinedGoals.map((goal) => (
            <div key={goal} className="flex items-start gap-3">
              <Checkbox
                checked={selectedPredefined.includes(goal)}
                onCheckedChange={() => handleTogglePredefined(goal)}
                id={goal}
              />
              <label
                htmlFor={goal}
                className="text-sm leading-relaxed cursor-pointer flex-1"
              >
                {goal}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Egendefinerte mål</CardTitle>
          <CardDescription>Legg til prosjektspesifikke HMS-mål</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {customGoals.map((goal, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="flex-1 text-sm">{goal}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCustomGoal(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              placeholder="Skriv inn et nytt HMS-mål..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCustomGoal()}
            />
            <Button onClick={handleAddCustomGoal} disabled={!newGoal.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Lagre mål og gå videre
      </Button>
    </div>
  );
}