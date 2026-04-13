import {
  onMounted,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
  type WatchStopHandle,
} from "vue";

import {
  canUseLiquidGlassWorkerRuntime,
  createManagedLiquidGlassRuntimeAssets,
  normalizeLiquidGlassFilterParams,
  resolveLiquidGlassRuntimeBackend,
  type CreateLiquidGlassRuntimeAssetsOptions,
  type LiquidGlassFilterAssets,
  type LiquidGlassFilterParamInput,
  type LiquidGlassManagedRuntimeAssets,
  type LiquidGlassRuntimeBackend,
} from "@lollipopkit/liquid-glass";

export type UseLiquidGlassRuntimeAssetsOptions =
  CreateLiquidGlassRuntimeAssetsOptions & {
    enabled?: boolean;
  };

export type UseLiquidGlassRuntimeAssetsResult = {
  assets: ShallowRef<LiquidGlassFilterAssets | null>;
  backend: Ref<LiquidGlassRuntimeBackend | null>;
  dispose: () => void;
  error: ShallowRef<Error | null>;
  isPending: Ref<boolean>;
  refresh: (forceRecreate?: boolean) => Promise<void>;
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

export function useLiquidGlassRuntimeAssets(
  input: MaybeRefOrGetter<LiquidGlassFilterParamInput> = {},
  options: MaybeRefOrGetter<UseLiquidGlassRuntimeAssetsOptions> = {}
): UseLiquidGlassRuntimeAssetsResult {
  const assets = shallowRef<LiquidGlassFilterAssets | null>(null);
  const backend = ref<LiquidGlassRuntimeBackend | null>(null);
  const error = shallowRef<Error | null>(null);
  const isPending = ref(false);

  let runtime: LiquidGlassManagedRuntimeAssets | null = null;
  let requestId = 0;
  let activeAbortController: AbortController | null = null;
  let stopWatch: WatchStopHandle | undefined;

  async function syncRuntime(forceRecreate = false) {
    if (typeof window === "undefined") {
      return;
    }

    const nextInput = toValue(input);
    const nextOptions = toValue(options);
    if (nextOptions.enabled === false) {
      dispose();
      return;
    }

    const nextBackend = resolveLiquidGlassRuntimeBackend(
      nextInput,
      nextOptions.dpr,
      nextOptions.backend,
      canUseLiquidGlassWorkerRuntime()
    );
    const localAbortController = new AbortController();
    const signal = mergeAbortSignals(nextOptions.signal, localAbortController.signal);
    const currentRequestId = ++requestId;

    activeAbortController?.abort();
    activeAbortController = localAbortController;
    error.value = null;
    isPending.value = true;

    try {
      if (!runtime || forceRecreate || runtime.backend !== nextBackend) {
        const createdRuntime = await createManagedLiquidGlassRuntimeAssets(nextInput, {
          ...nextOptions,
          signal,
        });

        if (currentRequestId !== requestId) {
          createdRuntime.dispose();
          return;
        }

        runtime?.dispose();
        runtime = createdRuntime;
      } else {
        await runtime.update(nextInput, {
          ...nextOptions,
          signal,
        });

        if (currentRequestId !== requestId) {
          return;
        }
      }

      if (!runtime) {
        return;
      }

      assets.value = toRuntimeSnapshot(runtime);
      backend.value = runtime.backend;
      error.value = null;
      isPending.value = false;
    } catch (nextError) {
      if (currentRequestId !== requestId) {
        return;
      }

      error.value = normalizeRuntimeError(nextError);
      isPending.value = false;
    } finally {
      if (activeAbortController === localAbortController) {
        activeAbortController = null;
      }
    }
  }

  function dispose() {
    activeAbortController?.abort();
    activeAbortController = null;
    requestId += 1;
    runtime?.dispose();
    runtime = null;
    assets.value = null;
    backend.value = null;
    error.value = null;
    isPending.value = false;
  }

  onMounted(() => {
    stopWatch = watch(
      () => [
        JSON.stringify(normalizeLiquidGlassFilterParams(toValue(input))),
        JSON.stringify({
          backend: toValue(options).backend ?? "auto",
          dpr: toValue(options).dpr ?? null,
          enabled: toValue(options).enabled ?? true,
          useCache: toValue(options).useCache ?? true,
        }),
      ],
      () => {
        void syncRuntime(false);
      },
      { immediate: true }
    );
  });

  onScopeDispose(() => {
    stopWatch?.();
    dispose();
  });

  return {
    assets,
    backend,
    dispose,
    error,
    isPending,
    refresh: (forceRecreate = false) => syncRuntime(forceRecreate),
  };
}
