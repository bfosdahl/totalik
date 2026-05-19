import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Detects new deployments by polling index.html and comparing the hashed
 * script bundle URL against the one that booted this session. When a new
 * version is found, shows a banner prompting the user to reload.
 *
 * Polls on: mount, every 2 min, on tab focus/visibility change.
 */
export function VersionChecker() {
  const initialBundleRef = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Skip in Lovable preview/iframe — only relevant for the deployed app
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const isPreviewHost =
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com");
    if (isInIframe || isPreviewHost) return;

    const extractBundleHash = (html: string): string | null => {
      // Vite injects <script type="module" src="/assets/index-XXXX.js">
      const m = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
      return m ? m[0] : null;
    };

    const check = async () => {
      try {
        const res = await fetch(`/?v=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const html = await res.text();
        const latest = extractBundleHash(html);
        if (!latest) return;
        if (initialBundleRef.current === null) {
          initialBundleRef.current = latest;
          return;
        }
        if (latest !== initialBundleRef.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // network blip — ignore
      }
    };

    check();
    const interval = window.setInterval(check, 2 * 60 * 1000);
    const onFocus = () => check();
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleReload = () => {
    // Hard reload — bypass cache where possible
    window.location.reload();
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl shadow-2xl border border-primary/30 px-4 py-3">
          <div className="p-2 rounded-full bg-primary-foreground/15 shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Ny versjon tilgjengelig</p>
            <p className="text-xs opacity-90">Trykk for å oppdatere appen</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReload}
            className="shrink-0"
          >
            Oppdater
          </Button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Lukk"
            className="p-1 rounded hover:bg-primary-foreground/15 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
