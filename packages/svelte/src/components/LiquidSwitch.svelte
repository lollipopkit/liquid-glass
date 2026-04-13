<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import type {
    CreateLiquidGlassRuntimeAssetsOptions,
    LiquidGlassFilterParamInput,
  } from "@lollipopkit/liquid-glass";
  import switchAssets from "virtual:liquidGlassFilterAssets?width=146&height=92&radius=46&bezelWidth=19&glassThickness=47&refractiveIndex=1.5&bezelType=lip";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import {
    createLiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStoreState,
  } from "../runtime";
  import { clamp, createAnimatedNumber, createFilterId, mix } from "../shared";

  export type LiquidSwitchRuntimeParams = Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;

  export let checked = false;
  export let disabled = false;
  export let className = "";
  export let runtime = false;
  export let runtimeParams: LiquidSwitchRuntimeParams = {};
  export let runtimeOptions: CreateLiquidGlassRuntimeAssetsOptions = {};

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
  const SWITCH_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
    bezelType: "lip",
    bezelWidth: 19,
    glassThickness: 47,
    height: THUMB_HEIGHT,
    radius: 46,
    refractiveIndex: 1.5,
    width: THUMB_WIDTH,
  };
  const INITIAL_RUNTIME_STATE: LiquidGlassRuntimeStoreState = {
    assets: null,
    backend: null,
    error: null,
    isPending: false,
  };

  let inputEl: HTMLInputElement | null = null;
  let pressed = false;
  let suppressClick = false;
  let runtimeStore: LiquidGlassRuntimeStore | null = null;
  let runtimeState: LiquidGlassRuntimeStoreState = INITIAL_RUNTIME_STATE;
  let unsubscribeRuntimeStore: (() => void) | undefined;
  const dragState = {
    dragRatio: 0,
    moved: false,
    pointerId: -1,
    startChecked: false,
    startX: 0,
  };
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
  $: if (!pressed) {
    checkedAmount.setTarget(checked ? 1 : 0);
  }
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
  $: mergedRuntimeInput = {
    ...SWITCH_RUNTIME_INPUT,
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
    unsubscribeRuntimeStore?.();
    unsubscribeRuntimeStore = undefined;
    runtimeStore?.dispose();
    runtimeStore = null;
    runtimeState = INITIAL_RUNTIME_STATE;
  }
  $: filterAssets = runtime && runtimeState.assets ? runtimeState.assets : switchAssets;

  onDestroy(() => {
    activeAmount.destroy();
    checkedAmount.destroy();
    unsubscribeRuntimeStore?.();
    runtimeStore?.dispose();
  });

  function resetDrag(pointerId?: number) {
    if (pointerId !== undefined) {
      inputEl?.releasePointerCapture?.(pointerId);
    }

    dragState.pointerId = -1;
    dragState.dragRatio = 0;
    dragState.moved = false;
  }

  function handlePointerMove(event: PointerEvent) {
    if (dragState.pointerId !== event.pointerId) return;

    const baseRatio = dragState.startChecked ? 1 : 0;
    const displacement = event.clientX - dragState.startX;
    const ratio = baseRatio + displacement / TRAVEL;
    const overflow = ratio < 0 ? -ratio : ratio > 1 ? ratio - 1 : 0;
    const overflowSign = ratio < 0 ? -1 : 1;
    const displayRatio = clamp(ratio, 0, 1) + (overflowSign * overflow) / 22;

    dragState.dragRatio = displayRatio;
    dragState.moved = Math.abs(displacement) > 4;
    checkedAmount.jump(displayRatio);
  }

  function handlePointerUp(event: PointerEvent) {
    if (dragState.pointerId !== event.pointerId) return;

    const shouldCommit = dragState.moved;
    const nextChecked = clamp(dragState.dragRatio, 0, 1) > 0.5;

    resetDrag(event.pointerId);
    pressed = false;

    if (shouldCommit) {
      suppressClick = true;
      checked = nextChecked;
      dispatch("checkedChange", checked);
      return;
    }

    checkedAmount.setTarget(checked ? 1 : 0);
  }

  function handlePointerCancel(event: PointerEvent) {
    if (dragState.pointerId !== event.pointerId) return;

    resetDrag(event.pointerId);
    pressed = false;
    checkedAmount.setTarget(checked ? 1 : 0);
  }
</script>

<svelte:window
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={handlePointerCancel}
/>

<label class={`relative inline-flex h-[92px] w-[160px] shrink-0 select-none touch-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}>
  <input
    bind:this={inputEl}
    type="checkbox"
    {disabled}
    bind:checked
    class="absolute inset-0 z-20 h-full w-full cursor-inherit opacity-0"
    on:change={(event) => {
      dispatch("change", event);
      dispatch("checkedChange", checked);
    }}
    on:pointerdown={(event) => {
      if (!disabled) {
        dragState.pointerId = event.pointerId;
        dragState.startX = event.clientX;
        dragState.startChecked = checked;
        dragState.dragRatio = checked ? 1 : 0;
        dragState.moved = false;
        pressed = true;
        inputEl?.setPointerCapture?.(event.pointerId);
      }
    }}
    on:click={(event) => {
      if (!suppressClick) return;

      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }}
    on:focus={(event) => {
      dispatch("focus", event);
    }}
    on:blur={(event) => {
      resetDrag();
      pressed = false;
      checkedAmount.setTarget(checked ? 1 : 0);
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
      style={`top:0;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;left:${thumbLeft}px;border-radius:${THUMB_RADIUS}px;backdrop-filter:url(#${filterId});transform:scale(${thumbScale});background-color:${thumbBackground};box-shadow:${thumbShadow};will-change:left,transform,background-color,box-shadow`}
    ></div>
  </div>
</label>
