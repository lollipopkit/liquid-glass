# @lollipopkit/liquid-glass-svelte

Svelte components for liquid glass UI effects.

## Install

```bash
npm install @lollipopkit/liquid-glass-svelte
```

Install `@lollipopkit/liquid-glass-vite` only if you want build-time `virtual:`
asset generation and static resource optimization.

Without Vite, the package falls back to runtime asset generation automatically.

## Exports

- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`
- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`
- `createLiquidGlassRuntimeStore`
- shared runtime helpers re-exported from `@lollipopkit/liquid-glass`

## Path A: Runtime

```ts
import { createLiquidGlassRuntimeStore } from "@lollipopkit/liquid-glass-svelte";

const runtime = createLiquidGlassRuntimeStore(
  {
    width: 420,
    height: 56,
    radius: 28,
    bezelWidth: 27,
    glassThickness: 70,
    refractiveIndex: 1.5,
    bezelType: "convex_squircle",
  },
  {
    backend: "auto",
    useCache: true,
  }
);
```

`LiquidSearchbox` also supports runtime mode directly:

```svelte
<LiquidSearchbox
  mode="runtime"
  runtimeParams={{ glassThickness: 96, bezelWidth: 24 }}
  runtimeOptions={{ backend: "auto", useCache: true }}
/>
```

The same `mode`, `runtime`, `runtimeParams`, and `runtimeOptions` props are
also available on `LiquidSlider`, `LiquidSwitch`, `LiquidMagnifyingGlass`, and
`LiquidParallaxHero`.

## Path B: Vite Static Assets

If your app uses Vite, you can pre-generate assets and register them once:

```ts
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";
import { configureLiquidGlassStaticAssets } from "@lollipopkit/liquid-glass-svelte";

configureLiquidGlassStaticAssets({
  searchbox: searchboxAssets,
});
```

`mode` accepts:

- `"auto"`: use registered static assets when available, otherwise fall back to runtime assets
- `"static"`: prefer registered static assets, but still falls back to runtime when none were configured
- `"runtime"`: force runtime assets

`runtime` remains available as a compatibility flag while `mode` becomes the
preferred API.

See the root repository README for optional Vite setup and examples.
