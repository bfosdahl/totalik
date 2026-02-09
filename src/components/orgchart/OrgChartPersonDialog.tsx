import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import UserSelect from '@/components/audits/UserSelect';

interface OrgChartPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (personName: string) => void;
  nodeTitle: string;
  isLoading?: boolean;
}

const OrgChartPersonDialog: React.FC<OrgChartPersonDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  nodeTitle,
  isLoading = false,
}) => {
  const [personName, setPersonName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;
    onSave(personName.trim());
    setPersonName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tilknytt person til "{nodeTitle}"</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person">Velg person</Label>
            <UserSelect
              value={personName}
              onValueChange={setPersonName}
              placeholder="Velg fra ansatte eller skriv inn navn"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={!personName.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tilknytt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrgChartPersonDialog;
