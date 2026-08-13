import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { currentProfile } from "../supabase";

export default defineTool({
  name: "list_deviations",
  title: "List avvik",
  description: "Henter avvik (deviations) for brukerens bedrift, med valgfritt filter på status og antall.",
  inputSchema: {
    status: z
      .enum(["open", "in_progress", "resolved", "closed"])
      .optional()
      .describe("Filtrer på status."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maks antall avvik."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ikke innlogget" }], isError: true };
    }
    const { supabase, profile } = await currentProfile(ctx);
    let query = supabase
      .from("deviations")
      .select("id, deviation_number, title, category, priority, status, due_date, assignee_name, reporter_name, created_at")
      .eq("company_id", profile.company_id as string)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { deviations: data ?? [] },
    };
  },
});
