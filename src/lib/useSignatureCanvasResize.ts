import { useEffect, RefObject } from "react";

/**
 * react-signature-canvas renders a 300x150 canvas by default. When the canvas is
 * stretched with CSS (w-full / h-24) the drawing coordinates no longer match the
 * pointer position, so drawing with a mouse/finger appears broken or invisible.
 * This hook keeps the canvas bitmap in sync with its rendered size.
 */
export function useSignatureCanvasResize(
  sigRef: RefObject<{ getCanvas: () => HTMLCanvasElement; clear: () => void } | null>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const resize = () => {
      const canvas = sigRef.current?.getCanvas?.();
      if (!canvas) return;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (!width || !height) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      if (canvas.width === width * ratio && canvas.height === height * ratio) return;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      sigRef.current?.clear();
    };

    const id = window.setTimeout(resize, 0);
    window.addEventListener("resize", resize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
