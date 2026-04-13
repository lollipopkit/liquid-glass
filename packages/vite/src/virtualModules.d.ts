import type {
  LiquidGlassDisplacementAsset,
  LiquidGlassFilterAssets,
  LiquidGlassImageAsset,
  LiquidGlassStaticAssetRegistry,
} from "@lollipopkit/liquid-glass";

declare module "virtual:liquidGlassDisplacementMap*" {
  const data: LiquidGlassDisplacementAsset;
  export const url: string;
  export const width: number;
  export const height: number;
  export const maxDisplacement: number;
  export default data;
}

declare module "virtual:liquidGlassSpecularMap*" {
  const data: LiquidGlassImageAsset;
  export const url: string;
  export const width: number;
  export const height: number;
  export default data;
}

declare module "virtual:liquidGlassMagnifyingMap*" {
  const data: LiquidGlassImageAsset;
  export const url: string;
  export const width: number;
  export const height: number;
  export default data;
}

declare module "virtual:liquidGlassFilterAssets*" {
  const data: LiquidGlassFilterAssets;
  export default data;
}

declare module "virtual:liquidGlassStaticAssetRegistry" {
  const data: LiquidGlassStaticAssetRegistry;
  export const staticAssets: LiquidGlassStaticAssetRegistry;
  export function registerLiquidGlassStaticAssets(
    configure: (assets: LiquidGlassStaticAssetRegistry) => void
  ): LiquidGlassStaticAssetRegistry;
  export default data;
}
