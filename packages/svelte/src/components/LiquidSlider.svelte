<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import sliderAssets from "virtual:liquidGlassFilterAssets?width=90&height=60&radius=30&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

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

  const THUMB_WIDTH = 90;
  const THUMB_HEIGHT = 60;
  const TRACK_HEIGHT = 14;
  const REST_SCALE = 0.6;
  const ACTIVE_SCALE = 1;
  const REST_WIDTH = THUMB_WIDTH * REST_SCALE;

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

  onDestroy(() => {
    activeAmount.destroy();
    progressAmount.destroy();
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
        assets={sliderAssets}
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
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
