import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { logClientError } from "@/utils/logClientError";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // Initialize i18n

// Global handlers for uncaught errors
window.addEventListener("error", (event) => {
  logClientError({
    error_message: event.message || "Unknown error",
    error_stack: event.error?.stack ?? null,
    url: window.location.href,
    user_agent: navigator.userAgent,
    source: "window_error",
  });
});

// Detect chunk-load errors after a new deploy and auto-recover by reloading.
// This happens when the user has an old HTML cached and tries to load a JS chunk
// that no longer exists at the expected hash.
const isChunkLoadError = (message: string): boolean => {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("error loading dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("loading chunk") ||
    m.includes("loading css chunk")
  );
};

const handleChunkError = (message: string): boolean => {
  if (!isChunkLoadError(message)) return false;
  // Avoid infinite reload loops by only retrying once per session.
  const KEY = "chunk-reload-attempted";
  if (sessionStorage.getItem(KEY)) return false;
  sessionStorage.setItem(KEY, "1");
  toast("Ny versjon oppdaget – laster siden på nytt…", { duration: 2000 });
  window.setTimeout(() => window.location.reload(), 800);
  return true;
};

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason) || "Unhandled promise rejection";

  if (handleChunkError(message)) {
    event.preventDefault();
    return;
  }

  logClientError({
    error_message: message,
    error_stack: reason?.stack ?? null,
    url: window.location.href,
    user_agent: navigator.userAgent,
    source: "unhandled_rejection",
  });
});

createRoot(document.getElementById("root")!).render(<App />);

// Ensure users get the latest version (PWA/service worker update handling)
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-reload after a short delay, but allow user to trigger immediately
    toast("Ny versjon tilgjengelig – oppdaterer…", {
      duration: 5000,
      action: {
        label: "Oppdater nå",
        onClick: () => updateSW(true),
      },
    });

    window.setTimeout(() => updateSW(true), 1500);
  },
  onOfflineReady() {
    // Optional: show a subtle message; keep quiet to avoid noise
  },
});
