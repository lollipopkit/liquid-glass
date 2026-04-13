<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import type {
    CreateLiquidGlassRuntimeAssetsOptions,
    LiquidGlassAssetMode,
    LiquidGlassFilterParamInput,
  } from "@lollipopkit/liquid-glass";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import {
    createLiquidGlassRuntimeStore,
    resolveLiquidGlassComponentAssets,
    resolveLiquidGlassComponentMode,
    type LiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStoreState,
  } from "../runtime";
  import { getLiquidGlassStaticAssets } from "../staticAssets";
  import { clamp, createAnimatedNumber, createFilterId, mix } from "../shared";

  type LiquidSliderRuntimeParams = Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let disabled = false;
  export let className = "";
  export let mode: LiquidGlassAssetMode | undefined = undefined;
  export let runtime = false;
  export let runtimeParams: LiquidSliderRuntimeParams = {};
  export let runtimeOptions: CreateLiquidGlassRuntimeAssetsOptions = {};

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-slider");

  const THUMB_WIDTH = 90;
  const THUMB_HEIGHT = 60;
  const TRACK_HEIGHT = 14;
  const REST_SCALE = 0.6;
  const ACTIVE_SCALE = 1;
  const REST_WIDTH = THUMB_WIDTH * REST_SCALE;
  const SLIDER_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
    bezelType: "convex_squircle",
    bezelWidth: 16,
    glassThickness: 80,
    height: THUMB_HEIGHT,
    radius: 30,
    refractiveIndex: 1.45,
    width: THUMB_WIDTH,
  };
  const INITIAL_RUNTIME_STATE: LiquidGlassRuntimeStoreState = {
    assets: null,
    backend: null,
    error: null,
    isPending: false,
  };

  let pressed = false;
  let runtimeStore: LiquidGlassRuntimeStore | null = null;
  let runtimeState: LiquidGlassRuntimeStoreState = INITIAL_RUNTIME_STATE;
  let unsubscribeRuntimeStore: (() => void) | undefined;
  const activeAmount = createAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.76,
  });
  const progressAmount = createAnimatedNumber(0, {
    stiffness: 0.26,
    damping: 0.72,
  });

  function disposeRuntimeStore() {
    unsubscribeRuntimeStore?.();
    unsubscribeRuntimeStore = undefined;
    runtimeStore?.dispose();
    runtimeStore = null;
    runtimeState = INITIAL_RUNTIME_STATE;
  }

  $: safeMax = max > min ? max : min + 1;
  $: normalizedValue = clamp(value, min, safeMax);
  $: progress = ((normalizedValue - min) / (safeMax - min)) * 100;
  $: active = !disabled && pressed;
  $: activeAmount.setTarget(active ? 1 : 0);
  $: if (pressed) {
    progressAmount.jump(progress);
  } else {
    progressAmount.setTarget(progress);
  }
  $: blur = 0;
  $: scaleRatio = mix(0.4, 0.9, $activeAmount);
  $: specularOpacity = 0.4;
  $: specularSaturation = 7;
  $: thumbScale = disabled ? REST_SCALE : mix(REST_SCALE, ACTIVE_SCALE, $activeAmount);
  $: thumbBackground = disabled
    ? "rgba(255,255,255,0.2)"
    : `rgba(255,255,255,${mix(1, 0.1, $activeAmount)})`;
  $: thumbShadow = "0 3px 14px rgba(0,0,0,0.1)";
  $: mergedRuntimeInput = {
    ...SLIDER_RUNTIME_INPUT,
    ...runtimeParams,
  };
  const staticAssets = getLiquidGlassStaticAssets("slider");
  $: resolvedMode = resolveLiquidGlassComponentMode(mode, runtime, Boolean(staticAssets));
  $: if (resolvedMode === "runtime") {
    if (!runtimeStore) {
      runtimeStore = createLiquidGlassRuntimeStore(mergedRuntimeInput, runtimeOptions);
      unsubscribeRuntimeStore = runtimeStore.subscribe((value) => {
        runtimeState = value;
      });
    } else {
      void runtimeStore.setConfig(mergedRuntimeInput, runtimeOptions);
    }
  } else {
    disposeRuntimeStore();
  }
  $: filterAssets = resolveLiquidGlassComponentAssets(
    resolvedMode,
    runtimeState.assets,
    staticAssets,
    mergedRuntimeInput
  );

  onDestroy(() => {
    activeAmount.destroy();
    progressAmount.destroy();
    disposeRuntimeStore();
  });
</script>

<svelte:window
  on:pointerup={() => (pressed = false)}
  on:pointercancel={() => (pressed = false)}
/>

<div class={`relative w-full max-w-[330px] min-w-[220px] select-none ${disabled ? "opacity-60" : ""} ${className}`}>
  <div class="relative h-[60px]">
    <input
      class={`absolute inset-0 z-20 m-0 h-full w-full cursor-pointer touch-none opacity-0 ${disabled ? "cursor-not-allowed" : ""}`}
      type="range"
      {min}
      max={safeMax}
      {step}
      {disabled}
      value={normalizedValue}
      on:input={(event) => {
        value = Number((event.currentTarget as HTMLInputElement).value);
        dispatch("input", value);
      }}
      on:change={(event) => dispatch("change", event)}
      on:pointerdown={() => {
        if (!disabled) pressed = true;
      }}
      on:focus={(event) => {
        dispatch("focus", event);
      }}
      on:blur={(event) => {
        pressed = false;
        dispatch("blur", event);
      }}
    />

      <div class="absolute inset-y-0" style={`left:${REST_WIDTH / 2}px;right:${REST_WIDTH / 2}px`}>
        <div
          class="absolute inset-x-0 overflow-hidden rounded-full"
          style={`top:${(THUMB_HEIGHT - TRACK_HEIGHT) / 2}px;height:${TRACK_HEIGHT}px;background-color:#89898F66`}
        >
        <div
          class="h-full rounded-full"
          style={`width:${$progressAmount}%;background-color:#0377F7`}
        ></div>
      </div>

      <LiquidGlassFilter
        id={filterId}
        assets={filterAssets}
        width={filterAssets.width}
        height={filterAssets.height}
        {blur}
        {scaleRatio}
        {specularOpacity}
        {specularSaturation}
      />

      <div
        class="pointer-events-none absolute"
        style={`top:0;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;left:calc(${$progressAmount}% - ${THUMB_WIDTH / 2}px);border-radius:${THUMB_HEIGHT / 2}px;backdrop-filter:url(#${filterId});transform:scale(${thumbScale});background-color:${thumbBackground};box-shadow:${thumbShadow};will-change:left,transform,background-color,box-shadow`}
      ></div>
    </div>
  </div>
</div>
