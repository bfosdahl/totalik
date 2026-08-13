import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useIkMatScheduledTasks } from "@/hooks/useIkMatScheduledTasks";
import { t } from "@/i18n/t";

interface CreateScheduledTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mandag' },
  { value: 2, label: 'Tirsdag' },
  { value: 3, label: 'Onsdag' },
  { value: 4, label: 'Torsdag' },
  { value: 5, label: 'Fredag' },
  { value: 6, label: 'Lørdag' },
  { value: 0, label: 'Søndag' },
];

export const CreateScheduledTaskDialog = ({ open, onOpenChange }: CreateScheduledTaskDialogProps) => {
  const { createTask } = useIkMatScheduledTasks();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('cleaning');
  const [frequency, setFrequency] = useState('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number[]>([]);
  const [responsible, setResponsible] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        task_type: taskType,
        frequency,
        day_of_week: frequency === 'weekly' ? selectedDays : undefined,
        day_of_month: frequency === 'monthly' || frequency === 'periodisk' ? selectedDayOfMonth : undefined,
        responsible: responsible.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTaskType('cleaning');
      setFrequency('daily');
      setSelectedDays([]);
      setSelectedDayOfMonth([]);
      setResponsible('');
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleDayOfMonth = (day: number) => {
    setSelectedDayOfMonth(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auto.ny_planlagt_oppgave")}</DialogTitle>
          <DialogDescription>
            {t("auto.opprett_en_ny_oppgave_som_vises_i_kalend")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("auto.oppgavenavn")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("auto.f_eks_gulv_paa_kjoekken")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("auto.beskrivelse")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("auto.valgfri_beskrivelse_av_oppgaven")}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("auto.type_oppgave")}</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">{t("auto.renhold")}</SelectItem>
                  <SelectItem value="inspection">{t("auto.inspeksjon")}</SelectItem>
                  <SelectItem value="temperature">{t("auto.temperatur")}</SelectItem>
                  <SelectItem value="other">{t("auto.annet")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("auto.frekvens_2")}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("auto.daglig")}</SelectItem>
                  <SelectItem value="weekly">{t("auto.ukentlig")}</SelectItem>
                  <SelectItem value="monthly">{t("auto.maanedlig")}</SelectItem>
                  <SelectItem value="periodisk">{t("auto.periodisk")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>{t("auto.velg_dager")}</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div 
                    key={day.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label 
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(frequency === 'monthly' || frequency === 'periodisk') && (
            <div className="space-y-2">
              <Label>{t("auto.velg_dager_i_maaneden")}</Label>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={selectedDayOfMonth.includes(day) ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleDayOfMonth(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="responsible">{t("auto.ansvarlig_2")}</Label>
            <Input
              id="responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder={t("auto.hvem_er_ansvarlig_for_oppgaven")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.avbryt")}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? 'Lagrer...' : 'Opprett oppgave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
