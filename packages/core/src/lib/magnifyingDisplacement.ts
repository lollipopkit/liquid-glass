import { createRgbaImageData } from "./imageData";

export function calculateMagnifyingDisplacementMap(
  canvasWidth: number,
  canvasHeight: number,
  dpr?: number
) {
  const devicePixelRatio =
    dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1);
  const bufferWidth = canvasWidth * devicePixelRatio;
  const bufferHeight = canvasHeight * devicePixelRatio;
  const imageData = createRgbaImageData(bufferWidth, bufferHeight);
  const pixels = imageData.data;

  const ratio = Math.max(bufferWidth / 2, bufferHeight / 2);
  const halfWidth = bufferWidth / 2;
  const halfHeight = bufferHeight / 2;

  for (let y1 = 0; y1 < bufferHeight; y1++) {
    const y = y1 - halfHeight;
    const rY = y / ratio;
    const rowStart = y1 * bufferWidth * 4;

    for (let x1 = 0; x1 < bufferWidth; x1++) {
      const idx = rowStart + x1 * 4;
      const x = x1 - halfWidth;
      const rX = x / ratio;

      pixels[idx] = 128 - rX * 127; // R
      pixels[idx + 1] = 128 - rY * 127; // G
      pixels[idx + 2] = 0; // B
      pixels[idx + 3] = 255; // A
    }
  }
  return imageData;
}
