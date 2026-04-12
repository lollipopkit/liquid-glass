<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import sliderAssets from "virtual:liquidGlassFilterAssets?width=84&height=56&radius=28&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { clamp, createAnimatedNumber, createFilterId, mix } from "../shared";

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
  const activeAmount = createAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.76,
  });
  const progressAmount = createAnimatedNumber(0, {
    stiffness: 0.26,
    damping: 0.72,
  });

  $: safeMax = max > min ? max : min + 1;
  $: normalizedValue = clamp(value, min, safeMax);
  $: progress = ((normalizedValue - min) / (safeMax - min)) * 100;
  $: active = !disabled && (focused || pressed);
  $: activeAmount.setTarget(active ? 1 : 0);
  $: if (pressed) {
    progressAmount.jump(progress);
  } else {
    progressAmount.setTarget(progress);
  }
  $: blur = mix(0.3, 0.05, $activeAmount);
  $: scaleRatio = mix(0.56, 0.92, $activeAmount);
  $: specularOpacity = mix(0.4, 0.52, $activeAmount);
  $: specularSaturation = mix(7, 9, $activeAmount);
  $: thumbScale = disabled ? 0.72 : mix(0.68, 1, $activeAmount);
  $: thumbBackground = disabled
    ? "rgba(255,255,255,0.14)"
    : `rgba(255,255,255,${mix(0.16, 0.28, $activeAmount)})`;
  $: thumbShadow = `0 ${mix(8, 14, $activeAmount)}px ${mix(20, 28, $activeAmount)}px rgba(15,23,42,${mix(0.14, 0.18, $activeAmount)})`;

  onDestroy(() => {
    activeAmount.destroy();
    progressAmount.destroy();
  });
</script>

<svelte:window
  on:pointerup={() => (pressed = false)}
  on:pointercancel={() => (pressed = false)}
/>

<div class={`relative w-full min-w-[220px] select-none ${disabled ? "opacity-60" : ""} ${className}`}>
  <div class="relative h-16">
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
        <div
          class="h-full rounded-full bg-sky-500/85"
          style={`width:${$progressAmount}%`}
        ></div>
      </div>

      <LiquidGlassFilter
        id={filterId}
        assets={sliderAssets}
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        {blur}
        {scaleRatio}
        {specularOpacity}
        {specularSaturation}
      />

      <div
        class="pointer-events-none absolute border border-white/35 bg-white/16"
        style={`top:${(64 - THUMB_HEIGHT) / 2}px;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;left:calc(${$progressAmount}% - ${THUMB_WIDTH / 2}px);border-radius:${THUMB_HEIGHT / 2}px;backdrop-filter:url(#${filterId});transform:scale(${thumbScale});background-color:${thumbBackground};box-shadow:${thumbShadow};will-change:left,transform,background-color,box-shadow`}
      ></div>
    </div>
  </div>
</div>
