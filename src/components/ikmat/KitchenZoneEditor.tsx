import { useState, useRef, useCallback, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash2,
  Download,
  RotateCcw,
  MousePointer,
  Move,
  ZoomIn,
  ZoomOut,
  Copy,
  ChevronUp,
  ChevronDown,
  Ruler,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Kitchen zone element types
type KitchenElementType =
  | "wall"
  | "matsone"        // Food prep zone (clean)
  | "oppvasksone"    // Dish wash zone (unclean)
  | "kjoeleskap"     // Refrigerator
  | "fryser"         // Freezer
  | "haandvask"      // Hand wash sink
  | "matkum"         // Food sink
  | "komfyr"         // Stove/range
  | "oppvaskmaskin"  // Dishwasher
  | "hylle_rent"     // Clean shelf
  | "hylle_urent"    // Unclean shelf
  | "torrvarelager"  // Dry goods storage
  | "door"
  | "text";

interface KitchenElement {
  id: string;
  type: KitchenElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
  color?: string;
}

interface KitchenZoneEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: string;
  onSave: (imageDataUrl: string, elementsJson: string) => Promise<void>;
}

const DEFAULT_PPM = 50;
const MIN_ELEMENT_SIZE = 10;
const GRID_SNAP = 10;

const KITCHEN_PRESETS: Record<KitchenElementType, { label: string; emoji: string; defaultWidth: number; defaultHeight: number; color: string; zone?: "ren" | "uren" }> = {
  wall:          { label: "Vegg",           emoji: "▬", defaultWidth: 200, defaultHeight: 10, color: "#1f2937" },
  matsone:       { label: "Matsone",        emoji: "🍳", defaultWidth: 250, defaultHeight: 180, color: "#fef3c7", zone: "ren" },
  oppvasksone:   { label: "Oppvasksone",    emoji: "🫧", defaultWidth: 200, defaultHeight: 150, color: "#e0e7ff", zone: "uren" },
  kjoeleskap:    { label: "Kjøl",           emoji: "❄️", defaultWidth: 100, defaultHeight: 150, color: "#bae6fd" },
  fryser:        { label: "Frys",           emoji: "🧊", defaultWidth: 100, defaultHeight: 100, color: "#e0e7ff" },
  haandvask:     { label: "Håndvask",       emoji: "🚰", defaultWidth: 60,  defaultHeight: 50,  color: "#a5f3fc" },
  matkum:        { label: "Matkum",         emoji: "🫗", defaultWidth: 80,  defaultHeight: 60,  color: "#99f6e4" },
  komfyr:        { label: "Komfyr",         emoji: "🔥", defaultWidth: 80,  defaultHeight: 60,  color: "#fecaca" },
  oppvaskmaskin: { label: "Oppvaskmaskin",  emoji: "🫧", defaultWidth: 60,  defaultHeight: 60,  color: "#c7d2fe" },
  hylle_rent:    { label: "Hylle (rent)",   emoji: "📦", defaultWidth: 60,  defaultHeight: 40,  color: "#bbf7d0", zone: "ren" },
  hylle_urent:   { label: "Hylle (uren)",   emoji: "📦", defaultWidth: 60,  defaultHeight: 40,  color: "#fed7aa", zone: "uren" },
  torrvarelager: { label: "Tørrvarer",      emoji: "🏪", defaultWidth: 120, defaultHeight: 80,  color: "#d9f99d" },
  door:          { label: "Dør",            emoji: "🚪", defaultWidth: 50,  defaultHeight: 10,  color: "#3b82f6" },
  text:          { label: "Tekst",          emoji: "Aa", defaultWidth: 80,  defaultHeight: 24,  color: "#1f2937" },
};

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
const snapToGrid = (val: number) => Math.round(val / GRID_SNAP) * GRID_SNAP;
const pxToMeters = (px: number, ppm: number) => (px / ppm).toFixed(1);

export function KitchenZoneEditor({ open, onOpenChange, initialData, onSave }: KitchenZoneEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [elements, setElements] = useState<KitchenElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<KitchenElementType | "select" | "move">("select");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeOrigin, setResizeOrigin] = useState({ x: 0, y: 0, w: 0, h: 0, ex: 0, ey: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"elements" | "settings">("elements");
  const [ppm] = useState(DEFAULT_PPM);
  const [showDimensions, setShowDimensions] = useState(true);
  const wasDraggingRef = useRef(false);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        setElements(parsed.elements || []);
      } catch {
        setElements([]);
      }
    } else {
      setElements([]);
    }
  }, [initialData]);

  // Resize canvas
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        drawCanvas();
      }
    };
    if (open) {
      setTimeout(resizeCanvas, 100);
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [open, isMobile]);

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, el: KitchenElement, x: number, y: number, w: number, h: number, scale: number) => {
    const preset = KITCHEN_PRESETS[el.type];

    switch (el.type) {
      case "wall":
        ctx.fillStyle = el.color || "#1f2937";
        ctx.fillRect(x, y, w, h);
        break;
      case "matsone":
      case "oppvasksone":
      case "torrvarelager":
        // Zone with colored background and border
        ctx.fillStyle = el.color || preset.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = el.type === "matsone" ? "#ca8a04" : el.type === "oppvasksone" ? "#6366f1" : "#65a30d";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        // Zone label (large)
        ctx.fillStyle = "#374151";
        ctx.font = `bold ${Math.max(14, 18 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label || preset.label, x + w / 2, y + h / 2);
        break;
      case "kjoeleskap":
      case "fryser":
        ctx.fillStyle = el.color || preset.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = el.type === "kjoeleskap" ? "#0284c7" : "#6366f1";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#1e3a5f";
        ctx.font = `bold ${Math.max(12, 16 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label || preset.label, x + w / 2, y + h / 2);
        break;
      case "haandvask":
      case "matkum":
        ctx.fillStyle = el.color || preset.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#0891b2";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        // Draw a small circle to represent basin
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h / 2, Math.min(w, h) * 0.25, 0, Math.PI * 2);
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (el.label) {
          ctx.fillStyle = "#374151";
          ctx.font = `${Math.max(9, 11 * scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(el.label, x + w / 2, y + h / 2);
        }
        break;
      case "komfyr":
        ctx.fillStyle = el.color || preset.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        // Draw burners
        const burnerR = Math.min(w, h) * 0.15;
        const positions = [
          [x + w * 0.3, y + h * 0.35],
          [x + w * 0.7, y + h * 0.35],
          [x + w * 0.3, y + h * 0.65],
          [x + w * 0.7, y + h * 0.65],
        ];
        positions.forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.arc(bx, by, burnerR, 0, Math.PI * 2);
          ctx.fillStyle = "#1f2937";
          ctx.fill();
        });
        break;
      case "oppvaskmaskin":
        ctx.fillStyle = el.color || preset.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        // Circle inside
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      case "hylle_rent":
      case "hylle_urent":
        ctx.fillStyle = el.color || preset.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = el.type === "hylle_rent" ? "#16a34a" : "#ea580c";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#374151";
        ctx.font = `${Math.max(8, 10 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label || preset.label, x + w / 2, y + h / 2);
        break;
      case "door":
        ctx.fillStyle = el.color || "#3b82f6";
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.arc(x, y + h / 2, w * 0.8, -Math.PI / 2, 0);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      case "text":
        ctx.fillStyle = el.color || "#1f2937";
        ctx.font = `${14 * scale}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(el.label || "Tekst", x, y);
        break;
    }

    // Label for non-text, non-zone elements that have custom label
    if (el.label && el.type !== "text" && !["matsone", "oppvasksone", "torrvarelager", "kjoeleskap", "fryser", "hylle_rent", "hylle_urent"].includes(el.type)) {
      ctx.fillStyle = "#374151";
      ctx.font = `${Math.max(9, 11 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el.label, x + w / 2, y + h / 2);
    }
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    const gridPx = ppm * zoom;
    const subGrid = gridPx / 5;
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 0.5;
    for (let x = pan.x % subGrid; x < canvas.width; x += subGrid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = pan.y % subGrid; y < canvas.height; y += subGrid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    for (let x = pan.x % gridPx; x < canvas.width; x += gridPx) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = pan.y % gridPx; y < canvas.height; y += gridPx) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Ruler
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let x = pan.x % gridPx; x < canvas.width; x += gridPx) {
      const m = Math.round((x - pan.x) / gridPx);
      if (x > 20) ctx.fillText(`${m}m`, x, 4);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = pan.y % gridPx; y < canvas.height; y += gridPx) {
      const m = Math.round((y - pan.y) / gridPx);
      if (y > 20) ctx.fillText(`${m}`, 16, y);
    }

    // Elements
    elements.forEach((el) => {
      const x = el.x * zoom + pan.x;
      const y = el.y * zoom + pan.y;
      const w = el.width * zoom;
      const h = el.height * zoom;

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));

      drawElement(ctx, el, x, y, w, h, zoom);

      ctx.restore();

      // Dimensions
      if (showDimensions && ["wall", "matsone", "oppvasksone", "kjoeleskap", "fryser", "torrvarelager"].includes(el.type)) {
        const wM = pxToMeters(el.width, ppm);
        const hM = pxToMeters(el.height, ppm);
        ctx.save();
        ctx.fillStyle = "#1d4ed8";
        ctx.font = `bold ${Math.max(9, 11 * zoom)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${wM}m`, x + w / 2, y - 4);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + w, y - 3); ctx.stroke();
        ctx.save();
        ctx.translate(x + w + 12, y + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = "bottom";
        ctx.fillText(`${hM}m`, 0, 0);
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(x + w + 4, y); ctx.lineTo(x + w + 4, y + h); ctx.stroke();
        ctx.restore();
      }

      // Selection handles
      if (el.id === selectedId) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
        ctx.setLineDash([]);
        const hs = 8;
        ctx.fillStyle = "#3b82f6";
        [[x - hs / 2, y - hs / 2], [x + w - hs / 2, y - hs / 2], [x - hs / 2, y + h - hs / 2], [x + w - hs / 2, y + h - hs / 2]].forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
        ctx.fillStyle = "#60a5fa";
        [[x + w / 2 - hs / 2, y - hs / 2], [x + w / 2 - hs / 2, y + h - hs / 2], [x - hs / 2, y + h / 2 - hs / 2], [x + w - hs / 2, y + h / 2 - hs / 2]].forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
      }
    });

    // Legend
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Kjøkkenplanløsning – Ren/uren sone", 24, 24);

  }, [elements, selectedId, zoom, pan, ppm, showDimensions, drawElement]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // Coordinate helpers
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  };

  const getScreenCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 0, sy: 0 };
    const rect = canvas.getBoundingClientRect();
    return { sx: clientX - rect.left, sy: clientY - rect.top };
  };

  const hitTestHandle = (sx: number, sy: number): ResizeHandle | null => {
    if (!selectedId) return null;
    const el = elements.find(e => e.id === selectedId);
    if (!el) return null;
    const x = el.x * zoom + pan.x;
    const y = el.y * zoom + pan.y;
    const w = el.width * zoom;
    const h = el.height * zoom;
    const hs = 10;
    const positions: { handle: ResizeHandle; hx: number; hy: number }[] = [
      { handle: "nw", hx: x, hy: y }, { handle: "ne", hx: x + w, hy: y },
      { handle: "sw", hx: x, hy: y + h }, { handle: "se", hx: x + w, hy: y + h },
      { handle: "n", hx: x + w / 2, hy: y }, { handle: "s", hx: x + w / 2, hy: y + h },
      { handle: "w", hx: x, hy: y + h / 2 }, { handle: "e", hx: x + w, hy: y + h / 2 },
    ];
    for (const { handle, hx, hy } of positions) {
      if (Math.abs(sx - hx) < hs && Math.abs(sy - hy) < hs) return handle;
    }
    return null;
  };

  const findElementAt = (x: number, y: number) => {
    return [...elements].reverse().find(el => {
      const minHit = 35;
      const padding = 8;
      const hitW = Math.max(el.width + padding * 2, minHit);
      const hitH = Math.max(el.height + padding * 2, minHit);
      const hitX = el.x - (hitW - el.width) / 2;
      const hitY = el.y - (hitH - el.height) / 2;
      return x >= hitX && x <= hitX + hitW && y >= hitY && y <= hitY + hitH;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isResizing || wasDraggingRef.current) { wasDraggingRef.current = false; return; }
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    if (activeTool === "select" || activeTool === "move") {
      setSelectedId(findElementAt(x, y)?.id || null);
    } else {
      const preset = KITCHEN_PRESETS[activeTool];
      const newEl: KitchenElement = {
        id: crypto.randomUUID(),
        type: activeTool,
        x: snapToGrid(x - preset.defaultWidth / 2),
        y: snapToGrid(y - preset.defaultHeight / 2),
        width: preset.defaultWidth,
        height: preset.defaultHeight,
        rotation: 0,
        color: preset.color,
        label: activeTool === "text" ? textInput || "Tekst" : undefined,
      };
      setElements([...elements, newEl]);
      setSelectedId(newEl.id);
      if (isMobile) setMobileToolbarOpen(false);
      setActiveTool("select");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    wasDraggingRef.current = false;
    if (activeTool === "move") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (activeTool === "select") {
      if (selectedId) {
        const { sx, sy } = getScreenCoords(e.clientX, e.clientY);
        const handle = hitTestHandle(sx, sy);
        if (handle) {
          const el = elements.find(e => e.id === selectedId)!;
          setIsResizing(true);
          setResizeHandle(handle);
          setResizeOrigin({ x: el.x, y: el.y, w: el.width, h: el.height, ex: e.clientX, ey: e.clientY });
          return;
        }
      }
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const clickedEl = findElementAt(x, y);
      if (clickedEl) {
        setSelectedId(clickedEl.id);
        setIsDragging(true);
        setDragStart({ x: x - clickedEl.x, y: y - clickedEl.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedId && activeTool === "select" && !isDragging && !isResizing) {
      const { sx, sy } = getScreenCoords(e.clientX, e.clientY);
      const handle = hitTestHandle(sx, sy);
      const canvas = canvasRef.current;
      if (canvas) {
        if (handle) {
          const cursorMap: Record<ResizeHandle, string> = {
            nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize",
            n: "n-resize", s: "s-resize", w: "w-resize", e: "e-resize",
          };
          canvas.style.cursor = cursorMap[handle];
        } else {
          canvas.style.cursor = "default";
        }
      }
    }
    if (isResizing && selectedId && resizeHandle) {
      const dx = (e.clientX - resizeOrigin.ex) / zoom;
      const dy = (e.clientY - resizeOrigin.ey) / zoom;
      let newX = resizeOrigin.x, newY = resizeOrigin.y, newW = resizeOrigin.w, newH = resizeOrigin.h;
      if (resizeHandle.includes("e")) newW = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.w + dx);
      if (resizeHandle.includes("w")) { newX = resizeOrigin.x + dx; newW = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.w - dx); }
      if (resizeHandle.includes("s")) newH = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.h + dy);
      if (resizeHandle.includes("n")) { newY = resizeOrigin.y + dy; newH = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.h - dy); }
      setElements(elements.map(el => el.id === selectedId ? { ...el, x: snapToGrid(newX), y: snapToGrid(newY), width: snapToGrid(newW), height: snapToGrid(newH) } : el));
      return;
    }
    if (!isDragging) return;
    if (activeTool === "move") {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }
    if (selectedId) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      setElements(elements.map(el => el.id === selectedId ? { ...el, x: snapToGrid(x - dragStart.x), y: snapToGrid(y - dragStart.y) } : el));
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) wasDraggingRef.current = true;
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    wasDraggingRef.current = false;
    const touch = e.touches[0];
    if (activeTool === "move") { setIsDragging(true); setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y }); return; }
    if (activeTool === "select") {
      if (selectedId) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const handle = hitTestHandle(touch.clientX - rect.left, touch.clientY - rect.top);
        if (handle) {
          const el = elements.find(e => e.id === selectedId)!;
          setIsResizing(true); setResizeHandle(handle);
          setResizeOrigin({ x: el.x, y: el.y, w: el.width, h: el.height, ex: touch.clientX, ey: touch.clientY });
          return;
        }
      }
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      const clickedEl = findElementAt(x, y);
      if (clickedEl) { setSelectedId(clickedEl.id); setIsDragging(true); setDragStart({ x: x - clickedEl.x, y: y - clickedEl.y }); }
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (isResizing && selectedId && resizeHandle) {
      const dx = (touch.clientX - resizeOrigin.ex) / zoom;
      const dy = (touch.clientY - resizeOrigin.ey) / zoom;
      let newX = resizeOrigin.x, newY = resizeOrigin.y, newW = resizeOrigin.w, newH = resizeOrigin.h;
      if (resizeHandle.includes("e")) newW = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.w + dx);
      if (resizeHandle.includes("w")) { newX = resizeOrigin.x + dx; newW = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.w - dx); }
      if (resizeHandle.includes("s")) newH = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.h + dy);
      if (resizeHandle.includes("n")) { newY = resizeOrigin.y + dy; newH = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.h - dy); }
      setElements(elements.map(el => el.id === selectedId ? { ...el, x: snapToGrid(newX), y: snapToGrid(newY), width: snapToGrid(newW), height: snapToGrid(newH) } : el));
      return;
    }
    if (activeTool === "move") { setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y }); return; }
    if (selectedId) {
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      setElements(elements.map(el => el.id === selectedId ? { ...el, x: snapToGrid(x - dragStart.x), y: snapToGrid(y - dragStart.y) } : el));
    }
  };
  const handleTouchEnd = () => { setIsDragging(false); setIsResizing(false); setResizeHandle(null); };

  const deleteSelected = () => { if (selectedId) { setElements(elements.filter(el => el.id !== selectedId)); setSelectedId(null); } };
  const duplicateSelected = () => {
    if (selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el) { const n = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 }; setElements([...elements, n]); setSelectedId(n.id); }
    }
  };
  const updateSelectedLabel = (label: string) => { if (selectedId) setElements(elements.map(el => el.id === selectedId ? { ...el, label } : el)); };
  const updateSelectedSize = (field: "width" | "height", meters: string) => {
    if (!selectedId) return;
    const val = parseFloat(meters);
    if (isNaN(val) || val <= 0) return;
    setElements(elements.map(el => el.id === selectedId ? { ...el, [field]: Math.round(val * ppm) } : el));
  };
  const rotateSelected = () => { if (selectedId) setElements(elements.map(el => el.id === selectedId ? { ...el, rotation: (el.rotation + 90) % 360 } : el)); };

  const handleSave = async () => {
    if (elements.length === 0) return;
    setIsSaving(true);
    try {
      const padding = 60;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elements.forEach(el => { minX = Math.min(minX, el.x); minY = Math.min(minY, el.y); maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height); });
      minX -= padding; minY -= padding; maxX += padding; maxY += padding;
      const exportW = Math.max(800, maxX - minX);
      const exportH = Math.max(600, maxY - minY);
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;
      const ctx = exportCanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportW, exportH);

      // Grid on export
      const gridPx = ppm;
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 0.5;
      for (let gx = (-minX) % gridPx; gx < exportW; gx += gridPx) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, exportH); ctx.stroke(); }
      for (let gy = (-minY) % gridPx; gy < exportH; gy += gridPx) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(exportW, gy); ctx.stroke(); }

      const offsetX = -minX;
      const offsetY = -minY;

      elements.forEach((el) => {
        const x = el.x + offsetX;
        const y = el.y + offsetY;
        const w = el.width;
        const h = el.height;
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-(x + w / 2), -(y + h / 2));
        drawElement(ctx, el, x, y, w, h, 1);
        ctx.restore();

        if (showDimensions && ["wall", "matsone", "oppvasksone", "kjoeleskap", "fryser", "torrvarelager"].includes(el.type)) {
          const wM = pxToMeters(el.width, ppm);
          const hM = pxToMeters(el.height, ppm);
          ctx.save();
          ctx.fillStyle = "#1d4ed8"; ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          ctx.fillText(`${wM}m`, x + w / 2, y - 4);
          ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + w, y - 3); ctx.stroke();
          ctx.save(); ctx.translate(x + w + 12, y + h / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "bottom"; ctx.fillText(`${hM}m`, 0, 0); ctx.restore();
          ctx.beginPath(); ctx.moveTo(x + w + 4, y); ctx.lineTo(x + w + 4, y + h); ctx.stroke();
          ctx.restore();
        }
      });

      // Title
      ctx.fillStyle = "#6b7280"; ctx.font = "14px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("Kjøkkenplanløsning – Ren/uren sone", 24, 24);

      // Legend
      const legendY = exportH - 40;
      ctx.fillStyle = "#f9fafb"; ctx.fillRect(10, legendY - 5, exportW - 20, 35);
      ctx.font = "11px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      let lx = 20;
      [
        { label: "Ren sone", color: "#fef3c7" },
        { label: "Uren sone", color: "#e0e7ff" },
        { label: "Kjøl/Frys", color: "#bae6fd" },
        { label: "Vask", color: "#a5f3fc" },
      ].forEach(({ label, color }) => {
        ctx.fillStyle = color; ctx.fillRect(lx, legendY + 2, 16, 16);
        ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 0.5; ctx.strokeRect(lx, legendY + 2, 16, 16);
        ctx.fillStyle = "#374151"; ctx.fillText(label, lx + 20, legendY + 10);
        lx += ctx.measureText(label).width + 40;
      });

      const imageDataUrl = exportCanvas.toDataURL("image/png");
      const elementsJson = JSON.stringify({ elements, version: 1 });
      await onSave(imageDataUrl, elementsJson);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  // Group presets for sidebar
  const zonePresets: KitchenElementType[] = ["matsone", "oppvasksone", "torrvarelager"];
  const equipmentPresets: KitchenElementType[] = ["kjoeleskap", "fryser", "komfyr", "oppvaskmaskin", "haandvask", "matkum"];
  const otherPresets: KitchenElementType[] = ["hylle_rent", "hylle_urent", "wall", "door", "text"];

  const renderPresetButton = (type: KitchenElementType) => {
    const preset = KITCHEN_PRESETS[type];
    return (
      <Tooltip key={type}>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === type ? "default" : "outline"}
            size="sm"
            className="h-9 justify-start gap-2 text-xs"
            onClick={() => setActiveTool(type)}
          >
            <span>{preset.emoji}</span>
            <span className="truncate">{preset.label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{preset.label}</TooltipContent>
      </Tooltip>
    );
  };

  const renderDesktopSidebar = () => (
    <div className="w-60 border-r bg-muted/30 p-3 flex flex-col gap-3 overflow-y-auto">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Verktøy</Label>
        <div className="grid grid-cols-2 gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={activeTool === "select" ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => setActiveTool("select")}>
                  <MousePointer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Velg</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={activeTool === "move" ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => setActiveTool("move")}>
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Flytt visning</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Soner</Label>
        <div className="grid grid-cols-1 gap-1">
          <TooltipProvider>{zonePresets.map(renderPresetButton)}</TooltipProvider>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Utstyr</Label>
        <div className="grid grid-cols-2 gap-1">
          <TooltipProvider>{equipmentPresets.map(renderPresetButton)}</TooltipProvider>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Annet</Label>
        <div className="grid grid-cols-2 gap-1">
          <TooltipProvider>{otherPresets.map(renderPresetButton)}</TooltipProvider>
        </div>
      </div>

      {activeTool === "text" && (
        <div className="space-y-2">
          <Label className="text-xs">Tekst</Label>
          <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Skriv inn tekst..." className="h-8 text-sm" />
        </div>
      )}

      <Separator />

      {selectedElement && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Etikett</Label>
            <Input value={selectedElement.label || ""} onChange={(e) => updateSelectedLabel(e.target.value)} placeholder="Navn..." className="h-8 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" />Mål (meter)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Bredde</Label>
                <Input type="number" step="0.1" min="0.1" value={pxToMeters(selectedElement.width, ppm)} onChange={(e) => updateSelectedSize("width", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Høyde</Label>
                <Input type="number" step="0.1" min="0.1" value={pxToMeters(selectedElement.height, ppm)} onChange={(e) => updateSelectedSize("height", e.target.value)} className="h-7 text-xs" />
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Vis mål</Label>
          <Button variant={showDimensions ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowDimensions(!showDimensions)}>
            {showDimensions ? "På" : "Av"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</Label>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}><ZoomOut className="h-3 w-3" /></Button>
          <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} min={0.25} max={2} step={0.25} className="flex-1" />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(2, zoom + 0.25))}><ZoomIn className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );

  const renderMobileToolbar = () => (
    <div className="border-t bg-background">
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        <Button variant={activeTool === "select" ? "default" : "outline"} size="icon" className="h-10 w-10 shrink-0" onClick={() => setActiveTool("select")}>
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button variant={activeTool === "move" ? "default" : "outline"} size="icon" className="h-10 w-10 shrink-0" onClick={() => setActiveTool("move")}>
          <Move className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-8 mx-1" />
        {selectedId && (
          <>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={deleteSelected}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={duplicateSelected}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={rotateSelected}><RotateCcw className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-8 mx-1" />
          </>
        )}
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
        <span className="text-xs text-muted-foreground shrink-0 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setZoom(Math.min(2, zoom + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => setMobileToolbarOpen(!mobileToolbarOpen)}>
          {mobileToolbarOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <span className="text-xs">Elementer</span>
        </Button>
      </div>
      {mobileToolbarOpen && (
        <div className="border-t p-3 max-h-[40vh] overflow-y-auto">
          <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
            {(Object.entries(KITCHEN_PRESETS) as [KitchenElementType, typeof KITCHEN_PRESETS[KitchenElementType]][]).map(([type, preset]) => (
              <Button
                key={type}
                variant={activeTool === type ? "default" : "outline"}
                size="sm"
                className="h-14 flex-col gap-1 text-xs p-1"
                onClick={() => setActiveTool(type)}
              >
                <span>{preset.emoji}</span>
                <span className="truncate w-full text-center text-[10px]">{preset.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={
        isMobile
          ? "max-w-[100vw] w-full h-[100dvh] max-h-[100dvh] p-0 overflow-hidden rounded-none flex flex-col"
          : "max-w-[95vw] w-[1200px] max-h-[95vh] p-0 overflow-hidden flex flex-col"
      }>
        <DialogHeader className={isMobile ? "px-4 pt-4 pb-2 shrink-0" : "px-6 pt-6 pb-2 shrink-0"}>
          <DialogTitle className={isMobile ? "text-base" : ""}>
            Kjøkkenplanløsning – Ren/uren sone
          </DialogTitle>
          <DialogDescription className={isMobile ? "text-xs" : ""}>
            Tegn opp kjøkkenet med soner for matlaging, oppvask, lagring og utstyr. Skille mellom rene og urene soner.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {!isMobile && renderDesktopSidebar()}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {!isMobile && (
              <div className="flex items-center gap-2 p-2 border-b bg-muted/20 shrink-0 flex-wrap">
                <Button variant="ghost" size="sm" onClick={deleteSelected} disabled={!selectedId}><Trash2 className="h-4 w-4 mr-1" />Slett</Button>
                <Button variant="ghost" size="sm" onClick={duplicateSelected} disabled={!selectedId}><Copy className="h-4 w-4 mr-1" />Dupliser</Button>
                <Button variant="ghost" size="sm" onClick={rotateSelected} disabled={!selectedId}><RotateCcw className="h-4 w-4 mr-1" />Roter</Button>
                <Separator orientation="vertical" className="h-6" />
                {selectedElement && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Etikett:</Label>
                    <Input value={selectedElement.label || ""} onChange={(e) => updateSelectedLabel(e.target.value)} placeholder="Navn..." className="h-7 w-32 text-xs" />
                    <Separator orientation="vertical" className="h-6" />
                    <span className="text-xs text-muted-foreground">{pxToMeters(selectedElement.width, ppm)}m × {pxToMeters(selectedElement.height, ppm)}m</span>
                  </div>
                )}
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}>Tilbakestill visning</Button>
              </div>
            )}
            <div
              ref={containerRef}
              className="flex-1 overflow-hidden bg-muted/50 min-h-0"
              style={{ cursor: activeTool === "move" ? "grab" : activeTool === "select" ? "default" : "crosshair", touchAction: "none" }}
            >
              <canvas
                ref={canvasRef}
                width={isMobile ? 400 : 1000}
                height={isMobile ? 400 : 600}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="bg-white w-full h-full"
              />
            </div>
            {isMobile && renderMobileToolbar()}
          </div>
        </div>

        <DialogFooter className={isMobile ? "px-4 py-3 border-t shrink-0 flex-row gap-2" : "px-6 py-4 border-t shrink-0"}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? "flex-1" : ""}>Avbryt</Button>
          <Button onClick={handleSave} disabled={isSaving || elements.length === 0} className={isMobile ? "flex-1 gap-2" : "gap-2"}>
            <Download className="h-4 w-4" />
            {isSaving ? "Lagrer..." : "Lagre tegning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
