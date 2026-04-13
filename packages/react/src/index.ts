import componentStyles from "./styles.css?inline";
import "./styles.css";
export type {
  UseLiquidGlassRuntimeAssetsOptions,
  UseLiquidGlassRuntimeAssetsResult,
} from "./runtime";
export { useLiquidGlassRuntimeAssets } from "./runtime";

const STYLE_ID = "liquid-glass-react-styles";

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
  CreateLiquidGlassWorkerOptions,
  CreateLiquidGlassRuntimeAssetsOptions,
  LiquidGlassAssetMode,
  LiquidGlassFilterAssets,
  LiquidGlassFilterParamInput,
  LiquidGlassManagedRuntimeAssets,
  LiquidGlassRuntimeAssets,
  LiquidGlassRuntimeBackend,
  LiquidGlassRuntimeBackendPreference,
  LiquidGlassStaticAssetKey,
  LiquidGlassStaticAssetRegistry,
  LiquidGlassWorkerFactory,
} from "@lollipopkit/liquid-glass";
export {
  canUseLiquidGlassWorkerRuntime,
  configureLiquidGlassWorkerRuntime,
  createLiquidGlassRuntimeAssets,
  createManagedLiquidGlassRuntimeAssets,
  normalizeLiquidGlassFilterParams,
  prewarmLiquidGlassManagedRuntimeAssets,
  primeLiquidGlassWorkerRuntime,
  resolveLiquidGlassRuntimeBackend,
} from "@lollipopkit/liquid-glass";
export {
  configureLiquidGlassStaticAssets,
  getLiquidGlassStaticAssets,
  resetLiquidGlassStaticAssets,
} from "./staticAssets";
export type { LiquidSearchboxProps } from "./components/LiquidSearchbox";
export { LiquidSearchbox } from "./components/LiquidSearchbox";
export type { LiquidSliderProps } from "./components/LiquidSlider";
export { LiquidSlider } from "./components/LiquidSlider";
export type { LiquidSwitchProps } from "./components/LiquidSwitch";
export { LiquidSwitch } from "./components/LiquidSwitch";
export type { LiquidMagnifyingGlassProps } from "./components/LiquidMagnifyingGlass";
export { LiquidMagnifyingGlass } from "./components/LiquidMagnifyingGlass";
export type { LiquidParallaxHeroProps } from "./components/LiquidParallaxHero";
export { LiquidParallaxHero } from "./components/LiquidParallaxHero";
