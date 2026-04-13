# @lollipopkit/liquid-glass-react

React components for liquid glass UI effects.

## Install

```bash
npm install @lollipopkit/liquid-glass-react @lollipopkit/liquid-glass-vite
```

## Exports

- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`
- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`
- `useLiquidGlassRuntimeAssets`
- shared runtime helpers re-exported from `@lollipopkit/liquid-glass`

## Runtime Hook

```tsx
import { useLiquidGlassRuntimeAssets } from "@lollipopkit/liquid-glass-react";

const runtime = useLiquidGlassRuntimeAssets(
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

```tsx
<LiquidSearchbox
  runtime
  runtimeParams={{ glassThickness: 96, bezelWidth: 24 }}
  runtimeOptions={{ backend: "auto", useCache: true }}
/>
```

The same `runtime`, `runtimeParams`, and `runtimeOptions` props are also
available on `LiquidSlider`, `LiquidSwitch`, and `LiquidMagnifyingGlass`.

See the root repository README for Vite setup and examples.
