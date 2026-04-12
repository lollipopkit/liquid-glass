export type RgbaImageData = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export function createRgbaImageData(
  width: number,
  height: number
): RgbaImageData {
  if (typeof ImageData !== "undefined") {
    return new ImageData(width, height);
  }

  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  };
}
