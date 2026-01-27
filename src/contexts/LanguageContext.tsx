import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type SupportedLanguage = "no" | "pl" | "lt" | "en";

export const LANGUAGE_CONFIG: Record<SupportedLanguage, { flag: string; name: string; nativeName: string }> = {
  no: { flag: "🇳🇴", name: "Norsk", nativeName: "Norsk" },
  pl: { flag: "🇵🇱", name: "Polsk", nativeName: "Polski" },
  lt: { flag: "🇱🇹", name: "Litauisk", nativeName: "Lietuvių" },
  en: { flag: "🇬🇧", name: "Engelsk", nativeName: "English" },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>("no");
  const [isChanging, setIsChanging] = useState(false);

  // Load language preference from profile or localStorage
  useEffect(() => {
    const loadLanguage = async () => {
      // First check localStorage for quick initial load
      const stored = localStorage.getItem("preferred_language") as SupportedLanguage;
      if (stored && LANGUAGE_CONFIG[stored]) {
        setLanguageState(stored);
      }

      // Then load from profile if logged in
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("user_id", user.id)
          .single();

        if (data?.preferred_language && LANGUAGE_CONFIG[data.preferred_language as SupportedLanguage]) {
          const lang = data.preferred_language as SupportedLanguage;
          setLanguageState(lang);
          localStorage.setItem("preferred_language", lang);
        }
      }
    };

    loadLanguage();
  }, [user?.id]);

  const setLanguage = async (lang: SupportedLanguage) => {
    setIsChanging(true);
    try {
      setLanguageState(lang);
      localStorage.setItem("preferred_language", lang);

      // Save to profile if logged in
      if (user?.id) {
        await supabase
          .from("profiles")
          .update({ preferred_language: lang })
          .eq("user_id", user.id);
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isChanging }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
