import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActionRow {
  id: string;
  action: string;
  responsible: string;
  deadline: string;
}

interface ResponsiveActionTableProps {
  title: string;
  actions: ActionRow[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Omit<ActionRow, 'id'>, value: string) => void;
}

const ResponsiveActionTable: React.FC<ResponsiveActionTableProps> = ({
  title,
  actions,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Legg til</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile: Stacked cards
          <div className="space-y-4">
            {actions.map((row, index) => (
              <div key={row.id} className="border border-border rounded-lg p-3 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tiltak {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(row.id)}
                    disabled={actions.length === 1}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Tiltak</Label>
                  <Input
                    value={row.action}
                    onChange={(e) => onUpdate(row.id, 'action', e.target.value)}
                    placeholder="Beskriv tiltak..."
                    className="h-9"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Ansvarlig</Label>
                    <Input
                      value={row.responsible}
                      onChange={(e) => onUpdate(row.id, 'responsible', e.target.value)}
                      placeholder="Navn"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Frist</Label>
                    <Input
                      type="date"
                      value={row.deadline}
                      onChange={(e) => onUpdate(row.id, 'deadline', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop: Table view
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tiltak</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-36">Ansvarlig</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-36">Frist</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {actions.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-3">
                      <Input
                        value={row.action}
                        onChange={(e) => onUpdate(row.id, 'action', e.target.value)}
                        placeholder="Beskriv tiltak..."
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.responsible}
                        onChange={(e) => onUpdate(row.id, 'responsible', e.target.value)}
                        placeholder="Ansvarlig"
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={row.deadline}
                        onChange={(e) => onUpdate(row.id, 'deadline', e.target.value)}
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(row.id)}
                        disabled={actions.length === 1}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveActionTable;
