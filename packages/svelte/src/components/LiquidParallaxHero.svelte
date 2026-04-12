<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import heroAssets from "virtual:liquidGlassFilterAssets?width=150&height=150&radius=75&bezelWidth=40&glassThickness=120&refractiveIndex=1.5";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { createAnimatedNumber, createFilterId, toCssSize } from "../shared";

  export let imageSrc: string;
  export let alt: string;
  export let focalImageSrc: string | undefined = undefined;
  export let height: number | string | undefined = undefined;
  export let lensSize = 200;
  export let parallaxSpeed = -0.25;
  export let className = "";

  const filterId = createFilterId("liquid-parallax-hero");

  let measureFrame = 0;
  const progress = createAnimatedNumber(0, {
    stiffness: 0.12,
    damping: 0.82,
  });

  function scheduleUpdate() {
    if (measureFrame || typeof window === "undefined") return;
    measureFrame = window.requestAnimationFrame(() => {
      measureFrame = 0;
      progress.setTarget(window.scrollY || 0);
    });
  }

  onMount(() => {
    scheduleUpdate();
  });

  onDestroy(() => {
    if (measureFrame && typeof window !== "undefined") {
      window.cancelAnimationFrame(measureFrame);
    }
    progress.destroy();
  });

  $: backgroundOffset = Math.min(800, $progress) * parallaxSpeed;
  $: backgroundY = -60 + backgroundOffset;
  $: focalY = 13 + backgroundOffset * 0.75;
</script>

<svelte:window on:scroll={scheduleUpdate} on:resize={scheduleUpdate} />

<div
  role="img"
  aria-label={alt}
  class={`relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-slate-600/20 ${className}`}
  style={`height:${toCssSize(height, "400px")};background-image:url(${imageSrc});background-size:700px auto;background-position-x:center;background-position-y:${backgroundY}px`}
>
  <slot />

  <svg
    class="pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
    viewBox="0 0 150 150"
    preserveAspectRatio="xMidYMid slice"
    color-interpolation-filters="sRGB"
    style="border-radius:100px;box-shadow:0 16px 31px rgba(0,0,0,0.4)"
  >
    <LiquidGlassFilter
      id={filterId}
      assets={heroAssets}
      width={150}
      height={150}
      specularOpacity={0.2}
      specularSaturation={6}
      withSvgWrapper={false}
    />
    <g filter={`url(#${filterId})`}>
      <image
        href={focalImageSrc ?? imageSrc}
        width={lensSize}
        preserveAspectRatio="xMidYMid slice"
        x={-29}
        y={focalY}
      />
    </g>
  </svg>
</div>
