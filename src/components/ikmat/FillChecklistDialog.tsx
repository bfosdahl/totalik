import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { CheckpointResponse, CheckpointItem, getCheckpointText } from "@/hooks/useIkMatChecklistResponses";
import { Check, X, Minus } from "lucide-react";

interface FillChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistName: string;
  checkpoints: CheckpointItem[];
  existingResponses?: CheckpointResponse[];
  onSave: (responses: CheckpointResponse[], status: 'draft' | 'completed', notes?: string) => Promise<boolean>;
}

export function FillChecklistDialog({
  open,
  onOpenChange,
  checklistName,
  checkpoints,
  existingResponses,
  onSave
}: FillChecklistDialogProps) {
  const [responses, setResponses] = useState<CheckpointResponse[]>(
    existingResponses || checkpoints.map(cp => ({
      checkpoint: getCheckpointText(cp),
      status: 'na' as const,
      comment: ''
    }))
  );
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updateResponse = (index: number, field: keyof CheckpointResponse, value: any) => {
    setResponses(prev => {
      const newResponses = [...prev];
      newResponses[index] = { ...newResponses[index], [field]: value };
      return newResponses;
    });
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    setIsSaving(true);
    const success = await onSave(responses, status, notes);
    setIsSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <Check className="h-4 w-4 text-success" />;
      case 'not_ok':
        return <X className="h-4 w-4 text-destructive" />;
      case 'na':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{checklistName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {responses.map((response, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">{response.checkpoint}</Label>
              
              <RadioGroup
                value={response.status}
                onValueChange={(value) => updateResponse(index, 'status', value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ok" id={`ok-${index}`} />
                  <Label htmlFor={`ok-${index}`} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon('ok')}
                    <span>OK</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_ok" id={`not_ok-${index}`} />
                  <Label htmlFor={`not_ok-${index}`} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon('not_ok')}
                    <span>Ikke OK</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="na" id={`na-${index}`} />
                  <Label htmlFor={`na-${index}`} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon('na')}
                    <span>N/A</span>
                  </Label>
                </div>
              </RadioGroup>

              <Textarea
                placeholder="Kommentar (valgfritt)"
                value={response.comment || ''}
                onChange={(e) => updateResponse(index, 'comment', e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label>Notater (valgfritt)</Label>
            <Textarea
              placeholder="Generelle notater om sjekklisten..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Avbryt
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
            >
              Lagre utkast
            </Button>
            <Button
              onClick={() => handleSave('completed')}
              disabled={isSaving}
            >
              Fullfør sjekkliste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}