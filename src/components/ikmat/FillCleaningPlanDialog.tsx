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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CleaningRecord } from '@/hooks/useIkMatCleaningPlan';

interface CleaningTask {
  area: string;
  frequency: string;
  method: string;
  responsible: string;
}

type FrequencyType = 'daily' | 'weekly' | 'monthly';

const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig/Periodisk',
};

interface FillCleaningPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cleaningTasks: CleaningTask[];
  existingResponse?: {
    id: string;
    cleaning_records: CleaningRecord[];
    notes: string | null;
    status: string;
    frequency_type?: string;
  };
  onSave: (data: {
    cleaning_records: CleaningRecord[];
    notes?: string;
    status: string;
    frequency_type?: string;
  }) => Promise<void>;
  frequencyType?: FrequencyType | null;
}

export const FillCleaningPlanDialog = ({
  open,
  onOpenChange,
  cleaningTasks,
  existingResponse,
  onSave,
  frequencyType,
}: FillCleaningPlanDialogProps) => {
  const [cleaningRecords, setCleaningRecords] = useState<CleaningRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && cleaningTasks.length > 0) {
      if (existingResponse) {
        setCleaningRecords(existingResponse.cleaning_records);
        setNotes(existingResponse.notes || '');
      } else {
        setCleaningRecords(
          cleaningTasks.map((task) => ({
            area: task.area,
            completed: false,
            notes: '',
          }))
        );
        setNotes('');
      }
    }
  }, [open, cleaningTasks, existingResponse]);

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updated = [...cleaningRecords];
    updated[index] = {
      ...updated[index],
      completed: checked,
      completedAt: checked ? new Date().toISOString() : undefined,
    };
    setCleaningRecords(updated);
  };

  const handleNotesChange = (index: number, value: string) => {
    const updated = [...cleaningRecords];
    updated[index] = {
      ...updated[index],
      notes: value,
    };
    setCleaningRecords(updated);
  };

  const handleSave = async (status: string) => {
    setIsSaving(true);
    try {
      await onSave({
        cleaning_records: cleaningRecords,
        notes,
        status,
        frequency_type: frequencyType || existingResponse?.frequency_type,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving cleaning plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getDialogTitle = () => {
    if (existingResponse) {
      const freqLabel = existingResponse.frequency_type 
        ? FREQUENCY_LABELS[existingResponse.frequency_type as FrequencyType]
        : null;
      return freqLabel ? `Se ${freqLabel.toLowerCase()} renholdsplan` : 'Se renholdsplan';
    }
    if (frequencyType) {
      return `Utfør ${FREQUENCY_LABELS[frequencyType].toLowerCase()} renhold`;
    }
    return 'Utfør renholdsplan';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            {frequencyType && !existingResponse && (
              <Badge variant="outline">{FREQUENCY_LABELS[frequencyType]}</Badge>
            )}
          </div>
          <DialogDescription>
            Kryss av for oppgaver som er fullført og legg til notater ved behov
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {cleaningRecords.map((record, index) => {
              const task = cleaningTasks[index];
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`task-${index}`}
                      checked={record.completed}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(index, checked as boolean)
                      }
                      disabled={!!existingResponse && existingResponse.status === 'completed'}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`task-${index}`}
                        className="text-base font-medium cursor-pointer"
                      >
                        {record.area}
                      </Label>
                      {task && (
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <p>Frekvens: {task.frequency}</p>
                          <p>Metode: {task.method}</p>
                          <p>Ansvarlig: {task.responsible}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`notes-${index}`} className="text-sm">
                      Notater (valgfritt)
                    </Label>
                    <Textarea
                      id={`notes-${index}`}
                      value={record.notes || ''}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      placeholder="Legg til notater for denne oppgaven..."
                      className="mt-1"
                      rows={2}
                      disabled={!!existingResponse && existingResponse.status === 'completed'}
                    />
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <Label htmlFor="overall-notes">Generelle notater</Label>
              <Textarea
                id="overall-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Legg til generelle notater for hele renholdsplanen..."
                rows={3}
                disabled={!!existingResponse && existingResponse.status === 'completed'}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {!existingResponse || existingResponse.status !== 'completed' ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={isSaving}
              >
                Lagre utkast
              </Button>
              <Button onClick={() => handleSave('completed')} disabled={isSaving}>
                {isSaving ? 'Lagrer...' : 'Fullfør og signer'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Lukk
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
