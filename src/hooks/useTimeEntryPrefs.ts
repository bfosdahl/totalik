import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Husker brukerens siste valg i timeføring (lokalt på enheten).
 * Ingen ekstra databasekall – kun localStorage per bruker + bedrift.
 */
export interface TimeEntryPrefs {
  lastProjectId?: string;
  lastCustomProjectName?: string;
  lastCustomerName?: string;
  lastStartTime?: string;
  lastEndTime?: string;
  lastHours?: string;
  lastHourType?: string;
  /** projectId (eller fritekstnavn) -> antall ganger brukt */
  projectCounts: Record<string, number>;
  /** materialtype-id -> antall ganger brukt */
  materialCounts: Record<string, number>;
  /** tilleggstype-id -> antall ganger brukt */
  allowanceCounts: Record<string, number>;
  /** sist brukte kundenavn (maks 5) */
  customers: string[];
  /** projectKey -> siste beskrivelser (maks 5) */
  descriptions: Record<string, string[]>;
}

const EMPTY: TimeEntryPrefs = {
  projectCounts: {},
  materialCounts: {},
  allowanceCounts: {},
  customers: [],
  descriptions: {},
};

function storageKey(userId?: string, companyId?: string) {
  return `time-entry-prefs:${userId ?? "anon"}:${companyId ?? "none"}`;
}

function read(key: string): TimeEntryPrefs {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      ...EMPTY,
      ...parsed,
      projectCounts: parsed?.projectCounts ?? {},
      materialCounts: parsed?.materialCounts ?? {},
      allowanceCounts: parsed?.allowanceCounts ?? {},
      customers: parsed?.customers ?? [],
      descriptions: parsed?.descriptions ?? {},
    };
  } catch {
    return EMPTY;
  }
}

export function useTimeEntryPrefs() {
  const { user, profile } = useAuth();
  const key = storageKey(user?.id, (profile as { company_id?: string } | null)?.company_id);
  const [prefs, setPrefs] = useState<TimeEntryPrefs>(EMPTY);

  useEffect(() => {
    setPrefs(read(key));
  }, [key]);

  const save = useCallback(
    (next: TimeEntryPrefs) => {
      setPrefs(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* lagring kan feile i privat modus – ikke kritisk */
      }
    },
    [key]
  );

  /** Kalles etter at en føring er lagret. */
  const remember = useCallback(
    (input: {
      projectId?: string;
      customProjectName?: string;
      customerName?: string;
      startTime?: string;
      endTime?: string;
      hours?: string;
      hourType?: string;
      description?: string;
      materialTypeIds?: string[];
      allowanceTypeIds?: string[];
    }) => {
      const current = read(key);
      const projectKey = input.projectId || input.customProjectName || "";
      const counts = { ...current.projectCounts };
      if (projectKey) counts[projectKey] = (counts[projectKey] ?? 0) + 1;

      const descriptions = { ...current.descriptions };
      const desc = input.description?.trim();
      if (projectKey && desc) {
        const list = [desc, ...(descriptions[projectKey] ?? []).filter((d) => d !== desc)].slice(0, 5);
        descriptions[projectKey] = list;
      }

      save({
        lastProjectId: input.projectId || current.lastProjectId,
        lastCustomProjectName: input.customProjectName || current.lastCustomProjectName,
        lastCustomerName: input.customerName || current.lastCustomerName,
        lastStartTime: input.startTime || current.lastStartTime,
        lastEndTime: input.endTime || current.lastEndTime,
        lastHours: input.hours || current.lastHours,
        projectCounts: counts,
        descriptions,
      });
    },
    [key, save]
  );

  /** Sorterer en prosjektliste slik at mest brukte kommer først. */
  const sortByUsage = useCallback(
    <T extends { id: string }>(items: T[]): T[] =>
      [...items].sort((a, b) => (prefs.projectCounts[b.id] ?? 0) - (prefs.projectCounts[a.id] ?? 0)),
    [prefs.projectCounts]
  );

  const usageCount = useCallback(
    (id: string) => prefs.projectCounts[id] ?? 0,
    [prefs.projectCounts]
  );

  const suggestionsFor = useCallback(
    (projectKey?: string) => (projectKey ? prefs.descriptions[projectKey] ?? [] : []),
    [prefs.descriptions]
  );

  return { prefs, remember, sortByUsage, usageCount, suggestionsFor };
}
