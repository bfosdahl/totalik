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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Square,
  Circle,
  ArrowRight,
  DoorOpen,
  Trash2,
  Download,
  RotateCcw,
  MousePointer,
  Type,
  Minus,
  Move,
  ZoomIn,
  ZoomOut,
  Copy,
  Layers,
  ChevronUp,
  ChevronDown,
  Settings2,
  Ruler,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Floor plan element types
type ElementType = 
  | "wall" 
  | "room" 
  | "door" 
  | "emergency_exit" 
  | "toilet" 
  | "office" 
  | "stairs" 
  | "elevator" 
  | "fire_extinguisher"
  | "fire_alarm"
  | "first_aid"
  | "text";

interface FloorPlanElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
  color?: string;
}

interface FdvFloorPlanEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingName: string;
  initialData?: string;
  onSave: (imageDataUrl: string, elementsJson: string) => Promise<void>;
}

// Scale: pixels per meter (configurable)
const DEFAULT_PIXELS_PER_METER = 50;
const MIN_ELEMENT_SIZE = 10; // minimum px
const GRID_SNAP = 10; // snap to 10px grid (0.2m at default scale)

const ELEMENT_PRESETS: Record<ElementType, { label: string; icon: React.ReactNode; defaultWidth: number; defaultHeight: number; color: string }> = {
  wall: { label: "Vegg", icon: <Minus className="h-4 w-4" />, defaultWidth: 200, defaultHeight: 10, color: "#1f2937" },
  room: { label: "Rom", icon: <Square className="h-4 w-4" />, defaultWidth: 200, defaultHeight: 150, color: "#e5e7eb" },
  door: { label: "Dør", icon: <DoorOpen className="h-4 w-4" />, defaultWidth: 50, defaultHeight: 10, color: "#3b82f6" },
  emergency_exit: { label: "Nødutgang", icon: <ArrowRight className="h-4 w-4" />, defaultWidth: 50, defaultHeight: 30, color: "#22c55e" },
  toilet: { label: "Toalett", icon: <span className="text-xs font-bold">WC</span>, defaultWidth: 100, defaultHeight: 100, color: "#60a5fa" },
  office: { label: "Kontor", icon: <Square className="h-4 w-4" />, defaultWidth: 150, defaultHeight: 120, color: "#fef3c7" },
  stairs: { label: "Trapp", icon: <Layers className="h-4 w-4" />, defaultWidth: 75, defaultHeight: 100, color: "#d1d5db" },
  elevator: { label: "Heis", icon: <Square className="h-4 w-4" />, defaultWidth: 75, defaultHeight: 75, color: "#c4b5fd" },
  fire_extinguisher: { label: "Brannslukker", icon: <Circle className="h-4 w-4" />, defaultWidth: 24, defaultHeight: 24, color: "#ef4444" },
  fire_alarm: { label: "Brannalarm", icon: <Circle className="h-4 w-4" />, defaultWidth: 20, defaultHeight: 20, color: "#f97316" },
  first_aid: { label: "Førstehjelp", icon: <span className="text-xs font-bold">+</span>, defaultWidth: 30, defaultHeight: 30, color: "#22c55e" },
  text: { label: "Tekst", icon: <Type className="h-4 w-4" />, defaultWidth: 80, defaultHeight: 24, color: "#1f2937" },
};

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const snapToGrid = (val: number) => Math.round(val / GRID_SNAP) * GRID_SNAP;
const pxToMeters = (px: number, ppm: number) => (px / ppm).toFixed(1);

export function FdvFloorPlanEditor({ open, onOpenChange, buildingName, initialData, onSave }: FdvFloorPlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const [elements, setElements] = useState<FloorPlanElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ElementType | "select" | "move">("select");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeOrigin, setResizeOrigin] = useState({ x: 0, y: 0, w: 0, h: 0, ex: 0, ey: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [floorName, setFloorName] = useState("1. etasje");
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"elements" | "settings">("elements");
  const [pixelsPerMeter, setPixelsPerMeter] = useState(DEFAULT_PIXELS_PER_METER);
  const [showDimensions, setShowDimensions] = useState(true);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        setElements(parsed.elements || []);
        setFloorName(parsed.floorName || "1. etasje");
        if (parsed.pixelsPerMeter) setPixelsPerMeter(parsed.pixelsPerMeter);
      } catch {
        setElements([]);
      }
    }
  }, [initialData]);

  // Resize canvas to fit container
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

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid with meter markings
    const gridSizePx = pixelsPerMeter * zoom; // 1 meter grid
    const subGridSize = gridSizePx / 5; // 0.2m sub-grid

    // Sub-grid
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 0.5;
    for (let x = pan.x % subGridSize; x < canvas.width; x += subGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = pan.y % subGridSize; y < canvas.height; y += subGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Main meter grid
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    for (let x = pan.x % gridSizePx; x < canvas.width; x += gridSizePx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = pan.y % gridSizePx; y < canvas.height; y += gridSizePx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw meter ruler along top and left
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let x = pan.x % gridSizePx; x < canvas.width; x += gridSizePx) {
      const meterVal = Math.round((x - pan.x) / gridSizePx);
      if (x > 20) {
        ctx.fillText(`${meterVal}m`, x, 4);
        // tick
        ctx.beginPath();
        ctx.moveTo(x, 16);
        ctx.lineTo(x, 20);
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = pan.y % gridSizePx; y < canvas.height; y += gridSizePx) {
      const meterVal = Math.round((y - pan.y) / gridSizePx);
      if (y > 20) {
        ctx.fillText(`${meterVal}`, 16, y);
      }
    }

    // Draw elements
    elements.forEach((el) => {
      const x = (el.x * zoom) + pan.x;
      const y = (el.y * zoom) + pan.y;
      const w = el.width * zoom;
      const h = el.height * zoom;

      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-(x + w/2), -(y + h/2));

      switch (el.type) {
        case "room":
        case "office":
        case "toilet":
          ctx.fillStyle = el.color || ELEMENT_PRESETS[el.type].color;
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#374151";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          break;
        case "wall":
          ctx.fillStyle = el.color || "#1f2937";
          ctx.fillRect(x, y, w, h);
          break;
        case "door":
          ctx.fillStyle = el.color || "#3b82f6";
          ctx.fillRect(x, y, w, h);
          ctx.beginPath();
          ctx.arc(x, y + h/2, w * 0.8, -Math.PI/2, 0);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case "emergency_exit":
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "#ffffff";
          ctx.font = `${12 * zoom}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("EXIT", x + w/2, y + h/2);
          break;
        case "stairs":
          ctx.fillStyle = "#d1d5db";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#6b7280";
          ctx.lineWidth = 1;
          const stepCount = 6;
          for (let i = 1; i < stepCount; i++) {
            const stepY = y + (h / stepCount) * i;
            ctx.beginPath();
            ctx.moveTo(x, stepY);
            ctx.lineTo(x + w, stepY);
            ctx.stroke();
          }
          break;
        case "elevator":
          ctx.fillStyle = "#c4b5fd";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = "#7c3aed";
          ctx.font = `${10 * zoom}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("HEIS", x + w/2, y + h/2);
          break;
        case "fire_extinguisher":
          ctx.beginPath();
          ctx.arc(x + w/2, y + h/2, w/2, 0, Math.PI * 2);
          ctx.fillStyle = "#ef4444";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${10 * zoom}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🧯", x + w/2, y + h/2);
          break;
        case "fire_alarm":
          ctx.beginPath();
          ctx.arc(x + w/2, y + h/2, w/2, 0, Math.PI * 2);
          ctx.fillStyle = "#f97316";
          ctx.fill();
          break;
        case "first_aid":
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${16 * zoom}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("+", x + w/2, y + h/2);
          break;
        case "text":
          ctx.fillStyle = el.color || "#1f2937";
          ctx.font = `${14 * zoom}px sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(el.label || "Tekst", x, y);
          break;
      }

      // Label inside element
      if (el.label && el.type !== "text") {
        ctx.fillStyle = "#374151";
        ctx.font = `${11 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label, x + w/2, y + h/2);
      }

      ctx.restore();

      // Dimension labels (meter measurements) for sizable elements
      if (showDimensions && ["wall", "room", "office", "toilet", "stairs", "elevator"].includes(el.type)) {
        const wMeters = pxToMeters(el.width, pixelsPerMeter);
        const hMeters = pxToMeters(el.height, pixelsPerMeter);
        
        ctx.save();
        ctx.fillStyle = "#1d4ed8";
        ctx.font = `bold ${Math.max(9, 11 * zoom)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        // Width dimension (top)
        const dimY = y - 4;
        ctx.fillText(`${wMeters}m`, x + w / 2, dimY);

        // Draw dimension line on top
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, dimY + 1);
        ctx.lineTo(x + w, dimY + 1);
        ctx.stroke();
        // end caps
        ctx.beginPath();
        ctx.moveTo(x, dimY - 2);
        ctx.lineTo(x, dimY + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w, dimY - 2);
        ctx.lineTo(x + w, dimY + 4);
        ctx.stroke();

        // Height dimension (right side)
        ctx.save();
        ctx.translate(x + w + 12, y + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = "bottom";
        ctx.fillText(`${hMeters}m`, 0, 0);
        ctx.restore();

        // Height dimension line on right
        ctx.beginPath();
        ctx.moveTo(x + w + 4, y);
        ctx.lineTo(x + w + 4, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w + 2, y);
        ctx.lineTo(x + w + 6, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w + 2, y + h);
        ctx.lineTo(x + w + 6, y + h);
        ctx.stroke();

        ctx.restore();
      }

      // Selection + resize handles
      if (el.id === selectedId) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
        ctx.setLineDash([]);

        const hs = 8; // handle size
        ctx.fillStyle = "#3b82f6";
        // Corner handles
        const handles: [number, number][] = [
          [x - hs/2, y - hs/2],           // nw
          [x + w - hs/2, y - hs/2],       // ne
          [x - hs/2, y + h - hs/2],       // sw
          [x + w - hs/2, y + h - hs/2],   // se
        ];
        handles.forEach(([hx, hy]) => {
          ctx.fillRect(hx, hy, hs, hs);
        });
        // Edge midpoint handles
        const edgeHandles: [number, number][] = [
          [x + w/2 - hs/2, y - hs/2],         // n
          [x + w/2 - hs/2, y + h - hs/2],     // s
          [x - hs/2, y + h/2 - hs/2],         // w
          [x + w - hs/2, y + h/2 - hs/2],     // e
        ];
        ctx.fillStyle = "#60a5fa";
        edgeHandles.forEach(([hx, hy]) => {
          ctx.fillRect(hx, hy, hs, hs);
        });
      }
    });

    // Floor name
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(floorName, 24, 24);

  }, [elements, selectedId, zoom, pan, floorName, pixelsPerMeter, showDimensions]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Coordinate helpers
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const getScreenCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 0, sy: 0 };
    const rect = canvas.getBoundingClientRect();
    return { sx: clientX - rect.left, sy: clientY - rect.top };
  };

  // Check if a point hits a resize handle, returns handle name or null
  const hitTestHandle = (sx: number, sy: number): ResizeHandle | null => {
    if (!selectedId) return null;
    const el = elements.find(e => e.id === selectedId);
    if (!el) return null;

    const x = (el.x * zoom) + pan.x;
    const y = (el.y * zoom) + pan.y;
    const w = el.width * zoom;
    const h = el.height * zoom;
    const hs = 10; // hit area slightly larger than visual

    const handlePositions: { handle: ResizeHandle; hx: number; hy: number }[] = [
      { handle: "nw", hx: x, hy: y },
      { handle: "ne", hx: x + w, hy: y },
      { handle: "sw", hx: x, hy: y + h },
      { handle: "se", hx: x + w, hy: y + h },
      { handle: "n", hx: x + w/2, hy: y },
      { handle: "s", hx: x + w/2, hy: y + h },
      { handle: "w", hx: x, hy: y + h/2 },
      { handle: "e", hx: x + w, hy: y + h/2 },
    ];

    for (const { handle, hx, hy } of handlePositions) {
      if (Math.abs(sx - hx) < hs && Math.abs(sy - hy) < hs) {
        return handle;
      }
    }
    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isResizing) return; // don't place elements after resize

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === "select" || activeTool === "move") {
      const clicked = [...elements].reverse().find(el => 
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
      );
      setSelectedId(clicked?.id || null);
    } else {
      const preset = ELEMENT_PRESETS[activeTool];
      const snappedX = snapToGrid(x - preset.defaultWidth / 2);
      const snappedY = snapToGrid(y - preset.defaultHeight / 2);
      const newElement: FloorPlanElement = {
        id: crypto.randomUUID(),
        type: activeTool,
        x: snappedX,
        y: snappedY,
        width: preset.defaultWidth,
        height: preset.defaultHeight,
        rotation: 0,
        color: preset.color,
        label: activeTool === "text" ? textInput || "Tekst" : undefined,
      };
      setElements([...elements, newElement]);
      setSelectedId(newElement.id);
      if (isMobile) setMobileToolbarOpen(false);
      setActiveTool("select");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "move") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Check resize handles first
    if (selectedId && activeTool === "select") {
      const { sx, sy } = getScreenCoords(e.clientX, e.clientY);
      const handle = hitTestHandle(sx, sy);
      if (handle) {
        const el = elements.find(e => e.id === selectedId)!;
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeOrigin({ x: el.x, y: el.y, w: el.width, h: el.height, ex: e.clientX, ey: e.clientY });
        return;
      }

      // Otherwise drag the element
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const el = elements.find(e => e.id === selectedId);
      if (el && x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        setIsDragging(true);
        setDragStart({ x: x - el.x, y: y - el.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Update cursor based on handle hover
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
      
      let newX = resizeOrigin.x;
      let newY = resizeOrigin.y;
      let newW = resizeOrigin.w;
      let newH = resizeOrigin.h;

      if (resizeHandle.includes("e")) newW = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.w + dx);
      if (resizeHandle.includes("w")) { newX = resizeOrigin.x + dx; newW = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.w - dx); }
      if (resizeHandle.includes("s")) newH = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.h + dy);
      if (resizeHandle.includes("n")) { newY = resizeOrigin.y + dy; newH = Math.max(MIN_ELEMENT_SIZE, resizeOrigin.h - dy); }

      // Snap to grid
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
      newW = snapToGrid(newW);
      newH = snapToGrid(newH);

      setElements(elements.map(el => 
        el.id === selectedId ? { ...el, x: newX, y: newY, width: newW, height: newH } : el
      ));
      return;
    }

    if (!isDragging) return;

    if (activeTool === "move") {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    if (selectedId) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const snappedX = snapToGrid(x - dragStart.x);
      const snappedY = snapToGrid(y - dragStart.y);
      setElements(elements.map(el => 
        el.id === selectedId 
          ? { ...el, x: snappedX, y: snappedY }
          : el
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (activeTool === "move") {
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      return;
    }
    if (selectedId && activeTool === "select") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = touch.clientX - rect.left;
      const sy = touch.clientY - rect.top;
      const handle = hitTestHandle(sx, sy);
      if (handle) {
        const el = elements.find(e => e.id === selectedId)!;
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeOrigin({ x: el.x, y: el.y, w: el.width, h: el.height, ex: touch.clientX, ey: touch.clientY });
        return;
      }

      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      const el = elements.find(e => e.id === selectedId);
      if (el && x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        setIsDragging(true);
        setDragStart({ x: x - el.x, y: y - el.y });
      }
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
      newX = snapToGrid(newX); newY = snapToGrid(newY); newW = snapToGrid(newW); newH = snapToGrid(newH);
      setElements(elements.map(el => el.id === selectedId ? { ...el, x: newX, y: newY, width: newW, height: newH } : el));
      return;
    }

    if (activeTool === "move") {
      setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
      return;
    }
    if (selectedId) {
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      setElements(elements.map(el => 
        el.id === selectedId 
          ? { ...el, x: snapToGrid(x - dragStart.x), y: snapToGrid(y - dragStart.y) }
          : el
      ));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const duplicateSelected = () => {
    if (selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el) {
        const newEl = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      }
    }
  };

  const updateSelectedLabel = (label: string) => {
    if (selectedId) {
      setElements(elements.map(el => 
        el.id === selectedId ? { ...el, label } : el
      ));
    }
  };

  const updateSelectedSize = (field: "width" | "height", meters: string) => {
    if (!selectedId) return;
    const val = parseFloat(meters);
    if (isNaN(val) || val <= 0) return;
    const px = Math.round(val * pixelsPerMeter);
    setElements(elements.map(el => 
      el.id === selectedId ? { ...el, [field]: px } : el
    ));
  };

  const rotateSelected = () => {
    if (selectedId) {
      setElements(elements.map(el => 
        el.id === selectedId ? { ...el, rotation: (el.rotation + 90) % 360 } : el
      ));
    }
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const tempZoom = zoom;
      const tempPan = pan;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      
      await new Promise(r => setTimeout(r, 100));
      
      const imageDataUrl = canvas.toDataURL("image/png");
      const elementsJson = JSON.stringify({ elements, floorName, pixelsPerMeter });
      
      await onSave(imageDataUrl, elementsJson);
      
      setZoom(tempZoom);
      setPan(tempPan);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  // Mobile bottom toolbar content
  const renderMobileToolbar = () => (
    <div className="border-t bg-background">
      {/* Quick action bar - always visible */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        <Button 
          variant={activeTool === "select" ? "default" : "outline"} 
          size="icon" 
          className="h-10 w-10 shrink-0"
          onClick={() => setActiveTool("select")}
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button 
          variant={activeTool === "move" ? "default" : "outline"} 
          size="icon" 
          className="h-10 w-10 shrink-0"
          onClick={() => setActiveTool("move")}
        >
          <Move className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-8 mx-1" />
        
        {selectedId && (
          <>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={duplicateSelected}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={rotateSelected}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-8 mx-1" />
          </>
        )}
        
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground shrink-0 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => setMobileToolbarOpen(!mobileToolbarOpen)}
        >
          {mobileToolbarOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <span className="text-xs">Elementer</span>
        </Button>
      </div>

      {/* Expandable panel */}
      {mobileToolbarOpen && (
        <div className="border-t p-3 max-h-[40vh] overflow-y-auto">
          {/* Section tabs */}
          <div className="flex gap-2 mb-3">
            <Button
              variant={mobileSection === "elements" ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setMobileSection("elements")}
            >
              Elementer
            </Button>
            <Button
              variant={mobileSection === "settings" ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs gap-1"
              onClick={() => setMobileSection("settings")}
            >
              <Settings2 className="h-3 w-3" />
              Innstillinger
            </Button>
          </div>

          {mobileSection === "elements" && (
            <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
              {(Object.entries(ELEMENT_PRESETS) as [ElementType, typeof ELEMENT_PRESETS[ElementType]][]).map(([type, preset]) => (
                <Button 
                  key={type}
                  variant={activeTool === type ? "default" : "outline"} 
                  size="sm" 
                  className="h-14 flex-col gap-1 text-xs p-1"
                  onClick={() => { setActiveTool(type); }}
                >
                  {preset.icon}
                  <span className="truncate w-full text-center text-[10px]">{preset.label}</span>
                </Button>
              ))}
            </div>
          )}

          {mobileSection === "settings" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Etasjenavn</Label>
                <Input 
                  value={floorName} 
                  onChange={(e) => setFloorName(e.target.value)}
                  placeholder="1. etasje"
                  className="h-10 text-sm"
                />
              </div>
              {selectedElement && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Etikett</Label>
                    <Input 
                      value={selectedElement.label || ""} 
                      onChange={(e) => updateSelectedLabel(e.target.value)}
                      placeholder="Romnavn..."
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bredde (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={pxToMeters(selectedElement.width, pixelsPerMeter)}
                        onChange={(e) => updateSelectedSize("width", e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Høyde (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={pxToMeters(selectedElement.height, pixelsPerMeter)}
                        onChange={(e) => updateSelectedSize("height", e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeTool === "text" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tekst</Label>
                  <Input 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Skriv inn tekst..."
                    className="h-10 text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Desktop sidebar
  const renderDesktopSidebar = () => (
    <div className="w-60 border-r bg-muted/30 p-3 flex flex-col gap-4 overflow-y-auto">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Etasjenavn</Label>
        <Input 
          value={floorName} 
          onChange={(e) => setFloorName(e.target.value)}
          placeholder="1. etasje"
          className="h-8 text-sm"
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Verktøy</Label>
        <div className="grid grid-cols-3 gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activeTool === "select" ? "default" : "outline"} 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setActiveTool("select")}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Velg</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activeTool === "move" ? "default" : "outline"} 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setActiveTool("move")}
                >
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
        <Label className="text-xs text-muted-foreground">Elementer</Label>
        <div className="grid grid-cols-2 gap-1">
          <TooltipProvider>
            {(Object.entries(ELEMENT_PRESETS) as [ElementType, typeof ELEMENT_PRESETS[ElementType]][]).map(([type, preset]) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeTool === type ? "default" : "outline"} 
                    size="sm" 
                    className="h-9 justify-start gap-2 text-xs"
                    onClick={() => setActiveTool(type)}
                  >
                    {preset.icon}
                    <span className="truncate">{preset.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{preset.label}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {activeTool === "text" && (
        <div className="space-y-2">
          <Label className="text-xs">Tekst</Label>
          <Input 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Skriv inn tekst..."
            className="h-8 text-sm"
          />
        </div>
      )}

      <Separator />

      {/* Selected element dimensions */}
      {selectedElement && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              Mål (meter)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Bredde</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pxToMeters(selectedElement.width, pixelsPerMeter)}
                  onChange={(e) => updateSelectedSize("width", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Høyde</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pxToMeters(selectedElement.height, pixelsPerMeter)}
                  onChange={(e) => updateSelectedSize("height", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Vis mål</Label>
          <Button
            variant={showDimensions ? "default" : "outline"}
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => setShowDimensions(!showDimensions)}
          >
            {showDimensions ? "På" : "Av"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</Label>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Slider 
            value={[zoom]} 
            onValueChange={([v]) => setZoom(v)} 
            min={0.25} 
            max={2} 
            step={0.25}
            className="flex-1"
          />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>
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
            {isMobile ? `Etasjeplan – ${buildingName}` : `Tegn etasjeplan – ${buildingName}`}
          </DialogTitle>
          <DialogDescription className={isMobile ? "text-xs" : ""}>
            Lag en enkel skisse av bygget med rom, dører, nødutganger og utstyr. Dra i hjørnene for å endre størrelse.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Desktop sidebar */}
          {!isMobile && renderDesktopSidebar()}

          {/* Canvas area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Desktop canvas toolbar */}
            {!isMobile && (
              <div className="flex items-center gap-2 p-2 border-b bg-muted/20 shrink-0 flex-wrap">
                <Button variant="ghost" size="sm" onClick={deleteSelected} disabled={!selectedId}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Slett
                </Button>
                <Button variant="ghost" size="sm" onClick={duplicateSelected} disabled={!selectedId}>
                  <Copy className="h-4 w-4 mr-1" />
                  Dupliser
                </Button>
                <Button variant="ghost" size="sm" onClick={rotateSelected} disabled={!selectedId}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Roter
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                {selectedElement && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Etikett:</Label>
                    <Input 
                      value={selectedElement.label || ""} 
                      onChange={(e) => updateSelectedLabel(e.target.value)}
                      placeholder="Romnavn..."
                      className="h-7 w-32 text-xs"
                    />
                    <Separator orientation="vertical" className="h-6" />
                    <span className="text-xs text-muted-foreground">
                      {pxToMeters(selectedElement.width, pixelsPerMeter)}m × {pxToMeters(selectedElement.height, pixelsPerMeter)}m
                    </span>
                  </div>
                )}

                <div className="flex-1" />
                
                <Button variant="ghost" size="sm" onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}>
                  Tilbakestill visning
                </Button>
              </div>
            )}

            {/* Canvas */}
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

            {/* Mobile bottom toolbar */}
            {isMobile && renderMobileToolbar()}
          </div>
        </div>

        <DialogFooter className={isMobile ? "px-4 py-3 border-t shrink-0 flex-row gap-2" : "px-6 py-4 border-t shrink-0"}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? "flex-1" : ""}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className={isMobile ? "flex-1 gap-2" : "gap-2"}>
            <Download className="h-4 w-4" />
            {isSaving ? "Lagrer..." : "Lagre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
