import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FREQUENCY_OPTIONS = [
  { value: 'Daglig', label: 'Daglig' },
  { value: 'Ukentlig', label: 'Ukentlig' },
  { value: 'Månedlig', label: 'Månedlig' },
  { value: 'Periodisk', label: 'Periodisk' },
  { value: 'Ved behov', label: 'Annet/Ved behov' },
];

interface EditCleaningTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: {
    id: string;
    area: string;
    frequency: string;
    method: string;
    responsible: string;
  } | null;
  onSave: (data: {
    area: string;
    frequency: string;
    method: string;
    responsible: string;
  }) => Promise<void>;
}

export const EditCleaningTaskDialog = ({
  open,
  onOpenChange,
  task,
  onSave,
}: EditCleaningTaskDialogProps) => {
  const [area, setArea] = useState('');
  const [frequency, setFrequency] = useState('');
  const [method, setMethod] = useState('');
  const [responsible, setResponsible] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && task) {
      setArea(task.area);
      setFrequency(task.frequency);
      setMethod(task.method);
      setResponsible(task.responsible);
    } else if (open && !task) {
      setArea('');
      setFrequency('');
      setMethod('');
      setResponsible('');
    }
  }, [open, task]);

  const handleSave = async () => {
    if (!area.trim() || !frequency.trim() || !method.trim() || !responsible.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        area: area.trim(),
        frequency: frequency.trim(),
        method: method.trim(),
        responsible: responsible.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Rediger renholdsoppgave' : 'Ny renholdsoppgave'}
          </DialogTitle>
          <DialogDescription>
            Fyll ut informasjon om renholdsoppgaven
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="area">Område *</Label>
            <Input
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="F.eks. Arbeidsbenker og overflater"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frekvens *</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Velg frekvens" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Metode *</Label>
            <Textarea
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Beskriv rengjøringsmetode..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Ansvarlig *</Label>
            <Input
              id="responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="F.eks. Alle ansatte, Vaktansvarlig"
            />
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
              !area.trim() ||
              !frequency.trim() ||
              !method.trim() ||
              !responsible.trim()
            }
          >
            {isSaving ? 'Lagrer...' : 'Lagre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
