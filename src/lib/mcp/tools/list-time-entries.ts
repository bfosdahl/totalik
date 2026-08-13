import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { currentProfile } from "../supabase";

export default defineTool({
  name: "list_time_entries",
  title: "List timeføringer",
  description: "Henter den innloggede brukerens egne timeføringer i en valgfri datoperiode.",
  inputSchema: {
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Fra-dato YYYY-MM-DD."),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Til-dato YYYY-MM-DD."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maks antall linjer."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ikke innlogget" }], isError: true };
    }
    const { supabase } = await currentProfile(ctx);
    let query = supabase
      .from("time_entries")
      .select("id, entry_date, hours, hour_type, start_time, end_time, project_name, customer_name, description, status")
      .eq("user_id", ctx.getUserId() ?? "")
      .order("entry_date", { ascending: false })
      .limit(limit ?? 50);
    if (from_date) query = query.gte("entry_date", from_date);
    if (to_date) query = query.lte("entry_date", to_date);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (data ?? []).reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ total_hours: total, entries: data ?? [] }, null, 2) }],
      structuredContent: { total_hours: total, entries: data ?? [] },
    };
  },
});
