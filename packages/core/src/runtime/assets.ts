import {
  getLiquidGlassSurfacePreset,
  normalizeLiquidGlassFilterParams,
  type LiquidGlassFilterAssets,
  type LiquidGlassFilterParamInput,
  type LiquidGlassFilterParams,
} from "../filter";
import type { RgbaImageData } from "../lib/imageData";
import {
  calculateDisplacementMap,
  calculateDisplacementMap2,
} from "../lib/displacementMap";
import { calculateMagnifyingDisplacementMap } from "../lib/magnifyingDisplacement";
import { calculateRefractionSpecular } from "../lib/specular";

export type LiquidGlassRuntimeBackend = "ts" | "worker";
export type LiquidGlassRuntimeBackendPreference =
  | LiquidGlassRuntimeBackend
  | "auto";
export type LiquidGlassAssetMode = "auto" | "static" | "runtime";
export type LiquidGlassStaticAssetKey =
  | "hero"
  | "magnifier"
  | "searchbox"
  | "slider"
  | "switch";
export type LiquidGlassStaticAssetRegistry = Partial<
  Record<LiquidGlassStaticAssetKey, LiquidGlassFilterAssets>
>;

export type CreateLiquidGlassRuntimeAssetsOptions = {
  backend?: LiquidGlassRuntimeBackendPreference;
  dpr?: number;
  signal?: AbortSignal;
  useCache?: boolean;
};

export type LiquidGlassRuntimeAssets = LiquidGlassFilterAssets & {
  backend: LiquidGlassRuntimeBackend;
  dispose(): void;
  update(
    input?: LiquidGlassFilterParamInput,
    options?: CreateLiquidGlassRuntimeAssetsOptions
  ): Promise<void>;
};

type RuntimeAssetState = LiquidGlassFilterAssets & {
  dpr: number;
  displacementObjectUrl: string;
  specularObjectUrl: string;
  magnifyingObjectUrl?: string;
};

type RuntimeDisplacementRender = Pick<
  RuntimeAssetState,
  "displacementObjectUrl" | "displacementUrl" | "maxDisplacement"
>;

type RuntimeSpecularRender = Pick<
  RuntimeAssetState,
  "specularObjectUrl" | "specularUrl"
>;

type RuntimeMagnifyingRender = Pick<
  RuntimeAssetState,
  "magnify" | "magnifyingObjectUrl" | "magnifyingUrl"
>;

type CachedDisplacementRender = {
  blob: Blob;
  maxDisplacement: number;
};

type CachedSpecularRender = {
  blob: Blob;
};

type CachedMagnifyingRender = {
  blob?: Blob;
  magnify: boolean;
};

const MAX_RUNTIME_CACHE_ENTRIES = 12;
const AUTO_WORKER_PIXEL_COST_THRESHOLD = 900_000;
const AUTO_WORKER_MAGNIFY_PIXEL_COST_THRESHOLD = 650_000;

let displacementCache = new Map<string, Promise<CachedDisplacementRender>>();
let specularCache = new Map<string, Promise<CachedSpecularRender>>();
let magnifyingCache = new Map<string, Promise<CachedMagnifyingRender>>();

function assertBrowserRuntime() {
  if (
    typeof OffscreenCanvas === "undefined" &&
    (typeof document === "undefined" || typeof document.createElement !== "function")
  ) {
    throw new Error(
      "Liquid glass runtime assets require OffscreenCanvas or document.createElement."
    );
  }
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

function resolveDevicePixelRatio(dpr?: number): number {
  return dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1);
}

export function resolveLiquidGlassRuntimeBackend(
  input: LiquidGlassFilterParamInput = {},
  dpr?: number,
  preferredBackend: LiquidGlassRuntimeBackendPreference = "auto",
  supportsWorkerBackend = false
): LiquidGlassRuntimeBackend {
  if (preferredBackend === "ts") {
    return "ts";
  }

  if (preferredBackend === "worker") {
    return supportsWorkerBackend ? "worker" : "ts";
  }

  if (!supportsWorkerBackend) {
    return "ts";
  }

  const params = normalizeLiquidGlassFilterParams(input);
  const resolvedDpr = resolveDevicePixelRatio(dpr);
  const pixelCost = params.width * params.height * resolvedDpr * resolvedDpr;

  if (
    pixelCost >= AUTO_WORKER_PIXEL_COST_THRESHOLD ||
    (params.magnify && pixelCost >= AUTO_WORKER_MAGNIFY_PIXEL_COST_THRESHOLD)
  ) {
    return "worker";
  }

  return "ts";
}

function getMaxDisplacement(values: number[]): number {
  let maxDisplacement = 0;

  for (const value of values) {
    const absolute = Math.abs(value);
    if (absolute > maxDisplacement) {
      maxDisplacement = absolute;
    }
  }

  return maxDisplacement;
}

function toImageData({ data, width, height }: RgbaImageData): ImageData {
  if (typeof ImageData !== "undefined" && data instanceof Uint8ClampedArray) {
    return new ImageData(new Uint8ClampedArray(data), width, height);
  }

  throw new Error("ImageData is not available in the current runtime.");
}

async function toPngBlob(
  imageData: RgbaImageData,
  signal?: AbortSignal
): Promise<Blob> {
  assertBrowserRuntime();
  assertNotAborted(signal);

  const browserImageData = toImageData(imageData);

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create a 2D drawing context for OffscreenCanvas.");
    }

    context.putImageData(browserImageData, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    assertNotAborted(signal);
    return blob;
  }

  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create a 2D drawing context for canvas.");
  }

  context.putImageData(browserImageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error("Canvas.toBlob returned null."));
        return;
      }

      resolve(value);
    }, "image/png");
  });

  assertNotAborted(signal);
  return blob;
}

function revokeObjectUrls(state: RuntimeAssetState) {
  URL.revokeObjectURL(state.displacementObjectUrl);
  URL.revokeObjectURL(state.specularObjectUrl);

  if (state.magnifyingObjectUrl) {
    URL.revokeObjectURL(state.magnifyingObjectUrl);
  }
}

function revokeIfDefined(objectUrl?: string) {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
}

function trimRuntimeCache<T>(cache: Map<string, Promise<T>>) {
  if (cache.size <= MAX_RUNTIME_CACHE_ENTRIES) {
    return;
  }

  const entries = [...cache.entries()];
  while (entries.length > MAX_RUNTIME_CACHE_ENTRIES) {
    const oldest = entries.shift();
    if (!oldest) {
      break;
    }

    cache.delete(oldest[0]);
  }
}

function getDisplacementCacheKey(
  params: LiquidGlassFilterParams,
  dpr: number
): string {
  return JSON.stringify({
    bezelType: params.bezelType,
    bezelWidth: params.bezelWidth,
    dpr,
    glassThickness: params.glassThickness,
    height: params.height,
    radius: params.radius,
    refractiveIndex: params.refractiveIndex,
    width: params.width,
  });
}

function getSpecularCacheKey(
  params: LiquidGlassFilterParams,
  dpr: number
): string {
  return JSON.stringify({
    bezelWidth: params.bezelWidth,
    dpr,
    height: params.height,
    radius: params.radius,
    width: params.width,
  });
}

function getMagnifyingCacheKey(
  params: LiquidGlassFilterParams,
  dpr: number
): string {
  return JSON.stringify({
    dpr,
    height: params.height,
    magnify: params.magnify,
    width: params.width,
  });
}

function shouldRerenderDisplacement(
  previous: LiquidGlassFilterParams,
  next: LiquidGlassFilterParams,
  previousDpr: number,
  nextDpr: number
): boolean {
  return (
    previous.width !== next.width ||
    previous.height !== next.height ||
    previous.radius !== next.radius ||
    previous.bezelWidth !== next.bezelWidth ||
    previous.glassThickness !== next.glassThickness ||
    previous.refractiveIndex !== next.refractiveIndex ||
    previous.bezelType !== next.bezelType ||
    previousDpr !== nextDpr
  );
}

function shouldRerenderSpecular(
  previous: LiquidGlassFilterParams,
  next: LiquidGlassFilterParams,
  previousDpr: number,
  nextDpr: number
): boolean {
  return (
    previous.width !== next.width ||
    previous.height !== next.height ||
    previous.radius !== next.radius ||
    previous.bezelWidth !== next.bezelWidth ||
    previousDpr !== nextDpr
  );
}

function shouldRerenderMagnifying(
  previous: LiquidGlassFilterParams,
  next: LiquidGlassFilterParams,
  previousDpr: number,
  nextDpr: number
): boolean {
  return (
    previous.magnify !== next.magnify ||
    previous.width !== next.width ||
    previous.height !== next.height ||
    previousDpr !== nextDpr
  );
}

async function renderDisplacementAsset(
  params: LiquidGlassFilterParams,
  signal?: AbortSignal,
  dpr?: number,
  useCache = true
): Promise<RuntimeDisplacementRender> {
  const resolvedDpr = resolveDevicePixelRatio(dpr);
  const renderPromise = useCache
    ? (() => {
        const key = getDisplacementCacheKey(params, resolvedDpr);
        const cached = displacementCache.get(key);
        if (cached) {
          displacementCache.delete(key);
          displacementCache.set(key, cached);
          return cached;
        }

        const next = (async () => {
          const surfacePreset = getLiquidGlassSurfacePreset(params.bezelType);
          const precomputedDisplacementMap = calculateDisplacementMap(
            params.glassThickness,
            params.bezelWidth,
            surfacePreset.fn,
            params.refractiveIndex
          );
          const displacementImageData = calculateDisplacementMap2(
            params.width,
            params.height,
            params.width,
            params.height,
            params.radius,
            params.bezelWidth,
            100,
            precomputedDisplacementMap,
            resolvedDpr
          );

          return {
            blob: await toPngBlob(displacementImageData),
            maxDisplacement: getMaxDisplacement(precomputedDisplacementMap),
          };
        })().catch((error) => {
          displacementCache.delete(key);
          throw error;
        });

        displacementCache.set(key, next);
        trimRuntimeCache(displacementCache);
        return next;
      })()
    : (async () => {
        const surfacePreset = getLiquidGlassSurfacePreset(params.bezelType);
        const precomputedDisplacementMap = calculateDisplacementMap(
          params.glassThickness,
          params.bezelWidth,
          surfacePreset.fn,
          params.refractiveIndex
        );
        const displacementImageData = calculateDisplacementMap2(
          params.width,
          params.height,
          params.width,
          params.height,
          params.radius,
          params.bezelWidth,
          100,
          precomputedDisplacementMap,
          resolvedDpr
        );

        return {
          blob: await toPngBlob(displacementImageData, signal),
          maxDisplacement: getMaxDisplacement(precomputedDisplacementMap),
        };
      })();
  const displacementRender = await renderPromise;
  assertNotAborted(signal);
  const displacementObjectUrl = URL.createObjectURL(displacementRender.blob);

  return {
    displacementObjectUrl,
    displacementUrl: displacementObjectUrl,
    maxDisplacement: displacementRender.maxDisplacement,
  };
}

async function renderSpecularAsset(
  params: LiquidGlassFilterParams,
  signal?: AbortSignal,
  dpr?: number,
  useCache = true
): Promise<RuntimeSpecularRender> {
  const resolvedDpr = resolveDevicePixelRatio(dpr);
  const renderPromise = useCache
    ? (() => {
        const key = getSpecularCacheKey(params, resolvedDpr);
        const cached = specularCache.get(key);
        if (cached) {
          specularCache.delete(key);
          specularCache.set(key, cached);
          return cached;
        }

        const next = (async () => ({
          blob: await toPngBlob(
            calculateRefractionSpecular(
              params.width,
              params.height,
              params.radius,
              params.bezelWidth,
              undefined,
              resolvedDpr
            )
          ),
        }))().catch((error) => {
          specularCache.delete(key);
          throw error;
        });

        specularCache.set(key, next);
        trimRuntimeCache(specularCache);
        return next;
      })()
    : (async () => ({
        blob: await toPngBlob(
          calculateRefractionSpecular(
            params.width,
            params.height,
            params.radius,
            params.bezelWidth,
            undefined,
            resolvedDpr
          ),
          signal
        ),
      }))();
  const specularRender = await renderPromise;
  assertNotAborted(signal);
  const specularObjectUrl = URL.createObjectURL(specularRender.blob);

  return {
    specularObjectUrl,
    specularUrl: specularObjectUrl,
  };
}

async function renderMagnifyingAsset(
  params: LiquidGlassFilterParams,
  signal?: AbortSignal,
  dpr?: number,
  useCache = true
): Promise<RuntimeMagnifyingRender> {
  const resolvedDpr = resolveDevicePixelRatio(dpr);
  const renderPromise = useCache
    ? (() => {
        const key = getMagnifyingCacheKey(params, resolvedDpr);
        const cached = magnifyingCache.get(key);
        if (cached) {
          magnifyingCache.delete(key);
          magnifyingCache.set(key, cached);
          return cached;
        }

        const next = (async () => {
          if (!params.magnify) {
            return {
              magnify: false,
            };
          }

          return {
            blob: await toPngBlob(
              calculateMagnifyingDisplacementMap(
                params.width,
                params.height,
                resolvedDpr
              )
            ),
            magnify: true,
          };
        })().catch((error) => {
          magnifyingCache.delete(key);
          throw error;
        });

        magnifyingCache.set(key, next);
        trimRuntimeCache(magnifyingCache);
        return next;
      })()
    : (async () => {
        if (!params.magnify) {
          return {
            magnify: false,
          };
        }

        return {
          blob: await toPngBlob(
            calculateMagnifyingDisplacementMap(
              params.width,
              params.height,
              resolvedDpr
            ),
            signal
          ),
          magnify: true,
        };
      })();
  const magnifyingRender = await renderPromise;
  assertNotAborted(signal);
  const magnifyingObjectUrl = magnifyingRender.blob
    ? URL.createObjectURL(magnifyingRender.blob)
    : undefined;

  return {
    magnify: magnifyingRender.magnify,
    magnifyingObjectUrl,
    magnifyingUrl: magnifyingObjectUrl,
  };
}

async function renderRuntimeAssetState(
  input: LiquidGlassFilterParamInput = {},
  options: CreateLiquidGlassRuntimeAssetsOptions = {}
): Promise<RuntimeAssetState> {
  const params = normalizeLiquidGlassFilterParams(input);
  const resolvedDpr = resolveDevicePixelRatio(options.dpr);
  const useCache = options.useCache ?? true;
  let displacementRender: RuntimeDisplacementRender | undefined;
  let specularRender: RuntimeSpecularRender | undefined;
  let magnifyingRender: RuntimeMagnifyingRender | undefined;

  try {
    [displacementRender, specularRender, magnifyingRender] = await Promise.all([
      renderDisplacementAsset(params, options.signal, resolvedDpr, useCache),
      renderSpecularAsset(params, options.signal, resolvedDpr, useCache),
      renderMagnifyingAsset(params, options.signal, resolvedDpr, useCache),
    ]);
  } catch (error) {
    revokeIfDefined(displacementRender?.displacementObjectUrl);
    revokeIfDefined(specularRender?.specularObjectUrl);
    revokeIfDefined(magnifyingRender?.magnifyingObjectUrl);

    throw error;
  }

  return {
    displacementObjectUrl: displacementRender.displacementObjectUrl,
    displacementUrl: displacementRender.displacementUrl,
    dpr: resolvedDpr,
    height: params.height,
    magnify: magnifyingRender.magnify,
    magnifyingObjectUrl: magnifyingRender.magnifyingObjectUrl,
    magnifyingUrl: magnifyingRender.magnifyingUrl,
    maxDisplacement: displacementRender.maxDisplacement,
    params,
    specularObjectUrl: specularRender.specularObjectUrl,
    specularUrl: specularRender.specularUrl,
    width: params.width,
  };
}

export async function createLiquidGlassRuntimeAssets(
  input: LiquidGlassFilterParamInput = {},
  options: CreateLiquidGlassRuntimeAssetsOptions = {}
): Promise<LiquidGlassRuntimeAssets> {
  const resolvedBackend = resolveLiquidGlassRuntimeBackend(
    input,
    options.dpr,
    options.backend,
    false
  );
  let state = await renderRuntimeAssetState(input, options);
  let disposed = false;
  let dprOverride = options.dpr;
  let backendPreference = options.backend;
  let useCache = options.useCache ?? true;

  const runtimeAssets: LiquidGlassRuntimeAssets = {
    backend: resolvedBackend,
    displacementUrl: state.displacementUrl,
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      revokeObjectUrls(state);
    },
    height: state.height,
    magnify: state.magnify,
    magnifyingUrl: state.magnifyingUrl,
    maxDisplacement: state.maxDisplacement,
    params: state.params,
    specularUrl: state.specularUrl,
    async update(nextInput = {}, nextOptions = {}) {
      if (disposed) {
        throw new Error("Cannot update disposed liquid glass runtime assets.");
      }

      backendPreference = nextOptions.backend ?? backendPreference;
      const mergedDpr = nextOptions.dpr ?? dprOverride;
      useCache = nextOptions.useCache ?? useCache;
      const nextParams = normalizeLiquidGlassFilterParams({
        ...state.params,
        ...nextInput,
      });
      const nextDpr = resolveDevicePixelRatio(mergedDpr);
      const nextBackend = resolveLiquidGlassRuntimeBackend(
        nextParams,
        nextDpr,
        backendPreference,
        false
      );
      const rerenderDisplacement = shouldRerenderDisplacement(
        state.params,
        nextParams,
        state.dpr,
        nextDpr
      );
      const rerenderSpecular = shouldRerenderSpecular(
        state.params,
        nextParams,
        state.dpr,
        nextDpr
      );
      const rerenderMagnifying = shouldRerenderMagnifying(
        state.params,
        nextParams,
        state.dpr,
        nextDpr
      );

      let displacementRender: RuntimeDisplacementRender | undefined;
      let specularRender: RuntimeSpecularRender | undefined;
      let magnifyingRender: RuntimeMagnifyingRender | undefined;

      if (nextBackend !== "ts") {
        throw new Error(
          "Worker runtime is not available in createLiquidGlassRuntimeAssets()."
        );
      }

      try {
        [displacementRender, specularRender, magnifyingRender] = await Promise.all([
          rerenderDisplacement
            ? renderDisplacementAsset(nextParams, nextOptions.signal, nextDpr, useCache)
            : Promise.resolve(undefined),
          rerenderSpecular
            ? renderSpecularAsset(nextParams, nextOptions.signal, nextDpr, useCache)
            : Promise.resolve(undefined),
          rerenderMagnifying
            ? renderMagnifyingAsset(nextParams, nextOptions.signal, nextDpr, useCache)
            : Promise.resolve(undefined),
        ]);
      } catch (error) {
        revokeIfDefined(displacementRender?.displacementObjectUrl);
        revokeIfDefined(specularRender?.specularObjectUrl);
        revokeIfDefined(magnifyingRender?.magnifyingObjectUrl);
        throw error;
      }

      const previousState = state;
      state = {
        displacementObjectUrl:
          displacementRender?.displacementObjectUrl ??
          previousState.displacementObjectUrl,
        displacementUrl:
          displacementRender?.displacementUrl ?? previousState.displacementUrl,
        dpr: nextDpr,
        height: nextParams.height,
        magnify: magnifyingRender?.magnify ?? nextParams.magnify,
        magnifyingObjectUrl:
          magnifyingRender !== undefined
            ? magnifyingRender.magnifyingObjectUrl
            : previousState.magnifyingObjectUrl,
        magnifyingUrl:
          magnifyingRender !== undefined
            ? magnifyingRender.magnifyingUrl
            : previousState.magnifyingUrl,
        maxDisplacement:
          displacementRender?.maxDisplacement ?? previousState.maxDisplacement,
        params: nextParams,
        specularObjectUrl:
          specularRender?.specularObjectUrl ?? previousState.specularObjectUrl,
        specularUrl: specularRender?.specularUrl ?? previousState.specularUrl,
        width: nextParams.width,
      };

      if (rerenderDisplacement) {
        revokeIfDefined(previousState.displacementObjectUrl);
      }

      if (rerenderSpecular) {
        revokeIfDefined(previousState.specularObjectUrl);
      }

      if (rerenderMagnifying) {
        revokeIfDefined(previousState.magnifyingObjectUrl);
      }

      dprOverride = mergedDpr;
      runtimeAssets.displacementUrl = state.displacementUrl;
      runtimeAssets.height = state.height;
      runtimeAssets.magnify = state.magnify;
      runtimeAssets.magnifyingUrl = state.magnifyingUrl;
      runtimeAssets.maxDisplacement = state.maxDisplacement;
      runtimeAssets.params = state.params;
      runtimeAssets.specularUrl = state.specularUrl;
      runtimeAssets.width = state.width;
    },
    width: state.width,
  };

  return runtimeAssets;
}
