import { comparePixels } from "./pixels";
self.onmessage = async (
  event: MessageEvent<{
    baseline: Blob;
    current: Blob;
    threshold: number;
    alignment: "top-left" | "center";
  }>,
) => {
  let a: ImageBitmap | undefined;
  let b: ImageBitmap | undefined;
  try {
    a = await createImageBitmap(event.data.baseline);
    b = await createImageBitmap(event.data.current);
    const width = Math.max(a.width, b.width);
    const height = Math.max(a.height, b.height);
    if (width * height > 16000000)
      throw new Error(
        "Difference mode supports up to 16 megapixels of combined canvas area.",
      );
    const get = (image: ImageBitmap) => {
      const c = new OffscreenCanvas(width, height);
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable.");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      const center = event.data.alignment === "center";
      ctx.drawImage(
        image,
        center ? Math.floor((width - image.width) / 2) : 0,
        center ? Math.floor((height - image.height) / 2) : 0,
      );
      return ctx.getImageData(0, 0, width, height).data;
    };
    const result = comparePixels(get(a), get(b), event.data.threshold);
    const c = new OffscreenCanvas(width, height);
    c.getContext("2d")!.putImageData(
      new ImageData(new Uint8ClampedArray(result.pixels), width, height),
      0,
      0,
    );
    self.postMessage({
      blob: await c.convertToBlob(),
      changed: result.changed,
      percent: result.percent,
      width,
      height,
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Comparison failed.",
    });
  } finally {
    a?.close();
    b?.close();
  }
};
