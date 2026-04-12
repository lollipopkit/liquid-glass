<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import switchAssets from "virtual:liquidGlassFilterAssets?width=58&height=58&radius=29&bezelWidth=16&glassThickness=58&refractiveIndex=1.5&bezelType=lip";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { createFilterId } from "../shared";

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
      class="absolute inset-x-0 border border-black/8 transition-[background-color,box-shadow] duration-200 dark:border-white/8"
      style={`top:${TRACK_PADDING}px;height:${TRACK_HEIGHT}px;border-radius:${TRACK_HEIGHT / 2}px;background-color:${checked ? "rgba(56,189,248,0.48)" : "rgba(148,148,159,0.34)"};box-shadow:${focused ? "0 0 0 1px rgba(56,189,248,0.22)" : "0 10px 24px rgba(15,23,42,0.08)"}`}
    ></div>

    <LiquidGlassFilter
      id={filterId}
      assets={switchAssets}
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      blur={active ? 0.08 : 0.18}
      scaleRatio={active ? 0.94 : 0.62}
      specularOpacity={active ? 0.6 : 0.5}
      specularSaturation={active ? 8 : 6}
    />

    <div
      class="pointer-events-none absolute border border-white/35 bg-white/16 shadow-[0_10px_24px_rgba(15,23,42,0.15)] transition-[left,transform,background-color,box-shadow] duration-200"
      style={`top:0;width:${THUMB_SIZE}px;height:${THUMB_SIZE}px;left:${checked ? TRACK_WIDTH - THUMB_SIZE : 0}px;border-radius:${THUMB_SIZE / 2}px;backdrop-filter:url(#${filterId});transform:scale(${disabled ? 0.76 : active ? 0.94 : 0.8});background-color:${checked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.18)"};box-shadow:${active ? "0 14px 28px rgba(15,23,42,0.18)" : "0 8px 22px rgba(15,23,42,0.14)"}`}
    ></div>
  </div>
</label>
