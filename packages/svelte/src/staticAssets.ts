import type {
  LiquidGlassStaticAssetKey,
  LiquidGlassStaticAssetRegistry,
} from "@lollipopkit/liquid-glass";
import { createLiquidGlassStaticAssetRegistryManager } from "@lollipopkit/liquid-glass";

const staticAssetRegistry = createLiquidGlassStaticAssetRegistryManager();

export type { LiquidGlassStaticAssetKey, LiquidGlassStaticAssetRegistry };

export function configureLiquidGlassStaticAssets(
  nextRegistry: LiquidGlassStaticAssetRegistry
) {
  staticAssetRegistry.configure(nextRegistry);
}

export function resetLiquidGlassStaticAssets() {
  staticAssetRegistry.reset();
}

export function getLiquidGlassStaticAssets(
  key: LiquidGlassStaticAssetKey
) {
  return staticAssetRegistry.get(key);
}
