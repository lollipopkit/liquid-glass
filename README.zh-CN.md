[English](./README.md) | 简体中文

# liquid-glass

参考 [kube 博客文章](https://kube.io/blog/liquid-glass-css-svg)

用于生成和应用 liquid glass / refraction 效果的工具包，包含三部分能力：

- 低层位移贴图与高光贴图计算函数
- 基于 `virtual:` module 的 Vite 插件
- 一组现成可用的 React 组件

## 安装

```bash
npm i @lollipopkit/liquid-glass
# 或者使用 Bun
bun add @lollipopkit/liquid-glass
```

Peer dependencies:

- `react@^19.1.0`
- `react-dom@^19.1.0`

`@lollipopkit/liquid-glass/components` 会自动引入包内样式；`@lollipopkit/liquid-glass/styles.css` 仍然保留为可选的显式样式入口。

## 开发预览

仓库内已经有一个联动当前包源码的 demo app。现在可以直接在当前包目录启动：

```bash
npm run dev
bun run dev
```

这会使用 `../../apps/liquid-glass-demo` 的 Vite 配置启动预览页面，并直接 alias 到 `packages/liquid-glass/src`，所以你改动组件、样式或 Vite 虚拟模块后会立即反映到 demo 中。脚本使用了 `--configLoader runner`，可以从当前包目录直接启动，不依赖 demo app 自己的 `node_modules` 目录。

如果你要预览构建后的 demo：

```bash
npm run preview
bun run preview
```

## 导出入口

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

## Vite 插件

在 `vite.config.ts` 中注册插件：

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { liquidGlassPlugin } from "@lollipopkit/liquid-glass/vite";

export default defineConfig({
  plugins: [react(), liquidGlassPlugin()],
});
```

插件提供 3 类虚拟模块：

- `virtual:refractionDisplacementMap?...`
- `virtual:refractionSpecularMap?...`
- `virtual:refractionFilter?...`

支持的 query 参数：

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

最常用的是直接生成一个可复用的 `Filter` 组件：

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

`Filter` props：

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

## 算法 API

如果你只想复用底层生成逻辑，可以直接调用：

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

内置曲面预设：

- `CONVEX_CIRCLE`
- `CONVEX`
- `CONCAVE`
- `LIP`
- `surfacePresets`

## Components

`@lollipopkit/liquid-glass/components` 导出了一组可直接用于页面的 React 组件：

- `LiquidMagnifyingGlass`
- `LiquidParallaxHero`
- `LiquidSearchbox`
- `LiquidSlider`
- `LiquidSwitch`

这些组件默认可以直接嵌入业务页面，`components` 入口已经自动带上包内样式。

## 适用场景

- 玻璃态搜索框、开关、滑块、播放器 UI
- 图片或背景上的折射/放大镜效果
- 构建时预生成 displacement/specular 贴图
- 需要把滤镜参数暴露给动画系统时，与 `MotionValue` 联动
