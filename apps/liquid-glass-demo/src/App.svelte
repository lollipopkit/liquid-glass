<script lang="ts">
  import {
    LiquidMagnifyingGlass,
    LiquidParallaxHero,
    LiquidSearchbox,
    LiquidSlider,
    LiquidSwitch,
  } from "@lollipopkit/liquid-glass-svelte";

  const heroImage =
    "https://images.unsplash.com/photo-1688494930098-e88c53c26e3a?auto=format&q=80&fit=crop&w=1400&h=1600&crop=focalpoint&fp-x=0.3&fp-y=0.5&fp-z=1";
  const heroFocus =
    "https://images.unsplash.com/photo-1688494930098-e88c53c26e3a?auto=format&q=80&fit=crop&w=400&h=700&crop=focalpoint&fp-x=0.3&fp-y=0.6&fp-z=1.9";
  const magnifierImage =
    "https://images.unsplash.com/photo-1579380656108-f98e4df8ea62?q=80&w=800&auto=format&fit=crop";

  let searchValue = "";
  let sliderValue = 10;
  let switchChecked = true;
</script>

<main class="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-10 sm:px-6 lg:px-8">
  <section class="space-y-3">
    <div class="text-[11px] uppercase tracking-[0.28em] text-slate-500">
      Liquid Glass
    </div>
    <h1 class="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
      Refractive UI studies rebuilt from the original article
    </h1>
    <p class="max-w-2xl text-[15px] leading-7 text-slate-600">
      The demo surface now follows the original proportions, motion targets and
      composition more closely: rounded refraction controls, oversized switch
      geometry, draggable magnifier, and the centered parallax lens.
    </p>
  </section>

  <section class="space-y-4">
    <div class="text-sm font-semibold text-slate-900">Searchbox</div>
    <div
      class="relative flex h-96 items-center justify-center overflow-hidden rounded-xl border border-white/10 px-6 text-white/6 sm:px-8 [--bg1:#1b1b22] [--bg2:#0f0f14]"
      style="background-image:linear-gradient(to right, currentColor 1px, transparent 1px),linear-gradient(to bottom, currentColor 1px, transparent 1px),radial-gradient(120% 100% at 10% 0%, var(--bg1), var(--bg2));background-size:24px 24px,24px 24px,100% 100%;background-position:12px 12px,12px 12px,0 0"
    >
      <LiquidSearchbox bind:value={searchValue} placeholder="Search" />
    </div>
  </section>

  <section class="space-y-4">
    <div class="text-sm font-semibold text-slate-900">Slider</div>
    <div
      class="relative flex h-96 items-center justify-center overflow-hidden rounded-xl border border-white/10 text-white/6 [--bg1:#1b1b22] [--bg2:#0f0f14]"
      style="background-image:linear-gradient(to right, currentColor 1px, transparent 1px),linear-gradient(to bottom, currentColor 1px, transparent 1px),radial-gradient(120% 100% at 10% 0%, var(--bg1), var(--bg2));background-size:24px 24px,24px 24px,100% 100%;background-position:12px 12px,12px 12px,0 0"
    >
      <LiquidSlider bind:value={sliderValue} />
    </div>
  </section>

  <section class="space-y-4">
    <div class="text-sm font-semibold text-slate-900">Switch</div>
    <div
      class="relative flex h-96 items-center justify-center overflow-hidden rounded-xl border border-white/10 text-white/6 [--bg1:#1b1b22] [--bg2:#0f0f14]"
      style="background-image:linear-gradient(to right, currentColor 1px, transparent 1px),linear-gradient(to bottom, currentColor 1px, transparent 1px),radial-gradient(120% 100% at 10% 0%, var(--bg1), var(--bg2));background-size:24px 24px,24px 24px,100% 100%;background-position:12px 12px,12px 12px,0 0"
    >
      <LiquidSwitch bind:checked={switchChecked} />
    </div>
  </section>

  <section class="space-y-4">
    <div class="text-sm font-semibold text-slate-900">Magnifying Glass</div>
    <LiquidMagnifyingGlass className="min-h-[420px] sm:min-h-[420px] border-white/10 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      <div class="absolute inset-0 grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1fr_46%] sm:gap-10 sm:p-10">
        <div class="flex flex-col justify-center">
          <div class="flex items-center gap-3 text-red-600">
            <span class="h-[2px] w-10 bg-current"></span>
            <span class="text-[11px] font-medium uppercase tracking-[0.25em]">
              Optics Study
            </span>
          </div>
          <h3 class="mt-4 text-[36px] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[54px]">
            Liquid Glass<span class="text-white/40">-</span>Precision Lens
          </h3>
          <div class="mt-4 max-w-[60ch] space-y-3 text-[15px] leading-[1.55] text-white/70 sm:text-[16px]">
            <p>
              Drag the capsule to bend the page. This lens is a compact SVG
              displacement rig that refracts whatever sits beneath it.
            </p>
            <p>
              The field comes from a rounded bezel profile; pixels are pushed
              along its gradient, then topped with a subtle specular bloom for
              depth.
            </p>
            <p class="text-white/60">
              Sweep across strong edges. High contrast makes the bend snap.
            </p>
          </div>
        </div>
        <div class="relative hidden overflow-hidden rounded-lg ring-1 ring-white/10 sm:block">
          <img
            src={magnifierImage}
            alt="Abstract architectural lines"
            class="absolute inset-0 h-full w-full object-cover"
            draggable="false"
          />
        </div>
      </div>
    </LiquidMagnifyingGlass>
  </section>

  <section class="space-y-4">
    <div class="text-sm font-semibold text-slate-900">Parallax Image Hero</div>
    <LiquidParallaxHero
      imageSrc={heroImage}
      focalImageSrc={heroFocus}
      alt="Abstract folded surface"
    />
    <div class="text-right text-[10px] uppercase tracking-[0.2em] text-slate-500">
      Photo by Martin Martz on Unsplash
    </div>
  </section>
</main>
