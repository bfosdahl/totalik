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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Activity, Volume2, Vibrate, Plus, X, Wrench } from "lucide-react";
import { useCreateErgonomicAssessment, ErgonomicAssessmentType } from "@/hooks/useErgonomicRiskAssessment";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";

interface NewErgonomicAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASSESSMENT_TYPES = [
  {
    value: "muskel_skjelett" as ErgonomicAssessmentType,
    label: t("auto.muskel_og_skjelettplager"),
    icon: Activity,
    description: t("auto.tunge_loeft_arbeidsstillinger_belastning"),
    color: "text-blue-600",
    bgActive: "bg-blue-50 border-blue-500",
  },
  {
    value: "vibrasjon" as ErgonomicAssessmentType,
    label: t("auto.vibrasjoner"),
    icon: Vibrate,
    description: t("auto.haand_arm_og_helkroppsvibrasjoner"),
    color: "text-purple-600",
    bgActive: "bg-purple-50 border-purple-500",
  },
  {
    value: "stoy" as ErgonomicAssessmentType,
    label: t("auto.stoey"),
    icon: Volume2,
    description: t("auto.stoeyeksponering_og_hoerselvern"),
    color: "text-orange-600",
    bgActive: "bg-orange-50 border-orange-500",
  },
];

export function NewErgonomicAssessmentDialog({ open, onOpenChange }: NewErgonomicAssessmentDialogProps) {
  const [selectedTypes, setSelectedTypes] = useState<ErgonomicAssessmentType[]>(["muskel_skjelett"]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workArea, setWorkArea] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState("");

  const { mutate: createAssessment, isPending } = useCreateErgonomicAssessment();

  const toggleType = (type: ErgonomicAssessmentType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Must have at least one
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const addEquipment = () => {
    const trimmed = newEquipment.trim();
    if (trimmed && !equipment.includes(trimmed)) {
      setEquipment([...equipment, trimmed]);
      setNewEquipment("");
    }
  };

  const removeEquipment = (item: string) => {
    setEquipment(equipment.filter((e) => e !== item));
  };

  const showEquipmentField = selectedTypes.includes("vibrasjon") || selectedTypes.includes("stoy");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedTypes.length === 0) return;

    createAssessment(
      {
        assessment_type: selectedTypes,
        title: title.trim(),
        description: description.trim() || undefined,
        work_area: workArea.trim() || undefined,
        job_role: jobRole.trim() || undefined,
        equipment: equipment.length > 0 ? equipment : undefined,
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
    setSelectedTypes(["muskel_skjelett"]);
    setTitle("");
    setDescription("");
    setWorkArea("");
    setJobRole("");
    setEquipment([]);
    setNewEquipment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("auto.ny_ergonomisk_risikovurdering")}</DialogTitle>
          <DialogDescription>
            {t("auto.opprett_en_ny_risikovurdering_for_ergono")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Assessment Type Selection - Multi-select */}
          <div className="space-y-3">
            <Label>Type vurdering (velg en eller flere)</Label>
            <div className="grid gap-3">
              {ASSESSMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedTypes.includes(type.value);

                return (
                  <label
                    key={type.value}
                    className={cn(
                      "flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors",
                      isSelected ? type.bgActive : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleType(type.value)}
                      className="mt-1"
                    />
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
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("auto.tittel_2")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("auto.f_eks_risikovurdering_lagerarbeid")}
              required
            />
          </div>

          {/* Work Area */}
          <div className="space-y-2">
            <Label htmlFor="workArea">{t("auto.arbeidsomraade")}</Label>
            <Input
              id="workArea"
              value={workArea}
              onChange={(e) => setWorkArea(e.target.value)}
              placeholder={t("auto.f_eks_lager_kontor_verksted")}
            />
          </div>

          {/* Job Role */}
          <div className="space-y-2">
            <Label htmlFor="jobRole">{t("auto.yrkesgruppe_stilling")}</Label>
            <Input
              id="jobRole"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder={t("auto.f_eks_lagermedarbeider_toemrer")}
            />
          </div>

          {/* Equipment field - shown when vibrasjon or støy is selected */}
          {showEquipmentField && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Verktøy / Utstyr
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("auto.legg_til_verktoey_og_utstyr_som_skal_vur")}
              </p>
              <div className="flex gap-2">
                <Input
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder={t("auto.f_eks_borhammer_vinkelsliper_kompressor")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEquipment();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addEquipment} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {equipment.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {equipment.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1 py-1">
                      {item}
                      <button type="button" onClick={() => removeEquipment(item)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("auto.beskrivelse")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("auto.beskriv_arbeidsoppgavene_som_skal_vurder")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={isPending || !title.trim() || selectedTypes.length === 0}>
              {isPending ? "Oppretter..." : "Opprett vurdering"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
