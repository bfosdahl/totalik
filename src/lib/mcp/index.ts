import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listDeviationsTool from "./tools/list-deviations";
import createDeviationTool from "./tools/create-deviation";
import listProjectsTool from "./tools/list-projects";
import listTimeEntriesTool from "./tools/list-time-entries";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "totalik-no",
  title: "Totalik.no",
  version: "0.1.0",
  instructions:
    "Verktøy for Total-IK (HMS, internkontroll og kvalitetssikring). Bruk `whoami` for å se brukerens bedrift, `list_deviations`/`create_deviation` for avvik, `list_projects` for KS-byggeprosjekter og `list_time_entries` for egne timeføringer. Alle data er begrenset til den innloggede brukerens bedrift.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listDeviationsTool, createDeviationTool, listProjectsTool, listTimeEntriesTool],
});
