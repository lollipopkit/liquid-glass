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

export type LiquidGlassRuntimeBackend = "ts";

export type CreateLiquidGlassRuntimeAssetsOptions = {
  dpr?: number;
  signal?: AbortSignal;
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

async function toPngObjectUrl(
  imageData: RgbaImageData,
  signal?: AbortSignal
): Promise<string> {
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
    return URL.createObjectURL(blob);
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
  return URL.createObjectURL(blob);
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
  dpr?: number
): Promise<RuntimeDisplacementRender> {
  const surfacePreset = getLiquidGlassSurfacePreset(params.bezelType);
  const precomputedDisplacementMap = calculateDisplacementMap(
    params.glassThickness,
    params.bezelWidth,
    surfacePreset.fn,
    params.refractiveIndex
  );
  const maxDisplacement = getMaxDisplacement(precomputedDisplacementMap);
  const displacementImageData = calculateDisplacementMap2(
    params.width,
    params.height,
    params.width,
    params.height,
    params.radius,
    params.bezelWidth,
    100,
    precomputedDisplacementMap,
    dpr
  );
  const displacementObjectUrl = await toPngObjectUrl(displacementImageData, signal);

  return {
    displacementObjectUrl,
    displacementUrl: displacementObjectUrl,
    maxDisplacement,
  };
}

async function renderSpecularAsset(
  params: LiquidGlassFilterParams,
  signal?: AbortSignal,
  dpr?: number
): Promise<RuntimeSpecularRender> {
  const specularImageData = calculateRefractionSpecular(
    params.width,
    params.height,
    params.radius,
    params.bezelWidth,
    undefined,
    dpr
  );
  const specularObjectUrl = await toPngObjectUrl(specularImageData, signal);

  return {
    specularObjectUrl,
    specularUrl: specularObjectUrl,
  };
}

async function renderMagnifyingAsset(
  params: LiquidGlassFilterParams,
  signal?: AbortSignal,
  dpr?: number
): Promise<RuntimeMagnifyingRender> {
  if (!params.magnify) {
    return {
      magnify: false,
      magnifyingObjectUrl: undefined,
      magnifyingUrl: undefined,
    };
  }

  const magnifyingImageData = calculateMagnifyingDisplacementMap(
    params.width,
    params.height,
    dpr
  );
  const magnifyingObjectUrl = await toPngObjectUrl(magnifyingImageData, signal);

  return {
    magnify: true,
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
  let displacementRender: RuntimeDisplacementRender | undefined;
  let specularRender: RuntimeSpecularRender | undefined;
  let magnifyingRender: RuntimeMagnifyingRender | undefined;

  try {
    [displacementRender, specularRender, magnifyingRender] = await Promise.all([
      renderDisplacementAsset(params, options.signal, resolvedDpr),
      renderSpecularAsset(params, options.signal, resolvedDpr),
      renderMagnifyingAsset(params, options.signal, resolvedDpr),
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
  let state = await renderRuntimeAssetState(input, options);
  let disposed = false;
  let dprOverride = options.dpr;

  const runtimeAssets: LiquidGlassRuntimeAssets = {
    backend: "ts",
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

      const mergedDpr = nextOptions.dpr ?? dprOverride;
      const nextParams = normalizeLiquidGlassFilterParams({
        ...state.params,
        ...nextInput,
      });
      const nextDpr = resolveDevicePixelRatio(mergedDpr);
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

      try {
        [displacementRender, specularRender, magnifyingRender] = await Promise.all([
          rerenderDisplacement
            ? renderDisplacementAsset(nextParams, nextOptions.signal, nextDpr)
            : Promise.resolve(undefined),
          rerenderSpecular
            ? renderSpecularAsset(nextParams, nextOptions.signal, nextDpr)
            : Promise.resolve(undefined),
          rerenderMagnifying
            ? renderMagnifyingAsset(nextParams, nextOptions.signal, nextDpr)
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
