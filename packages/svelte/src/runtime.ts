import { writable, type Readable } from "svelte/store";

import {
  canUseLiquidGlassWorkerRuntime,
  createManagedLiquidGlassRuntimeAssets,
  normalizeLiquidGlassFilterParams,
  resolveLiquidGlassRuntimeBackend,
  type CreateLiquidGlassRuntimeAssetsOptions,
  type LiquidGlassAssetMode,
  type LiquidGlassFilterAssets,
  type LiquidGlassFilterParamInput,
  type LiquidGlassManagedRuntimeAssets,
  type LiquidGlassRuntimeBackend,
} from "@lollipopkit/liquid-glass";

export type LiquidGlassRuntimeStoreState = {
  assets: LiquidGlassFilterAssets | null;
  backend: LiquidGlassRuntimeBackend | null;
  error: Error | null;
  isPending: boolean;
};

export type LiquidGlassRuntimeStore = Readable<LiquidGlassRuntimeStoreState> & {
  dispose: () => void;
  refresh: (forceRecreate?: boolean) => Promise<void>;
  setConfig: (
    nextInput: LiquidGlassFilterParamInput,
    nextOptions?: CreateLiquidGlassRuntimeAssetsOptions
  ) => Promise<void>;
  setInput: (nextInput: LiquidGlassFilterParamInput) => Promise<void>;
  setOptions: (nextOptions: CreateLiquidGlassRuntimeAssetsOptions) => Promise<void>;
  updateInput: (patch: LiquidGlassFilterParamInput) => Promise<void>;
  updateOptions: (patch: CreateLiquidGlassRuntimeAssetsOptions) => Promise<void>;
};

const EMPTY_IMAGE_DATA_URL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

export function resolveLiquidGlassComponentMode(
  mode: LiquidGlassAssetMode | undefined,
  runtime: boolean | undefined,
  hasStaticAssets = true
): "runtime" | "static" {
  if (mode === "runtime") {
    return "runtime";
  }

  if (mode === "static") {
    return hasStaticAssets ? "static" : "runtime";
  }

  if (runtime) {
    return "runtime";
  }

  return hasStaticAssets ? "static" : "runtime";
}

export function resolveLiquidGlassComponentAssets(
  mode: "runtime" | "static",
  runtimeAssets: LiquidGlassFilterAssets | null,
  staticAssets: LiquidGlassFilterAssets | null,
  fallbackInput: LiquidGlassFilterParamInput = {}
): LiquidGlassFilterAssets {
  if (mode === "runtime" && runtimeAssets) {
    return runtimeAssets;
  }

  if (mode === "static" && staticAssets) {
    return staticAssets;
  }

  if (mode === "runtime" && staticAssets) {
    return staticAssets;
  }

  if (runtimeAssets) {
    return runtimeAssets;
  }

  const params = normalizeLiquidGlassFilterParams(fallbackInput);
  return {
    displacementUrl: EMPTY_IMAGE_DATA_URL,
    height: params.height,
    magnify: params.magnify,
    magnifyingUrl: params.magnify ? EMPTY_IMAGE_DATA_URL : undefined,
    maxDisplacement: 0,
    params,
    specularUrl: EMPTY_IMAGE_DATA_URL,
    width: params.width,
  };
}

const INITIAL_STATE: LiquidGlassRuntimeStoreState = {
  assets: null,
  backend: null,
  error: null,
  isPending: false,
};

function mergeAbortSignals(...signals: Array<AbortSignal | undefined>) {
  const activeSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal));
  if (activeSignals.length === 0) {
    return undefined;
  }

  if (activeSignals.length === 1) {
    return activeSignals[0];
  }

  if (typeof AbortSignal !== "undefined" && "any" in AbortSignal) {
    return AbortSignal.any(activeSignals);
  }

  const controller = new AbortController();

  const abort = () => {
    controller.abort();

    for (const signal of activeSignals) {
      signal.removeEventListener("abort", abort);
    }
  };

  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort();
      break;
    }

    signal.addEventListener("abort", abort, { once: true });
  }

  return controller.signal;
}

function toRuntimeSnapshot(
  runtimeAssets: LiquidGlassManagedRuntimeAssets
): LiquidGlassFilterAssets {
  return {
    displacementUrl: runtimeAssets.displacementUrl,
    height: runtimeAssets.height,
    magnify: runtimeAssets.magnify,
    magnifyingUrl: runtimeAssets.magnifyingUrl,
    maxDisplacement: runtimeAssets.maxDisplacement,
    params: runtimeAssets.params,
    specularUrl: runtimeAssets.specularUrl,
    width: runtimeAssets.width,
  };
}

function normalizeRuntimeError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to synchronize liquid glass runtime assets.");
}

export function createLiquidGlassRuntimeStore(
  initialInput: LiquidGlassFilterParamInput = {},
  initialOptions: CreateLiquidGlassRuntimeAssetsOptions = {}
): LiquidGlassRuntimeStore {
  const { subscribe, set, update } = writable<LiquidGlassRuntimeStoreState>(
    INITIAL_STATE
  );

  let currentInput = initialInput;
  let currentOptions = initialOptions;
  let runtime: LiquidGlassManagedRuntimeAssets | null = null;
  let requestId = 0;
  let activeAbortController: AbortController | null = null;
  let disposed = false;

  async function syncRuntime(forceRecreate = false) {
    if (typeof window === "undefined" || disposed) {
      return;
    }

    const nextBackend = resolveLiquidGlassRuntimeBackend(
      currentInput,
      currentOptions.dpr,
      currentOptions.backend,
      canUseLiquidGlassWorkerRuntime()
    );
    const localAbortController = new AbortController();
    const signal = mergeAbortSignals(currentOptions.signal, localAbortController.signal);
    const currentRequestId = ++requestId;

    activeAbortController?.abort();
    activeAbortController = localAbortController;
    update((previous) => ({
      ...previous,
      error: null,
      isPending: true,
    }));

    try {
      if (!runtime || forceRecreate || runtime.backend !== nextBackend) {
        const createdRuntime = await createManagedLiquidGlassRuntimeAssets(currentInput, {
          ...currentOptions,
          signal,
        });

        if (currentRequestId !== requestId || disposed) {
          createdRuntime.dispose();
          return;
        }

        runtime?.dispose();
        runtime = createdRuntime;
      } else {
        await runtime.update(currentInput, {
          ...currentOptions,
          signal,
        });

        if (currentRequestId !== requestId || disposed) {
          return;
        }
      }

      if (!runtime) {
        return;
      }

      set({
        assets: toRuntimeSnapshot(runtime),
        backend: runtime.backend,
        error: null,
        isPending: false,
      });
    } catch (error) {
      if (currentRequestId !== requestId || disposed) {
        return;
      }

      update((previous) => ({
        ...previous,
        error: normalizeRuntimeError(error),
        isPending: false,
      }));
    } finally {
      if (activeAbortController === localAbortController) {
        activeAbortController = null;
      }
    }
  }

  async function setInput(nextInput: LiquidGlassFilterParamInput) {
    currentInput = nextInput;
    await syncRuntime(false);
  }

  async function setConfig(
    nextInput: LiquidGlassFilterParamInput,
    nextOptions: CreateLiquidGlassRuntimeAssetsOptions = currentOptions
  ) {
    currentInput = nextInput;
    currentOptions = nextOptions;
    await syncRuntime(false);
  }

  async function updateInput(patch: LiquidGlassFilterParamInput) {
    currentInput = normalizeLiquidGlassFilterParams({
      ...currentInput,
      ...patch,
    });
    await syncRuntime(false);
  }

  async function setOptions(nextOptions: CreateLiquidGlassRuntimeAssetsOptions) {
    currentOptions = nextOptions;
    await syncRuntime(false);
  }

  async function updateOptions(patch: CreateLiquidGlassRuntimeAssetsOptions) {
    currentOptions = {
      ...currentOptions,
      ...patch,
    };
    await syncRuntime(false);
  }

  function dispose() {
    disposed = true;
    activeAbortController?.abort();
    activeAbortController = null;
    requestId += 1;
    runtime?.dispose();
    runtime = null;
    set(INITIAL_STATE);
  }

  if (typeof window !== "undefined") {
    void syncRuntime(true);
  }

  return {
    dispose,
    refresh: (forceRecreate = false) => syncRuntime(forceRecreate),
    setConfig,
    setInput,
    setOptions,
    subscribe,
    updateInput,
    updateOptions,
  };
}
