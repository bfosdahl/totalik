import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { KsSafetyRound } from "@/hooks/useKsSafetyRounds";

interface CheckpointResult {
  checkpoint_id: string;
  status: "ok" | "not_ok" | "not_applicable";
  comment: string;
  photos: File[];
}

interface Checkpoint {
  id: string;
  text: string;
  category: string | null;
  order_index: number;
  isCustom?: boolean;
}

interface KsSafetyRoundChecklistProps {
  round: KsSafetyRound | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function KsSafetyRoundChecklist({ round, open, onOpenChange, onComplete }: KsSafetyRoundChecklistProps) {
  const { profile } = useAuth();
  const [checkpointResults, setCheckpointResults] = useState<CheckpointResult[]>([]);
  const [customCheckpoints, setCustomCheckpoints] = useState<Checkpoint[]>([]);
  const [newCheckpointText, setNewCheckpointText] = useState("");
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: checkpoints } = useQuery({
    queryKey: ["vernerunde-checkpoints", round?.template_id],
    queryFn: async () => {
      if (!round?.template_id) return [];
      const { data, error } = await supabase
        .from("ks_vernerunde_checkpoints")
        .select("*")
        .eq("template_id", round.template_id)
        .order("order_index");
      if (error) throw error;
      return data as Checkpoint[];
    },
    enabled: !!round?.template_id && open
  });

  useEffect(() => {
    if (checkpoints && checkpoints.length > 0 && checkpointResults.length === 0) {
      setCheckpointResults(
        checkpoints.map((cp) => ({
          checkpoint_id: cp.id,
          status: "ok" as const,
          comment: "",
          photos: [],
        }))
      );
    }
  }, [checkpoints]);

  const allCheckpoints = [...(checkpoints || []), ...customCheckpoints];

  const addCustomCheckpoint = () => {
    if (!newCheckpointText.trim()) {
      toast.error("Sjekkpunkt må ha en beskrivelse");
      return;
    }

    const newCheckpoint: Checkpoint = {
      id: `custom-${Date.now()}`,
      text: newCheckpointText,
      category: "Egendefinert",
      order_index: allCheckpoints.length,
      isCustom: true,
    };

    setCustomCheckpoints((prev) => [...prev, newCheckpoint]);
    setCheckpointResults((prev) => [
      ...prev,
      {
        checkpoint_id: newCheckpoint.id,
        status: "ok" as const,
        comment: "",
        photos: [],
      },
    ]);

    setNewCheckpointText("");
    setIsAddingCheckpoint(false);
    toast.success("Sjekkpunkt lagt til");
  };

  const updateCheckpointResult = (checkpointId: string, field: keyof CheckpointResult, value: any) => {
    setCheckpointResults((prev) =>
      prev.map((r) => (r.checkpoint_id === checkpointId ? { ...r, [field]: value } : r))
    );
  };

  const handlePhotoSelect = (checkpointId: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setCheckpointResults((prev) =>
      prev.map((r) =>
        r.checkpoint_id === checkpointId ? { ...r, photos: [...r.photos, ...newFiles] } : r
      )
    );
  };

  const removePhoto = (checkpointId: string, index: number) => {
    setCheckpointResults((prev) =>
      prev.map((r) =>
        r.checkpoint_id === checkpointId
          ? { ...r, photos: r.photos.filter((_, i) => i !== index) }
          : r
      )
    );
  };

  const handleComplete = async () => {
    if (!round || !profile?.company_id || !round.template_id) return;

    setIsSubmitting(true);
    try {
      // First, save custom checkpoints to database and get their real IDs
      const checkpointIdMapping: Record<string, string> = {};

      if (customCheckpoints.length > 0) {
        const customCheckpointsToSave = customCheckpoints.map((cp) => ({
          template_id: round.template_id!,
          company_id: profile.company_id!,
          text: cp.text,
          category: cp.category,
          order_index: cp.order_index,
        }));

        const { data: savedCheckpoints, error: checkpointError } = await supabase
          .from("ks_vernerunde_checkpoints")
          .insert(customCheckpointsToSave)
          .select();

        if (checkpointError) {
          console.error("Error saving custom checkpoints:", checkpointError);
          toast.error("Kunne ikke lagre egendefinerte sjekkpunkter");
          return;
        }

        // Create mapping from temporary IDs to real IDs
        customCheckpoints.forEach((cp, index) => {
          if (savedCheckpoints && savedCheckpoints[index]) {
            checkpointIdMapping[cp.id] = savedCheckpoints[index].id;
          }
        });
      }

      // Upload photos and get paths
      const resultsWithPhotoPaths = await Promise.all(
        checkpointResults.map(async (result) => {
          const photoPaths: string[] = [];

          for (const photo of result.photos) {
            const fileName = `${round.id}/${result.checkpoint_id}/${Date.now()}_${photo.name}`;
            const { error: uploadError } = await supabase.storage
              .from("project-documents")
              .upload(fileName, photo);

            if (uploadError) {
              console.error("Photo upload error:", uploadError);
              continue;
            }

            photoPaths.push(fileName);
          }

          // Use real checkpoint ID if this was a custom checkpoint
          const finalCheckpointId = checkpointIdMapping[result.checkpoint_id] || result.checkpoint_id;

          return {
            safety_round_id: round.id,
            checkpoint_id: finalCheckpointId,
            company_id: profile.company_id!,
            status: result.status,
            comment: result.comment || null,
            photo_paths: photoPaths.length > 0 ? photoPaths : null,
          };
        })
      );

      // Save checkpoint results
      const { error: resultsError } = await supabase
        .from("ks_safety_round_results")
        .insert(resultsWithPhotoPaths);

      if (resultsError) {
        console.error("Error saving results:", resultsError);
        toast.error("Kunne ikke lagre sjekklistedata");
        return;
      }

      // Update safety round status
      const { error: updateError } = await supabase
        .from("ks_safety_rounds")
        .update({ status: "completed" })
        .eq("id", round.id);

      if (updateError) {
        console.error("Error updating status:", updateError);
      }

      toast.success("Vernerunde fullført");
      onComplete();
      onOpenChange(false);
      setCheckpointResults([]);
      setCustomCheckpoints([]);
      setNewCheckpointText("");
      setIsAddingCheckpoint(false);
    } catch (error) {
      console.error("Error completing safety round:", error);
      toast.error("En feil oppstod");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCheckpointResult = (checkpointId: string) => {
    return checkpointResults.find((r) => r.checkpoint_id === checkpointId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Utfør vernerunde</DialogTitle>
          <DialogDescription>
            Gå gjennom sjekklisten og registrer status for hvert punkt
          </DialogDescription>
        </DialogHeader>

        {round && (
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <span className="font-medium">Dato:</span>{" "}
              {new Date(round.round_date).toLocaleDateString("nb-NO")}
            </p>
            {round.participants && (
              <p className="text-sm">
                <span className="font-medium">Deltakere:</span> {round.participants}
              </p>
            )}
            {round.responsible && (
              <p className="text-sm">
                <span className="font-medium">Ansvarlig:</span> {round.responsible}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {isAddingCheckpoint && (
            <Card className="p-4 border-primary">
              <div className="space-y-3">
                <Label htmlFor="new-checkpoint">Nytt sjekkpunkt</Label>
                <Textarea
                  id="new-checkpoint"
                  value={newCheckpointText}
                  onChange={(e) => setNewCheckpointText(e.target.value)}
                  placeholder="Beskriv sjekkpunktet..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={addCustomCheckpoint} size="sm">
                    Legg til
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingCheckpoint(false);
                      setNewCheckpointText("");
                    }}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Button
            variant="outline"
            onClick={() => setIsAddingCheckpoint(true)}
            disabled={isAddingCheckpoint}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til sjekkpunkt
          </Button>

          {allCheckpoints && allCheckpoints.length > 0 ? (
            allCheckpoints.map((checkpoint) => {
              const result = getCheckpointResult(checkpoint.id);
              return (
                <Card key={checkpoint.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{checkpoint.text}</p>
                        {checkpoint.category && (
                          <Badge variant="outline" className="mt-1">
                            {checkpoint.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm mb-2">Status *</Label>
                      <RadioGroup
                        value={result?.status || "ok"}
                        onValueChange={(value) =>
                          updateCheckpointResult(checkpoint.id, "status", value)
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ok" id={`${checkpoint.id}-ok`} />
                          <Label htmlFor={`${checkpoint.id}-ok`} className="cursor-pointer">
                            OK
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not_ok" id={`${checkpoint.id}-not-ok`} />
                          <Label htmlFor={`${checkpoint.id}-not-ok`} className="cursor-pointer">
                            Ikke OK
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not_applicable" id={`${checkpoint.id}-na`} />
                          <Label htmlFor={`${checkpoint.id}-na`} className="cursor-pointer">
                            Ikke aktuelt
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor={`comment-${checkpoint.id}`} className="text-sm">
                        Kommentar
                      </Label>
                      <Textarea
                        id={`comment-${checkpoint.id}`}
                        value={result?.comment || ""}
                        onChange={(e) =>
                          updateCheckpointResult(checkpoint.id, "comment", e.target.value)
                        }
                        placeholder="Legg til kommentar..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label className="text-sm mb-2">Bilder</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handlePhotoSelect(checkpoint.id, e.target.files)}
                          className="hidden"
                          id={`photo-${checkpoint.id}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`photo-${checkpoint.id}`)?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Ta bilde
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`photo-${checkpoint.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Last opp
                        </Button>
                      </div>
                      {result && result.photos.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {result.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Bilde ${index + 1}`}
                                className="h-20 w-20 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => removePhoto(checkpoint.id, index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Ingen kontrollpunkter funnet for denne malen
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setCheckpointResults([]);
              setCustomCheckpoints([]);
              setNewCheckpointText("");
              setIsAddingCheckpoint(false);
            }}
            disabled={isSubmitting}
          >
            Avbryt
          </Button>
          <Button onClick={handleComplete} disabled={isSubmitting || allCheckpoints.length === 0}>
            {isSubmitting ? "Lagrer..." : "Fullfør vernerunde"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
