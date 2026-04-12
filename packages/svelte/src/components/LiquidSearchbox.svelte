<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { createFilterId } from "../shared";

  export let value = "";
  export let placeholder = "Search";
  export let disabled = false;
  export let autocomplete: HTMLInputAttributes["autocomplete"] = "off";
  export let inputClass = "";
  export let className = "";

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-searchbox");

  let focused = false;
  let pressed = false;
  let labelEl: HTMLLabelElement;
  let width = 280;

  function updateWidth() {
    width = Math.max(Math.round(labelEl?.getBoundingClientRect().width ?? 0), 280);
  }

  function handleInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    value = target.value;
    dispatch("input", value);
    dispatch("change", event);
  }
</script>

<svelte:window on:resize={updateWidth} />

<label
  bind:this={labelEl}
  class={`relative flex h-14 w-full min-w-0 items-center overflow-hidden rounded-full border px-4 text-black transition-transform duration-200 border-black/10 bg-white/10 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/8 dark:text-white ${disabled ? "cursor-not-allowed opacity-70" : "cursor-text"} ${className}`}
  style={`transform: scale(${disabled ? 1 : pressed ? 0.992 : focused ? 1 : 0.985})`}
  on:pointerdown={() => {
    if (!disabled) pressed = true;
    updateWidth();
  }}
  on:pointerup={() => (pressed = false)}
  on:pointercancel={() => (pressed = false)}
  on:pointerleave={() => (pressed = false)}
>
  <LiquidGlassFilter
    id={filterId}
    assets={searchboxAssets}
    width={width}
    height={56}
    blur={focused ? 0.35 : 0.8}
    scaleRatio={focused ? 0.92 : 0.72}
    specularOpacity={focused ? 0.24 : 0.18}
    specularSaturation={focused ? 6 : 4}
  />

  <span
    class="absolute inset-0 transition-[background-color,box-shadow] duration-200"
    style={`border-radius:9999px;backdrop-filter:url(#${filterId});background-color:${disabled ? "rgba(255,255,255,0.12)" : focused || pressed ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.14)"};box-shadow:${focused ? "0 0 0 1px rgba(56,189,248,0.24), 0 18px 40px rgba(15,23,42,0.16)" : "0 12px 28px rgba(15,23,42,0.12)"}`}
  ></span>

  <span class="pointer-events-none relative z-[1] shrink-0 text-black/55 dark:text-white/55">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  </span>

  <input
    autocomplete={autocomplete}
    {disabled}
    type="search"
    bind:value
    {placeholder}
    class={`relative z-[1] ml-3 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-none text-black/80 outline-none placeholder:text-black/45 selection:bg-sky-400/25 dark:text-white/82 dark:placeholder:text-white/42 disabled:cursor-not-allowed ${inputClass}`}
    on:input={handleInput}
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
</label>
