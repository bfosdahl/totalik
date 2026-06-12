import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Save, Download, Shield, ExternalLink, Plus, Minus, Image as ImageIcon, Ruler, X, RotateCw, Move, Maximize2 } from "lucide-react";
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchStateRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    startDist: number;
    startZoom: number;
    startPan: { x: number; y: number };
    centerX: number;
    centerY: number;
  } | null>(null);
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
    if (!profile?.company_id || !projectId) {
      toast.error("Mangler bedrift- eller prosjekt-ID. Last siden på nytt.");
      return;
    }
    // Sjekk filtype tidlig (HEIC/HEIF kan ikke vises i nettleser)
    const lowerName = (file.name || "").toLowerCase();
    if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
      toast.error("HEIC/HEIF-bilder støttes ikke. Konverter til JPG eller PNG først (iPhone: Innstillinger → Kamera → Format → Mest kompatibelt).");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Bare bildefiler er støttet (PNG, JPG). PDF kan ikke brukes som bakgrunn.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Bildet er for stort (maks 30 MB).");
      return;
    }
    setUploadingBg(true);
    try {
      // Komprimer bildet (maks 2400 px lengste side, JPEG kvalitet 0.85) før opplasting
      const compressed = await compressImageFile(file, { maxDim: 2400, quality: 0.85 });
      // Bruk alltid .jpg fra komprimering, ellers original-ext
      const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${projectId}/rigg/${plan.id}-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("ks-module2-files")
        .upload(path, compressed, { upsert: false, contentType: compressed.type || "image/jpeg" });
      if (error) throw error;
      // Delete old background if exists
      if (canvas.backgroundImagePath && canvas.backgroundImagePath !== path) {
        await supabase.storage.from("ks-module2-files").remove([canvas.backgroundImagePath]).catch(() => {});
      }
      setCanvas({ ...canvas, backgroundImagePath: path, backgroundImageOpacity: canvas.backgroundImageOpacity ?? 0.7 });
      const ratio = (compressed.size / file.size) * 100;
      toast.success(
        `Bakgrunnsbilde lastet opp (${(compressed.size / 1024).toFixed(0)} kB, ${ratio.toFixed(0)}% av original) – husk å lagre`
      );
    } catch (e: any) {
      console.error("[riggplan] upload background failed", e);
      const msg = e?.message || e?.error || "Ukjent feil";
      toast.error(`Kunne ikke laste opp bilde: ${msg}`);
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

  // ---------- Pan + zoom logic (viewport) ----------
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panMovedRef = useRef(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const clampZoom = (z: number) => Math.max(0.1, Math.min(5, z));

  const zoomAtPoint = (newZoom: number, viewportX: number, viewportY: number) => {
    const z0 = zoomRef.current;
    const z1 = clampZoom(newZoom);
    const p = panRef.current;
    setZoom(z1);
    setPan({
      x: viewportX - (viewportX - p.x) * (z1 / z0),
      y: viewportY - (viewportY - p.y) * (z1 / z0),
    });
  };

  const fitToView = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const z = clampZoom(Math.min(vw / canvas.width, vh / canvas.height) * 0.95);
    setZoom(z);
    setPan({ x: (vw - canvas.width * z) / 2, y: (vh - canvas.height * z) / 2 });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Non-passive wheel handler so we can preventDefault for ctrl-zoom & pan
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const vx = e.clientX - rect.left;
      const vy = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.0015);
        zoomAtPoint(zoomRef.current * factor, vx, vy);
      } else {
        e.preventDefault();
        const p = panRef.current;
        setPan({ x: p.x - e.deltaX, y: p.y - e.deltaY });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleViewportPointerDown = (e: React.PointerEvent) => {
    // Ignore if pointer down originated on an object (object has own handler + stopPropagation)
    const target = e.target as HTMLElement;
    if (target.closest("[data-rigg-object]")) return;
    if (calibrating) return; // let click handler do its thing
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    panMovedRef.current = false;

    if (pointersRef.current.size === 1) {
      panStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: panRef.current.x,
        origY: panRef.current.y,
      };
      setIsPanning(true);
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const rect = viewportRef.current!.getBoundingClientRect();
      pinchStateRef.current = {
        pointers: new Map(pointersRef.current),
        startDist: dist || 1,
        startZoom: zoomRef.current,
        startPan: { ...panRef.current },
        centerX: (pts[0].x + pts[1].x) / 2 - rect.left,
        centerY: (pts[0].y + pts[1].y) / 2 - rect.top,
      };
      panStateRef.current = null;
    }
  };

  const handleViewportPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinchStateRef.current && pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values()).slice(0, 2);
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ps = pinchStateRef.current;
      const z1 = clampZoom(ps.startZoom * (dist / ps.startDist));
      setZoom(z1);
      setPan({
        x: ps.centerX - (ps.centerX - ps.startPan.x) * (z1 / ps.startZoom),
        y: ps.centerY - (ps.centerY - ps.startPan.y) * (z1 / ps.startZoom),
      });
      panMovedRef.current = true;
    } else if (panStateRef.current) {
      const dx = e.clientX - panStateRef.current.startX;
      const dy = e.clientY - panStateRef.current.startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) panMovedRef.current = true;
      setPan({ x: panStateRef.current.origX + dx, y: panStateRef.current.origY + dy });
    }
  };

  const handleViewportPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStateRef.current = null;
    if (pointersRef.current.size === 0) {
      panStateRef.current = null;
      setIsPanning(false);
    }
  };

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
                  className="w-7 h-7 rounded border shrink-0 flex items-center justify-center text-base leading-none"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                >
                  {s.emoji}
                </span>
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
            <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <RotateCw className="h-3.5 w-3.5 text-primary" />
                  Roter boks
                </Label>
                <span className="text-xs font-mono text-primary">{Math.round(selected.rotation || 0)}°</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selected.rotation || 0}
                  onChange={(e) => updateObject(selected.id, { rotation: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => updateObject(selected.id, { rotation: 0 })}
                >
                  0°
                </Button>
              </div>
              <div className="flex gap-1">
                {[-90, -45, 45, 90].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs px-1"
                    onClick={() =>
                      updateObject(selected.id, {
                        rotation: Math.max(-180, Math.min(180, (selected.rotation || 0) + d)),
                      })
                    }
                  >
                    {d > 0 ? `+${d}°` : `${d}°`}
                  </Button>
                ))}
              </div>
            </div>

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
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const vp = viewportRef.current;
                if (!vp) return setZoom((z) => clampZoom(z - 0.1));
                const r = vp.getBoundingClientRect();
                zoomAtPoint(zoomRef.current - 0.1, r.width / 2, r.height / 2);
              }}
              title="Zoom ut"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const vp = viewportRef.current;
                if (!vp) return setZoom((z) => clampZoom(z + 0.1));
                const r = vp.getBoundingClientRect();
                zoomAtPoint(zoomRef.current + 0.1, r.width / 2, r.height / 2);
              }}
              title="Zoom inn"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={fitToView} title="Tilpass i vindu">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={resetView} title="Nullstill zoom og posisjon">
              <Move className="h-4 w-4" />
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

        <Card className="p-0 overflow-hidden bg-muted/30 relative" ref={containerRef}>
          <div
            ref={viewportRef}
            className="relative w-full overflow-hidden select-none"
            style={{
              height: "70vh",
              minHeight: 480,
              touchAction: "none",
              cursor: isPanning ? "grabbing" : calibrating ? "crosshair" : "grab",
            }}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            onPointerCancel={handleViewportPointerUp}
          >
            <div className="absolute top-2 left-2 z-10 text-[10px] bg-white/85 border rounded px-1.5 py-0.5 text-muted-foreground pointer-events-none shadow-sm">
              Dra for å flytte · Ctrl/⌘+scroll for zoom · 2 fingre for knip-zoom
            </div>
            <div
              className="absolute bg-white shadow-inner border"
              style={{
                left: 0,
                top: 0,
                width: canvas.width * zoom,
                height: canvas.height * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: "0 0",
                cursor: calibrating ? "crosshair" : undefined,
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onClick={(e) => {
                if (panMovedRef.current) {
                  panMovedRef.current = false;
                  return;
                }
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
                  data-rigg-object
                  onPointerDown={(e) => calibrating ? undefined : onPointerDownObj(e, obj, "move")}
                  onClick={(e) => {
                    if (calibrating) return;
                    e.stopPropagation();
                    setSelectedId(obj.id);
                  }}
                  className="absolute flex flex-col items-center justify-center text-xs font-medium border-2 select-none gap-0.5"
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
                    transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
                    transformOrigin: "center center",
                  }}
                >
                  <span className="px-1 text-center pointer-events-none leading-tight">{obj.label}</span>
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
