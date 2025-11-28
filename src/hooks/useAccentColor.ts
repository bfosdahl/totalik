import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const accentColors = {
  blue: {
    primary: "217 91% 60%",
    primaryForeground: "0 0% 100%",
  },
  green: {
    primary: "160 84% 39%",
    primaryForeground: "0 0% 100%",
  },
  violet: {
    primary: "263 70% 50%",
    primaryForeground: "0 0% 100%",
  },
  orange: {
    primary: "25 95% 53%",
    primaryForeground: "0 0% 100%",
  },
  pink: {
    primary: "330 81% 60%",
    primaryForeground: "0 0% 100%",
  },
  red: {
    primary: "0 84% 60%",
    primaryForeground: "0 0% 100%",
  },
  teal: {
    primary: "174 72% 40%",
    primaryForeground: "0 0% 100%",
  },
  amber: {
    primary: "38 92% 50%",
    primaryForeground: "0 0% 0%",
  },
  indigo: {
    primary: "239 84% 67%",
    primaryForeground: "0 0% 100%",
  },
  cyan: {
    primary: "189 94% 43%",
    primaryForeground: "0 0% 0%",
  },
  rose: {
    primary: "350 89% 60%",
    primaryForeground: "0 0% 100%",
  },
  slate: {
    primary: "215 20% 45%",
    primaryForeground: "0 0% 100%",
  },
} as const;

export type AccentColorKey = keyof typeof accentColors;

// Convert HEX to HSL
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%"; // fallback to blue
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Get luminance to determine if foreground should be light or dark
export function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0.5;
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function isCustomColor(color: string): boolean {
  return color.startsWith("#");
}

export function getColorValues(color: string): { primary: string; primaryForeground: string } {
  if (isCustomColor(color)) {
    const hsl = hexToHsl(color);
    const luminance = getLuminance(color);
    return {
      primary: hsl,
      primaryForeground: luminance > 0.5 ? "0 0% 0%" : "0 0% 100%",
    };
  }
  return accentColors[color as AccentColorKey] || accentColors.blue;
}

export function useAccentColor() {
  const { company } = useAuth();
  const accentColor = company?.accent_color || "blue";

  useEffect(() => {
    const colors = getColorValues(accentColor);
    const root = document.documentElement;
    
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
  }, [accentColor]);

  return accentColor;
}
