import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Activity, Volume2, Vibrate } from "lucide-react";
import { useCreateErgonomicAssessment, ErgonomicAssessmentType } from "@/hooks/useErgonomicRiskAssessment";
import { cn } from "@/lib/utils";

interface NewErgonomicAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASSESSMENT_TYPES = [
  {
    value: "muskel_skjelett" as ErgonomicAssessmentType,
    label: "Muskel- og skjelettplager",
    icon: Activity,
    description: "Tunge løft, arbeidsstillinger, belastningsskader",
    color: "text-blue-600",
    bgActive: "bg-blue-50 border-blue-500",
  },
  {
    value: "vibrasjon" as ErgonomicAssessmentType,
    label: "Vibrasjoner",
    icon: Vibrate,
    description: "Hånd-arm og helkroppsvibrasjoner",
    color: "text-purple-600",
    bgActive: "bg-purple-50 border-purple-500",
  },
  {
    value: "stoy" as ErgonomicAssessmentType,
    label: "Støy",
    icon: Volume2,
    description: "Støyeksponering og hørselvern",
    color: "text-orange-600",
    bgActive: "bg-orange-50 border-orange-500",
  },
];

export function NewErgonomicAssessmentDialog({ open, onOpenChange }: NewErgonomicAssessmentDialogProps) {
  const [assessmentType, setAssessmentType] = useState<ErgonomicAssessmentType>("muskel_skjelett");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workArea, setWorkArea] = useState("");
  const [jobRole, setJobRole] = useState("");

  const { mutate: createAssessment, isPending } = useCreateErgonomicAssessment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    createAssessment(
      {
        assessment_type: assessmentType,
        title: title.trim(),
        description: description.trim() || undefined,
        work_area: workArea.trim() || undefined,
        job_role: jobRole.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setAssessmentType("muskel_skjelett");
    setTitle("");
    setDescription("");
    setWorkArea("");
    setJobRole("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Ny ergonomisk risikovurdering</DialogTitle>
          <DialogDescription>
            Opprett en ny risikovurdering for ergonomiske forhold
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pr-1">
          {/* Assessment Type Selection */}
          <div className="space-y-3">
            <Label>Type vurdering</Label>
            <RadioGroup
              value={assessmentType}
              onValueChange={(v) => setAssessmentType(v as ErgonomicAssessmentType)}
              className="grid gap-3"
            >
              {ASSESSMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = assessmentType === type.value;
                
                return (
                  <label
                    key={type.value}
                    className={cn(
                      "flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors",
                      isSelected ? type.bgActive : "border-border hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={type.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", type.color)} />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Risikovurdering lagerarbeid"
              required
            />
          </div>

          {/* Work Area */}
          <div className="space-y-2">
            <Label htmlFor="workArea">Arbeidsområde</Label>
            <Input
              id="workArea"
              value={workArea}
              onChange={(e) => setWorkArea(e.target.value)}
              placeholder="F.eks. Lager, Kontor, Verksted"
            />
          </div>

          {/* Job Role */}
          <div className="space-y-2">
            <Label htmlFor="jobRole">Yrkesgruppe / Stilling</Label>
            <Input
              id="jobRole"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="F.eks. Lagermedarbeider, Tømrer"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv arbeidsoppgavene som skal vurderes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Oppretter..." : "Opprett vurdering"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
