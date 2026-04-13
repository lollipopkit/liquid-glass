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

  const panelClass =
    "demo-panel relative flex h-96 items-center justify-center overflow-hidden rounded-xl border";
  const paddedPanelClass = `${panelClass} px-6 sm:px-8`;
</script>

<main class="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-10 sm:px-6 lg:px-8">
  <section class="space-y-3">
    <div class="page-kicker text-[11px] uppercase tracking-[0.28em]">Liquid Glass</div>
    <h1 class="page-title max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
      Refractive UI studies rebuilt
    </h1>
    <h2>
      <a style="color: #8b2252" href="https://kube.io/blog/liquid-glass-css-svg/">Original post</a>
    </h2>
  </section>

  <section class="space-y-4">
    <div class="section-title text-sm font-semibold">Searchbox</div>
    <div class={paddedPanelClass}>
      <LiquidSearchbox bind:value={searchValue} placeholder="Search" />
    </div>
  </section>

  <section class="space-y-4">
    <div class="section-title text-sm font-semibold">Slider</div>
    <div class={panelClass}>
      <LiquidSlider bind:value={sliderValue} />
    </div>
  </section>

  <section class="space-y-4">
    <div class="section-title text-sm font-semibold">Switch</div>
    <div class={panelClass}>
      <LiquidSwitch bind:checked={switchChecked} />
    </div>
  </section>

  <section class="space-y-4">
    <div class="section-title text-sm font-semibold">Magnifying Glass</div>
    <LiquidMagnifyingGlass className="min-h-[420px] border-black/10 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-black/60 dark:shadow-[0_18px_50px_rgba(0,0,0,0.32)] sm:min-h-[420px]">
      <div class="absolute inset-0 grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1fr_46%] sm:gap-10 sm:p-10">
        <div class="flex flex-col justify-center">
          <div class="magnifier-accent flex items-center gap-3">
            <span class="h-[2px] w-10 bg-current"></span>
            <span class="text-[11px] font-medium uppercase tracking-[0.25em]">
              Optics Study
            </span>
          </div>
          <h3 class="magnifier-title mt-4 text-[36px] font-extrabold leading-[0.95] tracking-tight sm:text-[54px]">
            Liquid Glass<span class="magnifier-separator">-</span>Precision Lens
          </h3>
          <div class="magnifier-copy mt-4 max-w-[60ch] space-y-3 text-[15px] leading-[1.55] sm:text-[16px]">
            <p>
              Drag the capsule to bend the page. This lens is a compact SVG
              displacement rig that refracts whatever sits beneath it.
            </p>
            <p>
              The field comes from a rounded bezel profile; pixels are pushed
              along its gradient, then topped with a subtle specular bloom for
              depth.
            </p>
            <p class="magnifier-muted">
              Sweep across strong edges. High contrast makes the bend snap.
            </p>
          </div>
        </div>
        <div class="magnifier-media relative hidden overflow-hidden rounded-lg ring-1 sm:block">
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
    <div class="section-title text-sm font-semibold">Parallax Image Hero</div>
    <LiquidParallaxHero
      imageSrc={heroImage}
      focalImageSrc={heroFocus}
      alt="Abstract folded surface"
    />
    <div class="caption text-right text-[10px] uppercase tracking-[0.2em]">
      Photo by Martin Martz on Unsplash
    </div>
  </section>
</main>

<style>
  .page-kicker {
    color: var(--demo-kicker);
  }

  .page-title,
  .section-title {
    color: var(--demo-ink);
  }

  .page-copy,
  .caption {
    color: var(--demo-muted);
  }

  .demo-panel {
    border-color: var(--demo-panel-border);
    color: var(--demo-panel-grid);
    background-image:
      linear-gradient(to right, currentColor 1px, transparent 1px),
      linear-gradient(to bottom, currentColor 1px, transparent 1px),
      radial-gradient(120% 100% at 10% 0%, var(--demo-panel-bg1), var(--demo-panel-bg2));
    background-position: 12px 12px, 12px 12px, 0 0;
    background-size: 24px 24px, 24px 24px, 100% 100%;
  }

  .magnifier-accent {
    color: var(--demo-accent);
  }

  .magnifier-title {
    color: var(--demo-magnifier-ink);
  }

  .magnifier-separator {
    color: color-mix(in srgb, var(--demo-magnifier-ink) 38%, transparent);
  }

  .magnifier-copy {
    color: var(--demo-magnifier-soft);
  }

  .magnifier-muted {
    color: var(--demo-magnifier-muted);
  }

  .magnifier-media {
    --tw-ring-color: color-mix(in srgb, var(--demo-magnifier-ink) 12%, transparent);
  }
</style>
