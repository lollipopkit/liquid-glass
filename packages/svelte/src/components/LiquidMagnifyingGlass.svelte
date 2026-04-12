<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import magnifierAssets from "virtual:liquidGlassFilterAssets?width=220&height=150&radius=75&bezelWidth=24&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { clamp, createFilterId } from "../shared";

  export let lensWidth = 220;
  export let lensHeight = 150;
  export let initialX = 24;
  export let initialY = 24;
  export let magnification = 28;
  export let className = "";

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-magnifier");

  let containerEl: HTMLDivElement;
  let lensEl: HTMLDivElement;
  let active = false;
  let position = { x: initialX, y: initialY };
  let size = { width: 0, height: 0 };
  let frame = 0;
  const dragState = {
    pointerId: -1,
    startX: 0,
    startY: 0,
    baseX: initialX,
    baseY: initialY,
  };
  const livePosition = {
    x: initialX,
    y: initialY,
  };

  function applyLensTransform(nextX: number, nextY: number, nextActive: boolean) {
    if (!lensEl) return;
    lensEl.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${nextActive ? 1 : 0.94})`;
  }

  function updateSize() {
    const rect = containerEl?.getBoundingClientRect();
    size = { width: rect?.width ?? 0, height: rect?.height ?? 0 };
    position = {
      x: clamp(position.x, 0, Math.max(0, size.width - lensWidth)),
      y: clamp(position.y, 0, Math.max(0, size.height - lensHeight)),
    };
    livePosition.x = position.x;
    livePosition.y = position.y;
    applyLensTransform(position.x, position.y, active);
  }

  function handlePointerMove(event: PointerEvent) {
    if (dragState.pointerId !== event.pointerId) return;

    livePosition.x = clamp(
      dragState.baseX + (event.clientX - dragState.startX),
      0,
      Math.max(0, size.width - lensWidth)
    );
    livePosition.y = clamp(
      dragState.baseY + (event.clientY - dragState.startY),
      0,
      Math.max(0, size.height - lensHeight)
    );

    if (frame) return;

    frame = window.requestAnimationFrame(() => {
      frame = 0;
      applyLensTransform(livePosition.x, livePosition.y, true);
    });
  }

  function handlePointerUp(event: PointerEvent) {
    if (dragState.pointerId !== event.pointerId) return;
    dragState.pointerId = -1;
    lensEl?.releasePointerCapture?.(event.pointerId);

    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    position = { x: livePosition.x, y: livePosition.y };
    active = false;
  }

  onMount(() => {
    updateSize();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  });
</script>

<svelte:window on:resize={updateSize} on:pointermove={handlePointerMove} on:pointerup={handlePointerUp} on:pointercancel={handlePointerUp} />

<div
  bind:this={containerEl}
  class={`relative isolate min-h-[320px] overflow-hidden rounded-[28px] border border-black/10 bg-white/6 shadow-[0_18px_50px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-black/16 ${className}`}
>
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.2),transparent_52%)] dark:bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.08),transparent_52%)]"></div>
  <div class="relative h-full w-full"><slot /></div>

  <LiquidGlassFilter
    id={filterId}
    assets={magnifierAssets}
    width={lensWidth}
    height={lensHeight}
    blur={active ? 0 : 0.15}
    scaleRatio={active ? 1 : 0.82}
    specularOpacity={0.28}
    specularSaturation={8}
    magnifyingScale={magnification}
  />

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={lensEl}
    class="absolute left-0 top-0 z-10 cursor-grab touch-none border border-white/35 bg-white/12 shadow-[0_18px_34px_rgba(15,23,42,0.18)] transition-[transform,box-shadow] duration-200 active:cursor-grabbing"
    style={`width:${lensWidth}px;height:${lensHeight}px;border-radius:${lensHeight / 2}px;transform:translate3d(${position.x}px, ${position.y}px, 0) scale(${active ? 1 : 0.94});backdrop-filter:url(#${filterId});transition-duration:${active ? "0ms" : "200ms"};will-change:${active ? "transform" : "auto"};box-shadow:${active ? "0 22px 42px rgba(15,23,42,0.22)" : "0 16px 28px rgba(15,23,42,0.18)"}`}
    on:pointerdown={(event) => {
      updateSize();
      dragState.pointerId = event.pointerId;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      dragState.baseX = livePosition.x;
      dragState.baseY = livePosition.y;
      lensEl?.setPointerCapture?.(event.pointerId);
      applyLensTransform(livePosition.x, livePosition.y, true);
      active = true;
      dispatch("dragstart", { x: livePosition.x, y: livePosition.y });
    }}
  >
    <div
      class="pointer-events-none absolute inset-[6px] rounded-[inherit] border border-white/22"
      style={`border-radius:${Math.max(0, lensHeight / 2 - 6)}px`}
    ></div>
  </div>
</div>
