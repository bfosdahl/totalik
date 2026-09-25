import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Universal utkast-lagring: tar vare på det brukeren har skrevet (localStorage,
 * per bruker) og advarer ved lukking av fanen når noe ikke er lagret.
 * Bruk: const d = useFormDraft("ks-sjekkliste:"+id, data, { enabled: dirty });
 */
export function useFormDraft<T>(namespace: string, data: T, opts: { enabled: boolean }) {
  const { user } = useAuth();
  const key = `draft:${namespace}:${user?.id ?? "anon"}`;
  const [draft, setDraft] = useState<{ data: T; savedAt: string } | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setDraft(raw ? JSON.parse(raw) : null);
    } catch {
      setDraft(null);
    }
    loadedRef.current = true;
  }, [key]);

  // Autolagre (debounce)
  useEffect(() => {
    if (!opts.enabled || !loadedRef.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ data, savedAt: new Date().toISOString() }));
      } catch {
        /* full lagring – ignorer */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [key, data, opts.enabled]);

  // Advar ved lukking/oppdatering av fanen
  useEffect(() => {
    if (!opts.enabled) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [opts.enabled]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* */ }
    setDraft(null);
  }, [key]);

  const dismiss = useCallback(() => setDraft(null), []);

  return { draft, clear, dismiss };
}
