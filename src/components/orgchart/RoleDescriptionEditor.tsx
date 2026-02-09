import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";
import type { OrgChartNode } from "@/hooks/useOrgChart";

interface RoleDescriptionEditorProps {
  node: OrgChartNode;
  index: number;
  onSave: (id: string, description: string) => Promise<void>;
}

export const RoleDescriptionEditor = ({ node, index, onSave }: RoleDescriptionEditorProps) => {
  const [localValue, setLocalValue] = useState(node.role_description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external changes
  useEffect(() => {
    if (!isSaving) {
      setLocalValue(node.role_description || '');
    }
  }, [node.role_description, isSaving]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    setShowSaved(false);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce: save after 800ms of no typing
    saveTimeoutRef.current = setTimeout(async () => {
      if (value !== node.role_description) {
        setIsSaving(true);
        try {
          await onSave(node.id, value);
          setShowSaved(true);
          
          // Hide "saved" indicator after 2 seconds
          if (savedTimeoutRef.current) {
            clearTimeout(savedTimeoutRef.current);
          }
          savedTimeoutRef.current = setTimeout(() => {
            setShowSaved(false);
          }, 2000);
        } finally {
          setIsSaving(false);
        }
      }
    }, 800);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

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
        <div className="w-6 h-6 flex items-center justify-center">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {showSaved && !isSaving && <Check className="h-4 w-4 text-emerald-600" />}
        </div>
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
