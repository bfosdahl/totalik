import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { PREDEFINED_ORG_ROLES, type OrgChartNode } from '@/hooks/useOrgChart';

interface OrgChartNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    role_title: string;
    role_description: string;
    parent_node_id: string | null;
  }) => void;
  nodes: OrgChartNode[];
  editingNode?: OrgChartNode | null;
  defaultParentId?: string | null;
  isLoading?: boolean;
}

const OrgChartNodeDialog: React.FC<OrgChartNodeDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  nodes,
  editingNode,
  defaultParentId,
  isLoading = false,
}) => {
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);
  const [selectedPredefined, setSelectedPredefined] = useState<string>('custom');

  useEffect(() => {
    if (editingNode) {
      setRoleTitle(editingNode.role_title);
      setRoleDescription(editingNode.role_description || '');
      setParentNodeId(editingNode.parent_node_id);
      
      const isPredefined = PREDEFINED_ORG_ROLES.some(r => r.title === editingNode.role_title);
      setSelectedPredefined(isPredefined ? editingNode.role_title : 'custom');
    } else {
      setRoleTitle('');
      setRoleDescription('');
      setParentNodeId(defaultParentId || null);
      setSelectedPredefined('custom');
    }
  }, [editingNode, defaultParentId, open]);

  const handlePredefinedChange = (value: string) => {
    setSelectedPredefined(value);
    if (value !== 'custom') {
      const role = PREDEFINED_ORG_ROLES.find(r => r.title === value);
      if (role) {
        setRoleTitle(role.title);
        setRoleDescription(role.description);
      }
    } else {
      if (!editingNode) {
        setRoleTitle('');
        setRoleDescription('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) return;
    
    onSave({
      role_title: roleTitle.trim(),
      role_description: roleDescription.trim(),
      parent_node_id: parentNodeId,
    });
  };

  // Filter out the current node and its descendants from parent options
  const getValidParentOptions = () => {
    if (!editingNode) return nodes;
    
    const getDescendantIds = (nodeId: string): string[] => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return [];
      
      const childNodes = nodes.filter(n => n.parent_node_id === nodeId);
      const descendantIds = childNodes.flatMap(c => getDescendantIds(c.id));
      return [nodeId, ...descendantIds];
    };
    
    const invalidIds = getDescendantIds(editingNode.id);
    return nodes.filter(n => !invalidIds.includes(n.id));
  };

  const validParentOptions = getValidParentOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingNode ? 'Rediger node' : 'Legg til node'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="predefined">Rolletype</Label>
            <Select value={selectedPredefined} onValueChange={handlePredefinedChange}>
              <SelectTrigger>
                <SelectValue placeholder="Velg rolletype" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_ORG_ROLES.map((role) => (
                  <SelectItem key={role.title} value={role.title}>
                    {role.title}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Egendefinert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedPredefined === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="title">Rolletittel *</Label>
              <Input
                id="title"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="F.eks. Salgssjef"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Beskriv ansvarsområder..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parent">Rapporterer til</Label>
            <Select 
              value={parentNodeId || 'none'} 
              onValueChange={(v) => setParentNodeId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg overordnet (valgfritt)" />
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
            <Button type="submit" disabled={!roleTitle.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingNode ? 'Lagre endringer' : 'Legg til'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrgChartNodeDialog;
