import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const authState = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  company: { id: "comp-A" } as { id: string } | null,
  profile: { company_id: "comp-A" } as { company_id: string | null } | null,
}));

const locationState = vi.hoisted(() => ({ pathname: "/risikoanalyse" }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: authState.user,
    company: authState.company,
    profile: authState.profile,
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useLocation: () => ({ pathname: locationState.pathname }) };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

vi.mock("@/hooks/useSpeech", () => ({
  useSpeech: () => ({
    isListening: false,
    isSupported: false,
    start: vi.fn(),
    stop: vi.fn(),
    speak: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn(async () => ({ data: null, error: null })) } },
}));

import { MascotChatHelper } from "./MascotChatHelper";

const KEY = (scope: string, proff: string) => `mascot-chat:v2:user-1:${scope}:${proff}`;
const SECRET = "HEMMELEGG FRA FORRIGE SELSKAP";

const renderHelper = () =>
  render(
    <MemoryRouter>
      <MascotChatHelper />
    </MemoryRouter>,
  );

describe("MascotChatHelper scoped history", () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState.user = { id: "user-1" };
    authState.company = { id: "comp-A" };
    authState.profile = { company_id: "comp-A" };
    locationState.pathname = "/risikoanalyse";
  });

  it("never writes the previous company's chat into the new company's key on a company switch", () => {
    sessionStorage.setItem(
      KEY("comp-A", "hms"),
      JSON.stringify([{ id: "x", content: SECRET, isBot: true }]),
    );

    const { rerender } = renderHelper();
    expect(screen.getByText(SECRET)).toBeInTheDocument();

    act(() => {
      authState.company = { id: "comp-B" };
      authState.profile = { company_id: "comp-B" };
    });
    rerender(
      <MemoryRouter>
        <MascotChatHelper />
      </MemoryRouter>,
    );

    const bKey = sessionStorage.getItem(KEY("comp-B", "hms"));
    expect(bKey).not.toBeNull();
    expect(bKey).not.toContain(SECRET);
    expect(JSON.parse(bKey!)[0].content).toContain("HMS Proffen");

    // the old scope keeps its own history untouched
    expect(sessionStorage.getItem(KEY("comp-A", "hms"))).toContain(SECRET);
  });

  it("loads the new company's own stored chat when the scope changes", () => {
    const other = "DIALOG SOM TILHORER B";
    sessionStorage.setItem(KEY("comp-A", "hms"), JSON.stringify([{ id: "x", content: SECRET, isBot: true }]));
    sessionStorage.setItem(KEY("comp-B", "hms"), JSON.stringify([{ id: "y", content: other, isBot: true }]));

    const { rerender } = renderHelper();
    expect(screen.getByText(SECRET)).toBeInTheDocument();

    act(() => {
      authState.company = { id: "comp-B" };
      authState.profile = { company_id: "comp-B" };
    });
    rerender(
      <MemoryRouter>
        <MascotChatHelper />
      </MemoryRouter>,
    );

    expect(screen.getByText(other)).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
    expect(sessionStorage.getItem(KEY("comp-B", "hms"))).toContain(other);
    expect(sessionStorage.getItem(KEY("comp-B", "hms"))).not.toContain(SECRET);
  });

  it("does not read or write chat history when nobody is signed in", () => {
    authState.user = null;
    authState.company = null;
    authState.profile = null;

    renderHelper();

    const scoped = Object.keys(sessionStorage).filter((k) => k.startsWith("mascot-chat:v2:"));
    expect(scoped).toEqual([]);
  });
});
