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

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  logClientError({
    error_message: reason?.message || String(reason) || "Unhandled promise rejection",
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
