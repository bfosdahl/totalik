import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Enkel "husk sist brukt"-lagring per bruker + bedrift (localStorage).
 * Brukes av IK/MAT, sjekklister og avvik for å forhåndsfylle valg.
 * Ingen ekstra databasekall.
 */
export function useLastUsed<T extends Record<string, unknown>>(namespace: string, initial: T) {
  const { user, profile } = useAuth();
  const companyId = (profile as { company_id?: string } | null)?.company_id;
  const key = `last-used:${namespace}:${user?.id ?? "anon"}:${companyId ?? "none"}`;
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setValue(raw ? { ...initial, ...JSON.parse(raw) } : initial);
    } catch {
      setValue(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const remember = useCallback(
    (patch: Partial<T>) => {
      setValue((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignorer */
        }
        return next;
      });
    },
    [key]
  );

  return { lastUsed: value, remember };
}
