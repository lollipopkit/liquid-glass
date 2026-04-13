<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import type {
    CreateLiquidGlassRuntimeAssetsOptions,
    LiquidGlassFilterAssets,
    LiquidGlassFilterParamInput,
  } from "@lollipopkit/liquid-glass";
  import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import {
    createLiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStoreState,
  } from "../runtime";
  import { createAnimatedNumber, createFilterId, mix } from "../shared";

  export type LiquidSearchboxRuntimeParams = Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;

  const SEARCHBOX_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
    bezelType: "convex_squircle",
    bezelWidth: 27,
    glassThickness: 70,
    height: 56,
    radius: 28,
    refractiveIndex: 1.5,
    width: 420,
  };
  const INITIAL_RUNTIME_STATE: LiquidGlassRuntimeStoreState = {
    assets: null,
    backend: null,
    error: null,
    isPending: false,
  };

  export let value = "";
  export let placeholder = "Search";
  export let disabled = false;
  export let autocomplete: HTMLInputAttributes["autocomplete"] = "off";
  export let inputClass = "";
  export let className = "";
  export let runtime = false;
  export let runtimeParams: LiquidSearchboxRuntimeParams = {};
  export let runtimeOptions: CreateLiquidGlassRuntimeAssetsOptions = {};

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-searchbox");

  let focused = false;
  let pressed = false;
  let inputEl: HTMLInputElement;
  let runtimeStore: LiquidGlassRuntimeStore | null = null;
  let runtimeState: LiquidGlassRuntimeStoreState = INITIAL_RUNTIME_STATE;
  let unsubscribeRuntimeStore: (() => void) | undefined;
  const focusAmount = createAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.8,
  });
  const pressAmount = createAnimatedNumber(0, {
    stiffness: 0.22,
    damping: 0.78,
  });

  function handleInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    value = target.value;
    dispatch("input", value);
    dispatch("change", event);
  }

  function disposeRuntimeStore() {
    unsubscribeRuntimeStore?.();
    unsubscribeRuntimeStore = undefined;
    runtimeStore?.dispose();
    runtimeStore = null;
    runtimeState = INITIAL_RUNTIME_STATE;
  }

  onDestroy(() => {
    focusAmount.destroy();
    pressAmount.destroy();
    disposeRuntimeStore();
  });

  $: mergedRuntimeInput = {
    ...SEARCHBOX_RUNTIME_INPUT,
    ...runtimeParams,
  };
  $: if (runtime) {
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
  $: focusAmount.setTarget(focused ? 1 : 0);
  $: pressAmount.setTarget(pressed ? 1 : 0);
  $: backgroundOpacity = Math.max(
    mix(0.05, 0.3, $pressAmount),
    mix(0.05, 0.2, $focusAmount)
  );
  $: scale = mix(0.8, 1, $focusAmount) * mix(1, 0.99, $pressAmount);
  $: blur = 1;
  $: scaleRatio = 0.7;
  $: specularOpacity = 0.2;
  $: specularSaturation = 4;
  $: boxShadow = "0 4px 16px rgba(0, 0, 0, 0.16)";
  $: filterAssets =
    runtime && runtimeState.assets ? runtimeState.assets : searchboxAssets;
</script>

<svelte:window on:pointerup={() => (pressed = false)} on:pointercancel={() => (pressed = false)} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<label
  class={`relative flex h-14 w-full max-w-[420px] min-w-0 items-center overflow-hidden rounded-full px-5 text-black dark:text-white ${disabled ? "cursor-not-allowed opacity-70" : "cursor-text"} ${className}`}
  style={`transform: scale(${disabled ? 1 : scale});will-change:transform`}
  on:pointerdown={() => {
    if (!disabled) pressed = true;
  }}
  on:pointerup={() => (pressed = false)}
  on:pointercancel={() => (pressed = false)}
  on:pointerleave={() => (pressed = false)}
  on:click={() => {
    if (!disabled) {
      inputEl?.focus();
    }
  }}
>
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

  <span
    class="absolute inset-0"
    style={`border-radius:9999px;backdrop-filter:url(#${filterId});background-color:${disabled ? "rgba(255,255,255,0.12)" : `rgba(255,255,255,${backgroundOpacity})`};box-shadow:${boxShadow};transform:translateZ(0);will-change:background-color`}
  ></span>

  <span class="pointer-events-none relative z-[1] shrink-0 opacity-70">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
      />
    </svg>
  </span>

  <input
    bind:this={inputEl}
    autocomplete={autocomplete}
    {disabled}
    type="search"
    bind:value
    {placeholder}
    class={`relative z-[1] ml-3 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-none text-black/70 outline-none placeholder:text-black/70 selection:bg-sky-400/25 dark:text-white/70 dark:placeholder:text-white/70 disabled:cursor-not-allowed ${inputClass}`}
    on:input={handleInput}
    on:focus={(event) => {
      focused = true;
      dispatch("focus", event);
    }}
    on:mousedown={(event) => {
      if (!focused) {
        event.preventDefault();
      }
    }}
    on:blur={(event) => {
      focused = false;
      pressed = false;
      dispatch("blur", event);
    }}
  />
</label>
