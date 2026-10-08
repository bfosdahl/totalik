/**
 * Formaterer filstørrelse: "512 B", "1.5 KB", "2.3 MB".
 * @param emptyText Hvis satt, returneres denne når bytes er 0, null eller undefined.
 */
export function formatFileSize(bytes: number | null | undefined, emptyText?: string): string {
  if (emptyText !== undefined && !bytes) return emptyText;
  const b = bytes ?? 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
