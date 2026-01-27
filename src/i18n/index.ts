import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import noTranslations from "./locales/no.json";
import plTranslations from "./locales/pl.json";
import ltTranslations from "./locales/lt.json";
import enTranslations from "./locales/en.json";

const resources = {
  no: { translation: noTranslations },
  pl: { translation: plTranslations },
  lt: { translation: ltTranslations },
  en: { translation: enTranslations },
};

// Get initial language from localStorage or default to Norwegian
const getInitialLanguage = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("preferred_language");
    if (stored && ["no", "pl", "lt", "en"].includes(stored)) {
      return stored;
    }
  }
  return "no";
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "no",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
