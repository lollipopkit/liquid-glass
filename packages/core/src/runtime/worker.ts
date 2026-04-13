import {
  createLiquidGlassRuntimeAssets,
  resolveLiquidGlassRuntimeBackend,
  type CreateLiquidGlassRuntimeAssetsOptions,
  type LiquidGlassRuntimeAssets,
} from "./assets";
import type {
  LiquidGlassFilterAssets,
  LiquidGlassFilterParamInput,
  LiquidGlassFilterParams,
} from "../filter";
import { normalizeLiquidGlassFilterParams } from "../filter";
import type {
  WorkerRenderResponse,
  WorkerRenderTask,
  WorkerResponse,
  WorkerWarmupResponse,
} from "./workerProtocol";

export type LiquidGlassManagedRuntimeAssets = Omit<
  LiquidGlassRuntimeAssets,
  "update"
> & {
  update(
    input?: LiquidGlassFilterParamInput,
    options?: CreateLiquidGlassRuntimeAssetsOptions
  ): Promise<void>;
};

export type CreateLiquidGlassWorkerOptions = {
  name?: string;
};

export type LiquidGlassWorkerFactory = (
  options?: CreateLiquidGlassWorkerOptions
) => Worker;

type WorkerRuntimeState = LiquidGlassFilterAssets & {
  dpr: number;
  displacementObjectUrl: string;
  magnifyingObjectUrl?: string;
  specularObjectUrl: string;
};

const ALL_RENDER_TASKS: WorkerRenderTask[] = [
  "displacement",
  "specular",
  "magnifying",
];
const MAX_WORKER_RENDER_CACHE_ENTRIES = 4;

let renderCache = new Map<string, Promise<WorkerRenderResponse>>();
let sharedWorkerClient: LiquidGlassRuntimeWorkerClient | undefined;
let workerWarmupPromise: Promise<void> | undefined;
let workerFactoryOverride: LiquidGlassWorkerFactory | undefined;

class LiquidGlassRuntimeWorkerClient {
  private readonly pending = new Map<
    number,
    {
      reject: (reason?: unknown) => void;
      resolve: (response: WorkerRenderResponse | WorkerWarmupResponse) => void;
    }
  >();
  private requestId = 0;
  private readonly worker: Worker;

  constructor() {
    this.worker = getLiquidGlassWorkerFactory()({
      name: "liquid-glass-runtime",
    });

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const pendingRequest = this.pending.get(event.data.id);
      if (!pendingRequest) {
        return;
      }

      this.pending.delete(event.data.id);

      if (event.data.type === "error") {
        const error = new Error(event.data.message);
        error.name = event.data.name ?? "Error";
        pendingRequest.reject(error);
        return;
      }

      pendingRequest.resolve(event.data);
    };

    this.worker.onerror = (event: ErrorEvent) => {
      const error = event.error ?? new Error(event.message || "Worker crashed.");

      for (const pendingRequest of this.pending.values()) {
        pendingRequest.reject(error);
      }

      this.pending.clear();
    };
  }

  dispose(reason = new Error("Liquid glass worker runtime was reset.")) {
    for (const pendingRequest of this.pending.values()) {
      pendingRequest.reject(reason);
    }

    this.pending.clear();
    this.worker.terminate();
  }

  render(
    input: LiquidGlassFilterParamInput,
    dpr: number,
    tasks: WorkerRenderTask[]
  ): Promise<WorkerRenderResponse> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, {
        reject,
        resolve: (response) => resolve(response as WorkerRenderResponse),
      });
      this.worker.postMessage({
        dpr,
        id,
        input,
        tasks,
        type: "render",
      });
    });
  }

  warmup(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, {
        reject,
        resolve: () => resolve(),
      });
      this.worker.postMessage({
        id,
        type: "warmup",
      });
    });
  }
}

function supportsWorkerBackend() {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function"
  );
}

function createDefaultLiquidGlassWorker(
  options?: CreateLiquidGlassWorkerOptions
): Worker {
  const workerUrl = new URL("./runtime/liquidGlassRuntime.worker.js", import.meta.url);
  return new Worker(workerUrl, {
    name: options?.name,
    type: "module",
  });
}

function getLiquidGlassWorkerFactory(): LiquidGlassWorkerFactory {
  return workerFactoryOverride ?? createDefaultLiquidGlassWorker;
}

export function canUseLiquidGlassWorkerRuntime() {
  return supportsWorkerBackend();
}

export function configureLiquidGlassWorkerRuntime(options?: {
  workerFactory?: LiquidGlassWorkerFactory;
}) {
  const nextFactory = options?.workerFactory;
  if (nextFactory === workerFactoryOverride) {
    return;
  }

  workerFactoryOverride = nextFactory;
  renderCache = new Map();
  workerWarmupPromise = undefined;

  if (sharedWorkerClient) {
    sharedWorkerClient.dispose();
    sharedWorkerClient = undefined;
  }
}

function getWorkerClient() {
  if (!sharedWorkerClient) {
    sharedWorkerClient = new LiquidGlassRuntimeWorkerClient();
  }

  return sharedWorkerClient;
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

function resolveDevicePixelRatio(dpr?: number): number {
  return dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1);
}

function getWorkerRenderCacheKey(
  input: LiquidGlassFilterParamInput,
  dpr: number,
  tasks: WorkerRenderTask[]
): string {
  return JSON.stringify({
    dpr,
    input: normalizeLiquidGlassFilterParams(input),
    tasks,
  });
}

function trimWorkerRenderCache() {
  if (renderCache.size <= MAX_WORKER_RENDER_CACHE_ENTRIES) {
    return;
  }

  const entries = [...renderCache.entries()];
  while (entries.length > MAX_WORKER_RENDER_CACHE_ENTRIES) {
    const oldest = entries.shift();
    if (!oldest) {
      break;
    }

    renderCache.delete(oldest[0]);
  }
}

function getOrCreateWorkerRender(
  input: LiquidGlassFilterParamInput,
  dpr: number,
  tasks: WorkerRenderTask[],
  useCache: boolean
): Promise<WorkerRenderResponse> {
  if (!useCache) {
    return getWorkerClient().render(input, dpr, tasks);
  }

  const key = getWorkerRenderCacheKey(input, dpr, tasks);
  const cached = renderCache.get(key);
  if (cached) {
    renderCache.delete(key);
    renderCache.set(key, cached);
    return cached;
  }

  const next = getWorkerClient()
    .render(input, dpr, tasks)
    .catch((error) => {
      renderCache.delete(key);
      throw error;
    });

  renderCache.set(key, next);
  trimWorkerRenderCache();
  return next;
}

function toObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
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

function createStateFromFullRender(
  response: WorkerRenderResponse,
  dpr: number
): WorkerRuntimeState {
  if (!response.displacement || !response.specular) {
    throw new Error("Worker runtime did not return the required image assets.");
  }

  const magnifyingObjectUrl =
    response.magnifying?.blob ? toObjectUrl(response.magnifying.blob) : undefined;
  const displacementObjectUrl = toObjectUrl(response.displacement.blob);
  const specularObjectUrl = toObjectUrl(response.specular.blob);

  return {
    displacementObjectUrl,
    displacementUrl: displacementObjectUrl,
    dpr,
    height: response.params.height,
    magnify: response.magnifying?.magnify ?? response.params.magnify,
    magnifyingObjectUrl,
    magnifyingUrl: magnifyingObjectUrl,
    maxDisplacement: response.displacement.maxDisplacement,
    params: response.params,
    specularObjectUrl,
    specularUrl: specularObjectUrl,
    width: response.params.width,
  };
}

function mergeStateWithPartialRender(
  previousState: WorkerRuntimeState,
  response: WorkerRenderResponse,
  nextParams: LiquidGlassFilterParams,
  nextDpr: number
): WorkerRuntimeState {
  const nextDisplacementObjectUrl = response.displacement
    ? toObjectUrl(response.displacement.blob)
    : previousState.displacementObjectUrl;
  const nextSpecularObjectUrl = response.specular
    ? toObjectUrl(response.specular.blob)
    : previousState.specularObjectUrl;
  const nextMagnifyingObjectUrl =
    response.magnifying !== undefined
      ? response.magnifying.blob
        ? toObjectUrl(response.magnifying.blob)
        : undefined
      : previousState.magnifyingObjectUrl;

  return {
    displacementObjectUrl: nextDisplacementObjectUrl,
    displacementUrl: nextDisplacementObjectUrl,
    dpr: nextDpr,
    height: nextParams.height,
    magnify: response.magnifying?.magnify ?? nextParams.magnify,
    magnifyingObjectUrl: nextMagnifyingObjectUrl,
    magnifyingUrl: nextMagnifyingObjectUrl,
    maxDisplacement:
      response.displacement?.maxDisplacement ?? previousState.maxDisplacement,
    params: nextParams,
    specularObjectUrl: nextSpecularObjectUrl,
    specularUrl: nextSpecularObjectUrl,
    width: nextParams.width,
  };
}

function syncPublicAssets(
  target: LiquidGlassManagedRuntimeAssets,
  state: WorkerRuntimeState
) {
  target.displacementUrl = state.displacementUrl;
  target.height = state.height;
  target.magnify = state.magnify;
  target.magnifyingUrl = state.magnifyingUrl;
  target.maxDisplacement = state.maxDisplacement;
  target.params = state.params;
  target.specularUrl = state.specularUrl;
  target.width = state.width;
}

function revokeStateObjectUrls(state: WorkerRuntimeState) {
  revokeIfDefined(state.displacementObjectUrl);
  revokeIfDefined(state.specularObjectUrl);
  revokeIfDefined(state.magnifyingObjectUrl);
}

export async function primeLiquidGlassWorkerRuntime() {
  if (!supportsWorkerBackend()) {
    return;
  }

  if (!workerWarmupPromise) {
    workerWarmupPromise = getWorkerClient()
      .warmup()
      .catch((error) => {
        workerWarmupPromise = undefined;
        throw error;
      });
  }

  await workerWarmupPromise;
}

export async function prewarmLiquidGlassManagedRuntimeAssets(
  input: LiquidGlassFilterParamInput = {},
  options: CreateLiquidGlassRuntimeAssetsOptions = {}
) {
  const resolvedBackend = resolveLiquidGlassRuntimeBackend(
    input,
    options.dpr,
    options.backend,
    supportsWorkerBackend()
  );

  if (resolvedBackend !== "worker") {
    return;
  }

  assertNotAborted(options.signal);
  await primeLiquidGlassWorkerRuntime();
  const dpr = resolveDevicePixelRatio(options.dpr);
  await getOrCreateWorkerRender(input, dpr, ALL_RENDER_TASKS, options.useCache ?? true);
  assertNotAborted(options.signal);
}

export async function createManagedLiquidGlassRuntimeAssets(
  input: LiquidGlassFilterParamInput = {},
  options: CreateLiquidGlassRuntimeAssetsOptions = {}
): Promise<LiquidGlassManagedRuntimeAssets> {
  const resolvedBackend = resolveLiquidGlassRuntimeBackend(
    input,
    options.dpr,
    options.backend,
    supportsWorkerBackend()
  );

  if (resolvedBackend !== "worker") {
    return createLiquidGlassRuntimeAssets(input, options);
  }

  assertNotAborted(options.signal);
  await primeLiquidGlassWorkerRuntime();
  const initialDpr = resolveDevicePixelRatio(options.dpr);
  const initialRender = await getOrCreateWorkerRender(
    input,
    initialDpr,
    ALL_RENDER_TASKS,
    options.useCache ?? true
  );
  let state = createStateFromFullRender(initialRender, initialDpr);
  let disposed = false;
  let dprOverride = options.dpr;
  let backendPreference = options.backend;
  let useCache = options.useCache ?? true;

  const runtimeAssets: LiquidGlassManagedRuntimeAssets = {
    backend: "worker",
    displacementUrl: state.displacementUrl,
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      revokeStateObjectUrls(state);
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

      assertNotAborted(nextOptions.signal);
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
        supportsWorkerBackend()
      );
      const tasks: WorkerRenderTask[] = [];

      if (nextBackend !== "worker") {
        throw new Error(
          "Runtime assets backend changed. Recreate assets instead of updating across backends."
        );
      }

      if (shouldRerenderDisplacement(state.params, nextParams, state.dpr, nextDpr)) {
        tasks.push("displacement");
      }

      if (shouldRerenderSpecular(state.params, nextParams, state.dpr, nextDpr)) {
        tasks.push("specular");
      }

      if (shouldRerenderMagnifying(state.params, nextParams, state.dpr, nextDpr)) {
        tasks.push("magnifying");
      }

      if (tasks.length === 0) {
        state = {
          ...state,
          dpr: nextDpr,
          height: nextParams.height,
          magnify: nextParams.magnify,
          params: nextParams,
          width: nextParams.width,
        };
        dprOverride = mergedDpr;
        syncPublicAssets(runtimeAssets, state);
        return;
      }

      const response = await getOrCreateWorkerRender(
        nextParams,
        nextDpr,
        tasks,
        useCache
      );
      const previousState = state;
      state = mergeStateWithPartialRender(previousState, response, nextParams, nextDpr);

      if (tasks.includes("displacement")) {
        revokeIfDefined(previousState.displacementObjectUrl);
      }

      if (tasks.includes("specular")) {
        revokeIfDefined(previousState.specularObjectUrl);
      }

      if (tasks.includes("magnifying")) {
        revokeIfDefined(previousState.magnifyingObjectUrl);
      }

      dprOverride = mergedDpr;
      syncPublicAssets(runtimeAssets, state);
    },
    width: state.width,
  };

  return runtimeAssets;
}

if (typeof window !== "undefined" && supportsWorkerBackend()) {
  void primeLiquidGlassWorkerRuntime().catch(() => undefined);
}
