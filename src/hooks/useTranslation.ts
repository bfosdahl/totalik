import { useState, useCallback } from "react";
import { useLanguage, SupportedLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TranslationResult {
  translatedContent: string;
  cached: boolean;
}

export function useTranslation() {
  const { language } = useLanguage();
  const { company } = useAuth();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  const translateContent = useCallback(
    async (
      content: string,
      targetLanguage?: SupportedLanguage,
      contentType = "handbook"
    ): Promise<string> => {
      const targetLang = targetLanguage || language;

      // If Norwegian, return original
      if (targetLang === "no") {
        setTranslatedContent(content);
        return content;
      }

      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke<TranslationResult>(
          "translate-content",
          {
            body: {
              content,
              targetLanguage: targetLang,
              contentType,
              companyId: company?.id,
            },
          }
        );

        if (error) {
          console.error("[useTranslation] Error:", error);
          toast.error("Kunne ikke oversette innholdet");
          return content;
        }

        if (data?.translatedContent) {
          setTranslatedContent(data.translatedContent);
          return data.translatedContent;
        }

        return content;
      } catch (err) {
        console.error("[useTranslation] Error:", err);
        toast.error("Oversettelse feilet");
        return content;
      } finally {
        setIsTranslating(false);
      }
    },
    [language, company?.id]
  );

  const resetTranslation = useCallback(() => {
    setTranslatedContent(null);
  }, []);

  return {
    language,
    translateContent,
    translatedContent,
    isTranslating,
    resetTranslation,
    isNorwegian: language === "no",
  };
}
