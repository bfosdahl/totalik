export interface RiggSymbolDef {
  type: string;
  label: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
  icon: string; // lucide icon name (rendered via dynamic import in UI)
}

export const RIGG_SYMBOLS: RiggSymbolDef[] = [
  { type: "brakkerigg", label: "Brakkerigg", color: "#BFDBFE", defaultWidth: 140, defaultHeight: 90, icon: "Home" },
  { type: "materiallager", label: "Materiallager", color: "#FEF3C7", defaultWidth: 140, defaultHeight: 90, icon: "Package" },
  { type: "avfall", label: "Avfall", color: "#FECACA", defaultWidth: 110, defaultHeight: 80, icon: "Trash2" },
  { type: "parkering", label: "Parkering", color: "#D1FAE5", defaultWidth: 140, defaultHeight: 90, icon: "Car" },
  { type: "tarnkran", label: "Tårnkran", color: "#9CA3AF", defaultWidth: 60, defaultHeight: 180, icon: "Construction" },
  { type: "adkomstvei", label: "Adkomstvei", color: "#D1D5DB", defaultWidth: 70, defaultHeight: 240, icon: "MoveRight" },
  { type: "romningsvei", label: "Rømningsvei", color: "#FCA5A5", defaultWidth: 60, defaultHeight: 60, icon: "ArrowUp" },
  { type: "gjerde", label: "Gjerde/Sikring", color: "#FBBF24", defaultWidth: 200, defaultHeight: 20, icon: "Minus" },
  { type: "strom", label: "Strøm", color: "#FDE68A", defaultWidth: 50, defaultHeight: 50, icon: "Zap" },
  { type: "vann", label: "Vann", color: "#BAE6FD", defaultWidth: 50, defaultHeight: 50, icon: "Droplet" },
  { type: "kontor", label: "Kontor/Møterom", color: "#E9D5FF", defaultWidth: 130, defaultHeight: 90, icon: "Building" },
  { type: "forstehjelp", label: "Førstehjelp", color: "#FECDD3", defaultWidth: 60, defaultHeight: 60, icon: "Heart" },
];

export function getSymbol(type: string): RiggSymbolDef | undefined {
  return RIGG_SYMBOLS.find((s) => s.type === type);
}
