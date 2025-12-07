import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import UserSelect from "./UserSelect";

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
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="gap-1 h-10 sm:h-9">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Legg til</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile: Optimized stacked cards for field work
          <div className="space-y-4">
            {actions.map((row, index) => (
              <div key={row.id} className="border border-border rounded-xl p-4 space-y-4 bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Tiltak {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(row.id)}
                    disabled={actions.length === 1}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tiltak</Label>
                  <Input
                    value={row.action}
                    onChange={(e) => onUpdate(row.id, 'action', e.target.value)}
                    placeholder="Beskriv tiltak..."
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ansvarlig</Label>
                  <UserSelect
                    value={row.responsible}
                    onValueChange={(value) => onUpdate(row.id, 'responsible', value)}
                    placeholder="Velg ansvarlig"
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Frist</Label>
                  <Input
                    type="date"
                    value={row.deadline}
                    onChange={(e) => onUpdate(row.id, 'deadline', e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>
            ))}
            
            {/* Mobile add button - larger touch target */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={onAdd} 
              className="w-full h-12 gap-2 text-base active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Legg til tiltak
            </Button>
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
                      <UserSelect
                        value={row.responsible}
                        onValueChange={(value) => onUpdate(row.id, 'responsible', value)}
                        placeholder="Velg ansvarlig"
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
