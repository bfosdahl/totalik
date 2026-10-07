// Thin shared helper for writing to user_provisioning_log.
//
// It is deliberately a pass-through only: the rows go to .insert() exactly as
// they are given, so no column is added, renamed, defaulted or transformed
// here, and the { data, error } result is returned untouched so every caller
// keeps its own existing error handling. The helper itself never throws on a
// database error and never swallows one.

type ProvisioningRow = Record<string, unknown>;

export async function insertProvisioningLog(client: any, rows: ProvisioningRow | ProvisioningRow[]) {
  return await client.from("user_provisioning_log").insert(rows);
}
