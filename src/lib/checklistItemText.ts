/** Returns the display text of a checklist item, supporting legacy keys (e.g. `checkpoint`). */
export function getChecklistItemText(item: any, fallback = ""): string {
  if (typeof item === "string") return item.trim() ? item : fallback;
  if (!item || typeof item !== "object") return fallback;
  for (const key of ["text", "checkpoint_text", "label", "checkpoint", "title", "name"]) {
    const v = item[key];
    if (typeof v === "string" && v.trim() !== "" && v !== "[object Object]") return v;
  }
  return fallback;
}
