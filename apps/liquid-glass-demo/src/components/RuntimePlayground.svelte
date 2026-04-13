<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import {
    canUseLiquidGlassWorkerRuntime as canUseWorkerRuntimeBackend,
    createManagedLiquidGlassRuntimeAssets as createDemoLiquidGlassRuntimeAssets,
    normalizeLiquidGlassFilterParams,
    prewarmLiquidGlassManagedRuntimeAssets as prewarmLiquidGlassRuntimeAssets,
    resolveLiquidGlassRuntimeBackend as resolveDemoLiquidGlassRuntimeBackend,
    type LiquidGlassManagedRuntimeAssets as DemoLiquidGlassRuntimeAssets,
    type LiquidGlassFilterParamInput,
    type LiquidGlassRuntimeBackend as DemoLiquidGlassRuntimeBackend,
    type LiquidGlassRuntimeBackendPreference as DemoLiquidGlassRuntimeBackendPreference,
    type SurfaceType,
  } from "@lollipopkit/liquid-glass";
  import LiquidGlassFilter from "../../../../packages/svelte/src/components/LiquidGlassFilter.svelte";

  type BrowserBenchRow = {
    averageMs: number;
    averageStallMs: number;
    iterations: number;
    label: string;
    longTaskCount: number;
    maxMs: number;
    maxStallMs: number;
    minMs: number;
    p95Ms: number;
    p95StallMs: number;
  };

  type MainThreadProbeStats = {
    baselineFrameIntervalMs: number;
    longTaskCount: number;
    maxExcessFrameGapMs: number;
    maxLongTaskMs: number;
  };

  const bezelTypes: Array<{ label: string; value: SurfaceType }> = [
    { label: "Convex Squircle", value: "convex_squircle" },
    { label: "Convex Circle", value: "convex_circle" },
    { label: "Concave", value: "concave" },
    { label: "Lip", value: "lip" },
  ];
  const BENCH_MIN_WIDTH = 720;
  const BENCH_MIN_HEIGHT = 220;
  const BENCH_MIN_DPR = 2;
  const filterId = "runtime-liquid-glass-lab";
  const backendOptions: Array<{
    description: string;
    disabled?: boolean;
    label: string;
    value: DemoLiquidGlassRuntimeBackendPreference;
  }> = [
    {
      description: "Choose the backend automatically from workload size.",
      label: "Auto",
      value: "auto",
    },
    {
      description: "Run the runtime path on the main thread.",
      label: "TS",
      value: "ts",
    },
    {
      description: canUseWorkerRuntimeBackend()
        ? "Move render generation into a worker."
        : "Worker backend is not available in this browser.",
      disabled: !canUseWorkerRuntimeBackend(),
      label: "Worker",
      value: "worker",
    },
  ];

  let width = 360;
  let height = 120;
  let radius = 36;
  let bezelWidth = 24;
  let glassThickness = 90;
  let refractiveIndex = 1.5;
  let magnify = false;
  let bezelType: SurfaceType = "convex_squircle";
  let runtimeDpr = 2;
  let selectedBackend: DemoLiquidGlassRuntimeBackendPreference = "auto";
  let useCache = true;
  let surfaceCopy = "Runtime optics";
  let runtimeAssets: DemoLiquidGlassRuntimeAssets | null = null;
  let runtimeError = "";
  let createDurationMs = 0;
  let createMainThreadBlockMs = 0;
  let createLongTaskCount = 0;
  let latestUpdateDurationMs = 0;
  let latestUpdateMainThreadBlockMs = 0;
  let latestUpdateLongTaskCount = 0;
  let latestInputLatencyMs = 0;
  let updateCount = 0;
  let pendingCreate = false;
  let pendingUpdate = false;
  let pendingPrewarm = false;
  let benchRunning = false;
  let browserBenchRows: BrowserBenchRow[] = [];
  let copyFeedback = "";
  let prewarmStatus = "idle";
  let mounted = false;
  let updateTimer: ReturnType<typeof setTimeout> | undefined;
  let prewarmTimer: ReturnType<typeof setTimeout> | undefined;
  let createRequestId = 0;
  let updateRequestId = 0;
  let lastAppliedKey = "";
  let lastSelectedBackend: DemoLiquidGlassRuntimeBackendPreference =
    selectedBackend;
  let lastUseCache = useCache;
  let runtimeKey = "";
  let resolvedVisibleBackend: DemoLiquidGlassRuntimeBackend = "ts";
  let resolvedBenchBackend: DemoLiquidGlassRuntimeBackend = "ts";
  let benchRunCount = 0;
  let dprInitialized = false;
  let frameBaselineMs = 16.7;
  let pendingInteractionAtMs: number | null = null;

  function getCurrentInput(): LiquidGlassFilterParamInput {
    return {
      bezelType,
      bezelWidth,
      glassThickness,
      height,
      magnify,
      radius,
      refractiveIndex,
      width,
    };
  }

  function getCurrentKey(): string {
    return JSON.stringify({
      backend: selectedBackend,
      useCache,
      ...getCurrentInput(),
      dpr: runtimeDpr,
    });
  }

  function applyDefaultParams() {
    const defaults = normalizeLiquidGlassFilterParams({
      width,
      height,
      radius,
      bezelWidth,
      glassThickness,
      refractiveIndex,
      magnify,
      bezelType,
    });

    width = defaults.width;
    height = defaults.height;
    radius = defaults.radius;
    bezelWidth = defaults.bezelWidth;
    glassThickness = defaults.glassThickness;
    refractiveIndex = defaults.refractiveIndex;
    magnify = defaults.magnify;
    bezelType = defaults.bezelType;
  }

  function clearScheduledUpdate() {
    if (!updateTimer) {
      return;
    }

    clearTimeout(updateTimer);
    updateTimer = undefined;
  }

  function clearScheduledPrewarm() {
    if (!prewarmTimer) {
      return;
    }

    clearTimeout(prewarmTimer);
    prewarmTimer = undefined;
  }

  function getBenchInput() {
    const benchHeight = Math.max(height, BENCH_MIN_HEIGHT);

    return normalizeLiquidGlassFilterParams({
      ...getCurrentInput(),
      bezelWidth: Math.max(bezelWidth, 28),
      glassThickness: Math.max(glassThickness, 104),
      height: benchHeight,
      magnify: false,
      radius: Math.min(Math.max(radius, 44), Math.floor(benchHeight / 2)),
      width: Math.max(width, BENCH_MIN_WIDTH),
    });
  }

  function getBenchDpr() {
    return Math.max(runtimeDpr, BENCH_MIN_DPR);
  }

  function summarizeDurations(label: string, durations: number[]): BrowserBenchRow {
    const sorted = [...durations].sort((left, right) => left - right);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    const p95Index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
    );

    return {
      averageMs: total / sorted.length,
      averageStallMs: 0,
      iterations: sorted.length,
      label,
      longTaskCount: 0,
      maxMs: sorted[sorted.length - 1] ?? 0,
      maxStallMs: 0,
      minMs: sorted[0] ?? 0,
      p95Ms: sorted[p95Index] ?? 0,
      p95StallMs: 0,
    };
  }

  async function measureFrameBaseline(sampleCount = 6): Promise<number> {
    if (typeof window === "undefined") {
      return 16.7;
    }

    return new Promise<number>((resolve) => {
      const samples: number[] = [];
      let previousTimestamp: number | undefined;

      const collect = (timestamp: number) => {
        if (previousTimestamp !== undefined) {
          samples.push(timestamp - previousTimestamp);
        }

        previousTimestamp = timestamp;

        if (samples.length >= sampleCount) {
          const average =
            samples.reduce((sum, value) => sum + value, 0) / samples.length;
          resolve(average);
          return;
        }

        window.requestAnimationFrame(collect);
      };

      window.requestAnimationFrame(collect);
    });
  }

  function summarizeMainThreadProbe(
    label: string,
    durations: number[],
    stalls: number[],
    longTaskCounts: number[]
  ): BrowserBenchRow {
    const summary = summarizeDurations(label, durations);
    const sortedStalls = [...stalls].sort((left, right) => left - right);
    const stallTotal = sortedStalls.reduce((sum, value) => sum + value, 0);
    const p95Index = Math.min(
      sortedStalls.length - 1,
      Math.max(0, Math.ceil(sortedStalls.length * 0.95) - 1)
    );

    return {
      ...summary,
      averageStallMs: stallTotal / sortedStalls.length,
      longTaskCount: longTaskCounts.reduce((sum, value) => sum + value, 0),
      maxStallMs: sortedStalls[sortedStalls.length - 1] ?? 0,
      p95StallMs: sortedStalls[p95Index] ?? 0,
    };
  }

  async function measureMainThreadProbe<T>(
    operation: () => Promise<T>
  ): Promise<{
    durationMs: number;
    postPaintDurationMs: number;
    stats: MainThreadProbeStats;
    value: T;
  }> {
    const stats: MainThreadProbeStats = {
      baselineFrameIntervalMs: frameBaselineMs,
      longTaskCount: 0,
      maxExcessFrameGapMs: 0,
      maxLongTaskMs: 0,
    };
    let animationFrame = 0;
    let monitoring = true;
    let observer: PerformanceObserver | undefined;
    let lastFrameTime: number | undefined;

    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            stats.longTaskCount += 1;
            if (entry.duration > stats.maxLongTaskMs) {
              stats.maxLongTaskMs = entry.duration;
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        observer = undefined;
      }
    }

    const monitorFrames = (timestamp: number) => {
      if (lastFrameTime !== undefined) {
        const gap = timestamp - lastFrameTime;
        const excessGap = Math.max(0, gap - stats.baselineFrameIntervalMs);

        if (excessGap > stats.maxExcessFrameGapMs) {
          stats.maxExcessFrameGapMs = excessGap;
        }
      }

      lastFrameTime = timestamp;
      if (monitoring) {
        animationFrame = window.requestAnimationFrame(monitorFrames);
      }
    };

    if (typeof window !== "undefined") {
      animationFrame = window.requestAnimationFrame(monitorFrames);
    }

    const start = performance.now();

    try {
      const value = await operation();
      const durationMs = performance.now() - start;

      if (typeof window !== "undefined") {
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame((timestamp) => {
            monitorFrames(timestamp);
            resolve();
          });
        });
      }

      const postPaintDurationMs = performance.now() - start;

      return {
        durationMs,
        postPaintDurationMs,
        stats,
        value,
      };
    } finally {
      monitoring = false;
      if (typeof window !== "undefined" && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      observer?.disconnect();
    }
  }

  async function createRuntimeAssets() {
    const requestId = ++createRequestId;
    const input = getCurrentInput();
    const key = JSON.stringify({
      backend: selectedBackend,
      useCache,
      ...input,
      dpr: runtimeDpr,
    });
    runtimeError = "";
    pendingCreate = true;

    try {
      const measuredCreate = await measureMainThreadProbe(() =>
        createDemoLiquidGlassRuntimeAssets(input, {
          backend: selectedBackend,
          dpr: runtimeDpr,
          useCache,
        })
      );
      const nextAssets = measuredCreate.value;

      if (requestId !== createRequestId) {
        nextAssets.dispose();
        return;
      }

      runtimeAssets?.dispose();
      runtimeAssets = nextAssets;
      runtimeAssets = runtimeAssets;
      createDurationMs = measuredCreate.durationMs;
      createMainThreadBlockMs = measuredCreate.stats.maxExcessFrameGapMs;
      createLongTaskCount = measuredCreate.stats.longTaskCount;
      latestUpdateDurationMs = 0;
      latestUpdateMainThreadBlockMs = 0;
      latestUpdateLongTaskCount = 0;
      latestInputLatencyMs = 0;
      updateCount = 0;
      lastAppliedKey = key;
      scheduleBenchPrewarm();
    } catch (error) {
      if (requestId !== createRequestId) {
        return;
      }

      runtimeError =
        error instanceof Error ? error.message : "Failed to create runtime assets.";
      runtimeAssets = null;
    } finally {
      if (requestId === createRequestId) {
        pendingCreate = false;
      }
    }
  }

  async function runBrowserBench() {
    if (!runtimeAssets || benchRunning) {
      return;
    }

    clearScheduledUpdate();
    updateRequestId += 1;
    pendingUpdate = false;
    benchRunning = true;
    runtimeError = "";

    const benchInput = getBenchInput();
    const baseDpr = getBenchDpr();
    const warmupIterations = 2;
    const scenarios: Array<{
      label: string;
      patches: LiquidGlassFilterParamInput[];
    }> = [
      {
        label: "Displacement only",
        patches: [
          Math.max(48, benchInput.glassThickness - 24),
          Math.max(48, benchInput.glassThickness - 12),
          benchInput.glassThickness,
          benchInput.glassThickness + 12,
          benchInput.glassThickness + 24,
          benchInput.glassThickness + 36,
        ].map((value) => ({
          glassThickness: value,
        })),
      },
      {
        label: "Shape + specular",
        patches: [
          Math.max(28, benchInput.radius - 14),
          Math.max(28, benchInput.radius - 6),
          benchInput.radius,
          Math.min(Math.floor(benchInput.height / 2), benchInput.radius + 8),
          Math.min(Math.floor(benchInput.height / 2), benchInput.radius + 16),
          Math.min(Math.floor(benchInput.height / 2), benchInput.radius + 24),
        ].map((value) => ({
          radius: value,
        })),
      },
      {
        label: "Magnify toggle",
        patches: [true, false, true, false, true, false].map((value) => ({
          magnify: value,
        })),
      },
    ];
    const startIndex = benchRunCount % scenarios.length;
    const orderedScenarios = scenarios
      .slice(startIndex)
      .concat(scenarios.slice(0, startIndex));

    try {
      const nextRows: BrowserBenchRow[] = [];

      for (const scenario of orderedScenarios) {
        const isolatedAssets = await createDemoLiquidGlassRuntimeAssets(benchInput, {
          backend: selectedBackend,
          dpr: baseDpr,
          useCache,
        });
        const durations: number[] = [];
        const stallDurations: number[] = [];
        const longTaskCounts: number[] = [];

        try {
          for (let index = 0; index < scenario.patches.length; index++) {
            const patch = scenario.patches[index];
            const nextInput = {
              ...benchInput,
              ...patch,
            };

            if (index < warmupIterations) {
              await isolatedAssets.update(nextInput, { dpr: baseDpr });
              continue;
            }

            const measuredUpdate = await measureMainThreadProbe(() =>
              isolatedAssets.update(nextInput, {
                backend: selectedBackend,
                dpr: baseDpr,
                useCache,
              })
            );
            durations.push(measuredUpdate.durationMs);
            stallDurations.push(measuredUpdate.stats.maxExcessFrameGapMs);
            longTaskCounts.push(measuredUpdate.stats.longTaskCount);
          }
        } finally {
          isolatedAssets.dispose();
        }

        nextRows.push(
          summarizeMainThreadProbe(
            scenario.label,
            durations,
            stallDurations,
            longTaskCounts
          )
        );
      }

      browserBenchRows = nextRows;
      benchRunCount += 1;
    } catch (error) {
      runtimeError =
        error instanceof Error ? error.message : "Browser benchmark failed.";
    } finally {
      benchRunning = false;
    }
  }

  async function copyBenchResults() {
    if (browserBenchRows.length === 0 || typeof navigator === "undefined") {
      return;
    }

    const benchInput = getBenchInput();
    const lines = [
      "Liquid Glass Runtime Bench",
      `visibleParams=${JSON.stringify({
        width,
        height,
        radius,
        bezelWidth,
        glassThickness,
        refractiveIndex,
        magnify,
        bezelType,
        dpr: runtimeDpr,
      })}`,
      `benchParams=${JSON.stringify({
        ...benchInput,
        dpr: getBenchDpr(),
      })}`,
      `backend=${selectedBackend}`,
      `activeBackend=${runtimeAssets?.backend ?? "unknown"}`,
      `benchBackend=${resolvedBenchBackend}`,
      `useCache=${useCache}`,
      `benchCache=${prewarmStatus}`,
      `frameBaseline=${frameBaselineMs.toFixed(2)}ms`,
      `create=${createDurationMs.toFixed(2)}ms`,
      `createMainThreadBlock=${createMainThreadBlockMs.toFixed(2)}ms`,
      `createLongTasks=${createLongTaskCount}`,
      `latestUpdate=${latestUpdateDurationMs.toFixed(2)}ms`,
      `latestUpdateMainThreadBlock=${latestUpdateMainThreadBlockMs.toFixed(2)}ms`,
      `latestUpdateLongTasks=${latestUpdateLongTaskCount}`,
      `latestInputLatency=${latestInputLatencyMs.toFixed(2)}ms`,
      ...browserBenchRows.map(
        (row) =>
          `${row.label}\tavg=${row.averageMs.toFixed(2)}ms\tp95=${row.p95Ms.toFixed(2)}ms\tmax=${row.maxMs.toFixed(2)}ms\tmin=${row.minMs.toFixed(2)}ms\tstallAvg=${row.averageStallMs.toFixed(2)}ms\tstallP95=${row.p95StallMs.toFixed(2)}ms\tstallMax=${row.maxStallMs.toFixed(2)}ms\tlongTasks=${row.longTaskCount}\tn=${row.iterations}`
      ),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      copyFeedback = "Copied";
    } catch {
      copyFeedback = "Copy failed";
    }
  }

  function scheduleRuntimeUpdate() {
    if (!mounted || !runtimeAssets || benchRunning) {
      return;
    }

    if (runtimeAssets.backend !== resolvedVisibleBackend) {
      rebuildRuntimeAssetsForBackend();
      return;
    }

    const nextKey = getCurrentKey();
    if (nextKey === lastAppliedKey) {
      return;
    }

    clearScheduledUpdate();
    pendingUpdate = true;

    const requestId = ++updateRequestId;
    updateTimer = setTimeout(async () => {
      try {
        const measuredUpdate = await measureMainThreadProbe(() =>
          runtimeAssets?.update(getCurrentInput(), {
            backend: selectedBackend,
            dpr: runtimeDpr,
            useCache,
          }) ??
          Promise.resolve()
        );

        if (requestId !== updateRequestId || !runtimeAssets) {
          return;
        }

        latestUpdateDurationMs = measuredUpdate.durationMs;
        latestUpdateMainThreadBlockMs = measuredUpdate.stats.maxExcessFrameGapMs;
        latestUpdateLongTaskCount = measuredUpdate.stats.longTaskCount;
        if (pendingInteractionAtMs !== null) {
          latestInputLatencyMs = performance.now() - pendingInteractionAtMs;
          pendingInteractionAtMs = null;
        } else {
          latestInputLatencyMs = measuredUpdate.postPaintDurationMs;
        }
        updateCount += 1;
        lastAppliedKey = nextKey;
        runtimeAssets = runtimeAssets;
      } catch (error) {
        if (requestId === updateRequestId) {
          runtimeError =
            error instanceof Error ? error.message : "Runtime update failed.";
        }
      } finally {
        if (requestId === updateRequestId) {
          pendingUpdate = false;
        }
      }
    }, 72);
  }

  function scheduleBenchPrewarm() {
    clearScheduledPrewarm();

    if (!useCache) {
      pendingPrewarm = false;
      prewarmStatus = "bypassed";
      return;
    }

    if (resolvedBenchBackend !== "worker") {
      pendingPrewarm = false;
      prewarmStatus = "n/a";
      return;
    }

    prewarmTimer = setTimeout(async () => {
      pendingPrewarm = true;
      prewarmStatus = "warming";

      try {
        await prewarmLiquidGlassRuntimeAssets(getBenchInput(), {
          backend: selectedBackend,
          dpr: getBenchDpr(),
          useCache,
        });
        prewarmStatus = "ready";
      } catch {
        prewarmStatus = "failed";
      } finally {
        pendingPrewarm = false;
      }
    }, 120);
  }

  function resetControls() {
    width = 360;
    height = 120;
    radius = 36;
    bezelWidth = 24;
    glassThickness = 90;
    refractiveIndex = 1.5;
    magnify = false;
    bezelType = "convex_squircle";
    browserBenchRows = [];
    pendingInteractionAtMs = performance.now();
  }

  function markInteraction() {
    pendingInteractionAtMs = performance.now();
  }

  function rebuildRuntimeAssetsForBackend() {
    clearScheduledUpdate();
    clearScheduledPrewarm();
    updateRequestId += 1;
    pendingUpdate = false;
    browserBenchRows = [];
    copyFeedback = "";
    lastAppliedKey = "";
    latestUpdateDurationMs = 0;
    latestUpdateMainThreadBlockMs = 0;
    latestUpdateLongTaskCount = 0;
    latestInputLatencyMs = 0;
    updateCount = 0;

    runtimeAssets?.dispose();
    runtimeAssets = null;

    if (!useCache) {
      prewarmStatus = "bypassed";
    } else if (resolvedVisibleBackend === "worker") {
      prewarmStatus = "warming";
      void prewarmLiquidGlassRuntimeAssets(getCurrentInput(), {
        backend: selectedBackend,
        dpr: runtimeDpr,
        useCache,
      })
        .then(() => {
          if (prewarmStatus === "warming") {
            prewarmStatus = "partial";
          }
        })
        .catch(() => {
          prewarmStatus = "failed";
        });
    } else {
      prewarmStatus = "n/a";
    }

    void createRuntimeAssets();
  }

  onMount(() => {
    mounted = true;

    if (!dprInitialized && typeof window !== "undefined") {
      runtimeDpr = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio ?? 2)));
      dprInitialized = true;
    }

    applyDefaultParams();
    void measureFrameBaseline()
      .then((nextBaseline) => {
        frameBaselineMs = nextBaseline;
      })
      .catch(() => {
        frameBaselineMs = 16.7;
      });
    rebuildRuntimeAssetsForBackend();

    return () => {
      clearScheduledUpdate();
      clearScheduledPrewarm();
    };
  });

  onDestroy(() => {
    clearScheduledUpdate();
    clearScheduledPrewarm();
    runtimeAssets?.dispose();
  });

  $: maxRadius = Math.floor(height / 2);
  $: if (radius > maxRadius) {
    radius = maxRadius;
  }
  $: applyDefaultParams();
  $: if (mounted && selectedBackend !== lastSelectedBackend) {
    lastSelectedBackend = selectedBackend;
    rebuildRuntimeAssetsForBackend();
  }
  $: if (mounted && useCache !== lastUseCache) {
    lastUseCache = useCache;
    rebuildRuntimeAssetsForBackend();
  }
  $: resolvedVisibleBackend = resolveDemoLiquidGlassRuntimeBackend(
    getCurrentInput(),
    runtimeDpr,
    selectedBackend
  );
  $: resolvedBenchBackend = resolveDemoLiquidGlassRuntimeBackend(
    getBenchInput(),
    getBenchDpr(),
    selectedBackend
  );
  $: runtimeKey = getCurrentKey();
  $: if (mounted && runtimeAssets && runtimeKey) {
    scheduleRuntimeUpdate();
  }
</script>

<section class="space-y-4">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div class="section-title text-sm font-semibold">Runtime Lab</div>
      <p class="runtime-copy mt-1 max-w-2xl text-sm leading-6">
        This section bypasses `virtual:` assets and generates the displacement,
        specular, and magnifying maps directly in the browser. The visible
        surface uses a worker-backed runtime path, while the browser benchmark
        now runs on a larger profile to stress the hot path more realistically.
      </p>
    </div>

    <div class="flex gap-2">
      <button class="runtime-button" type="button" on:click={resetControls}>
        Reset
      </button>
      <button
        class="runtime-button runtime-button--strong"
        type="button"
        on:click={runBrowserBench}
        disabled={!runtimeAssets || benchRunning || pendingCreate}
      >
        {benchRunning ? "Running Bench..." : "Run Browser Bench"}
      </button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_360px]">
    <div class="runtime-stage">
      <div class="runtime-backdrop">
        <div class="runtime-grid"></div>
        <div class="runtime-orb runtime-orb--a"></div>
        <div class="runtime-orb runtime-orb--b"></div>
        <div class="runtime-copy-block">
          <div class="runtime-kicker">Runtime Renderer</div>
          <h3 class="runtime-title">Selective glass regeneration</h3>
          <p class="runtime-lead">
            Shape-driven updates rerender the displacement and highlight layers.
            Thickness-only changes skip the specular map. Magnify toggles only
            touch the lens distortion field.
          </p>
          <div class="runtime-chip-row">
            <span class="runtime-chip">DPR {runtimeDpr}</span>
            <span class="runtime-chip">{selectedBackend}</span>
            <span class="runtime-chip">{runtimeAssets?.backend ?? "..."}</span>
            <span class="runtime-chip">{useCache ? "cache:on" : "cache:off"}</span>
            <span class="runtime-chip">
              {pendingCreate
                ? "creating"
                : pendingUpdate
                  ? "updating"
                  : pendingPrewarm
                    ? "prewarming"
                    : "ready"}
            </span>
            <span class="runtime-chip">{updateCount} updates</span>
          </div>
        </div>
      </div>

      {#if runtimeAssets}
        <LiquidGlassFilter
          id={filterId}
          assets={runtimeAssets}
          width={width}
          height={height}
          blur={0.9}
          scaleRatio={0.82}
          specularOpacity={0.3}
          specularSaturation={6}
          magnifyingScale={magnify ? 18 : 0}
        />

        <div
          class="runtime-surface"
          style={`width:${width}px;height:${height}px;border-radius:${radius}px;backdrop-filter:url(#${filterId});`}
        >
          <div class="runtime-surface__shine"></div>
          <div class="runtime-surface__content">
            <div class="runtime-surface__tag">live assets</div>
            <div class="runtime-surface__headline">{surfaceCopy}</div>
            <label class="runtime-input">
              <span>Type to test the refraction plate</span>
              <input bind:value={surfaceCopy} placeholder="Runtime optics" />
            </label>
          </div>
        </div>
      {:else}
        <div class="runtime-surface runtime-surface--placeholder">
          <div>{runtimeError || "Preparing runtime assets..."}</div>
        </div>
      {/if}
    </div>

    <aside class="runtime-sidebar">
      <div class="runtime-metrics">
        <div class="runtime-metric">
          <span class="runtime-metric__label">Create</span>
          <strong>{createDurationMs ? `${createDurationMs.toFixed(2)} ms` : "..."}</strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Create Stall</span>
          <strong>
            {createDurationMs ? `${createMainThreadBlockMs.toFixed(2)} ms` : "..."}
          </strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Latest Update</span>
          <strong>
            {latestUpdateDurationMs ? `${latestUpdateDurationMs.toFixed(2)} ms` : "..."}
          </strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Input Latency</span>
          <strong>
            {latestInputLatencyMs ? `${latestInputLatencyMs.toFixed(2)} ms` : "..."}
          </strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Update Stall</span>
          <strong>
            {latestUpdateDurationMs
              ? `${latestUpdateMainThreadBlockMs.toFixed(2)} ms`
              : "..."}
          </strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Status</span>
          <strong>
            {pendingCreate
              ? "Creating"
              : pendingUpdate
                ? "Updating"
                : pendingPrewarm
                  ? "Prewarming"
                  : "Idle"}
          </strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Backend</span>
          <strong>{selectedBackend} -> {runtimeAssets?.backend ?? "..."}</strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Bench Cache</span>
          <strong>{prewarmStatus}</strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Frame Baseline</span>
          <strong>{frameBaselineMs.toFixed(2)} ms</strong>
        </div>
        <div class="runtime-metric">
          <span class="runtime-metric__label">Cache</span>
          <strong>{useCache ? "On" : "Bypassed"}</strong>
        </div>
      </div>

      <div class="runtime-bench">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="runtime-sidebar__title">Browser Bench</div>
            <p class="runtime-bench__profile">
              {getBenchInput().width}x{getBenchInput().height} @ DPR {getBenchDpr()} · {resolvedBenchBackend}
            </p>
          </div>
          <div class="flex items-center gap-2">
            {#if copyFeedback}
              <span class="runtime-copy-feedback">{copyFeedback}</span>
            {/if}
            <button
              class="runtime-button runtime-button--small"
              type="button"
              on:click={copyBenchResults}
              disabled={browserBenchRows.length === 0}
            >
              Copy Results
            </button>
          </div>
        </div>

        {#if browserBenchRows.length > 0}
          <div class="runtime-bench__table">
            <div class="runtime-bench__header">Scenario</div>
            <div class="runtime-bench__header">Avg</div>
            <div class="runtime-bench__header">P95</div>
            <div class="runtime-bench__header">Max</div>
            <div class="runtime-bench__header">Stall</div>

            {#each browserBenchRows as row}
              <div>{row.label}</div>
              <div>{row.averageMs.toFixed(2)} ms</div>
              <div>{row.p95Ms.toFixed(2)} ms</div>
              <div>{row.maxMs.toFixed(2)} ms</div>
              <div>{row.maxStallMs.toFixed(2)} ms</div>
            {/each}
          </div>
        {:else}
          <p class="runtime-bench__empty">
            Run the larger browser benchmark once, then copy the structured results here.
          </p>
        {/if}
      </div>

      <div class="runtime-controls">
        <div class="runtime-sidebar__title">Controls</div>

        <label class="runtime-control">
          <span>Backend</span>
          <select bind:value={selectedBackend} on:change={markInteraction}>
            {#each backendOptions as option}
              <option
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            {/each}
          </select>
          <strong>{selectedBackend}</strong>
        </label>

        <label class="runtime-toggle">
          <input type="checkbox" bind:checked={useCache} on:change={markInteraction} />
          <span>Use runtime cache</span>
        </label>

        <label class="runtime-control">
          <span>Width</span>
          <input
            type="range"
            min="240"
            max="480"
            step="10"
            bind:value={width}
            on:input={markInteraction}
          />
          <strong>{width}px</strong>
        </label>

        <label class="runtime-control">
          <span>Height</span>
          <input
            type="range"
            min="72"
            max="180"
            step="4"
            bind:value={height}
            on:input={markInteraction}
          />
          <strong>{height}px</strong>
        </label>

        <label class="runtime-control">
          <span>Radius</span>
          <input
            type="range"
            min="18"
            max={maxRadius}
            step="2"
            bind:value={radius}
            on:input={markInteraction}
          />
          <strong>{radius}px</strong>
        </label>

        <label class="runtime-control">
          <span>Bezel Width</span>
          <input
            type="range"
            min="8"
            max="48"
            step="1"
            bind:value={bezelWidth}
            on:input={markInteraction}
          />
          <strong>{bezelWidth}px</strong>
        </label>

        <label class="runtime-control">
          <span>Glass Thickness</span>
          <input
            type="range"
            min="24"
            max="160"
            step="2"
            bind:value={glassThickness}
            on:input={markInteraction}
          />
          <strong>{glassThickness}px</strong>
        </label>

        <label class="runtime-control">
          <span>Refractive Index</span>
          <input
            type="range"
            min="1.1"
            max="1.8"
            step="0.01"
            bind:value={refractiveIndex}
            on:input={markInteraction}
          />
          <strong>{refractiveIndex.toFixed(2)}</strong>
        </label>

        <label class="runtime-control">
          <span>DPR</span>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            bind:value={runtimeDpr}
            on:input={markInteraction}
          />
          <strong>{runtimeDpr}x</strong>
        </label>

        <label class="runtime-control">
          <span>Bezel Type</span>
          <select bind:value={bezelType} on:change={markInteraction}>
            {#each bezelTypes as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label class="runtime-toggle">
          <input type="checkbox" bind:checked={magnify} on:change={markInteraction} />
          <span>Enable magnifying layer</span>
        </label>
      </div>

      {#if runtimeError}
        <p class="runtime-error">{runtimeError}</p>
      {/if}
    </aside>
  </div>
</section>

<style>
  .runtime-copy,
  .runtime-error {
    color: var(--demo-muted);
  }

  .runtime-button {
    border: 1px solid color-mix(in srgb, var(--demo-ink) 12%, transparent);
    border-radius: 9999px;
    padding: 0.7rem 1rem;
    color: var(--demo-ink);
    background: color-mix(in srgb, var(--demo-panel-bg1) 72%, white 28%);
    font: inherit;
    cursor: pointer;
  }

  .runtime-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .runtime-button--strong {
    color: white;
    background: linear-gradient(135deg, #0f172a, #1d4ed8);
  }

  .runtime-button--small {
    padding: 0.45rem 0.8rem;
    font-size: 0.82rem;
  }

  .runtime-stage {
    position: relative;
    display: grid;
    min-height: 560px;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--demo-panel-border);
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent);
  }

  .runtime-backdrop,
  .runtime-grid,
  .runtime-orb {
    position: absolute;
    inset: 0;
  }

  .runtime-backdrop {
    overflow: hidden;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--demo-panel-bg1) 92%, transparent), transparent 56%),
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 32%),
      radial-gradient(circle at 85% 18%, rgba(244, 63, 94, 0.14), transparent 22%),
      radial-gradient(circle at 80% 82%, rgba(56, 189, 248, 0.16), transparent 30%),
      linear-gradient(135deg, var(--demo-panel-bg1), var(--demo-panel-bg2));
  }

  .runtime-grid {
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--demo-ink) 8%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--demo-ink) 8%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.7;
  }

  .runtime-orb {
    border-radius: 9999px;
    filter: blur(18px);
  }

  .runtime-orb--a {
    inset: auto auto 72px 48px;
    width: 180px;
    height: 180px;
    background: rgba(20, 184, 166, 0.18);
  }

  .runtime-orb--b {
    inset: 34px 44px auto auto;
    width: 140px;
    height: 140px;
    background: rgba(59, 130, 246, 0.16);
  }

  .runtime-copy-block {
    position: absolute;
    top: 34px;
    left: 34px;
    z-index: 1;
    max-width: 28rem;
  }

  .runtime-kicker {
    color: var(--demo-accent);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .runtime-title {
    margin: 0.5rem 0 0;
    color: var(--demo-ink);
    font-size: clamp(1.8rem, 4vw, 3.1rem);
    line-height: 0.95;
  }

  .runtime-lead {
    margin: 1rem 0 0;
    max-width: 34rem;
    color: var(--demo-muted);
    line-height: 1.7;
  }

  .runtime-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1rem;
  }

  .runtime-chip {
    border: 1px solid color-mix(in srgb, var(--demo-ink) 10%, transparent);
    border-radius: 9999px;
    padding: 0.35rem 0.75rem;
    color: var(--demo-ink);
    background: color-mix(in srgb, white 72%, transparent);
    font-size: 0.8rem;
  }

  .runtime-surface {
    position: relative;
    z-index: 1;
    display: flex;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.16);
    box-shadow:
      0 24px 60px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    will-change: backdrop-filter, width, height, border-radius;
  }

  .runtime-surface--placeholder {
    align-items: center;
    justify-content: center;
    width: min(100% - 2rem, 360px);
    height: 120px;
    color: var(--demo-muted);
  }

  .runtime-surface__shine {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(90% 140% at 0% 0%, rgba(255, 255, 255, 0.46), transparent 54%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 58%);
    pointer-events: none;
  }

  .runtime-surface__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.9rem;
    justify-content: center;
    padding: 1.15rem 1.25rem;
  }

  .runtime-surface__tag {
    color: color-mix(in srgb, var(--demo-ink) 52%, transparent);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .runtime-surface__headline {
    color: var(--demo-ink);
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1;
  }

  .runtime-input {
    display: grid;
    gap: 0.45rem;
    color: color-mix(in srgb, var(--demo-ink) 64%, transparent);
    font-size: 0.8rem;
  }

  .runtime-input input,
  .runtime-control select {
    border: 1px solid color-mix(in srgb, var(--demo-ink) 10%, transparent);
    border-radius: 14px;
    padding: 0.7rem 0.9rem;
    color: var(--demo-ink);
    background: rgba(255, 255, 255, 0.42);
    font: inherit;
    outline: none;
  }

  .runtime-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .runtime-sidebar__title {
    color: var(--demo-ink);
    font-size: 0.86rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .runtime-metrics,
  .runtime-controls,
  .runtime-bench {
    border: 1px solid var(--demo-panel-border);
    border-radius: 24px;
    background: color-mix(in srgb, var(--demo-panel-bg1) 84%, white 16%);
    padding: 1rem;
  }

  .runtime-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .runtime-metric {
    display: grid;
    gap: 0.3rem;
  }

  .runtime-metric__label {
    color: var(--demo-muted);
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .runtime-metric strong {
    color: var(--demo-ink);
    font-size: 1rem;
  }

  .runtime-bench {
    display: grid;
    gap: 0.9rem;
  }

  .runtime-bench__empty {
    margin: 0;
    color: var(--demo-muted);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .runtime-copy-feedback {
    color: var(--demo-muted);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .runtime-bench__table {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 0.8fr));
    gap: 0.55rem 0.75rem;
    color: var(--demo-ink);
    font-size: 0.92rem;
  }

  .runtime-bench__header {
    color: var(--demo-muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .runtime-controls {
    display: grid;
    gap: 0.95rem;
  }

  .runtime-control {
    display: grid;
    gap: 0.45rem;
    color: var(--demo-ink);
  }

  .runtime-control span {
    color: var(--demo-muted);
    font-size: 0.86rem;
  }

  .runtime-control strong {
    font-size: 0.88rem;
  }

  .runtime-control input[type="range"] {
    width: 100%;
  }

  .runtime-toggle {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: var(--demo-ink);
  }

  .runtime-toggle input {
    width: 1rem;
    height: 1rem;
  }

  .runtime-error {
    margin: 0;
    font-size: 0.88rem;
  }

  @media (max-width: 1024px) {
    .runtime-metrics {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .runtime-copy-block {
      top: 24px;
      left: 24px;
      right: 24px;
    }

    .runtime-stage {
      min-height: 640px;
    }

    .runtime-surface {
      width: min(100% - 1.25rem, 360px) !important;
    }
  }
</style>
