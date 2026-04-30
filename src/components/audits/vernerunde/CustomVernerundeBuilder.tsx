import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft, ListPlus, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import type { HmsVernerundeTemplate, VernerundeCheckpoint } from "@/hooks/useHmsVernerundeTemplates";

interface CustomVernerundeBuilderProps {
  onBack: () => void;
  onCreate: (template: HmsVernerundeTemplate) => void;
}

interface DraftCheckpoint {
  id: string;
  category: string;
  checkpoint: string;
  help_text?: string;
}

const CustomVernerundeBuilder = ({ onBack, onCreate }: CustomVernerundeBuilderProps) => {
  const [name, setName] = useState("Egen vernerunde");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Generelt");
  const [newCheckpoint, setNewCheckpoint] = useState("");
  const [newHelp, setNewHelp] = useState("");
  const [checkpoints, setCheckpoints] = useState<DraftCheckpoint[]>([]);

  const addCheckpoint = () => {
    if (!newCheckpoint.trim()) {
      toast.error("Skriv inn et sjekkpunkt");
      return;
    }
    if (!category.trim()) {
      toast.error("Angi en kategori");
      return;
    }
    setCheckpoints((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: category.trim(),
        checkpoint: newCheckpoint.trim(),
        help_text: newHelp.trim() || undefined,
      },
    ]);
    setNewCheckpoint("");
    setNewHelp("");
  };

  const removeCheckpoint = (id: string) => {
    setCheckpoints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleStart = () => {
    if (!name.trim()) {
      toast.error("Gi vernerunden et navn");
      return;
    }
    if (checkpoints.length === 0) {
      toast.error("Legg til minst ett sjekkpunkt");
      return;
    }

    const template: HmsVernerundeTemplate = {
      id: `custom-${crypto.randomUUID()}`,
      company_id: null,
      template_name: name.trim(),
      description: description.trim() || "Egen vernerunde med tilpassede sjekkpunkter",
      checkpoints: checkpoints.map<VernerundeCheckpoint>((c) => ({
        id: c.id,
        category: c.category,
        checkpoint: c.checkpoint,
        help_text: c.help_text ?? null,
      })),
      is_system_template: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onCreate(template);
  };

  // Group preview by category
  const grouped = checkpoints.reduce<Record<string, DraftCheckpoint[]>>((acc, cp) => {
    if (!acc[cp.category]) acc[cp.category] = [];
    acc[cp.category].push(cp);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="p-2 bg-primary/10 rounded-lg">
            <FilePlus2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Opprett tom vernerunde</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Bygg din egen sjekkliste med kategorier og punkter
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Navn og beskrivelse */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Navn på vernerunden</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Vernerunde lager Q2"
            />
          </div>
          <div>
            <Label>Beskrivelse (valgfritt)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av runden"
            />
          </div>
        </div>

        <Separator />

        {/* Legg til sjekkpunkter */}
        <div className="space-y-3 bg-muted/40 rounded-lg p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ListPlus className="w-4 h-4" />
            Legg til sjekkpunkt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Kategori</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="F.eks. Brann, Orden, Verneutstyr"
              />
            </div>
            <div>
              <Label>Sjekkpunkt</Label>
              <Input
                value={newCheckpoint}
                onChange={(e) => setNewCheckpoint(e.target.value)}
                placeholder="F.eks. Rømningsveier er frie"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCheckpoint();
                  }
                }}
              />
            </div>
          </div>
          <div>
            <Label>Hjelpetekst (valgfritt)</Label>
            <Textarea
              value={newHelp}
              onChange={(e) => setNewHelp(e.target.value)}
              placeholder="Tilleggsinformasjon eller veiledning til punktet"
              rows={2}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addCheckpoint} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Legg til punkt
            </Button>
          </div>
        </div>

        {/* Forhåndsvisning */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sjekkpunkter ({checkpoints.length})</h3>
          </div>

          {checkpoints.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
              Ingen sjekkpunkter lagt til ennå
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cat}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {items.length} punkt{items.length === 1 ? "" : "er"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cp.checkpoint}</p>
                          {cp.help_text && (
                            <p className="text-xs text-muted-foreground mt-1">{cp.help_text}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCheckpoint(cp.id)}
                          className="shrink-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={onBack}>
            Avbryt
          </Button>
          <Button onClick={handleStart} disabled={checkpoints.length === 0}>
            Start vernerunde
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomVernerundeBuilder;
