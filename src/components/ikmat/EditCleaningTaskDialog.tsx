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
import { t } from "@/i18n/t";
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
            {t("auto.fyll_ut_informasjon_om_renholdsoppgaven")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="area">{t("auto.omraade")}</Label>
            <Input
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={t("auto.f_eks_arbeidsbenker_og_overflater")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">{t("auto.frekvens")}</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder={t("auto.velg_frekvens")} />
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
            <Label htmlFor="method">{t("auto.metode")}</Label>
            <Textarea
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder={t("auto.beskriv_rengjoeringsmetode")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">{t("auto.ansvarlig_3")}</Label>
            <Input
              id="responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder={t("auto.f_eks_alle_ansatte_vaktansvarlig")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.avbryt")}
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
