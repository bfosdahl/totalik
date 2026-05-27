/**
 * Compress an image data URL to JPEG with max dimension constraints.
 * Drastically reduces memory footprint when embedding many images into a jsPDF.
 */
export async function compressDataUrl(
  dataUrl: string,
  maxDimension = 1200,
  quality = 0.78
): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let { width, height } = img;
        // Hard cap input dimensions BEFORE allocating canvas — an 8000×6000 image
        // would allocate ~192MB and crash mobile browsers.
        const MAX_INPUT_DIMENSION = 4000;
        if (width > MAX_INPUT_DIMENSION || height > MAX_INPUT_DIMENSION) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_INPUT_DIMENSION);
            width = MAX_INPUT_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_INPUT_DIMENSION);
            height = MAX_INPUT_DIMENSION;
          }
        }
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl, w: img.width, h: img.height });
          return;
        }
        // White background ensures JPEG conversion doesn't show black where PNG had transparency
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const out = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl: out, w: width, h: height });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = dataUrl;
  });
}
