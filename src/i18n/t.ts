import i18n from "@/i18n";

/**
 * Global translate helper for UI strings.
 *
 * Usage: t("auto.lagre_endringer")
 *
 * Components do NOT need a hook: LanguageProvider remounts the app subtree
 * when the language changes, so every t() call is re-evaluated.
 *
 * Falls back to the Norwegian source string when a key is missing.
 */
export function t(key: string, fallback?: string): string {
  const value = i18n.t(key, { defaultValue: fallback ?? key });
  return typeof value === "string" ? value : String(value);
}

export default t;
