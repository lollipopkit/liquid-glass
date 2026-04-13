[简体中文](./README.zh-CN.md)

# liquid-glass

[Demo](https://liquid-glass.lollipopkit.com) | [Reference: kube blog](https://kube.io/blog/liquid-glass-css-svg)

Monorepo for `liquid glass / refraction` effects across React, Vue, and Svelte.

## Packages

- `@lollipopkit/liquid-glass`
  Core algorithms, shared types, surface presets
- `@lollipopkit/liquid-glass-vite`
  Vite plugin and resource-oriented `virtual:` modules
- `@lollipopkit/liquid-glass-react`
  React components
- `@lollipopkit/liquid-glass-vue`
  Vue components
- `@lollipopkit/liquid-glass-svelte`
  Svelte components

## Workspace Commands

```bash
npm install
npm run typecheck
npm run build
```

```bash
bun install
bun run typecheck
bun run build
```

```bash
npm run demo:dev
npm run demo:build
npm run demo:preview
```

## Demo App

The migrated Svelte preview lives in `apps/liquid-glass-demo` and renders the
workspace sources for `@lollipopkit/liquid-glass-svelte` and
`@lollipopkit/liquid-glass-vite` through local Vite aliases.

Separate non-Vite verification fixtures live in:

- `apps/liquid-glass-next`
  validates the React package in a real Next.js host using the runtime path
- `apps/liquid-glass-webpack`
  validates the React package in a traditional Webpack 5 host using the runtime path

Framework-specific Vite examples also live in:

- `apps/liquid-glass-react-demo`
  demonstrates React with registered static assets and runtime fallback
- `apps/liquid-glass-vue-demo`
  demonstrates Vue with registered static assets and runtime fallback

## Optional Vite Static Assets

The React, Vue, and Svelte packages now work without Vite by falling back to
runtime asset generation.

If you still want build-time static assets, register the plugin from
`@lollipopkit/liquid-glass-vite` in your app and wire those assets into the
framework package you use.

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

## Recommended Usage

For most apps:

- start with `mode="auto"`
- do not install `@lollipopkit/liquid-glass-vite` unless you want pre-generated static assets
- only add the Vite static registry path when startup cost or repeated renders justify it

Current mental model:

- framework packages work on their own
- runtime is the default fallback
- Vite is an optional static optimization layer
- worker runtime no longer depends on `?worker`

## Virtual Modules

The Vite package exposes resource modules instead of framework-specific filter components:

- `virtual:liquidGlassDisplacementMap?...`
- `virtual:liquidGlassSpecularMap?...`
- `virtual:liquidGlassMagnifyingMap?...`
- `virtual:liquidGlassFilterAssets?...`
- `virtual:liquidGlassStaticAssetRegistry`

`virtual:liquidGlassStaticAssetRegistry` exports:

```ts
import staticAssets, {
  registerLiquidGlassStaticAssets,
  staticAssets as namedStaticAssets,
} from "virtual:liquidGlassStaticAssetRegistry";
```

`virtual:liquidGlassFilterAssets` returns:

```ts
type LiquidGlassFilterAssets = {
  displacementUrl: string;
  specularUrl: string;
  magnifyingUrl?: string;
  width: number;
  height: number;
  maxDisplacement: number;
  magnify: boolean;
  params: LiquidGlassFilterParams;
};
```

All framework packages export:

- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`
- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`

## Runtime API

`@lollipopkit/liquid-glass` also exposes a browser runtime API for generating
filter assets directly at runtime:

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
  window.devicePixelRatio,
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
    dpr: window.devicePixelRatio,
    useCache: true,
  }
);

await prewarmLiquidGlassManagedRuntimeAssets(
  {
    width: 720,
    height: 220,
    radius: 44,
  },
  {
    backend: "auto",
    dpr: window.devicePixelRatio,
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
    dpr: window.devicePixelRatio,
    useCache: true,
  }
);
```

If your bundler needs a custom worker loader, configure it before using the
managed runtime helpers:

```ts
configureLiquidGlassWorkerRuntime({
  workerFactory: (options) =>
    new Worker(new URL("./liquidGlassRuntime.worker.js", import.meta.url), {
      name: options?.name,
      type: "module",
    }),
});
```

Runtime options:

- `backend?: "auto" | "ts" | "worker"`
- `useCache?: boolean`

Notes:

- `backend="auto"` lets applications choose a backend from workload size.
- `backend="ts"` forces the main-thread runtime path.
- `backend="worker"` prefers the shared worker runtime when the browser
  supports the required APIs.
- `useCache=false` bypasses runtime cache and forces fresh generation.

Shared runtime helpers:

- `createLiquidGlassRuntimeAssets()`: main-thread runtime helper
- `createManagedLiquidGlassRuntimeAssets()`: shared `ts` / `worker` runtime helper
- `prewarmLiquidGlassManagedRuntimeAssets()`: shared worker prewarm helper
- `configureLiquidGlassWorkerRuntime()`: optional worker factory override for non-default bundler wiring

These runtime helpers are also re-exported from the React, Vue, and Svelte
packages so framework consumers can keep using a single package entrypoint.

## Release Checks

Run this before publishing packages:

```bash
npm run prepublish:check
```

It verifies:

- all package builds
- Svelte, React, and Vue Vite demos
- Next.js and Webpack non-Vite fixtures
- `npm pack --dry-run` for every publishable package

## Component Asset Modes

All framework components support:

- `mode="auto"`: use registered static assets when available, otherwise fall back to runtime assets
- `mode="static"`: prefer registered static assets, but still falls back to runtime when no static assets were configured
- `mode="runtime"`: force runtime assets

`runtime` remains available as a compatibility flag, but `mode` is now the
preferred API.

## Host Compatibility

The current integration model supports:

- Vite apps using `virtual:liquidGlassStaticAssetRegistry`
- non-Vite apps using runtime mode only
- custom worker wiring via `configureLiquidGlassWorkerRuntime()` when a host bundler needs it
