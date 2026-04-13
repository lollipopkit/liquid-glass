import componentStyles from "./styles.css?inline";
import "./styles.css";
export type {
  LiquidGlassRuntimeStore,
  LiquidGlassRuntimeStoreState,
} from "./runtime";
export { createLiquidGlassRuntimeStore } from "./runtime";

const STYLE_ID = "liquid-glass-svelte-styles";

function ensureComponentStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = componentStyles;
  document.head.appendChild(style);
}

ensureComponentStyles();

export type {
  CreateLiquidGlassRuntimeAssetsOptions,
  LiquidGlassFilterAssets,
  LiquidGlassFilterParamInput,
  LiquidGlassManagedRuntimeAssets,
  LiquidGlassRuntimeAssets,
  LiquidGlassRuntimeBackend,
  LiquidGlassRuntimeBackendPreference,
} from "@lollipopkit/liquid-glass";
export {
  canUseLiquidGlassWorkerRuntime,
  createLiquidGlassRuntimeAssets,
  createManagedLiquidGlassRuntimeAssets,
  normalizeLiquidGlassFilterParams,
  prewarmLiquidGlassManagedRuntimeAssets,
  primeLiquidGlassWorkerRuntime,
  resolveLiquidGlassRuntimeBackend,
} from "@lollipopkit/liquid-glass";
export { default as LiquidSearchbox } from "./components/LiquidSearchbox.svelte";
export { default as LiquidSlider } from "./components/LiquidSlider.svelte";
export { default as LiquidSwitch } from "./components/LiquidSwitch.svelte";
export { default as LiquidMagnifyingGlass } from "./components/LiquidMagnifyingGlass.svelte";
export { default as LiquidParallaxHero } from "./components/LiquidParallaxHero.svelte";
