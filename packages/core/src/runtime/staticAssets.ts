import type { LiquidGlassFilterAssets } from "../filter";
import type {
  LiquidGlassStaticAssetKey,
  LiquidGlassStaticAssetRegistry,
} from "./assets";

export type LiquidGlassStaticAssetRegistryManager = {
  configure(nextRegistry: LiquidGlassStaticAssetRegistry): void;
  get(key: LiquidGlassStaticAssetKey): LiquidGlassFilterAssets | null;
  reset(): void;
};

export function createLiquidGlassStaticAssetRegistryManager(): LiquidGlassStaticAssetRegistryManager {
  const staticAssetRegistry: LiquidGlassStaticAssetRegistry = {};

  return {
    configure(nextRegistry) {
      Object.assign(staticAssetRegistry, nextRegistry);
    },
    get(key) {
      return staticAssetRegistry[key] ?? null;
    },
    reset() {
      for (const currentKey of Object.keys(
        staticAssetRegistry
      ) as LiquidGlassStaticAssetKey[]) {
        delete staticAssetRegistry[currentKey];
      }
    },
  };
}
