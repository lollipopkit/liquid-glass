import {
  calculateDisplacementMap,
  calculateDisplacementMap2,
} from "../lib/displacementMap";
import { calculateMagnifyingDisplacementMap } from "../lib/magnifyingDisplacement";
import { calculateRefractionSpecular } from "../lib/specular";
import { getLiquidGlassSurfacePreset, normalizeLiquidGlassFilterParams } from "../filter";
import type { RgbaImageData } from "../lib/imageData";

import type {
  WorkerRequest,
  WorkerRenderRequest,
  WorkerRenderResponse,
} from "./workerProtocol";

let warmupPromise: Promise<void> | undefined;

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

function toBrowserImageData(imageData: RgbaImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

async function encodePngBlob(imageData: RgbaImageData): Promise<Blob> {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("OffscreenCanvas is required for the worker runtime backend.");
  }

  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create a 2D drawing context for OffscreenCanvas.");
  }

  context.putImageData(toBrowserImageData(imageData), 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

async function ensureWarmup() {
  if (warmupPromise) {
    return warmupPromise;
  }

  warmupPromise = encodePngBlob({
    data: new Uint8ClampedArray([0, 0, 0, 0]),
    height: 1,
    width: 1,
  }).then(() => undefined);

  await warmupPromise;
}

async function handleRender(
  request: WorkerRenderRequest
): Promise<WorkerRenderResponse> {
  await ensureWarmup();
  const params = normalizeLiquidGlassFilterParams(request.input);
  const response: WorkerRenderResponse = {
    dpr: request.dpr,
    id: request.id,
    params,
    type: "render",
  };

  if (request.tasks.includes("displacement")) {
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
      request.dpr
    );

    response.displacement = {
      blob: await encodePngBlob(displacementImageData),
      maxDisplacement: getMaxDisplacement(precomputedDisplacementMap),
    };
  }

  if (request.tasks.includes("specular")) {
    response.specular = {
      blob: await encodePngBlob(
        calculateRefractionSpecular(
          params.width,
          params.height,
          params.radius,
          params.bezelWidth,
          undefined,
          request.dpr
        )
      ),
    };
  }

  if (request.tasks.includes("magnifying")) {
    if (!params.magnify) {
      response.magnifying = { magnify: false };
    } else {
      response.magnifying = {
        blob: await encodePngBlob(
          calculateMagnifyingDisplacementMap(
            params.width,
            params.height,
            request.dpr
          )
        ),
        magnify: true,
      };
    }
  }

  return response;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === "warmup") {
      await ensureWarmup();
      self.postMessage({
        id: event.data.id,
        type: "warmup",
      });
      return;
    }

    const response = await handleRender(event.data);
    self.postMessage(response);
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? { message: error.message, name: error.name }
        : { message: "Worker render failed.", name: "Error" };

    self.postMessage({
      id: event.data.id,
      ...normalizedError,
      type: "error",
    });
  }
};
