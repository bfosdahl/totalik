import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { accentColors, AccentColorKey } from "@/hooks/useAccentColor";

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const { company } = useAuth();
  const accentColor = (company?.accent_color as AccentColorKey) || "blue";

  useEffect(() => {
    const colors = accentColors[accentColor] || accentColors.blue;
    const root = document.documentElement;
    
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
  }, [accentColor]);

  return <>{children}</>;
}
