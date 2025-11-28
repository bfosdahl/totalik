import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const accentColors = {
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
} as const;

export type AccentColorKey = keyof typeof accentColors;

export function useAccentColor() {
  const { company } = useAuth();
  const accentColor = (company?.accent_color as AccentColorKey) || "blue";

  useEffect(() => {
    const colors = accentColors[accentColor] || accentColors.blue;
    const root = document.documentElement;
    
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
  }, [accentColor]);

  return accentColor;
}

export { accentColors };
