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

## Vite 前置要求

当前 UI 包要求消费端使用 Vite，并先在应用里注册 `@lollipopkit/liquid-glass-vite` 提供的插件。

```ts
import { defineConfig } from "vite";
import { liquidGlassPlugin } from "@lollipopkit/liquid-glass-vite";

export default defineConfig({
  plugins: [liquidGlassPlugin()],
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

这些运行时 helper 现在也会从 React、Vue、Svelte 包入口直接 re-export，
框架使用方不需要额外再引一次 `@lollipopkit/liquid-glass`。
