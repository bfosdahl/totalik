import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // Initialize i18n

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
