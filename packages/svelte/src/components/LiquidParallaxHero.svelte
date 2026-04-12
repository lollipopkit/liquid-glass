<script lang="ts">
  import heroAssets from "virtual:liquidGlassFilterAssets?width=180&height=180&radius=90&bezelWidth=34&glassThickness=120&refractiveIndex=1.5&bezelType=convex_squircle";

  import LiquidGlassFilter from "./LiquidGlassFilter.svelte";
  import { createFilterId, toCssSize } from "../shared";

  export let imageSrc: string;
  export let alt: string;
  export let focalImageSrc: string | undefined = undefined;
  export let height: number | string | undefined = undefined;
  export let lensSize = 180;
  export let parallaxSpeed = -0.25;
  export let className = "";

  const filterId = createFilterId("liquid-parallax-hero");

  let containerEl: HTMLDivElement;
  let progress = 0.5;

  function updateProgress() {
    const rect = containerEl?.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const value = ((viewportHeight - (rect?.top ?? 0)) / (viewportHeight + (rect?.height ?? 1)));
    progress = Math.max(0, Math.min(1, value));
  }

  $: backgroundTravel = 180 * parallaxSpeed;
  $: backgroundY = (progress - 0.5) * 2 * backgroundTravel;
  $: focalY = (progress - 0.5) * 2 * backgroundTravel * 0.72;
  $: lensImageSize = lensSize * 1.34;
</script>

<svelte:window on:scroll={updateProgress} on:resize={updateProgress} />

<div
  bind:this={containerEl}
  class={`relative isolate overflow-hidden rounded-[32px] border border-black/10 bg-slate-900 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] dark:border-white/10 ${className}`}
  style={`height:${toCssSize(height, "min(70vh, 560px)")}`}
>
  <img
    src={imageSrc}
    {alt}
    class="absolute inset-0 h-[118%] w-full object-cover transition-transform duration-150"
    style={`transform:translateY(${backgroundY}px)`}
  />
  <div class="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(255,255,255,0.15),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.4))]"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent"></div>

  <div class="relative z-10 flex h-full items-end p-6 sm:p-8 lg:p-10">
    <div class="max-w-2xl text-white drop-shadow-[0_10px_30px_rgba(15,23,42,0.22)]">
      <slot />
    </div>
  </div>

  <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
    <svg
      class="overflow-visible"
      viewBox={`0 0 ${lensSize} ${lensSize}`}
      preserveAspectRatio="xMidYMid slice"
      color-interpolation-filters="sRGB"
      style={`width:${lensSize}px;height:${lensSize}px;filter:drop-shadow(0 18px 36px rgba(15,23,42,0.24))`}
    >
      <LiquidGlassFilter
        id={filterId}
        assets={heroAssets}
        width={lensSize}
        height={lensSize}
        specularOpacity={0.24}
        specularSaturation={6}
        withSvgWrapper={false}
      />
      <g filter={`url(#${filterId})`}>
        <image
          href={focalImageSrc ?? imageSrc}
          width={lensImageSize}
          height={lensImageSize}
          preserveAspectRatio="xMidYMid slice"
          x={-(lensImageSize - lensSize) / 2}
          y={focalY - (lensImageSize - lensSize) / 2}
        />
      </g>
    </svg>
  </div>
</div>
