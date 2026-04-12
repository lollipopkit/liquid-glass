<script lang="ts">
  import {
    LiquidMagnifyingGlass,
    LiquidParallaxHero,
    LiquidSearchbox,
    LiquidSlider,
    LiquidSwitch,
  } from "@lollipopkit/liquid-glass-svelte";

  const sectionLinks = [
    { id: "searchbox", label: "Searchbox" },
    { id: "slider", label: "Slider" },
    { id: "switch", label: "Switch" },
    { id: "magnifier", label: "Magnifier" },
    { id: "parallax", label: "Parallax" },
  ] as const;

  function svgToDataUrl(svg: string) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  const heroBackdrop = svgToDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 960">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#dcecff" />
        <stop offset="45%" stop-color="#f8f5ef" />
        <stop offset="100%" stop-color="#e7d3bc" />
      </linearGradient>
      <linearGradient id="ridgeA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#29577f" />
        <stop offset="100%" stop-color="#1b3148" />
      </linearGradient>
      <linearGradient id="ridgeB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#45789b" />
        <stop offset="100%" stop-color="#24394d" />
      </linearGradient>
      <radialGradient id="sun" cx="0.72" cy="0.18" r="0.24">
        <stop offset="0%" stop-color="#fff8d6" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#fff8d6" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1600" height="960" fill="url(#sky)" />
    <rect width="1600" height="960" fill="url(#sun)" />
    <path d="M0 620C130 560 250 560 370 602C470 636 578 650 676 618C780 584 862 520 964 522C1106 526 1188 650 1310 662C1424 674 1508 630 1600 572V960H0Z" fill="#f7e7cf" />
    <path d="M0 692C152 622 294 602 428 642C580 686 700 766 860 730C1010 696 1106 574 1258 560C1382 548 1496 604 1600 668V960H0Z" fill="url(#ridgeB)" />
    <path d="M0 748C166 706 334 694 484 748C608 792 744 858 926 844C1118 830 1246 690 1400 676C1472 670 1538 682 1600 716V960H0Z" fill="url(#ridgeA)" />
    <path d="M0 816C150 784 312 786 456 826C566 858 696 928 850 930C1028 932 1186 850 1348 812C1444 790 1528 790 1600 806V960H0Z" fill="#10273d" />
  </svg>
  `);

  const heroFocal = svgToDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
    <defs>
      <radialGradient id="orb" cx="0.5" cy="0.42" r="0.55">
        <stop offset="0%" stop-color="#fff7d6" />
        <stop offset="34%" stop-color="#f1d8b5" />
        <stop offset="62%" stop-color="#9bc4de" />
        <stop offset="100%" stop-color="#22425f" />
      </radialGradient>
      <linearGradient id="band" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="900" height="900" rx="140" fill="#18314a" />
    <circle cx="450" cy="430" r="260" fill="url(#orb)" />
    <path d="M118 632C232 560 346 544 450 582C554 620 632 706 782 726V900H118Z" fill="#f4cf8d" fill-opacity="0.9" />
    <path d="M154 188L770 654" stroke="url(#band)" stroke-width="72" stroke-linecap="round" />
  </svg>
  `);

  let query = "liquid glass";
  let intensity = 64;
  let enabled = true;
</script>

<main class="px-4 py-6 sm:px-6 lg:px-8">
  <div class="mx-auto flex max-w-6xl flex-col gap-6">
    <section class="relative overflow-hidden rounded-[38px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.42))] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_30%),radial-gradient(circle_at_88%_22%,rgba(125,211,252,0.36),transparent_22%),radial-gradient(circle_at_16%_100%,rgba(251,191,36,0.22),transparent_26%)]"></div>
      <div class="relative flex flex-col gap-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <div class="text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-500">
              Svelte Preview
            </div>
            <h1 class="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              liquid-glass preview migrated to the Svelte package
            </h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              This page now uses <code>@lollipopkit/liquid-glass-svelte</code>
              and <code>@lollipopkit/liquid-glass-vite</code> through workspace
              source aliases, so the demo reflects the published Svelte API
              surface directly.
            </p>
          </div>
          <nav class="flex flex-wrap gap-2">
            {#each sectionLinks as section}
              <a
                href={`#${section.id}`}
                class="rounded-full border border-slate-900/8 bg-white/72 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
              >
                {section.label}
              </a>
            {/each}
          </nav>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div class="rounded-[30px] border border-white/70 bg-white/56 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold text-slate-900">
                  Live package surface
                </div>
                <div class="text-xs text-slate-500">
                  Searchbox bound to Svelte state
                </div>
              </div>
              <div class="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.2em] text-white">
                {String(query.length).padStart(2, "0")}
              </div>
            </div>
            <div class="rounded-[28px] bg-[linear-gradient(135deg,rgba(182,213,241,0.28),rgba(255,234,209,0.48))] p-5">
              <LiquidSearchbox
                bind:value={query}
                placeholder="Search material, filters or presets"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div class="rounded-[28px] border border-white/70 bg-white/56 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
              <div class="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Active slider
              </div>
              <div class="mt-2 text-3xl font-semibold text-slate-950">
                {intensity}%
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Refraction intensity can be tracked and displayed beside the
                control surface.
              </p>
            </div>
            <div class="rounded-[28px] border border-white/70 bg-white/56 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
              <div class="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Toggle state
              </div>
              <div class="mt-2 text-3xl font-semibold text-slate-950">
                {enabled ? "Enabled" : "Muted"}
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The switch surface already handles its own glass response and
                pointer transitions.
              </p>
            </div>
            <div class="rounded-[28px] border border-white/70 bg-white/56 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
              <div class="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Workspace wiring
              </div>
              <div class="mt-2 text-lg font-semibold text-slate-950">
                Alias package names to source
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The demo imports published package ids while Vite resolves them
                to local workspace entrypoints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      id="searchbox"
      class="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/46 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6"
    >
      <div class="mb-6 flex flex-col gap-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Component 01
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          LiquidSearchbox
        </h2>
        <p class="max-w-3xl text-sm leading-6 text-slate-600">
          Rounded convex refraction with a live input surface. The preview now
          binds directly to the Svelte package export.
        </p>
      </div>
      <div class="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div class="rounded-[28px] bg-[linear-gradient(135deg,rgba(192,220,243,0.45),rgba(255,230,202,0.54))] p-6">
          <LiquidSearchbox
            bind:value={query}
            placeholder="Try searching for glass, lens or displacement"
          />
        </div>
        <div class="rounded-[28px] border border-white/70 bg-white/64 p-5">
          <div class="text-xs uppercase tracking-[0.28em] text-slate-500">
            Current value
          </div>
          <div class="mt-3 rounded-[22px] bg-slate-950 px-4 py-3 font-medium text-white">
            {query || "Empty query"}
          </div>
          <p class="mt-4 text-sm leading-6 text-slate-600">
            The layout is kept intact while the implementation now runs on
            Svelte components.
          </p>
        </div>
      </div>
    </section>

    <section
      id="slider"
      class="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/46 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6"
    >
      <div class="mb-6 flex flex-col gap-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Component 02
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          LiquidSlider
        </h2>
        <p class="max-w-3xl text-sm leading-6 text-slate-600">
          A draggable thumb with scale, refraction and specular shift. The
          value readout sits beside the slider for quick visual QA.
        </p>
      </div>
      <div class="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div class="rounded-[28px] bg-[linear-gradient(135deg,rgba(193,213,237,0.44),rgba(230,244,255,0.68))] p-6">
          <LiquidSlider bind:value={intensity} />
        </div>
        <div class="rounded-[28px] border border-white/70 bg-white/64 p-5">
          <div class="flex items-end justify-between gap-4">
            <div>
              <div class="text-xs uppercase tracking-[0.28em] text-slate-500">
                Intensity
              </div>
              <div class="mt-2 text-4xl font-semibold text-slate-950">
                {intensity}
              </div>
            </div>
            <div class="rounded-full bg-sky-500/14 px-3 py-1 text-sm font-medium text-sky-900">
              {#if intensity < 35}
                Soft
              {:else if intensity < 70}
                Balanced
              {:else}
                High refract
              {/if}
            </div>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/8">
            <div
              class="h-full rounded-full bg-[linear-gradient(90deg,#5db7ff,#0f5ebc)]"
              style={`width:${intensity}%`}
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section
      id="switch"
      class="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/46 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6"
    >
      <div class="mb-6 flex flex-col gap-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Component 03
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          LiquidSwitch
        </h2>
        <p class="max-w-3xl text-sm leading-6 text-slate-600">
          Lip surface preset for a denser tactile toggle. The adjacent state
          card keeps the preview readable.
        </p>
      </div>
      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div class="rounded-[28px] bg-[linear-gradient(135deg,rgba(205,222,242,0.45),rgba(247,236,225,0.7))] p-6">
          <div class="flex min-h-[144px] items-center justify-center">
            <LiquidSwitch bind:checked={enabled} />
          </div>
        </div>
        <div class="rounded-[28px] border border-white/70 bg-white/64 p-5">
          <div class="text-xs uppercase tracking-[0.28em] text-slate-500">
            Surface mode
          </div>
          <div class="mt-3 text-3xl font-semibold text-slate-950">
            {enabled ? "Input ready" : "Ambient only"}
          </div>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            You can wire this into feature gates, accessibility modes or use it
            as a sculpted glass accent.
          </p>
        </div>
      </div>
    </section>

    <section
      id="magnifier"
      class="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/46 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6"
    >
      <div class="mb-6 flex flex-col gap-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Component 04
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          LiquidMagnifyingGlass
        </h2>
        <p class="max-w-3xl text-sm leading-6 text-slate-600">
          Drag the lens across layered content to inspect the magnifying field.
          The scene remains DOM-based rather than using a static bitmap.
        </p>
      </div>

      <LiquidMagnifyingGlass
        className="bg-[linear-gradient(135deg,rgba(22,44,68,0.86),rgba(17,30,45,0.96))]"
        initialX={28}
        initialY={30}
        lensWidth={230}
        lensHeight={156}
        magnification={28}
      >
        <div class="relative grid min-h-[420px] gap-6 overflow-hidden p-7 md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,207,255,0.24),transparent_34%),radial-gradient(circle_at_78%_30%,rgba(255,207,138,0.22),transparent_28%)]"></div>
          <div class="relative">
            <div class="inline-flex rounded-full border border-white/18 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80">
              Refraction Field
            </div>
            <h3 class="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Observe how text, gradients and cards distort under the lens.
            </h3>
            <p class="mt-4 max-w-lg text-sm leading-7 text-slate-200">
              This section keeps the migrated demo free of external assets while
              still making the magnification effect obvious.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              {#each ["glass", "vector", "filter", "preview"] as tag}
                <span
                  class="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                >
                  {tag}
                </span>
              {/each}
            </div>
          </div>

          <div class="relative grid gap-4">
            <div class="rounded-[24px] border border-white/14 bg-white/10 p-5 text-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
              <div class="text-xs uppercase tracking-[0.28em] text-white/55">
                Layer stack
              </div>
              <div class="mt-4 text-3xl font-semibold">03</div>
              <p class="mt-2 text-sm leading-6 text-white/72">
                Background gradients, text blocks and cards all remain live HTML
                under the filter.
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-[22px] border border-sky-200/15 bg-sky-200/10 p-4 text-white/90">
                <div class="text-xs uppercase tracking-[0.28em] text-white/55">
                  Optics
                </div>
                <div class="mt-3 text-2xl font-semibold">1.5x</div>
                <div class="mt-1 text-sm text-white/72">refractive index</div>
              </div>
              <div class="rounded-[22px] border border-amber-200/15 bg-amber-200/10 p-4 text-white/90">
                <div class="text-xs uppercase tracking-[0.28em] text-white/55">
                  Lens
                </div>
                <div class="mt-3 text-2xl font-semibold">230 px</div>
                <div class="mt-1 text-sm text-white/72">viewport width</div>
              </div>
            </div>
          </div>
        </div>
      </LiquidMagnifyingGlass>
    </section>

    <section
      id="parallax"
      class="scroll-mt-6 rounded-[30px] border border-white/60 bg-white/46 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6"
    >
      <div class="mb-6 flex flex-col gap-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Component 05
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          LiquidParallaxHero
        </h2>
        <p class="max-w-3xl text-sm leading-6 text-slate-600">
          A static hero image with an isolated liquid glass viewport. The
          preview uses embedded SVG data URLs for portability.
        </p>
      </div>

      <LiquidParallaxHero
        alt="Abstract layered landscape"
        imageSrc={heroBackdrop}
        focalImageSrc={heroFocal}
        height="min(72vh, 560px)"
      >
        <div class="max-w-2xl">
          <div class="inline-flex rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/80">
            Hero Surface
          </div>
          <h3 class="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            A centered glass viewport cuts through the landscape.
          </h3>
          <p class="mt-4 text-sm leading-7 text-white/78 sm:text-[15px]">
            The lens content is supplied separately from the background so the
            distortion reads cleanly while the hero scrolls with parallax.
          </p>
        </div>
      </LiquidParallaxHero>
    </section>
  </div>
</main>
