import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import i18n from "@/i18n";

/**
 * Custom hook that combines react-i18next with the LanguageContext
 * to ensure language changes are synchronized across the app.
 */
export function useTranslate() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Sync i18n language with context language
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return { t, language };
}
