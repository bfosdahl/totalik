import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

type HourType = "normal" | "overtime_50" | "overtime_100";

export interface AdminEditableEntry {
  id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  start_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  hour_type?: string | null;
  project_name?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: AdminEditableEntry | null;
  onSaved?: () => void;
}

const calcHoursBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let diff = (th * 60 + tm) - (fh * 60 + fm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
};

export function AdminEditTimeEntryDialog({ open, onOpenChange, entry, onSaved }: Props) {
  const [entryDate, setEntryDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hours, setHours] = useState("");
  const [hourType, setHourType] = useState<HourType>("normal");
  const [description, setDescription] = useState("");
  const [projectName, setProjectName] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !entry) return;
    setEntryDate(entry.entry_date || "");
    setStartTime((entry.start_time || "").substring(0, 5));
    setEndTime((entry.end_time || "").substring(0, 5));
    setHours(String(entry.hours ?? ""));
    setHourType((entry.hour_type as HourType) || "normal");
    setDescription(entry.description || "");
    setProjectName(entry.project_name || "");
    setReason("");
  }, [open, entry]);

  const handleSave = async () => {
    if (!entry) return;
    if (reason.trim().length < 3) {
      toast.error("Du må skrive en kort årsak til endringen");
      return;
    }
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      toast.error("Timer må være mellom 0 og 24");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-edit-time-entry", {
        body: {
          time_entry_id: entry.id,
          reason: reason.trim(),
          changes: {
            entry_date: entryDate,
            hours: hoursNum,
            start_time: startTime || null,
            end_time: endTime || null,
            description: description || null,
            hour_type: hourType,
            project_name: projectName || null,
          },
        },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Kunne ikke lagre");
        return;
      }
      toast.success("Timene er oppdatert og ansatt er varslet");
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Juster timer for {entry?.user_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-900 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Ansatt blir varslet via app, push og e-post med både gamle/nye verdier og årsaken du oppgir.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Dato</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Timetype</Label>
              <Select value={hourType} onValueChange={(v) => setHourType(v as HourType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="overtime_50">Overtid 50%</SelectItem>
                  <SelectItem value="overtime_100">Overtid 100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Fra</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartTime(v);
                  if (v && endTime) {
                    const d = calcHoursBetween(v, endTime);
                    if (d > 0) setHours(d.toFixed(2));
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Til</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => {
                  const v = e.target.value;
                  setEndTime(v);
                  if (startTime && v) {
                    const d = calcHoursBetween(startTime, v);
                    if (d > 0) setHours(d.toFixed(2));
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Timer</Label>
              <Input type="number" step="0.25" min="0.25" max="24" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Prosjekt</Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Prosjektnavn (valgfritt)" />
          </div>

          <div className="space-y-1">
            <Label>Beskrivelse</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
          </div>

          <div className="space-y-1 border-t pt-3">
            <Label className="text-destructive">Årsak til endring *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="F.eks. «Glemt pause trukket fra», «Feil prosjekt» eller «Overtidssatsen var feil»"
              className="min-h-[70px]"
            />
            <p className="text-xs text-muted-foreground">Årsaken sendes til ansatt og lagres i revisjonsloggen.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Lagrer..." : "Lagre og varsle"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
