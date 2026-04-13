[English](./README.md)

# liquid-glass

[演示](https://liquid-glass.lollipopkit.com) | [参考kube博客](https://kube.io/blog/liquid-glass-css-svg)

用于在 React、Vue、Svelte 中构建 `liquid glass / refraction` 效果的 monorepo。

## Packages

- `@lollipopkit/liquid-glass`
  核心算法、共享类型、曲面预设
- `@lollipopkit/liquid-glass-vite`
  Vite 插件与资源型 `virtual:` 模块
- `@lollipopkit/liquid-glass-react`
  React 组件包
- `@lollipopkit/liquid-glass-vue`
  Vue 组件包
- `@lollipopkit/liquid-glass-svelte`
  Svelte 组件包

## 工作区命令

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

## 演示应用

迁移后的 Svelte 预览位于 `apps/liquid-glass-demo`，并通过本地 Vite alias
直接渲染 `@lollipopkit/liquid-glass-svelte` 与
`@lollipopkit/liquid-glass-vite` 的 workspace 源码。

## 可选的 Vite 静态资源优化

React、Vue、Svelte 组件包现在已经可以在不依赖 Vite 的情况下工作，
默认会回退到 runtime 资源生成。

如果你仍然希望使用构建期静态资源，可以在应用里注册
`@lollipopkit/liquid-glass-vite` 插件，然后把生成的资源注册到对应的框架包。

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

## 虚拟模块

Vite 包现在提供的是资源型模块，而不是框架专属的滤镜组件：

- `virtual:liquidGlassDisplacementMap?...`
- `virtual:liquidGlassSpecularMap?...`
- `virtual:liquidGlassMagnifyingMap?...`
- `virtual:liquidGlassFilterAssets?...`

`virtual:liquidGlassFilterAssets` 返回：

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

三个框架包都导出：

- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`
- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`

## 运行时 API

`@lollipopkit/liquid-glass` 也提供了浏览器侧 runtime API，可在运行时直接生成滤镜资源，而不是依赖 Vite 的 `virtual:` 模块：

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

如果你的 bundler 需要自定义 worker 装载方式，可以在首次调用共享运行时 helper 之前先配置：

```ts
configureLiquidGlassWorkerRuntime({
  workerFactory: (options) =>
    new Worker(new URL("./liquidGlassRuntime.worker.js", import.meta.url), {
      name: options?.name,
      type: "module",
    }),
});
```

运行时选项：

- `backend?: "auto" | "ts" | "worker"`
- `useCache?: boolean`

说明：

- `backend="auto"` 允许应用根据 workload 大小自动选择 backend
- `backend="ts"` 强制使用主线程 runtime 路径
- `backend="worker"` 会在浏览器支持所需 API 时优先选择共享 worker runtime
- `useCache=false` 会绕过 runtime cache，强制重新生成

共享运行时入口：

- `createLiquidGlassRuntimeAssets()`：主线程运行时 helper
- `createManagedLiquidGlassRuntimeAssets()`：可在 `ts` / `worker` 之间切换的共享运行时 helper
- `prewarmLiquidGlassManagedRuntimeAssets()`：共享 worker 预热 helper
- `configureLiquidGlassWorkerRuntime()`：在默认 worker 装载方式不适用时覆盖 worker factory

这些运行时 helper 现在也会从 React、Vue、Svelte 包入口直接 re-export，
框架使用方不需要额外再引一次 `@lollipopkit/liquid-glass`。

## 组件资源模式

所有框架组件都支持：

- `mode="auto"`：优先使用已注册的静态资源；如果没有注册，则自动回退到 runtime 资源
- `mode="static"`：优先使用已注册的静态资源；如果没有静态资源，也会回退到 runtime
- `mode="runtime"`：强制使用 runtime 资源

`runtime` 仍然保留为兼容入口，但推荐优先使用 `mode`。
