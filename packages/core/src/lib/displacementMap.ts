import { createRgbaImageData } from "./imageData";

export function calculateDisplacementMap(
  glassThickness: number = 200,
  bezelWidth: number = 50,
  bezelHeightFn: (x: number) => number = (x) => x,
  refractiveIndex: number = 1.5,
  samples: number = 128
): number[] {
  // Pre-calculate the distance the ray will be deviated
  // given the distance to border (ratio of bezel)
  // and height of the glass
  const eta = 1 / refractiveIndex;

  const displacementMap = new Array<number>(samples);
  const dx = 0.0001;

  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = bezelHeightFn(x);

    // Calculate derivative in x
    const y2 = bezelHeightFn(x + dx);
    const derivative = (y2 - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const normalX = -derivative / magnitude;
    const normalY = -1 / magnitude;
    const dot = normalY;
    const k = 1 - eta * eta * (1 - dot * dot);

    if (k >= 0) {
      const kSqrt = Math.sqrt(k);
      const refractedX = -(eta * dot + kSqrt) * normalX;
      const refractedY = eta - (eta * dot + kSqrt) * normalY;
      const remainingHeightOnBezel = y * bezelWidth;
      const remainingHeight = remainingHeightOnBezel + glassThickness;

      // Return displacement (rest of travel on x-axis, depends on remaining height to hit bottom of glass)
      displacementMap[i] = refractedX * (remainingHeight / refractedY);
      continue;
    }

    displacementMap[i] = 0;
  }

  return displacementMap;
}

export function calculateDisplacementMap2(
  canvasWidth: number,
  canvasHeight: number,
  objectWidth: number,
  objectHeight: number,
  radius: number,
  bezelWidth: number,
  maximumDisplacement: number,
  precomputedDisplacementMap: number[] = [],
  dpr?: number
) {
  const devicePixelRatio =
    dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1);
  const bufferWidth = canvasWidth * devicePixelRatio;
  const bufferHeight = canvasHeight * devicePixelRatio;
  const imageData = createRgbaImageData(bufferWidth, bufferHeight);
  const pixels = imageData.data;

  // Fill neutral color using buffer
  const neutral = 0xff008080;
  new Uint32Array(pixels.buffer).fill(neutral);

  const radius_ = radius * devicePixelRatio;
  const bezel = bezelWidth * devicePixelRatio;
  const outerRadius = radius_ + 1;

  const radiusSquared = radius_ ** 2;
  const radiusPlusOneSquared = outerRadius ** 2;
  const radiusMinusBezelSquared = (radius_ - bezel) ** 2;

  const objectWidth_ = objectWidth * devicePixelRatio;
  const objectHeight_ = objectHeight * devicePixelRatio;
  const widthBetweenRadiuses = objectWidth_ - radius_ * 2;
  const heightBetweenRadiuses = objectHeight_ - radius_ * 2;
  const rightSideStart = objectWidth_ - radius_;
  const bottomSideStart = objectHeight_ - radius_;
  const bezelIndexScale =
    bezel > 0 ? precomputedDisplacementMap.length / bezel : 0;
  const displacementScale =
    maximumDisplacement !== 0 ? 127 / maximumDisplacement : 0;

  const objectX = (bufferWidth - objectWidth_) / 2;
  const objectY = (bufferHeight - objectHeight_) / 2;

  for (let y1 = 0; y1 < objectHeight_; y1++) {
    const isOnTopSide = y1 < radius_;
    const isOnBottomSide = y1 >= bottomSideStart;
    const y = isOnTopSide
      ? y1 - radius_
      : isOnBottomSide
      ? y1 - radius_ - heightBetweenRadiuses
      : 0;
    const ySquared = y * y;
    const rowStart = ((objectY + y1) * bufferWidth + objectX) * 4;

    for (let x1 = 0; x1 < objectWidth_; x1++) {
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
        distanceToCenterSquared < radiusMinusBezelSquared
      ) {
        continue;
      }

      const distanceFromCenter = Math.sqrt(distanceToCenterSquared);
      const distanceFromSide = radius_ - distanceFromCenter;
      const opacity =
        distanceToCenterSquared < radiusSquared ? 1 : outerRadius - distanceFromCenter;
      const bezelIndex = (distanceFromSide * bezelIndexScale) | 0;
      const distance = precomputedDisplacementMap[bezelIndex] ?? 0;
      const factor =
        distanceFromCenter !== 0
          ? (distance * displacementScale * opacity) / distanceFromCenter
          : 0;

      pixels[idx] = 128 - x * factor; // R
      pixels[idx + 1] = 128 - y * factor; // G
      pixels[idx + 2] = 0; // B
      pixels[idx + 3] = 255; // A
    }
  }
  return imageData;
}
