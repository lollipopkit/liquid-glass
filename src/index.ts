import {
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  LIP,
  type SurfaceFnDef,
} from "./lib/surfaceEquations";

export type { SurfaceFnDef } from "./lib/surfaceEquations";
export {
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  LIP,
} from "./lib/surfaceEquations";
export {
  calculateDisplacementMap,
  calculateDisplacementMap2,
} from "./lib/displacementMap";
export { calculateMagnifyingDisplacementMap } from "./lib/magnifyingDisplacement";
export { calculateRefractionSpecular } from "./lib/specular";

export type SurfaceType =
  | "convex_circle"
  | "convex_squircle"
  | "concave"
  | "lip";

export type LiquidGlassSurfacePreset = SurfaceFnDef & {
  key: SurfaceType;
};

export const surfacePresets: LiquidGlassSurfacePreset[] = [
  { key: "convex_circle", ...CONVEX_CIRCLE },
  { key: "convex_squircle", ...CONVEX },
  { key: "concave", ...CONCAVE },
  { key: "lip", ...LIP },
];
