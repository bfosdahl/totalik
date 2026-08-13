import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, SupportedLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const DELIM = "\n<<<§>>>\n";

interface TranslateResponse {
  translatedContent: string;
  cached: boolean;
  sourceLanguage?: string;
  sameLanguage?: boolean;
}

/**
 * Translates user-generated content stored in the database (checklists, routines,
 * SJA, risk assessments...) into the user's chosen language.
 *
 * The backend detects the source language automatically and caches the result,
 * so content already written in the reader's language (e.g. a Polish company
 * writing Polish checklists) is returned unchanged and never re-translated.
 */
export function useContentTranslation(contentType = "db-content") {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<string | null>(null);

  const translateMany = useCallback(
    async (texts: string[], targetLanguage?: SupportedLanguage): Promise<string[]> => {
      const target = targetLanguage || language;
      const nonEmpty = texts.map((t) => (t ?? "").toString());
      if (nonEmpty.every((t) => !t.trim())) return nonEmpty;

      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke<TranslateResponse>(
          "translate-content",
          {
            body: {
              content: nonEmpty.join(DELIM),
              targetLanguage: target,
              contentType,
            },
          }
        );

        if (error || !data?.translatedContent) {
          console.error("[useContentTranslation] error:", error);
          toast.error("Kunne ikke oversette innholdet");
          return nonEmpty;
        }

        setSourceLanguage(data.sourceLanguage ?? null);

        if (data.sameLanguage) return nonEmpty;

        const parts = data.translatedContent.split(/\n?<<<§>>>\n?/);
        if (parts.length !== nonEmpty.length) return nonEmpty;
        return parts.map((p, i) => (nonEmpty[i].trim() ? p.trim() : nonEmpty[i]));
      } catch (err) {
        console.error("[useContentTranslation] error:", err);
        toast.error("Oversettelse feilet");
        return nonEmpty;
      } finally {
        setIsTranslating(false);
      }
    },
    [language, contentType]
  );

  const translateOne = useCallback(
    async (text: string, targetLanguage?: SupportedLanguage) =>
      (await translateMany([text], targetLanguage))[0],
    [translateMany]
  );

  return { language, isTranslating, sourceLanguage, translateMany, translateOne };
}
