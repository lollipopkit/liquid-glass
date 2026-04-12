import {
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  LIP,
  type SurfaceFnDef,
} from "./lib/surfaceEquations";

export type SurfaceType =
  | "convex_circle"
  | "convex_squircle"
  | "concave"
  | "lip";

export type LiquidGlassSurfacePreset = SurfaceFnDef & {
  key: SurfaceType;
};

export type LiquidGlassFilterParams = {
  width: number;
  height: number;
  radius: number;
  bezelWidth: number;
  glassThickness: number;
  refractiveIndex: number;
  magnify: boolean;
  bezelType: SurfaceType;
};

export type LiquidGlassFilterParamInput = Partial<LiquidGlassFilterParams>;

export type LiquidGlassDisplacementAsset = {
  url: string;
  width: number;
  height: number;
  maxDisplacement: number;
  params: LiquidGlassFilterParams;
};

export type LiquidGlassImageAsset = {
  url: string;
  width: number;
  height: number;
  params: LiquidGlassFilterParams;
};

export type LiquidGlassFilterAssets = {
  displacementUrl: string;
  specularUrl: string;
  magnifyingUrl?: string;
  width: number;
  height: number;
  maxDisplacement: number;
  magnify: boolean;
  params: LiquidGlassFilterParams;
};

export const surfacePresets: LiquidGlassSurfacePreset[] = [
  { key: "convex_circle", ...CONVEX_CIRCLE },
  { key: "convex_squircle", ...CONVEX },
  { key: "concave", ...CONCAVE },
  { key: "lip", ...LIP },
];

export const LIQUID_GLASS_DEFAULT_FILTER_PARAMS: LiquidGlassFilterParams = {
  width: 150,
  height: 150,
  radius: 75,
  bezelWidth: 40,
  glassThickness: 120,
  refractiveIndex: 1.5,
  magnify: false,
  bezelType: "convex_squircle",
};

export function normalizeLiquidGlassFilterParams(
  input: LiquidGlassFilterParamInput = {}
): LiquidGlassFilterParams {
  return {
    width: input.width ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.width,
    height: input.height ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.height,
    radius:
      input.radius ??
      Math.min(
        LIQUID_GLASS_DEFAULT_FILTER_PARAMS.radius,
        (input.height ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.height) / 2
      ),
    bezelWidth: input.bezelWidth ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.bezelWidth,
    glassThickness:
      input.glassThickness ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.glassThickness,
    refractiveIndex:
      input.refractiveIndex ??
      LIQUID_GLASS_DEFAULT_FILTER_PARAMS.refractiveIndex,
    magnify: input.magnify ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.magnify,
    bezelType: input.bezelType ?? LIQUID_GLASS_DEFAULT_FILTER_PARAMS.bezelType,
  };
}

export function getLiquidGlassSurfacePreset(
  bezelType: SurfaceType
): LiquidGlassSurfacePreset {
  return (
    surfacePresets.find((preset) => preset.key === bezelType) ??
    surfacePresets[1]
  );
}

export function getLiquidGlassCacheKey(params: LiquidGlassFilterParams): string {
  return JSON.stringify(params);
}

export function getLiquidGlassHash(params: LiquidGlassFilterParams): string {
  const serialized = JSON.stringify(params);
  let hash = 0;

  if (serialized.length === 0) {
    return "0";
  }

  for (let index = 0; index < serialized.length; index++) {
    const charCode = serialized.charCodeAt(index);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}
