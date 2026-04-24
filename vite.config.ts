import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: false, // We use our own manifest.json
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB limit
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise warning threshold a bit; chunks below this are fine.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Group large third-party libraries into stable, cacheable vendor chunks.
        // This keeps the initial download small and lets the browser cache vendor
        // code across deploys when only app code changes.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;

          // React core — loaded on every page, keep separate for long-term caching.
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }

          // Supabase client — used everywhere but heavy.
          if (id.includes("@supabase")) return "vendor-supabase";

          // Radix UI primitives (shadcn) — many small modules, group them.
          if (id.includes("@radix-ui")) return "vendor-radix";

          // Charts (recharts + d3) — only used on a few pages, but very large.
          if (id.includes("recharts") || id.includes("/d3-")) return "vendor-charts";

          // PDF generation libs — heavy and only used on demand.
          if (
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("pdfjs-dist") ||
            id.includes("react-pdf")
          ) {
            return "vendor-pdf";
          }

          // Rich-text / editor libs.
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-editor";

          // Date utilities + calendars.
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "vendor-date";

          // Form / validation.
          if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform")) {
            return "vendor-forms";
          }

          // Icons — Lucide is tree-shaken but still sizeable when many used.
          if (id.includes("lucide-react")) return "vendor-icons";

          // Everything else from node_modules.
          return "vendor";
        },
      },
    },
  },
}));
