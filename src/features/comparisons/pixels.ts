export function comparePixels(
  baseline: Uint8ClampedArray,
  current: Uint8ClampedArray,
  threshold: number,
) {
  if (baseline.length !== current.length || baseline.length % 4)
    throw new Error("Pixel arrays must have matching RGBA dimensions.");
  const output = new Uint8ClampedArray(baseline.length);
  let changed = 0;
  for (let i = 0; i < baseline.length; i += 4) {
    // Composite against white so fully transparent RGB values do not create false differences.
    let delta = 0;
    let brightness = 0;
    for (let channel = 0; channel < 3; channel++) {
      const before =
        (baseline[i + channel] * baseline[i + 3]) / 255 +
        255 * (1 - baseline[i + 3] / 255);
      const after =
        (current[i + channel] * current[i + 3]) / 255 +
        255 * (1 - current[i + 3] / 255);
      delta = Math.max(delta, Math.abs(before - after));
      brightness += after;
    }
    if (delta > threshold) {
      changed++;
      output[i] = 239;
      output[i + 1] = 68;
      output[i + 2] = 130;
      output[i + 3] = 255;
    } else {
      const gray = brightness / 3;
      output[i] = output[i + 1] = output[i + 2] = gray;
      output[i + 3] = 100;
    }
  }
  return {
    pixels: output,
    changed,
    percent: baseline.length ? (changed / (baseline.length / 4)) * 100 : 0,
  };
}
