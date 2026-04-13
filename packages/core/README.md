# @lollipopkit/liquid-glass

Core liquid glass algorithms and shared types for the `liquid-glass` monorepo.

## Install

```bash
npm install @lollipopkit/liquid-glass
```

## Includes

- displacement map generation
- specular map generation
- magnifying map generation
- shared filter parameter normalization and cache helpers
- browser runtime asset generation
- runtime backend resolution helpers

## Runtime API

The core package exposes a browser runtime helper for generating filter assets
without going through the Vite `virtual:` modules.

```ts
import {
  configureLiquidGlassWorkerRuntime,
  createManagedLiquidGlassRuntimeAssets,
  createLiquidGlassRuntimeAssets,
  prewarmLiquidGlassManagedRuntimeAssets,
  resolveLiquidGlassRuntimeBackend,
} from "@lollipopkit/liquid-glass";

const backend = resolveLiquidGlassRuntimeBackend(
  {
    width: 360,
    height: 120,
    radius: 36,
    bezelWidth: 24,
    glassThickness: 90,
    refractiveIndex: 1.5,
    magnify: false,
    bezelType: "convex_squircle",
  },
  2,
  "auto",
  false
);

const assets = await createLiquidGlassRuntimeAssets(
  {
    width: 360,
    height: 120,
    radius: 36,
  },
  {
    backend: "auto",
    dpr: 2,
    useCache: true,
  }
);

await assets.update(
  {
    glassThickness: 104,
  },
  {
    useCache: false,
  }
);

assets.dispose();

await prewarmLiquidGlassManagedRuntimeAssets(
  {
    width: 720,
    height: 220,
    radius: 44,
  },
  {
    backend: "auto",
    dpr: 2,
    useCache: true,
  }
);

const managedAssets = await createManagedLiquidGlassRuntimeAssets(
  {
    width: 360,
    height: 120,
    radius: 36,
  },
  {
    backend: "auto",
    dpr: 2,
    useCache: true,
  }
);

managedAssets.dispose();
```

If your bundler needs a custom worker loader, configure it before the first
managed runtime call:

```ts
configureLiquidGlassWorkerRuntime({
  workerFactory: (options) =>
    new Worker(new URL("./liquidGlassRuntime.worker.js", import.meta.url), {
      name: options?.name,
      type: "module",
    }),
});
```

### Runtime Options

```ts
type LiquidGlassRuntimeBackend = "ts" | "worker";
type LiquidGlassRuntimeBackendPreference =
  | LiquidGlassRuntimeBackend
  | "auto";

type CreateLiquidGlassRuntimeAssetsOptions = {
  backend?: LiquidGlassRuntimeBackendPreference;
  dpr?: number;
  signal?: AbortSignal;
  useCache?: boolean;
};
```

- `backend`
  - `"auto"` lets your app resolve a preferred backend from workload size.
  - `"ts"` forces the main-thread runtime path.
  - `"worker"` prefers the shared worker runtime when the current environment
    supports `Worker`, `OffscreenCanvas`, and `URL.createObjectURL`.
- `useCache`
  - `true` reuses cached runtime renders when parameters match.
  - `false` bypasses runtime cache and forces fresh generation.

### Runtime Entrypoints

- `createLiquidGlassRuntimeAssets()`
  - main-thread runtime helper
  - best for smaller workloads or when your app wants explicit control
- `createManagedLiquidGlassRuntimeAssets()`
  - shared runtime helper that can resolve to either `ts` or `worker`
  - use this when React, Vue, or Svelte integrations all need the same worker-backed path
- `prewarmLiquidGlassManagedRuntimeAssets()`
  - warms the shared worker render cache for a later create/update sequence
- `configureLiquidGlassWorkerRuntime()`
  - overrides the default worker factory when your host app needs custom bundler wiring

See the root repository README for full usage and package relationships.
