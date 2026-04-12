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

## Workspace 命令

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

## Virtual Modules

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
