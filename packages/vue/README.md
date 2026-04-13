# @lollipopkit/liquid-glass-vue

Vue components for liquid glass UI effects.

## Install

```bash
npm install @lollipopkit/liquid-glass-vue @lollipopkit/liquid-glass-vite
```

## Exports

- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`
- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`
- `useLiquidGlassRuntimeAssets`
- shared runtime helpers re-exported from `@lollipopkit/liquid-glass`

## Runtime Composable

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
  :runtime="true"
  :runtime-params="{ glassThickness: 96, bezelWidth: 24 }"
  :runtime-options="{ backend: 'auto', useCache: true }"
/>
```

The same `runtime`, `runtimeParams`, and `runtimeOptions` props are also
available on `LiquidSlider`, `LiquidSwitch`, and `LiquidMagnifyingGlass`.

See the root repository README for Vite setup and examples.
