<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import type {
    CreateLiquidGlassRuntimeAssetsOptions,
    LiquidGlassFilterParamInput,
  } from "@lollipopkit/liquid-glass";
  import magnifierAssets from "virtual:liquidGlassFilterAssets?width=210&height=150&radius=75&bezelWidth=25&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import {
    createLiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStore,
    type LiquidGlassRuntimeStoreState,
  } from "../runtime";
  import { clamp, createFilterId, createPhysicsSpring } from "../shared";

  export type LiquidMagnifyingGlassRuntimeParams = Partial<
    Pick<
      LiquidGlassFilterParamInput,
      "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
    >
  >;

  export let lensWidth = 210;
  export let lensHeight = 150;
  export let initialX = 24;
  export let initialY = 24;
  export let magnification = 24;
  export let className = "";
  export let runtime = false;
  export let runtimeParams: LiquidMagnifyingGlassRuntimeParams = {};
  export let runtimeOptions: CreateLiquidGlassRuntimeAssetsOptions = {};

  const dispatch = createEventDispatcher();
  const filterId = createFilterId("liquid-magnifier");
  const specularOpacity = 0.5;
  const specularSaturation = 9;
  const INITIAL_RUNTIME_STATE: LiquidGlassRuntimeStoreState = {
    assets: null,
    backend: null,
    error: null,
    isPending: false,
  };

  let containerEl: HTMLDivElement;
  let lensEl: HTMLDivElement;
  let runtimeStore: LiquidGlassRuntimeStore | null = null;
  let runtimeState: LiquidGlassRuntimeStoreState = INITIAL_RUNTIME_STATE;
  let unsubscribeRuntimeStore: (() => void) | undefined;
  let position = { x: initialX, y: initialY };
  let size = { width: 0, height: 0 };
  let dragFrame = 0;
  let dragFrameTime = 0;
  let isDragging = false;
  let velocityX = 0;

  const refractionLevel = createPhysicsSpring(0.8, {
    stiffness: 250,
    damping: 14,
  });
  const magnifyingScaleAmount = createPhysicsSpring(magnification, {
    stiffness: 250,
    damping: 14,
  });
  const objectScale = createPhysicsSpring(0.8, {
    stiffness: 340,
    damping: 20,
  });
  const objectScaleY = createPhysicsSpring(0.8, {
    stiffness: 340,
    damping: 30,
  });
  const objectScaleX = createPhysicsSpring(1, {
    stiffness: 340,
    damping: 30,
  });
  const shadowSx = createPhysicsSpring(0, {
    stiffness: 340,
    damping: 30,
  });
  const shadowSy = createPhysicsSpring(4, {
    stiffness: 340,
    damping: 30,
  });
  const shadowAlpha = createPhysicsSpring(0.16, {
    stiffness: 220,
    damping: 24,
  });
  const insetShadowAlpha = createPhysicsSpring(0.2, {
    stiffness: 220,
    damping: 24,
  });
  const shadowBlur = createPhysicsSpring(9, {
    stiffness: 340,
    damping: 30,
  });
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

  function updateSize() {
    const rect = containerEl?.getBoundingClientRect();
    size = { width: rect?.width ?? 0, height: rect?.height ?? 0 };
    position = {
      x: clamp(position.x, 0, Math.max(0, size.width - lensWidth)),
      y: clamp(position.y, 0, Math.max(0, size.height - lensHeight)),
    };
    livePosition.x = position.x;
    livePosition.y = position.y;
  }

  function disposeRuntimeStore() {
    unsubscribeRuntimeStore?.();
    unsubscribeRuntimeStore = undefined;
    runtimeStore?.dispose();
    runtimeStore = null;
    runtimeState = INITIAL_RUNTIME_STATE;
  }

  function stopDragLoop() {
    if (!dragFrame || typeof window === "undefined") return;
    window.cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    dragFrameTime = 0;
  }

  function startDragLoop() {
    if (dragFrame || typeof window === "undefined") return;

    const tick = (time: number) => {
      if (!isDragging) {
        dragFrame = 0;
        dragFrameTime = 0;
        return;
      }

      const deltaSeconds =
        dragFrameTime === 0 ? 1 / 60 : Math.min((time - dragFrameTime) / 1000, 0.05);
      dragFrameTime = time;

      const deltaX = livePosition.x - position.x;
      const rawVelocity = deltaX / deltaSeconds;

      velocityX =
        Math.abs(rawVelocity) < 12 ? 0 : clamp(rawVelocity, -5000, 5000);
      position = { x: livePosition.x, y: livePosition.y };

      dragFrame = window.requestAnimationFrame(tick);
    };

    dragFrame = window.requestAnimationFrame(tick);
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
  }

  function handlePointerUp(event: PointerEvent) {
    if (dragState.pointerId !== event.pointerId) return;
    dragState.pointerId = -1;
    lensEl?.releasePointerCapture?.(event.pointerId);
    isDragging = false;
    stopDragLoop();
    position = { x: livePosition.x, y: livePosition.y };
    velocityX = 0;
  }

  onMount(() => {
    updateSize();

    return () => {
      stopDragLoop();
    };
  });

  onDestroy(() => {
    refractionLevel.destroy();
    magnifyingScaleAmount.destroy();
    objectScale.destroy();
    objectScaleY.destroy();
    objectScaleX.destroy();
    shadowSx.destroy();
    shadowSy.destroy();
    shadowAlpha.destroy();
    insetShadowAlpha.destroy();
    shadowBlur.destroy();
    disposeRuntimeStore();
  });

  $: mergedRuntimeInput = {
    bezelType: "convex_squircle",
    bezelWidth: 25,
    glassThickness: 110,
    height: lensHeight,
    magnify: true,
    radius: Math.floor(lensHeight / 2),
    refractiveIndex: 1.5,
    width: lensWidth,
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
  $: refractionLevel.setTarget(isDragging ? 1 : 0.8);
  $: magnifyingScaleAmount.setTarget(isDragging ? magnification * 2 : magnification);
  $: objectScale.setTarget(isDragging ? 1 : 0.8);
  $: objectScaleY.setTarget(
    $objectScale * Math.max(0.7, 1 - Math.abs(velocityX) / 5000)
  );
  $: objectScaleX.setTarget($objectScale + (1 - $objectScaleY));
  $: shadowSx.setTarget(isDragging ? 4 : 0);
  $: shadowSy.setTarget(isDragging ? 16 : 4);
  $: shadowAlpha.setTarget(isDragging ? 0.22 : 0.16);
  $: insetShadowAlpha.setTarget(isDragging ? 0.27 : 0.2);
  $: shadowBlur.setTarget(isDragging ? 24 : 9);
  $: boxShadow = `${$shadowSx}px ${$shadowSy}px ${$shadowBlur}px rgba(0,0,0,${$shadowAlpha}), inset ${$shadowSx / 2}px ${$shadowSy / 2}px 24px rgba(0,0,0,${$insetShadowAlpha}), inset ${-$shadowSx / 2}px ${-$shadowSy / 2}px 24px rgba(255,255,255,${$insetShadowAlpha})`;
  $: filterAssets = runtime && runtimeState.assets ? runtimeState.assets : magnifierAssets;
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
    assets={filterAssets}
    width={lensWidth}
    height={lensHeight}
    blur={0}
    scaleRatio={$refractionLevel}
    specularOpacity={specularOpacity}
    specularSaturation={specularSaturation}
    magnifyingScale={$magnifyingScaleAmount}
  />

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={lensEl}
    class="absolute left-0 top-0 z-10 cursor-grab touch-none border border-white/35 bg-white/12 active:cursor-grabbing"
    style={`width:${lensWidth}px;height:${lensHeight}px;border-radius:${lensHeight / 2}px;transform:translate3d(${position.x}px, ${position.y}px, 0) scaleX(${$objectScaleX}) scaleY(${$objectScaleY});backdrop-filter:url(#${filterId});will-change:transform,box-shadow;box-shadow:${boxShadow}`}
    on:pointerdown={(event) => {
      updateSize();
      dragState.pointerId = event.pointerId;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      dragState.baseX = livePosition.x;
      dragState.baseY = livePosition.y;
      isDragging = true;
      velocityX = 0;
      lensEl?.setPointerCapture?.(event.pointerId);
      startDragLoop();
      dispatch("dragstart", { x: livePosition.x, y: livePosition.y });
    }}
  ></div>
</div>
