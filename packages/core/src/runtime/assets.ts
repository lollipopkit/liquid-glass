import {
  getLiquidGlassSurfacePreset,
  normalizeLiquidGlassFilterParams,
  type LiquidGlassFilterAssets,
  type LiquidGlassFilterParamInput,
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
  displacementObjectUrl: string;
  specularObjectUrl: string;
  magnifyingObjectUrl?: string;
};

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

async function renderRuntimeAssetState(
  input: LiquidGlassFilterParamInput = {},
  options: CreateLiquidGlassRuntimeAssetsOptions = {}
): Promise<RuntimeAssetState> {
  const params = normalizeLiquidGlassFilterParams(input);
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
    options.dpr
  );
  const specularImageData = calculateRefractionSpecular(
    params.width,
    params.height,
    params.radius,
    params.bezelWidth,
    undefined,
    options.dpr
  );
  const magnifyingImageData = params.magnify
    ? calculateMagnifyingDisplacementMap(params.width, params.height)
    : undefined;

  let displacementObjectUrl: string | undefined;
  let specularObjectUrl: string | undefined;
  let magnifyingObjectUrl: string | undefined;

  try {
    displacementObjectUrl = await toPngObjectUrl(
      displacementImageData,
      options.signal
    );
    specularObjectUrl = await toPngObjectUrl(specularImageData, options.signal);
    magnifyingObjectUrl = magnifyingImageData
      ? await toPngObjectUrl(magnifyingImageData, options.signal)
      : undefined;
  } catch (error) {
    if (displacementObjectUrl) {
      URL.revokeObjectURL(displacementObjectUrl);
    }

    if (specularObjectUrl) {
      URL.revokeObjectURL(specularObjectUrl);
    }

    if (magnifyingObjectUrl) {
      URL.revokeObjectURL(magnifyingObjectUrl);
    }

    throw error;
  }

  return {
    displacementObjectUrl,
    displacementUrl: displacementObjectUrl,
    height: params.height,
    magnify: params.magnify,
    magnifyingObjectUrl,
    magnifyingUrl: magnifyingObjectUrl,
    maxDisplacement,
    params,
    specularObjectUrl,
    specularUrl: specularObjectUrl,
    width: params.width,
  };
}

export async function createLiquidGlassRuntimeAssets(
  input: LiquidGlassFilterParamInput = {},
  options: CreateLiquidGlassRuntimeAssetsOptions = {}
): Promise<LiquidGlassRuntimeAssets> {
  let state = await renderRuntimeAssetState(input, options);
  let disposed = false;

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

      const nextState = await renderRuntimeAssetState(
        {
          ...state.params,
          ...nextInput,
        },
        {
          ...options,
          ...nextOptions,
        }
      );

      revokeObjectUrls(state);
      state = nextState;

      runtimeAssets.displacementUrl = nextState.displacementUrl;
      runtimeAssets.height = nextState.height;
      runtimeAssets.magnify = nextState.magnify;
      runtimeAssets.magnifyingUrl = nextState.magnifyingUrl;
      runtimeAssets.maxDisplacement = nextState.maxDisplacement;
      runtimeAssets.params = nextState.params;
      runtimeAssets.specularUrl = nextState.specularUrl;
      runtimeAssets.width = nextState.width;
    },
    width: state.width,
  };

  return runtimeAssets;
}
