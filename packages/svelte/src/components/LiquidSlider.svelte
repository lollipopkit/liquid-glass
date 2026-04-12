<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import sliderAssets from "virtual:liquidGlassFilterAssets?width=84&height=56&radius=28&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { clamp, createFilterId } from "../shared";

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let disabled = false;
  export let className = "";

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-slider");

  const THUMB_WIDTH = 84;
  const THUMB_HEIGHT = 56;

  let focused = false;
  let pressed = false;

  $: safeMax = max > min ? max : min + 1;
  $: normalizedValue = clamp(value, min, safeMax);
  $: progress = ((normalizedValue - min) / (safeMax - min)) * 100;
  $: active = !disabled && (focused || pressed);
</script>

<svelte:window on:pointerup={() => (pressed = false)} />

<div class={`relative w-full min-w-[220px] select-none ${disabled ? "opacity-60" : ""} ${className}`}>
  <div class="relative h-16">
    <input
      class={`absolute inset-0 z-20 m-0 h-full w-full cursor-pointer opacity-0 ${disabled ? "cursor-not-allowed" : ""}`}
      type="range"
      {min}
      max={safeMax}
      {step}
      {disabled}
      bind:value={normalizedValue}
      on:input={(event) => {
        value = Number((event.currentTarget as HTMLInputElement).value);
        dispatch("input", value);
      }}
      on:change={(event) => dispatch("change", event)}
      on:pointerdown={() => {
        if (!disabled) pressed = true;
      }}
      on:focus={(event) => {
        focused = true;
        dispatch("focus", event);
      }}
      on:blur={(event) => {
        focused = false;
        pressed = false;
        dispatch("blur", event);
      }}
    />

    <div class="absolute inset-y-0" style={`left:${THUMB_WIDTH / 2}px;right:${THUMB_WIDTH / 2}px`}>
      <div class="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div class="h-full rounded-full bg-sky-500/85 transition-[width] duration-200" style={`width:${progress}%`}></div>
      </div>

      <LiquidGlassFilter
        id={filterId}
        assets={sliderAssets}
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        blur={active ? 0.1 : 0.3}
        scaleRatio={active ? 0.92 : 0.56}
        specularOpacity={active ? 0.52 : 0.4}
        specularSaturation={active ? 9 : 7}
      />

      <div
        class="pointer-events-none absolute border border-white/35 bg-white/16 shadow-[0_8px_26px_rgba(15,23,42,0.15)] transition-[left,transform,background-color,box-shadow] duration-200"
        style={`top:${(64 - THUMB_HEIGHT) / 2}px;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;left:calc(${progress}% - ${THUMB_WIDTH / 2}px);border-radius:${THUMB_HEIGHT / 2}px;backdrop-filter:url(#${filterId});transform:scale(${disabled ? 0.72 : active ? 1 : 0.7});background-color:${disabled ? "rgba(255,255,255,0.14)" : active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.16)"};box-shadow:${active ? "0 14px 28px rgba(15,23,42,0.18)" : "0 8px 20px rgba(15,23,42,0.14)"}`}
      ></div>
    </div>
  </div>
</div>
