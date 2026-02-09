import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import type { OrgChartNode } from "@/hooks/useOrgChart";

interface RoleDescriptionEditorProps {
  node: OrgChartNode;
  index: number;
  onSave: (id: string, description: string) => Promise<void>;
}

export const RoleDescriptionEditor = ({ node, index, onSave }: RoleDescriptionEditorProps) => {
  const [localValue, setLocalValue] = useState(node.role_description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with external changes only when not dirty
  useEffect(() => {
    if (!hasChanges) {
      setLocalValue(node.role_description || '');
    }
  }, [node.role_description, hasChanges]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    setHasChanges(value !== (node.role_description || ''));
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      await onSave(node.id, localValue);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{node.role_title}</h4>
          {node.persons && node.persons.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {node.persons.map(p => p.person_name).join(', ')}
            </p>
          )}
        </div>
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          variant={hasChanges ? "default" : "outline"}
          className="gap-1.5"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Lagre
        </Button>
      </div>
      <Textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Beskriv ansvarsområder og oppgaver for denne rollen..."
        rows={2}
        className="text-sm"
      />
    </div>
  );
};
