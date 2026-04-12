<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import switchAssets from "virtual:liquidGlassFilterAssets?width=58&height=58&radius=29&bezelWidth=16&glassThickness=58&refractiveIndex=1.5&bezelType=lip";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { createAnimatedNumber, createFilterId, mix } from "../shared";

  export let checked = false;
  export let disabled = false;
  export let className = "";

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-switch");

  const THUMB_SIZE = 58;
  const TRACK_WIDTH = 92;
  const TRACK_HEIGHT = 40;
  const TRACK_PADDING = (THUMB_SIZE - TRACK_HEIGHT) / 2;

  let focused = false;
  let pressed = false;
  $: active = !disabled && (pressed || focused);
  const activeAmount = createAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.76,
  });
  const checkedAmount = createAnimatedNumber(checked ? 1 : 0, {
    stiffness: 0.16,
    damping: 0.74,
  });
  $: activeAmount.setTarget(active ? 1 : 0);
  $: checkedAmount.setTarget(checked ? 1 : 0);
  $: blur = mix(0.18, 0.08, $activeAmount);
  $: scaleRatio = mix(0.62, 0.94, $activeAmount);
  $: specularOpacity = mix(0.5, 0.6, $activeAmount);
  $: specularSaturation = mix(6, 8, $activeAmount);
  $: trackRed = mix(148, 56, $checkedAmount);
  $: trackGreen = mix(148, 189, $checkedAmount);
  $: trackBlue = mix(159, 248, $checkedAmount);
  $: trackAlpha = mix(0.34, 0.48, $checkedAmount);
  $: trackBackground = `rgba(${trackRed},${trackGreen},${trackBlue},${trackAlpha})`;
  $: thumbLeft = (TRACK_WIDTH - THUMB_SIZE) * $checkedAmount;
  $: thumbScale = disabled ? 0.76 : mix(0.8, 0.94, $activeAmount);
  $: thumbBackground = `rgba(255,255,255,${mix(0.18, 0.3, $checkedAmount)})`;
  $: thumbShadow = `0 ${mix(8, 14, $activeAmount)}px ${mix(22, 28, $activeAmount)}px rgba(15,23,42,${mix(0.14, 0.18, $activeAmount)})`;

  onDestroy(() => {
    activeAmount.destroy();
    checkedAmount.destroy();
  });
</script>

<svelte:window on:pointerup={() => (pressed = false)} />

<label class={`relative inline-flex h-[58px] w-[110px] shrink-0 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}>
  <input
    type="checkbox"
    {disabled}
    bind:checked
    class="absolute inset-0 z-20 h-full w-full cursor-inherit opacity-0"
    on:change={(event) => {
      dispatch("change", event);
      dispatch("checkedChange", checked);
    }}
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

  <div class="absolute inset-y-0" style={`left:${TRACK_PADDING}px;right:${TRACK_PADDING}px`}>
    <div
      class="absolute inset-x-0 border border-black/8 dark:border-white/8"
      style={`top:${TRACK_PADDING}px;height:${TRACK_HEIGHT}px;border-radius:${TRACK_HEIGHT / 2}px;background-color:${trackBackground};box-shadow:${focused ? "0 0 0 1px rgba(56,189,248,0.22)" : "0 10px 24px rgba(15,23,42,0.08)"};will-change:background-color`}
    ></div>

    <LiquidGlassFilter
      id={filterId}
      assets={switchAssets}
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      {blur}
      {scaleRatio}
      {specularOpacity}
      {specularSaturation}
    />

    <div
      class="pointer-events-none absolute border border-white/35 bg-white/16"
      style={`top:0;width:${THUMB_SIZE}px;height:${THUMB_SIZE}px;left:${thumbLeft}px;border-radius:${THUMB_SIZE / 2}px;backdrop-filter:url(#${filterId});transform:scale(${thumbScale});background-color:${thumbBackground};box-shadow:${thumbShadow};will-change:left,transform,background-color,box-shadow`}
    ></div>
  </div>
</label>
