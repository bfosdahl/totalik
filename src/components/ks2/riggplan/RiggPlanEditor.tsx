import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Save, Download, Shield, ExternalLink, Plus, Minus, Image as ImageIcon, Ruler, X } from "lucide-react";
import { RIGG_SYMBOLS, getSymbol } from "./riggSymbols";
import type { RiggCanvasData, RiggObject, RiggPlan } from "@/hooks/useKsRiggPlan";
import { exportRiggPlanPdf } from "@/utils/riggPlanPdf";
import { DEFAULT_RISK_AREAS } from "@/hooks/useKsModule2ShaPlan";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { compressImageFile } from "@/utils/imageCompression";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


interface Props {
  plan: RiggPlan;
  projectName: string;
  projectNumber: string;
  onSave: (canvas: RiggCanvasData, name: string) => Promise<void>;
  isSaving: boolean;
  initialSelectedId?: string | null;
}

export function RiggPlanEditor({ plan, projectName, projectNumber, onSave, isSaving, initialSelectedId }: Props) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { profile } = useAuth();
  const [canvas, setCanvas] = useState<RiggCanvasData>(plan.canvas_data);
  const [name, setName] = useState(plan.name);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [dragState, setDragState] = useState<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibPoints, setCalibPoints] = useState<{ x: number; y: number }[]>([]);
  const [calibDialog, setCalibDialog] = useState<{ pixelDist: number } | null>(null);
  const [calibMetersInput, setCalibMetersInput] = useState("10");

  useEffect(() => {
    setCanvas(plan.canvas_data);
    setName(plan.name);
  }, [plan.id]);

  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  // Sign URL for background image
  useEffect(() => {
    const path = canvas.backgroundImagePath;
    if (!path) { setBgUrl(null); return; }
    let active = true;
    supabase.storage
      .from("ks-module2-files")
      .createSignedUrl(path, 3600)
      .then(({ data }) => { if (active) setBgUrl(data?.signedUrl || null); });
    return () => { active = false; };
  }, [canvas.backgroundImagePath]);

  const handleUploadBackground = async (file: File) => {
    if (!profile?.company_id || !projectId) return;
    setUploadingBg(true);
    try {
      // Komprimer bildet (maks 2400 px lengste side, JPEG kvalitet 0.85) før opplasting
      const compressed = await compressImageFile(file, { maxDim: 2400, quality: 0.85 });
      const ext = compressed.name.split(".").pop() || "jpg";
      const path = `${profile.company_id}/rigg/${projectId}/${plan.id}-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("ks-module2-files")
        .upload(path, compressed, { upsert: true, contentType: compressed.type });
      if (error) throw error;
      // Delete old background if exists
      if (canvas.backgroundImagePath && canvas.backgroundImagePath !== path) {
        await supabase.storage.from("ks-module2-files").remove([canvas.backgroundImagePath]);
      }
      setCanvas({ ...canvas, backgroundImagePath: path, backgroundImageOpacity: canvas.backgroundImageOpacity ?? 0.7 });
      const ratio = (compressed.size / file.size) * 100;
      toast.success(
        `Bakgrunnsbilde lastet opp (${(compressed.size / 1024).toFixed(0)} kB, ${ratio.toFixed(0)}% av original) – husk å lagre`
      );
    } catch (e: any) {
      console.error(e);
      toast.error("Kunne ikke laste opp bilde");
    } finally {
      setUploadingBg(false);
    }
  };

  const removeBackground = async () => {
    if (canvas.backgroundImagePath) {
      await supabase.storage.from("ks-module2-files").remove([canvas.backgroundImagePath]).catch(() => {});
    }
    setCanvas({ ...canvas, backgroundImagePath: null });
  };


  const selected = canvas.objects.find((o) => o.id === selectedId) || null;

  const addObject = (type: string) => {
    const sym = getSymbol(type);
    if (!sym) return;
    const newObj: RiggObject = {
      id: crypto.randomUUID(),
      type,
      label: sym.label,
      x: 50,
      y: 50,
      width: sym.defaultWidth,
      height: sym.defaultHeight,
      color: sym.color,
      linkedRiskParagraphs: [...(sym.suggestedRiskParagraphs || [])],
      riskNote: "",
    };
    setCanvas({ ...canvas, objects: [...canvas.objects, newObj] });
    setSelectedId(newObj.id);
  };

  const toggleRiskParagraph = (objId: string, paragraph: string) => {
    const obj = canvas.objects.find((o) => o.id === objId);
    if (!obj) return;
    const current = obj.linkedRiskParagraphs || [];
    const next = current.includes(paragraph)
      ? current.filter((p) => p !== paragraph)
      : [...current, paragraph];
    updateObject(objId, { linkedRiskParagraphs: next });
  };

  const updateObject = (id: string, patch: Partial<RiggObject>) => {
    setCanvas({
      ...canvas,
      objects: canvas.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  const removeObject = (id: string) => {
    setCanvas({ ...canvas, objects: canvas.objects.filter((o) => o.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const onPointerDownObj = (e: React.PointerEvent, obj: RiggObject, mode: "move" | "resize") => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(obj.id);
    setDragState({
      id: obj.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const dx = (e.clientX - dragState.startX) / zoom;
    const dy = (e.clientY - dragState.startY) / zoom;
    if (dragState.mode === "move") {
      updateObject(dragState.id, {
        x: Math.max(0, Math.min(canvas.width - 20, dragState.origX + dx)),
        y: Math.max(0, Math.min(canvas.height - 20, dragState.origY + dy)),
      });
    } else {
      updateObject(dragState.id, {
        width: Math.max(30, dragState.origW + dx),
        height: Math.max(30, dragState.origH + dy),
      });
    }
  };

  const onPointerUp = () => setDragState(null);

  const handleSave = async () => {
    await onSave(canvas, name);
  };

  const handleExport = async () => {
    await exportRiggPlanPdf(name, projectName, projectNumber, canvas);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Sidebar with symbols */}
      <Card className="lg:w-64 shrink-0 p-3">
        <h3 className="font-semibold text-sm mb-2">Symbolbibliotek</h3>
        <p className="text-xs text-muted-foreground mb-3">Klikk for å legge til</p>
        <ScrollArea className="h-[280px] lg:h-[500px] pr-2">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {RIGG_SYMBOLS.map((s) => (
              <button
                key={s.type}
                onClick={() => addObject(s.type)}
                className="flex items-center gap-2 p-2 rounded border hover:border-primary hover:bg-accent transition text-left"
              >
                <span
                  className="w-6 h-6 rounded border shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs font-medium truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {selected && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <h4 className="font-semibold text-xs">Valgt objekt</h4>
            <Label className="text-xs">Etikett</Label>
            <Input
              value={selected.label}
              onChange={(e) => updateObject(selected.id, { label: e.target.value })}
              className="h-8 text-sm"
            />
            <Label className="text-xs">Farge</Label>
            <Input
              type="color"
              value={selected.color}
              onChange={(e) => updateObject(selected.id, { color: e.target.value })}
              className="h-8"
            />

            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <Label className="text-xs font-semibold">SHA §8 risikoområder</Label>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Auto-synkes til SHA-planen ved lagring. Avkryssede områder markeres som aktuelle med merknad om plasseringen.
              </p>
              <ScrollArea className="h-[160px] pr-2 -mx-1 px-1 border rounded bg-muted/30">
                <div className="space-y-1 py-1.5">
                  {DEFAULT_RISK_AREAS.map((ra) => {
                    const checked = (selected.linkedRiskParagraphs || []).includes(ra.paragraph);
                    return (
                      <div
                        key={ra.paragraph}
                        className="flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-accent text-[11px] leading-tight"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleRiskParagraph(selected.id, ra.paragraph)}
                          className="mt-0.5 h-3.5 w-3.5"
                        />
                        <label className="flex-1 cursor-pointer" onClick={() => toggleRiskParagraph(selected.id, ra.paragraph)}>
                          <span className="font-semibold mr-1">§{ra.paragraph})</span>
                          {ra.description}
                        </label>
                        {checked && projectId && (
                          <button
                            type="button"
                            title="Åpne risikoområdet i SHA-planen"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ks/project/${projectId}/hms/sha-plan?paragraph=${ra.paragraph}`);
                            }}
                            className="shrink-0 text-emerald-600 hover:text-emerald-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <Label className="text-xs">Merknad til SHA</Label>
              <Textarea
                value={selected.riskNote || ""}
                onChange={(e) => updateObject(selected.id, { riskNote: e.target.value })}
                placeholder="F.eks. plassering, avstand, sikringstiltak…"
                className="text-xs min-h-[56px]"
              />
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full mt-3"
              onClick={() => removeObject(selected.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Slett
            </Button>
          </div>
        )}
      </Card>

      {/* Canvas + controls */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Navn</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
          </div>
          <div className="flex gap-1 items-center">
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <input
            type="file"
            accept="image/*"
            id="rigg-bg-upload"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUploadBackground(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            disabled={uploadingBg}
            onClick={() => document.getElementById("rigg-bg-upload")?.click()}
            title="Last opp situasjonskart / bilde som bakgrunn"
          >
            <ImageIcon className="h-4 w-4 mr-1" /> {canvas.backgroundImagePath ? "Bytt bilde" : "Last opp kart"}
          </Button>
          {canvas.backgroundImagePath && (
            <Button variant="outline" size="icon" onClick={removeBackground} title="Fjern bakgrunn">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={calibrating ? "default" : "outline"}
            onClick={() => {
              setCalibrating((v) => !v);
              setCalibPoints([]);
            }}
            title="Kalibrer skala ved å klikke to punkter på kjent avstand"
          >
            <Ruler className="h-4 w-4 mr-1" /> {calibrating ? "Avbryt skala" : "Kalibrer skala"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" /> Lagre
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Eksporter PDF
          </Button>
        </div>

        {calibrating && (
          <div className="rounded-md border bg-amber-50 border-amber-300 text-amber-900 px-3 py-2 text-xs flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            {calibPoints.length === 0 && "Klikk på første punkt med kjent avstand i tegningen."}
            {calibPoints.length === 1 && "Klikk på andre punkt for å fullføre kalibreringen."}
          </div>
        )}

        <Card className="p-2 overflow-auto bg-muted/30" ref={containerRef}>
          <div
            className="relative bg-white mx-auto shadow-inner border"
            style={{
              width: canvas.width * zoom,
              height: canvas.height * zoom,
              minWidth: canvas.width * zoom,
              cursor: calibrating ? "crosshair" : undefined,
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={(e) => {
              if (calibrating) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = (e.clientX - rect.left) / zoom;
                const y = (e.clientY - rect.top) / zoom;
                const next = [...calibPoints, { x, y }];
                if (next.length < 2) {
                  setCalibPoints(next);
                } else {
                  const dx = next[1].x - next[0].x;
                  const dy = next[1].y - next[0].y;
                  const pixelDist = Math.sqrt(dx * dx + dy * dy);
                  setCalibPoints(next);
                  if (pixelDist > 0) {
                    setCalibMetersInput("10");
                    setCalibDialog({ pixelDist });
                  } else {
                    setCalibrating(false);
                    setCalibPoints([]);
                  }
                }
                return;
              }
              setSelectedId(null);
            }}
          >
            {bgUrl && (
              <img
                src={bgUrl}
                alt="Bakgrunnskart"
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                style={{ opacity: canvas.backgroundImageOpacity ?? 0.7 }}
              />
            )}
            {canvas.backgroundLabel && (
              <div className="absolute top-2 left-2 text-xs text-muted-foreground font-medium pointer-events-none">
                {canvas.backgroundLabel}
              </div>
            )}
            {/* Calibration markers */}
            {calibPoints.map((p, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-amber-500 border-2 border-white pointer-events-none"
                style={{ left: p.x * zoom, top: p.y * zoom }}
              />
            ))}
            {canvas.objects.map((obj) => {
              const isSel = obj.id === selectedId;
              return (
                <div
                  key={obj.id}
                  onPointerDown={(e) => calibrating ? undefined : onPointerDownObj(e, obj, "move")}
                  onClick={(e) => {
                    if (calibrating) return;
                    e.stopPropagation();
                    setSelectedId(obj.id);
                  }}
                  className="absolute flex items-center justify-center text-xs font-medium border-2 select-none"
                  style={{
                    left: obj.x * zoom,
                    top: obj.y * zoom,
                    width: obj.width * zoom,
                    height: obj.height * zoom,
                    backgroundColor: obj.color,
                    borderColor: isSel ? "hsl(var(--primary))" : "rgba(0,0,0,0.3)",
                    boxShadow: isSel ? "0 0 0 2px hsl(var(--primary) / 0.3)" : undefined,
                    cursor: calibrating ? "crosshair" : "move",
                    pointerEvents: calibrating ? "none" : "auto",
                  }}
                >
                  <span className="px-1 text-center pointer-events-none">{obj.label}</span>
                  {isSel && (
                    <div
                      onPointerDown={(e) => onPointerDownObj(e, obj, "resize")}
                      className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-se-resize"
                    />
                  )}
                </div>
              );
            })}

            {/* Visuell målestokk (skala-strek) */}
            {(() => {
              const mpp = canvas.scaleMetersPerPixel || 0.05;
              // Velg meterlengde slik at streken blir 80-200 px i nåværende zoom
              const candidates = [1, 2, 5, 10, 20, 50, 100];
              const targetPx = 140;
              const meters =
                candidates.find((m) => (m / mpp) * zoom >= targetPx) || candidates[candidates.length - 1];
              const widthPx = (meters / mpp) * zoom;
              return (
                <div
                  className="absolute bottom-3 right-3 flex flex-col items-end gap-0.5 pointer-events-none select-none"
                  aria-label="Målestokk"
                >
                  <div className="text-[10px] font-semibold bg-white/90 px-1.5 py-0.5 rounded shadow-sm border">
                    {meters} m
                  </div>
                  <div className="flex items-end h-2.5">
                    <div className="h-full w-0.5 bg-foreground" />
                    <div className="h-1 bg-foreground" style={{ width: widthPx }} />
                    <div className="h-full w-0.5 bg-foreground" />
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>

        {canvas.backgroundImagePath && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Bakgrunn transparens</Label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={canvas.backgroundImageOpacity ?? 0.7}
              onChange={(e) => setCanvas({ ...canvas, backgroundImageOpacity: Number(e.target.value) })}
              className="flex-1 max-w-[240px]"
            />
            <span className="text-xs text-muted-foreground w-10">{Math.round((canvas.backgroundImageOpacity ?? 0.7) * 100)}%</span>
          </div>
        )}


        <p className="text-xs text-muted-foreground">
          Område: {(canvas.width * canvas.scaleMetersPerPixel).toFixed(0)} m ×{" "}
          {(canvas.height * canvas.scaleMetersPerPixel).toFixed(0)} m · {canvas.objects.length} objekter
        </p>
      </div>

      <Dialog
        open={!!calibDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCalibDialog(null);
            setCalibrating(false);
            setCalibPoints([]);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-sm"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Kalibrer skala</DialogTitle>
            <DialogDescription>
              Oppgi den virkelige avstanden mellom de to punktene du klikket på.
              {calibDialog && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Pikselavstand: {calibDialog.pixelDist.toFixed(1)} px
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="calib-meters" className="text-xs">Avstand i meter</Label>
            <Input
              id="calib-meters"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              autoFocus
              value={calibMetersInput}
              onChange={(e) => setCalibMetersInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("calib-confirm")?.click();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCalibDialog(null);
                setCalibrating(false);
                setCalibPoints([]);
              }}
            >
              Avbryt
            </Button>
            <Button
              id="calib-confirm"
              onClick={() => {
                if (!calibDialog) return;
                const meters = Number((calibMetersInput || "").replace(",", "."));
                if (meters > 0 && calibDialog.pixelDist > 0) {
                  const mpp = meters / calibDialog.pixelDist;
                  setCanvas({ ...canvas, scaleMetersPerPixel: mpp });
                  toast.success(`Skala satt: 1 px = ${mpp.toFixed(3)} m`);
                } else {
                  toast.error("Oppgi et gyldig tall større enn 0");
                  return;
                }
                setCalibDialog(null);
                setCalibrating(false);
                setCalibPoints([]);
              }}
            >
              Bekreft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
