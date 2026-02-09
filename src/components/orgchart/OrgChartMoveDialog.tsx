import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight } from 'lucide-react';
import type { OrgChartNode, TreeNode } from '@/hooks/useOrgChart';

interface OrgChartMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (newParentId: string | null) => void;
  nodes: OrgChartNode[];
  movingNode: TreeNode | null;
  isLoading?: boolean;
}

const OrgChartMoveDialog: React.FC<OrgChartMoveDialogProps> = ({
  open,
  onOpenChange,
  onMove,
  nodes,
  movingNode,
  isLoading = false,
}) => {
  const [newParentId, setNewParentId] = useState<string | null>(null);

  // Filter out invalid parent options (self, descendants)
  const getValidParentOptions = () => {
    if (!movingNode) return nodes;
    
    const getDescendantIds = (nodeId: string): string[] => {
      const childNodes = nodes.filter(n => n.parent_node_id === nodeId);
      const descendantIds = childNodes.flatMap(c => [c.id, ...getDescendantIds(c.id)]);
      return descendantIds;
    };
    
    const invalidIds = [movingNode.id, ...getDescendantIds(movingNode.id)];
    return nodes.filter(n => !invalidIds.includes(n.id));
  };

  const validParentOptions = getValidParentOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMove(newParentId);
  };

  if (!movingNode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Flytt "{movingNode.role_title}"</DialogTitle>
          <DialogDescription>
            Velg ny overordnet for denne noden. Alle underordnede vil følge med.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <span className="text-muted-foreground">Fra: </span>
              <span className="font-medium">
                {movingNode.parent_node_id 
                  ? nodes.find(n => n.id === movingNode.parent_node_id)?.role_title || 'Ukjent'
                  : 'Toppnivå'}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Til: </span>
              <span className="font-medium">
                {newParentId 
                  ? nodes.find(n => n.id === newParentId)?.role_title || 'Velg...'
                  : 'Toppnivå'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newParent">Ny overordnet</Label>
            <Select 
              value={newParentId || 'none'} 
              onValueChange={(v) => setNewParentId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg ny overordnet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen (toppnivå)</SelectItem>
                {validParentOptions.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.role_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Flytt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrgChartMoveDialog;
