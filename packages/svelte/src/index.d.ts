import { SvelteComponent } from "svelte";
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

export interface LiquidSearchboxProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  autocomplete?: string;
  inputClass?: string;
  className?: string;
  runtime?: boolean;
  runtimeParams?: Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;
  runtimeOptions?: CreateLiquidGlassRuntimeAssetsOptions;
}

export interface LiquidSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  runtime?: boolean;
  runtimeParams?: Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;
  runtimeOptions?: CreateLiquidGlassRuntimeAssetsOptions;
}

export interface LiquidSwitchProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  runtime?: boolean;
  runtimeParams?: Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;
  runtimeOptions?: CreateLiquidGlassRuntimeAssetsOptions;
}

export interface LiquidMagnifyingGlassProps {
  lensWidth?: number;
  lensHeight?: number;
  initialX?: number;
  initialY?: number;
  magnification?: number;
  className?: string;
  runtime?: boolean;
  runtimeParams?: Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;
  runtimeOptions?: CreateLiquidGlassRuntimeAssetsOptions;
}

export interface LiquidParallaxHeroProps {
  imageSrc: string;
  alt: string;
  focalImageSrc?: string;
  height?: number | string;
  lensSize?: number;
  parallaxSpeed?: number;
  className?: string;
}

export interface LiquidGlassRuntimeStoreState {
  assets: LiquidGlassFilterAssets | null;
  backend: LiquidGlassRuntimeBackend | null;
  error: Error | null;
  isPending: boolean;
}

export interface LiquidGlassRuntimeStore {
  subscribe: (
    run: (value: LiquidGlassRuntimeStoreState) => void
  ) => () => void;
  dispose: () => void;
  refresh: (forceRecreate?: boolean) => Promise<void>;
  setConfig: (
    nextInput: LiquidGlassFilterParamInput,
    nextOptions?: CreateLiquidGlassRuntimeAssetsOptions
  ) => Promise<void>;
  setInput: (nextInput: LiquidGlassFilterParamInput) => Promise<void>;
  setOptions: (
    nextOptions: CreateLiquidGlassRuntimeAssetsOptions
  ) => Promise<void>;
  updateInput: (patch: LiquidGlassFilterParamInput) => Promise<void>;
  updateOptions: (
    patch: CreateLiquidGlassRuntimeAssetsOptions
  ) => Promise<void>;
}

export function createLiquidGlassRuntimeStore(
  initialInput?: LiquidGlassFilterParamInput,
  initialOptions?: CreateLiquidGlassRuntimeAssetsOptions
): LiquidGlassRuntimeStore;

export class LiquidSearchbox extends SvelteComponent<LiquidSearchboxProps> {}
export class LiquidSlider extends SvelteComponent<LiquidSliderProps> {}
export class LiquidSwitch extends SvelteComponent<LiquidSwitchProps> {}
export class LiquidMagnifyingGlass extends SvelteComponent<LiquidMagnifyingGlassProps> {}
export class LiquidParallaxHero extends SvelteComponent<LiquidParallaxHeroProps> {}
