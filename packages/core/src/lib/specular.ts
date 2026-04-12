import { createRgbaImageData } from "./imageData";

export function calculateRefractionSpecular(
  objectWidth: number,
  objectHeight: number,
  radius: number,
  bezelWidth: number,
  specularAngle = Math.PI / 3,
  dpr?: number
) {
  const devicePixelRatio =
    dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1);
  const bufferWidth = objectWidth * devicePixelRatio;
  const bufferHeight = objectHeight * devicePixelRatio;
  const imageData = createRgbaImageData(bufferWidth, bufferHeight);
  const pixels = imageData.data;

  const radius_ = radius * devicePixelRatio;
  const bezel_ = bezelWidth * devicePixelRatio;

  // Vector along which we should see specular
  const specularVectorX = Math.cos(specularAngle);
  const specularVectorY = Math.sin(specularAngle);

  // Fill neutral color using buffer
  const neutral = 0x00000000;
  new Uint32Array(pixels.buffer).fill(neutral);

  const radiusSquared = radius_ ** 2;
  const outerRadius = radius_ + devicePixelRatio;
  const specularInnerRadius = Math.max(radius_ - bezel_, radius_ - devicePixelRatio);
  const radiusPlusOneSquared = outerRadius ** 2;
  const radiusMinusSpecularSquared = specularInnerRadius ** 2;

  const widthBetweenRadiuses = bufferWidth - radius_ * 2;
  const heightBetweenRadiuses = bufferHeight - radius_ * 2;
  const rightSideStart = bufferWidth - radius_;
  const bottomSideStart = bufferHeight - radius_;
  const inverseDevicePixelRatio = 1 / devicePixelRatio;

  for (let y1 = 0; y1 < bufferHeight; y1++) {
    const isOnTopSide = y1 < radius_;
    const isOnBottomSide = y1 >= bottomSideStart;
    const y = isOnTopSide
      ? y1 - radius_
      : isOnBottomSide
      ? y1 - radius_ - heightBetweenRadiuses
      : 0;
    const ySquared = y * y;
    const rowStart = y1 * bufferWidth * 4;

    for (let x1 = 0; x1 < bufferWidth; x1++) {
      const idx = rowStart + x1 * 4;

      const isOnLeftSide = x1 < radius_;
      const isOnRightSide = x1 >= rightSideStart;

      const x = isOnLeftSide
        ? x1 - radius_
        : isOnRightSide
        ? x1 - radius_ - widthBetweenRadiuses
        : 0;

      const distanceToCenterSquared = x * x + ySquared;
      if (
        distanceToCenterSquared > radiusPlusOneSquared ||
        distanceToCenterSquared < radiusMinusSpecularSquared
      ) {
        continue;
      }

      const distanceFromCenter = Math.sqrt(distanceToCenterSquared);
      const distanceFromSide = radius_ - distanceFromCenter;
      const normalizedDistanceFromSide = distanceFromSide * inverseDevicePixelRatio;
      if (normalizedDistanceFromSide <= 0) {
        continue;
      }

      const opacity =
        distanceToCenterSquared < radiusSquared
          ? 1
          : 1 - (distanceFromCenter - radius_) * inverseDevicePixelRatio;

      const inverseDistance = 1 / distanceFromCenter;
      const dotProduct = Math.abs(
        (x * specularVectorX - y * specularVectorY) * inverseDistance
      );
      const coefficientBase =
        1 - (1 - normalizedDistanceFromSide) * (1 - normalizedDistanceFromSide);
      if (coefficientBase <= 0) {
        continue;
      }

      const coefficient = dotProduct * Math.sqrt(coefficientBase);
      const color = 255 * coefficient;
      const finalOpacity = color * coefficient * opacity;

      pixels[idx] = color;
      pixels[idx + 1] = color;
      pixels[idx + 2] = color;
      pixels[idx + 3] = finalOpacity;
    }
  }
  return imageData;
}
