# @lollipopkit/liquid-glass-vite

Vite plugin and `virtual:liquidGlass*` modules for the `liquid-glass` monorepo.

## Install

```bash
npm install @lollipopkit/liquid-glass-vite
```

## Usage

Register `liquidGlassPlugin()` in your Vite config, then import the generated
assets from `virtual:liquidGlassFilterAssets?...` and pass them to the
framework package you use via `configureLiquidGlassStaticAssets()`.

```ts
import { defineConfig } from "vite";
import { liquidGlassPlugin } from "@lollipopkit/liquid-glass-vite";

export default defineConfig({
  plugins: [liquidGlassPlugin()],
});
```

```ts
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";
import { configureLiquidGlassStaticAssets } from "@lollipopkit/liquid-glass-react";

configureLiquidGlassStaticAssets({
  searchbox: searchboxAssets,
});
```

See the root repository README for integration details.
