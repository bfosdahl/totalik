import { createRoot } from "react-dom/client";
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

// Clear chunk-reload flag on successful boot so future chunk errors can recover.
window.setTimeout(() => sessionStorage.removeItem("chunk-reload-attempted"), 5000);

createRoot(document.getElementById("root")!).render(<App />);

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

const unregisterServiceWorkers = () => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
};

// Avoid stale service-worker caches in Lovable preview/iframes. They can serve
// outdated chunks and leave Safari/preview users on a blank page after deploys.
unregisterServiceWorkers();
