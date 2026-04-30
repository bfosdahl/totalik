import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Play,
  QrCode,
  Pencil,
  Trash2,
  Thermometer,
  ClipboardCheck,
  SprayCan,
  Route,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ListChecks,
  X,
} from "lucide-react";
import { useIkMatDailyRounds, type RoundStation } from "@/hooks/useIkMatDailyRounds";
import { useIkMatTemperature } from "@/hooks/useIkMatTemperature";
import { useCustomChecklists } from "@/hooks/useCustomChecklists";
import { useCustomCleaningTasks } from "@/hooks/useCustomCleaningTasks";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { DailyRoundQrDialog } from "@/components/ikmat/DailyRoundQrDialog";

const TYPE_ICONS = {
  temperature: Thermometer,
  checklist: ClipboardCheck,
  cleaning: SprayCan,
  custom: ListChecks,
} as const;

const TYPE_LABELS = {
  temperature: "Temperatur",
  checklist: "Sjekkliste",
  cleaning: "Renhold",
  custom: "Egendefinert",
} as const;

export const RunderTab = () => {
  const navigate = useNavigate();
  const { rounds, completions, isLoading, createRound, updateRound, deleteRound } =
    useIkMatDailyRounds();
  const { equipment } = useIkMatTemperature();
  const { checklists } = useCustomChecklists();
  const { tasks: cleaningTasks } = useCustomCleaningTasks();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id?: string;
    name: string;
    description: string;
    stations: RoundStation[];
  } | null>(null);
  const [qrRound, setQrRound] = useState<{ id: string; name: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing({ name: "", description: "", stations: [] });
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    const r = rounds.find((x) => x.id === id);
    if (!r) return;
    setEditing({
      id: r.id,
      name: r.name,
      description: r.description || "",
      stations: r.stations || [],
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return;
    if (editing.id) {
      await updateRound.mutateAsync({
        id: editing.id,
        name: editing.name,
        description: editing.description || null,
        stations: editing.stations,
      });
    } else {
      await createRound.mutateAsync({
        name: editing.name,
        description: editing.description || undefined,
        stations: editing.stations,
      });
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const completionsByRound = useMemo(() => {
    const map: Record<string, typeof completions> = {};
    for (const c of completions) {
      if (!map[c.round_id]) map[c.round_id] = [];
      map[c.round_id].push(c);
    }
    return map;
  }, [completions]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Daglige runder
            </CardTitle>
            <CardDescription>
              Lag tilpassede runder med temperaturer, sjekklister og renhold.
              Skann én QR-kode og gå gjennom alle stasjoner i en wizard.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Ny runde
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Laster...
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Ingen runder opprettet</p>
              <p className="text-sm mt-1">
                Opprett en runde for å samle dagens kontroller bak én QR-kode.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rounds.map((r) => {
                const last = completionsByRound[r.id]?.[0];
                return (
                  <Card key={r.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{r.name}</CardTitle>
                          {r.description && (
                            <CardDescription className="line-clamp-2 mt-1">
                              {r.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">{r.stations.length} stasjoner</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {r.stations.slice(0, 6).map((s, i) => {
                          const Icon = TYPE_ICONS[s.type];
                          return (
                            <Badge key={i} variant="outline" className="gap-1 text-xs">
                              <Icon className="h-3 w-3" />
                              {s.label || TYPE_LABELS[s.type]}
                            </Badge>
                          );
                        })}
                        {r.stations.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{r.stations.length - 6}
                          </Badge>
                        )}
                      </div>

                      {last && (
                        <p className="text-xs text-muted-foreground">
                          Sist fullført{" "}
                          {format(new Date(last.completed_at), "d. MMM HH:mm", {
                            locale: nb,
                          })}{" "}
                          av {last.completed_by_name}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/ik-mat/runde/${r.id}`)}
                          disabled={r.stations.length === 0}
                        >
                          <Play className="h-4 w-4 mr-1" /> Start runde
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQrRound({ id: r.id, name: r.name })}
                        >
                          <QrCode className="h-4 w-4 mr-1" /> QR-kode
                        </Button>
                      </div>

                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Rediger runde" : "Ny runde"}</DialogTitle>
            <DialogDescription>
              Velg hvilke stasjoner som skal være med, og rekkefølgen.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Navn på runden *</Label>
                  <Input
                    placeholder="f.eks. Morgenrunde kjøkken"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Beskrivelse (valgfritt)</Label>
                  <Input
                    placeholder="Kort beskrivelse"
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Picker */}
              <div className="space-y-3">
                <Label>Velg stasjoner</Label>

                {/* Temperatures */}
                <StationPickerGroup
                  title="Temperatur"
                  icon={Thermometer}
                  items={(equipment || []).map((e) => ({
                    id: e.id,
                    label: e.name + (e.location ? ` (${e.location})` : ""),
                  }))}
                  selected={editing.stations}
                  type="temperature"
                  onToggle={(id, label, on) => {
                    if (on) {
                      setEditing({
                        ...editing,
                        stations: [
                          ...editing.stations,
                          { type: "temperature", ref_id: id, label },
                        ],
                      });
                    } else {
                      setEditing({
                        ...editing,
                        stations: editing.stations.filter(
                          (s) => !(s.type === "temperature" && s.ref_id === id)
                        ),
                      });
                    }
                  }}
                />

                {/* Checklists */}
                <StationPickerGroup
                  title="Sjekklister"
                  icon={ClipboardCheck}
                  items={(checklists || []).map((c) => ({
                    id: c.id,
                    label: c.checklist_name,
                  }))}
                  selected={editing.stations}
                  type="checklist"
                  onToggle={(id, label, on) => {
                    if (on) {
                      setEditing({
                        ...editing,
                        stations: [
                          ...editing.stations,
                          { type: "checklist", ref_id: id, label },
                        ],
                      });
                    } else {
                      setEditing({
                        ...editing,
                        stations: editing.stations.filter(
                          (s) => !(s.type === "checklist" && s.ref_id === id)
                        ),
                      });
                    }
                  }}
                />

                {/* Cleaning */}
                <StationPickerGroup
                  title="Renhold"
                  icon={SprayCan}
                  items={(cleaningTasks || []).map((t) => ({
                    id: t.id,
                    label: `${t.area} (${t.frequency})`,
                  }))}
                  selected={editing.stations}
                  type="cleaning"
                  onToggle={(id, label, on) => {
                    if (on) {
                      setEditing({
                        ...editing,
                        stations: [
                          ...editing.stations,
                          { type: "cleaning", ref_id: id, label },
                        ],
                      });
                    } else {
                      setEditing({
                        ...editing,
                        stations: editing.stations.filter(
                          (s) => !(s.type === "cleaning" && s.ref_id === id)
                        ),
                      });
                    }
                  }}
                />

                {/* Custom point */}
                <CustomStationAdder
                  onAdd={(station) =>
                    setEditing({
                      ...editing,
                      stations: [...editing.stations, station],
                    })
                  }
                />
              </div>

              {/* Order */}
              {editing.stations.length > 0 && (
                <div className="space-y-2">
                  <Label>Rekkefølge ({editing.stations.length})</Label>
                  <div className="space-y-1 border rounded-md p-2 max-h-64 overflow-y-auto">
                    {editing.stations.map((s, i) => {
                      const Icon = TYPE_ICONS[s.type];
                      return (
                        <div
                          key={`${s.type}-${s.ref_id}-${i}`}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {TYPE_LABELS[s.type]}
                          </Badge>
                          <span className="truncate flex-1">{s.label}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={i === 0}
                            onClick={() => {
                              const next = [...editing.stations];
                              [next[i - 1], next[i]] = [next[i], next[i - 1]];
                              setEditing({ ...editing, stations: next });
                            }}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={i === editing.stations.length - 1}
                            onClick={() => {
                              const next = [...editing.stations];
                              [next[i + 1], next[i]] = [next[i], next[i + 1]];
                              setEditing({ ...editing, stations: next });
                            }}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              const next = editing.stations.filter((_, idx) => idx !== i);
                              setEditing({ ...editing, stations: next });
                            }}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editing?.name.trim() || (editing?.stations.length || 0) === 0}
            >
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      {qrRound && (
        <DailyRoundQrDialog
          open={!!qrRound}
          onOpenChange={(o) => !o && setQrRound(null)}
          roundId={qrRound.id}
          roundName={qrRound.name}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett runde?</AlertDialogTitle>
            <AlertDialogDescription>
              Runden slettes permanent. Historikk over fullføringer beholdes ikke.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) await deleteRound.mutateAsync(deleteId);
                setDeleteId(null);
              }}
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface StationPickerGroupProps {
  title: string;
  icon: typeof Thermometer;
  items: { id: string; label: string }[];
  selected: RoundStation[];
  type: "temperature" | "checklist" | "cleaning";
  onToggle: (id: string, label: string, on: boolean) => void;
}

function StationPickerGroup({
  title,
  icon: Icon,
  items,
  selected,
  type,
  onToggle,
}: StationPickerGroupProps) {
  if (items.length === 0) {
    return (
      <div className="border rounded-md p-3">
        <div className="flex items-center gap-2 text-sm font-medium mb-1">
          <Icon className="h-4 w-4" /> {title}
        </div>
        <p className="text-xs text-muted-foreground">Ingen tilgjengelige.</p>
      </div>
    );
  }
  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {items.map((it) => {
          const checked = selected.some(
            (s) => s.type === type && s.ref_id === it.id
          );
          return (
            <label
              key={it.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm cursor-pointer"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onToggle(it.id, it.label, !!v)}
              />
              <span className="truncate">{it.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
