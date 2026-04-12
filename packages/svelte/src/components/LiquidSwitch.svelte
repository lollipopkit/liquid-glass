<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import switchAssets from "virtual:liquidGlassFilterAssets?width=146&height=92&radius=46&bezelWidth=19&glassThickness=47&refractiveIndex=1.5&bezelType=lip";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { createAnimatedNumber, createFilterId, mix } from "../shared";

  export let checked = false;
  export let disabled = false;
  export let className = "";

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-switch");

  const THUMB_WIDTH = 146;
  const THUMB_HEIGHT = 92;
  const THUMB_RADIUS = THUMB_HEIGHT / 2;
  const TRACK_WIDTH = 160;
  const TRACK_HEIGHT = 67;
  const REST_SCALE = 0.65;
  const ACTIVE_SCALE = 0.9;
  const THUMB_REST_OFFSET = ((1 - REST_SCALE) * THUMB_WIDTH) / 2;
  const TRACK_PADDING = (THUMB_HEIGHT - TRACK_HEIGHT) / 2;
  const TRAVEL =
    TRACK_WIDTH - TRACK_HEIGHT - (THUMB_WIDTH - THUMB_HEIGHT) * REST_SCALE;

  let pressed = false;
  $: active = !disabled && pressed;
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
  $: blur = 0.2;
  $: scaleRatio = 0.4 + 0.5 * $activeAmount;
  $: specularOpacity = 0.5;
  $: specularSaturation = 6;
  $: trackRed = mix(148, 59, $checkedAmount);
  $: trackGreen = mix(148, 191, $checkedAmount);
  $: trackBlue = mix(159, 78, $checkedAmount);
  $: trackAlpha = mix(0.47, 0.93, $checkedAmount);
  $: trackBackground = `rgba(${trackRed},${trackGreen},${trackBlue},${trackAlpha})`;
  $: thumbLeft =
    -THUMB_REST_OFFSET +
    (TRACK_HEIGHT - THUMB_HEIGHT * REST_SCALE) / 2 +
    TRAVEL * $checkedAmount;
  $: thumbScale = disabled ? REST_SCALE : mix(REST_SCALE, ACTIVE_SCALE, $activeAmount);
  $: thumbBackground = `rgba(255,255,255,${mix(1, 0.1, $activeAmount)})`;
  $: thumbShadow =
    $activeAmount > 0.5
      ? "0 4px 22px rgba(0,0,0,0.1), inset 2px 7px 24px rgba(0,0,0,0.09), inset -2px -7px 24px rgba(255,255,255,0.09)"
      : "0 4px 22px rgba(0,0,0,0.1)";

  onDestroy(() => {
    activeAmount.destroy();
    checkedAmount.destroy();
  });
</script>

<svelte:window on:pointerup={() => (pressed = false)} />

<label class={`relative inline-flex h-[92px] w-[160px] shrink-0 select-none touch-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}>
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
      dispatch("focus", event);
    }}
    on:blur={(event) => {
      pressed = false;
      dispatch("blur", event);
    }}
  />

  <div class="absolute inset-y-0" style="left:0;right:0">
    <div
      class="absolute"
      style={`top:${TRACK_PADDING}px;width:${TRACK_WIDTH}px;height:${TRACK_HEIGHT}px;border-radius:${TRACK_HEIGHT / 2}px;background-color:${trackBackground};box-shadow:none;will-change:background-color`}
    ></div>

    <LiquidGlassFilter
      id={filterId}
      assets={switchAssets}
      width={THUMB_WIDTH}
      height={THUMB_HEIGHT}
      {blur}
      {scaleRatio}
      {specularOpacity}
      {specularSaturation}
    />

    <div
      class="pointer-events-none absolute"
      style={`top:0;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;left:${thumbLeft}px;border-radius:${THUMB_RADIUS}px;backdrop-filter:url(#${filterId});transform:scale(${thumbScale});background-color:${thumbBackground};box-shadow:${thumbShadow};will-change:left,transform,background-color,box-shadow`}
    ></div>
  </div>
</label>
