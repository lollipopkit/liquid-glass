English | [简体中文](./README.zh-CN.md)

# liquid-glass

Reference: [kube blog article](https://kube.io/blog/liquid-glass-css-svg)

A toolkit for generating and applying liquid glass / refraction effects. It includes three parts:

- Low-level displacement map and specular map generation utilities
- A Vite plugin based on `virtual:` modules
- A set of ready-to-use React components

## Installation

```bash
npm i @lollipopkit/liquid-glass
# Or with Bun
bun add @lollipopkit/liquid-glass
```

Peer dependencies:

- `react@^19.1.0`
- `react-dom@^19.1.0`

`@lollipopkit/liquid-glass/components` imports the bundled styles automatically. `@lollipopkit/liquid-glass/styles.css` is still available as an optional explicit style entry.

## Development Preview

This repo already includes a demo app wired to the package source. You can start it directly from the current package directory:

```bash
npm run dev
bun run dev
```

This uses the Vite config from `../../apps/liquid-glass-demo` and aliases directly to `packages/liquid-glass/src`, so changes to components, styles, or virtual modules are reflected immediately in the demo. The script uses `--configLoader runner`, which allows starting from the package directory without depending on a local `node_modules` folder inside the demo app.

If you want to preview the built demo output:

```bash
npm run preview
bun run preview
```

## Exports

```ts
import {
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  LIP,
  calculateDisplacementMap,
  calculateDisplacementMap2,
  calculateMagnifyingDisplacementMap,
  calculateRefractionSpecular,
  surfacePresets,
} from "@lollipopkit/liquid-glass";

import { liquidGlassPlugin } from "@lollipopkit/liquid-glass/vite";

import {
  LiquidMagnifyingGlass,
  LiquidParallaxHero,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
} from "@lollipopkit/liquid-glass/components";
```

## Vite Plugin

Register the plugin in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { liquidGlassPlugin } from "@lollipopkit/liquid-glass/vite";

export default defineConfig({
  plugins: [react(), liquidGlassPlugin()],
});
```

The plugin provides three types of virtual modules:

- `virtual:refractionDisplacementMap?...`
- `virtual:refractionSpecularMap?...`
- `virtual:refractionFilter?...`

Supported query parameters:

- `width`
- `height`
- `radius`
- `bezelWidth`
- `glassThickness`
- `refractiveIndex`
- `specularSaturation`
- `blur`
- `magnify`
- `bezelType`: `convex_circle` | `convex_squircle` | `concave` | `lip`

### `virtual:refractionFilter`

The most common usage is generating a reusable `Filter` component directly:

```tsx
import { Filter } from "virtual:refractionFilter?width=240&height=72&radius=36&bezelWidth=20&glassThickness=90&refractiveIndex=1.45&bezelType=convex_squircle";

export function GlassCard() {
  return (
    <div className="relative">
      <Filter
        id="glass-card-filter"
        blur={0.5}
        scaleRatio={1}
        specularOpacity={0.25}
        specularSaturation={6}
      />

      <div
        style={{
          width: 240,
          height: 72,
          borderRadius: 36,
          backdropFilter: "url(#glass-card-filter)",
          background: "rgba(255,255,255,0.12)",
        }}
      />
    </div>
  );
}
```

`Filter` props:

- `id: string`
- `withSvgWrapper?: boolean`
- `blur?: number | MotionValue<number>`
- `scaleRatio?: number | MotionValue<number>`
- `specularOpacity?: number | MotionValue<number>`
- `specularSaturation?: number | MotionValue<number>`
- `magnifyingScale?: number | MotionValue<number>`
- `width?: number`
- `height?: number`

### `virtual:refractionDisplacementMap`

```ts
import displacement from "virtual:refractionDisplacementMap?width=150&height=150&radius=75&bezelWidth=40&glassThickness=120&refractiveIndex=1.5";

console.log(displacement.url);
console.log(displacement.maxDisplacement);
```

### `virtual:refractionSpecularMap`

```ts
import specularUrl from "virtual:refractionSpecularMap?width=150&height=150&radius=75&bezelWidth=40";
```

## Algorithm API

If you only want the low-level generation logic, you can call the utilities directly:

```ts
import {
  CONVEX,
  calculateDisplacementMap,
  calculateDisplacementMap2,
  calculateRefractionSpecular,
} from "@lollipopkit/liquid-glass";

const precomputed = calculateDisplacementMap(120, 40, CONVEX.fn, 1.5);

const imageData = calculateDisplacementMap2(
  150,
  150,
  150,
  150,
  75,
  40,
  100,
  precomputed,
  2
);

const specular = calculateRefractionSpecular(150, 150, 75, 40, undefined, 2);
```

Built-in surface presets:

- `CONVEX_CIRCLE`
- `CONVEX`
- `CONCAVE`
- `LIP`
- `surfacePresets`

## Components

`@lollipopkit/liquid-glass/components` exports a set of React components that can be used directly:

- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`
- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`

These components are intended to be embedded directly in product UI. The `components` entry already pulls in the bundled styles.

## Use Cases

- Glassmorphism search boxes, switches, sliders, and player UI
- Refraction or magnifying-glass effects over images or backgrounds
- Pre-generating displacement/specular assets at build time
- Driving filter parameters with animation systems through `MotionValue`
