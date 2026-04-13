# @lollipopkit/liquid-glass-vite

Vite plugin and `virtual:liquidGlass*` modules for the `liquid-glass` monorepo.

## Install

```bash
npm install @lollipopkit/liquid-glass-vite
```

## Usage

Register `liquidGlassPlugin()` in your Vite config, then import the generated
registry from `virtual:liquidGlassStaticAssetRegistry`.

```ts
import { defineConfig } from "vite";
import { liquidGlassPlugin } from "@lollipopkit/liquid-glass-vite";

export default defineConfig({
  plugins: [liquidGlassPlugin()],
});
```

```ts
import { registerLiquidGlassStaticAssets } from "virtual:liquidGlassStaticAssetRegistry";
import { configureLiquidGlassStaticAssets } from "@lollipopkit/liquid-glass-react";

registerLiquidGlassStaticAssets(configureLiquidGlassStaticAssets);
```

The same virtual module also exports `default` / `staticAssets` if your app
prefers to keep manual control:

```ts
import staticAssets from "virtual:liquidGlassStaticAssetRegistry";
import { configureLiquidGlassStaticAssets } from "@lollipopkit/liquid-glass-react";

configureLiquidGlassStaticAssets(staticAssets);
```

See the root repository README for integration details.
