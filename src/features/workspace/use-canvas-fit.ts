import { useCallback, useEffect, type RefObject } from "react";
import { useUI } from "../../stores/ui";

export function useCanvasFit(
  canvasRef: RefObject<HTMLDivElement | null>,
  width: number | undefined,
  height: number | undefined,
  contentKey: string | undefined,
  autoFit: boolean,
) {
  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    const style = getComputedStyle(canvas);
    const availableWidth =
      canvas.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const availableHeight =
      canvas.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom);
    useUI.getState().set({
      zoom: Math.max(
        0.05,
        Math.min(availableWidth / width, availableHeight / height, 1),
      ),
    });
    canvas.scrollTo({ left: 0, top: 0 });
  }, [canvasRef, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !contentKey || !autoFit) return;
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, contentKey, autoFit, fit]);

  return fit;
}
