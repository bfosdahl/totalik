import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { currentProfile } from "../supabase";

export default defineTool({
  name: "create_deviation",
  title: "Opprett avvik",
  description: "Registrerer et nytt avvik i Total-IK for brukerens bedrift. Avviksnummer genereres automatisk.",
  inputSchema: {
    title: z.string().trim().min(3).describe("Kort tittel på avviket."),
    description: z.string().trim().optional().describe("Utfyllende beskrivelse."),
    category: z
      .enum(["quality", "safety", "environment", "documentation", "other"])
      .default("other")
      .describe("Kategori."),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium").describe("Prioritet."),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Frist på formatet YYYY-MM-DD. Standard er 14 dager frem i tid."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, category, priority, due_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ikke innlogget" }], isError: true };
    }
    const { supabase, profile } = await currentProfile(ctx);

    const fallbackDue = new Date();
    fallbackDue.setDate(fallbackDue.getDate() + 14);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dueDate =
      due_date ??
      `${fallbackDue.getFullYear()}-${pad(fallbackDue.getMonth() + 1)}-${pad(fallbackDue.getDate())}`;

    const reporterName =
      `${(profile.first_name as string) ?? ""} ${(profile.last_name as string) ?? ""}`.trim() ||
      ((profile.email as string) ?? "Ukjent");

    const { data, error } = await supabase
      .from("deviations")
      .insert({
        company_id: profile.company_id as string,
        deviation_number: null,
        title,
        description: description ?? null,
        category,
        priority,
        status: "open",
        due_date: dueDate,
        reporter_id: ctx.getUserId(),
        reporter_name: reporterName,
      })
      .select("id, deviation_number, title, status, due_date")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Avvik opprettet: ${JSON.stringify(data)}` }],
      structuredContent: { deviation: data },
    };
  },
});
