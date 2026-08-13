import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { currentProfile } from "../supabase";
import { t } from "@/i18n/t";

export default defineTool({
  name: "list_projects",
  title: "List byggeprosjekter",
  description: t("auto.henter_ks_byggeprosjekter_for_brukerens_"),
  inputSchema: {
    status: z
      .enum(["planned", "active", "handover", "warranty", "completed"])
      .optional()
      .describe("Filtrer på prosjektstatus."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maks antall prosjekter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ikke innlogget" }], isError: true };
    }
    const { supabase, profile } = await currentProfile(ctx);
    let query = supabase
      .from("ks_module2_projects")
      .select("id, project_number, project_name, address, client_name, status, progress_percent, planned_start_date, planned_end_date")
      .eq("company_id", profile.company_id as string)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
