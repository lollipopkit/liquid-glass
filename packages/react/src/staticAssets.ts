import type {
  LiquidGlassFilterAssets,
  LiquidGlassStaticAssetKey,
  LiquidGlassStaticAssetRegistry,
} from "@lollipopkit/liquid-glass";

const staticAssetRegistry: LiquidGlassStaticAssetRegistry = {};

export type { LiquidGlassStaticAssetKey, LiquidGlassStaticAssetRegistry };

export function configureLiquidGlassStaticAssets(
  nextRegistry: LiquidGlassStaticAssetRegistry
) {
  Object.assign(staticAssetRegistry, nextRegistry);
}

export function resetLiquidGlassStaticAssets() {
  for (const key of Object.keys(staticAssetRegistry) as LiquidGlassStaticAssetKey[]) {
    delete staticAssetRegistry[key];
  }
}

export function getLiquidGlassStaticAssets(
  key: LiquidGlassStaticAssetKey
): LiquidGlassFilterAssets | null {
  return staticAssetRegistry[key] ?? null;
}
