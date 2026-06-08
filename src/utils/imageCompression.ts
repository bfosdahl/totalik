/**
 * Komprimerer et bilde i nettleseren før opplasting:
 * - Skalerer lengste side til maxDim (default 2000 px)
 * - Re-encoder som JPEG med gitt kvalitet
 * Returnerer en ny File med samme basisnavn + .jpg-endelse.
 * Faller tilbake til original-filen ved feil.
 */
export async function compressImageFile(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<File> {
  const maxDim = opts.maxDim ?? 2000;
  const quality = opts.quality ?? 0.85;

  if (!file.type.startsWith("image/")) return file;
  // Skip svg / gif (animated)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image-load-failed"));
      el.src = dataUrl;
    });

    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;
    // Don't bother if compressed is larger
    if (blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch (e) {
    console.warn("compressImageFile failed, using original", e);
    return file;
  }
}
