import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

interface CreateChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    checklist_name: string;
    description?: string;
    checkpoints: string[];
  }) => Promise<void>;
}

export const CreateChecklistDialog = ({
  open,
  onOpenChange,
  onSave,
}: CreateChecklistDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [checkpoints, setCheckpoints] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddCheckpoint = () => {
    setCheckpoints([...checkpoints, '']);
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleCheckpointChange = (index: number, value: string) => {
    const updated = [...checkpoints];
    updated[index] = value;
    setCheckpoints(updated);
  };

  const handleSave = async () => {
    const validCheckpoints = checkpoints.filter((cp) => cp.trim() !== '');
    
    if (!name.trim() || validCheckpoints.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        checklist_name: name.trim(),
        description: description.trim() || undefined,
        checkpoints: validCheckpoints,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setCheckpoints(['']);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving checklist:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opprett ny sjekkliste</DialogTitle>
          <DialogDescription>
            Lag en tilpasset sjekkliste for ditt behov
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn på sjekkliste *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Ukentlig kjøkkensjekk"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv hva sjekklisten brukes til..."
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Kontrollpunkter *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCheckpoint}
              >
                <Plus className="h-4 w-4 mr-1" />
                Legg til punkt
              </Button>
            </div>

            <div className="space-y-2">
              {checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={checkpoint}
                    onChange={(e) => handleCheckpointChange(index, e.target.value)}
                    placeholder={`Kontrollpunkt ${index + 1}`}
                  />
                  {checkpoints.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCheckpoint(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              !name.trim() ||
              checkpoints.filter((cp) => cp.trim() !== '').length === 0
            }
          >
            {isSaving ? 'Oppretter...' : 'Opprett sjekkliste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
