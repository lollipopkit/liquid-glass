[简体中文](./README.zh-CN.md)

# liquid-glass

Reference: [kube blog article](https://kube.io/blog/liquid-glass-css-svg)

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

## Vite Requirement

The UI packages currently require Vite. Register the plugin from `@lollipopkit/liquid-glass-vite` in the consumer app before using any React/Vue/Svelte component package.

```ts
import { defineConfig } from "vite";
import { liquidGlassPlugin } from "@lollipopkit/liquid-glass-vite";

export default defineConfig({
  plugins: [liquidGlassPlugin()],
});
```

## Virtual Modules

The Vite package exposes resource modules instead of framework-specific filter components:

- `virtual:liquidGlassDisplacementMap?...`
- `virtual:liquidGlassSpecularMap?...`
- `virtual:liquidGlassMagnifyingMap?...`
- `virtual:liquidGlassFilterAssets?...`

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
