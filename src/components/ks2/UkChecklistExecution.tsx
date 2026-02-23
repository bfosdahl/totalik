import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, CheckCircle2, Circle, Trash2, Camera, ArrowLeft, 
  Image as ImageIcon, X, Loader2 
} from "lucide-react";
import { useKsModule2UkChecklist, UkChecklistItem } from "@/hooks/useKsModule2UkChecklist";
import { KsModule2Uk } from "@/hooks/useKsModule2Uk";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  uk: KsModule2Uk;
  onBack: () => void;
  onApprove: (uk: KsModule2Uk) => void;
}

const CONTROL_AREAS: Record<string, string> = {
  konstruksjon: "Konstruksjonssikkerhet",
  brannteknisk: "Brannteknisk prosjektering",
  geoteknikk: "Geoteknikk",
  bygningsfysikk: "Bygningsfysikk",
  lydteknisk: "Lydtekniske forhold",
  energi: "Energieffektivitet",
  tilgjengelighet: "Tilgjengelighet",
  annet: "Annet",
};

export default function UkChecklistExecution({ uk, onBack, onApprove }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem, isAdding } = useKsModule2UkChecklist(uk.id);
  const [newPointText, setNewPointText] = useState("");
  const { company } = useAuth();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAddPoint = async () => {
    if (!newPointText.trim()) return;
    await addItem(newPointText.trim());
    setNewPointText("");
  };

  const handleToggleStatus = (item: UkChecklistItem) => {
    updateItem({
      id: item.id,
      status: item.status === "ok" ? "pending" : "ok",
    });
  };

  const handleUpdateNotes = (item: UkChecklistItem, notes: string) => {
    updateItem({ id: item.id, notes: notes || null });
  };

  const handlePhotoUpload = async (item: UkChecklistItem, files: FileList) => {
    if (!company?.id) return;
    const newPaths = [...(item.photo_paths || [])];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${company.id}/${uk.id}/${item.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("ks-module2-checklist-photos")
        .upload(path, file);
      if (error) {
        toast.error(`Kunne ikke laste opp ${file.name}`);
        continue;
      }
      newPaths.push(path);
    }

    updateItem({ id: item.id, photo_paths: newPaths });
    toast.success("Bilde lastet opp");
  };

  const handleDeletePhoto = async (item: UkChecklistItem, photoPath: string) => {
    await supabase.storage.from("ks-module2-checklist-photos").remove([photoPath]);
    const updated = (item.photo_paths || []).filter(p => p !== photoPath);
    updateItem({ id: item.id, photo_paths: updated });
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("ks-module2-checklist-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const allChecked = items.length > 0 && items.every(i => i.status === "ok");
  const checkedCount = items.filter(i => i.status === "ok").length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Laster sjekkliste...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">
            Kontroll: {CONTROL_AREAS[uk.control_area] || uk.control_area}
          </h2>
          <p className="text-sm text-muted-foreground">
            {uk.uk_number} • {uk.controller_company && `${uk.controller_company} • `}
            {uk.controller_name}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {checkedCount} / {items.length} sjekket
        </Badge>
      </div>

      {uk.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{uk.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Add new point */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Legg til nytt kontrollpunkt..."
              value={newPointText}
              onChange={(e) => setNewPointText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPoint()}
            />
            <Button onClick={handleAddPoint} disabled={isAdding || !newPointText.trim()} size="sm" className="gap-1">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Legg til
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklist items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="font-medium">Tom sjekkliste</p>
            <p className="text-sm">Legg til kontrollpunkter ovenfor for å starte kontrollen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className={item.status === "ok" ? "border-green-200 bg-green-50/50" : ""}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {item.status === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${item.status === "ok" ? "line-through text-muted-foreground" : ""}`}>
                      {index + 1}. {item.checkpoint_text}
                    </p>
                    <Textarea
                      placeholder="Kommentar / anmerkning..."
                      value={item.notes || ""}
                      onChange={(e) => handleUpdateNotes(item, e.target.value)}
                      className="mt-2 text-sm min-h-[60px]"
                      rows={2}
                    />

                    {/* Photos */}
                    {(item.photo_paths || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.photo_paths.map((path) => (
                          <div key={path} className="relative group w-20 h-20 rounded-md overflow-hidden border">
                            <img
                              src={getPhotoUrl(path)}
                              alt="Kontrollbilde"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleDeletePhoto(item, path)}
                              className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[item.id] = el; }}
                      onChange={(e) => e.target.files && handlePhotoUpload(item, e.target.files)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => fileInputRefs.current[item.id]?.click()}
                      title="Last opp bilde"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteItem(item.id)}
                      title="Slett punkt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve button */}
      {items.length > 0 && (
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>Tilbake</Button>
          <Button
            onClick={() => onApprove(uk)}
            disabled={!allChecked}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {allChecked ? "Godkjenn kontroll" : `${checkedCount}/${items.length} sjekket`}
          </Button>
        </div>
      )}
    </div>
  );
}
