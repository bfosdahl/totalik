import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Strip debug-level console calls in production builds.
  // console.warn and console.error are kept so real errors stay visible.
  esbuild: mode === "production"
    ? { drop: ["debugger"], pure: ["console.log", "console.info", "console.debug", "console.trace"] }
    : undefined,
  build: {
    modulePreload: false,
    // Raise warning threshold a bit; chunks below this are fine.
    chunkSizeWarningLimit: 800,
  },
}));
