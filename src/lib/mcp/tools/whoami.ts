import { defineTool } from "@lovable.dev/mcp-js";
import { currentProfile } from "../supabase";
import { t } from "@/i18n/t";

export default defineTool({
  name: "whoami",
  title: "Hvem er jeg",
  description: t("auto.returnerer_den_innloggede_brukerens_prof"),
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ikke innlogget" }], isError: true };
    }
    const { supabase, profile } = await currentProfile(ctx);
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, org_number")
      .eq("id", profile.company_id as string)
      .maybeSingle();
    const result = { profile, company };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
