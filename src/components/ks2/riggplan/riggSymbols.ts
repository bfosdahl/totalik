export interface RiggSymbolDef {
  type: string;
  label: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
  icon: string; // lucide icon name (rendered via dynamic import in UI)
  /** Foreslåtte §8-bokstaver i Byggherreforskriften som dette symbolet typisk berører */
  suggestedRiskParagraphs: string[];
}

export const RIGG_SYMBOLS: RiggSymbolDef[] = [
  { type: "brakkerigg",   label: "Brakkerigg",     color: "#BFDBFE", defaultWidth: 140, defaultHeight: 90,  icon: "Home",         suggestedRiskParagraphs: [] },
  { type: "materiallager",label: "Materiallager",  color: "#FEF3C7", defaultWidth: 140, defaultHeight: 90,  icon: "Package",      suggestedRiskParagraphs: ["j"] },
  { type: "avfall",       label: "Avfall",         color: "#FECACA", defaultWidth: 110, defaultHeight: 80,  icon: "Trash2",       suggestedRiskParagraphs: ["b", "p"] },
  { type: "parkering",    label: "Parkering",      color: "#D1FAE5", defaultWidth: 140, defaultHeight: 90,  icon: "Car",          suggestedRiskParagraphs: ["q"] },
  { type: "tarnkran",     label: "Tårnkran",       color: "#9CA3AF", defaultWidth: 60,  defaultHeight: 180, icon: "Construction", suggestedRiskParagraphs: ["d", "j", "m"] },
  { type: "adkomstvei",   label: "Adkomstvei",     color: "#D1D5DB", defaultWidth: 70,  defaultHeight: 240, icon: "MoveRight",    suggestedRiskParagraphs: ["q"] },
  { type: "romningsvei",  label: "Rømningsvei",    color: "#FCA5A5", defaultWidth: 60,  defaultHeight: 60,  icon: "ArrowUp",      suggestedRiskParagraphs: ["m", "e"] },
  { type: "gjerde",       label: "Gjerde/Sikring", color: "#FBBF24", defaultWidth: 200, defaultHeight: 20,  icon: "Minus",        suggestedRiskParagraphs: ["m"] },
  { type: "strom",        label: "Strøm",          color: "#FDE68A", defaultWidth: 50,  defaultHeight: 50,  icon: "Zap",          suggestedRiskParagraphs: ["n"] },
  { type: "vann",         label: "Vann",           color: "#BAE6FD", defaultWidth: 50,  defaultHeight: 50,  icon: "Droplet",      suggestedRiskParagraphs: ["e"] },
  { type: "kontor",       label: "Kontor/Møterom", color: "#E9D5FF", defaultWidth: 130, defaultHeight: 90,  icon: "Building",     suggestedRiskParagraphs: [] },
  { type: "forstehjelp",  label: "Førstehjelp",    color: "#FECDD3", defaultWidth: 60,  defaultHeight: 60,  icon: "Heart",        suggestedRiskParagraphs: [] },
];

export function getSymbol(type: string): RiggSymbolDef | undefined {
  return RIGG_SYMBOLS.find((s) => s.type === type);
}
