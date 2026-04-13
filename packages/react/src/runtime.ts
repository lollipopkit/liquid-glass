import { useEffect, useRef, useState } from "react";

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
  assets: LiquidGlassFilterAssets | null;
  backend: LiquidGlassRuntimeBackend | null;
  dispose: () => void;
  error: Error | null;
  isPending: boolean;
  refresh: (forceRecreate?: boolean) => Promise<void>;
};

type RuntimeState = Omit<UseLiquidGlassRuntimeAssetsResult, "dispose" | "refresh">;

const INITIAL_STATE: RuntimeState = {
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

export function useLiquidGlassRuntimeAssets(
  input: LiquidGlassFilterParamInput = {},
  options: UseLiquidGlassRuntimeAssetsOptions = {}
): UseLiquidGlassRuntimeAssetsResult {
  const runtimeRef = useRef<LiquidGlassManagedRuntimeAssets | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const latestInputRef = useRef(input);
  const latestOptionsRef = useRef(options);
  const [state, setState] = useState<RuntimeState>(INITIAL_STATE);

  latestInputRef.current = input;
  latestOptionsRef.current = options;

  const inputKey = JSON.stringify(normalizeLiquidGlassFilterParams(input));
  const optionsKey = JSON.stringify({
    backend: options.backend ?? "auto",
    dpr: options.dpr ?? null,
    enabled: options.enabled ?? true,
    useCache: options.useCache ?? true,
  });

  async function syncRuntime(forceRecreate = false) {
    if (typeof window === "undefined" || options.enabled === false) {
      return;
    }

    const nextInput = latestInputRef.current;
    const nextOptions = latestOptionsRef.current;
    const requestId = ++requestIdRef.current;
    const nextBackend = resolveLiquidGlassRuntimeBackend(
      nextInput,
      nextOptions.dpr,
      nextOptions.backend,
      canUseLiquidGlassWorkerRuntime()
    );
    const localAbortController = new AbortController();
    const signal = mergeAbortSignals(nextOptions.signal, localAbortController.signal);

    abortControllerRef.current?.abort();
    abortControllerRef.current = localAbortController;
    setState((previous) => ({
      ...previous,
      error: null,
      isPending: true,
    }));

    try {
      const currentRuntime = runtimeRef.current;

      if (!currentRuntime || forceRecreate || currentRuntime.backend !== nextBackend) {
        const createdRuntime = await createManagedLiquidGlassRuntimeAssets(nextInput, {
          ...nextOptions,
          signal,
        });

        if (requestId !== requestIdRef.current) {
          createdRuntime.dispose();
          return;
        }

        runtimeRef.current?.dispose();
        runtimeRef.current = createdRuntime;
      } else {
        await currentRuntime.update(nextInput, {
          ...nextOptions,
          signal,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }
      }

      if (!runtimeRef.current) {
        return;
      }

      setState({
        assets: toRuntimeSnapshot(runtimeRef.current),
        backend: runtimeRef.current.backend,
        error: null,
        isPending: false,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState((previous) => ({
        ...previous,
        error: normalizeRuntimeError(error),
        isPending: false,
      }));
    } finally {
      if (abortControllerRef.current === localAbortController) {
        abortControllerRef.current = null;
      }
    }
  }

  function dispose() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestIdRef.current += 1;
    runtimeRef.current?.dispose();
    runtimeRef.current = null;
    setState(INITIAL_STATE);
  }

  useEffect(() => {
    if (options.enabled === false) {
      dispose();
      return;
    }

    void syncRuntime(false);
  }, [inputKey, optionsKey]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    },
    []
  );

  return {
    ...state,
    dispose,
    refresh: (forceRecreate = false) => syncRuntime(forceRecreate),
  };
}
