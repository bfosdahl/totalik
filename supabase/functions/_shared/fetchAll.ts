// Paging helpers to bypass the backend's silent 1000-row cap (max-rows).
// Every builder MUST include a deterministic .order(...) ending in a unique column.

// deno-lint-ignore no-explicit-any
export async function fetchAllRows<T>(build: () => any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

// deno-lint-ignore no-explicit-any
export async function fetchAllIn<T>(ids: string[], build: (chunk: string[]) => any, chunkSize = 200): Promise<T[]> {
  if (!ids || ids.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    out.push(...(await fetchAllRows<T>(() => build(chunk))));
  }
  return out;
}
