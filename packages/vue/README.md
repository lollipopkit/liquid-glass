# @lollipopkit/liquid-glass-vue

Vue components for liquid glass UI effects.

## Install

```bash
npm install @lollipopkit/liquid-glass-vue
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
- `useLiquidGlassRuntimeAssets`
- shared runtime helpers re-exported from `@lollipopkit/liquid-glass`

## Path A: Runtime

```ts
import { useLiquidGlassRuntimeAssets } from "@lollipopkit/liquid-glass-vue";

const runtime = useLiquidGlassRuntimeAssets(
  () => ({
    width: 420,
    height: 56,
    radius: 28,
    bezelWidth: 27,
    glassThickness: 70,
    refractiveIndex: 1.5,
    bezelType: "convex_squircle",
  }),
  () => ({
    backend: "auto",
    useCache: true,
  })
);
```

`LiquidSearchbox` also supports runtime mode directly:

```vue
<LiquidSearchbox
  mode="runtime"
  :runtime-params="{ glassThickness: 96, bezelWidth: 24 }"
  :runtime-options="{ backend: 'auto', useCache: true }"
/>
```

The same `mode`, `runtime`, `runtimeParams`, and `runtimeOptions` props are
also available on `LiquidSlider`, `LiquidSwitch`, `LiquidMagnifyingGlass`, and
`LiquidParallaxHero`.

## Path B: Vite Static Assets

If your app uses Vite, you can pre-generate assets and register them once:

```ts
import { registerLiquidGlassStaticAssets } from "virtual:liquidGlassStaticAssetRegistry";
import { configureLiquidGlassStaticAssets } from "@lollipopkit/liquid-glass-vue";

registerLiquidGlassStaticAssets(configureLiquidGlassStaticAssets);
```

`mode` accepts:

- `"auto"`: use registered static assets when available, otherwise fall back to runtime assets
- `"static"`: prefer registered static assets, but still falls back to runtime when none were configured
- `"runtime"`: force runtime assets

`runtime` remains available as a compatibility flag while `mode` becomes the
preferred API.

See the root repository README for the latest runtime-first and optional Vite setup.
