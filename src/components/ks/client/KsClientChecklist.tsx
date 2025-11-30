import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { KsProjectClientChecklistItem } from "@/hooks/useKsProjectClient";
import { CheckSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface KsClientChecklistProps {
  items: KsProjectClientChecklistItem[];
  onUpdate: (id: string, data: Partial<KsProjectClientChecklistItem>) => void;
  onCreate: (item: string) => void;
}

const DEFAULT_CHECKLIST_ITEMS = [
  "SHA-plan godkjent av BH",
  "Avtale med KP/KU signert",
  "Info til arbeidere gitt",
  "Fremdriftsplan godkjent",
  "Endringer behandlet",
  "Overtakelsesbefaring utført",
];

export function KsClientChecklist({ items, onUpdate, onCreate }: KsClientChecklistProps) {
  const { profile } = useAuth();
  const [newItem, setNewItem] = useState("");

  const handleToggle = (item: KsProjectClientChecklistItem) => {
    onUpdate(item.id, {
      is_completed: !item.is_completed,
      completed_date: !item.is_completed ? new Date().toISOString() : null,
      completed_by_name: !item.is_completed
        ? `${profile?.first_name} ${profile?.last_name}`
        : null,
    });
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      onCreate(newItem.trim());
      setNewItem("");
    }
  };

  const handleAddDefaultItems = () => {
    DEFAULT_CHECKLIST_ITEMS.forEach(item => {
      if (!items.find(i => i.checklist_item === item)) {
        onCreate(item);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          BH Oppfølgingspunkter
        </CardTitle>
        <CardDescription>
          Sjekkliste for oppfølging av byggherre-relaterte aktiviteter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Ingen oppfølgingspunkter lagt til ennå</p>
            <Button onClick={handleAddDefaultItems} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Legg til standard sjekkpunkter
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={item.is_completed}
                  onCheckedChange={() => handleToggle(item)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className={item.is_completed ? "line-through text-muted-foreground" : ""}>
                    {item.checklist_item}
                  </p>
                  {item.is_completed && item.completed_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fullført {format(new Date(item.completed_date), "d. MMM yyyy", { locale: nb })}
                      {item.completed_by_name && ` av ${item.completed_by_name}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Legg til nytt oppfølgingspunkt..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddItem();
              }
            }}
          />
          <Button onClick={handleAddItem} disabled={!newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
