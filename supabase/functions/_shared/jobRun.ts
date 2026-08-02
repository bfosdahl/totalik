// Shared helper: records every background/alarm job run so we can monitor
// whether the jobs actually run, and whether they fail or start sending
// unusually many notifications.

import { createClient } from "npm:@supabase/supabase-js@2";

export interface JobRunResult {
  itemsProcessed?: number;
  notificationsSent?: number;
  errorCount?: number;
  errorMessage?: string | null;
  details?: Record<string, unknown> | null;
}

export async function recordJobRun(
  jobName: string,
  status: "success" | "error",
  startedAt: number,
  result: JobRunResult = {},
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return;

    const client = createClient(supabaseUrl, serviceKey);
    const finished = Date.now();

    await client.from("job_run_log").insert({
      job_name: jobName,
      status,
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date(finished).toISOString(),
      duration_ms: finished - startedAt,
      items_processed: result.itemsProcessed ?? 0,
      notifications_sent: result.notificationsSent ?? 0,
      error_count: result.errorCount ?? 0,
      error_message: result.errorMessage ?? null,
      details: result.details ?? null,
    });
  } catch (e) {
    // Never let monitoring break the job itself
    console.error(`recordJobRun failed for ${jobName}:`, e);
  }
}
