# liquid-glass 去除 Vite 强依赖计划

## 背景

当前仓库已经完成了几件关键工作：

- `packages/core` 提供了浏览器运行时生成能力
- `packages/core` 提供了 shared worker runtime
- React / Vue / Svelte 三个框架包已经可以直接 re-export runtime API
- 五个组件都已经支持 `runtime` / `runtimeParams` / `runtimeOptions`

这意味着组件库已经不再只能依赖 `virtual:liquidGlassFilterAssets?...` 才能工作。

但当前仍存在两类 Vite 绑定：

1. 框架包层面的 Vite 强依赖
   - `@lollipopkit/liquid-glass-react`
   - `@lollipopkit/liquid-glass-vue`
   - `@lollipopkit/liquid-glass-svelte`
   这三个包当前仍把 `@lollipopkit/liquid-glass-vite` 放在 `peerDependencies` 中

2. 实现层面的 Vite 绑定
   - 组件默认静态模式仍依赖 `virtual:liquidGlassFilterAssets?...`
   - `packages/core/src/runtime/worker.ts` 当前仍使用 `./liquidGlassRuntime.worker?worker`

所以现在的目标不应该是“直接删除 Vite 包”，而应该是：

- 让 Vite 从“必需前提”变成“可选优化”
- 让框架组件在没有 Vite 插件的情况下也能工作
- 为后续完全 bundler-agnostic 的 worker 装载方案铺路

---

## 结论

### 结论一：值得去除 Vite 强依赖

原因：

- runtime 模式已经存在，组件具备脱离 `virtual:` 资源工作的能力
- 保留 Vite 作为唯一前提，会限制 Next.js、Webpack、Rspack、Parcel、Rollup 等环境接入
- 现在继续把 UI 包描述为 “for Vite projects” 已经不符合代码现状

### 结论二：应采用“两阶段去依赖”方案

第一阶段：

- 去掉框架包对 `@lollipopkit/liquid-glass-vite` 的强依赖
- 将组件默认行为改成“不要求 Vite 插件”
- 保留 Vite 静态资源模式作为可选路径

第二阶段：

- 替换 `?worker` 这类 Vite 风格 worker 装载方式
- 让 shared worker runtime 也脱离 Vite 专属打包语法

### 结论三：当前不应删除 `@lollipopkit/liquid-glass-vite`

原因：

- 它仍然是有价值的优化包
- 构建期预生成资源、缓存和 demo 仍然能从它获益
- 对追求更低首建成本的用户，静态资源模式仍然是有效选项

所以合理定位是：

- `@lollipopkit/liquid-glass-vite`：可选优化
- `@lollipopkit/liquid-glass`：核心运行时与算法
- React / Vue / Svelte 包：默认可独立工作

---

## 目标

### 产品目标

- React / Vue / Svelte 用户在不安装 Vite 插件时也能直接使用组件
- 默认使用体验不依赖 `virtual:` 模块
- 保留静态模式给需要构建期优化的用户

### 技术目标

- 消除框架包对 `@lollipopkit/liquid-glass-vite` 的强依赖
- 将组件默认工作模式切换为 runtime-first
- 保留 static mode 作为显式选择
- 重构 worker 装载方式，避免 `?worker` 成为最终 API 前提

### 非目标

- 当前阶段不移除 `packages/vite`
- 当前阶段不重写 SVG filter 架构
- 当前阶段不引入 WebGL / WebGPU
- 当前阶段不为了去 Vite 依赖而放弃 worker runtime

---

## 当前状态判断

### 已完成能力

- `createLiquidGlassRuntimeAssets()`
- `createManagedLiquidGlassRuntimeAssets()`
- `prewarmLiquidGlassManagedRuntimeAssets()`
- `resolveLiquidGlassRuntimeBackend()`
- React `useLiquidGlassRuntimeAssets()`
- Vue `useLiquidGlassRuntimeAssets()`
- Svelte `createLiquidGlassRuntimeStore()`
- 五个组件的 `runtime` / `runtimeParams` / `runtimeOptions`

### 当前仍然耦合 Vite 的点

#### 1. 框架包描述和依赖

三个框架包的 `package.json` 仍有：

- `peerDependencies["@lollipopkit/liquid-glass-vite"]`

这会给使用者传达错误信号：仿佛不用 Vite 插件就不能工作。

#### 2. 组件默认静态入口

五个组件仍默认 import：

- `virtual:liquidGlassFilterAssets?...`

虽然已有 runtime fallback，但默认路径仍然把静态资源作为第一来源。

#### 3. shared worker runtime 装载

`packages/core/src/runtime/worker.ts` 当前使用：

```ts
import LiquidGlassRuntimeWorker from "./liquidGlassRuntime.worker?worker";
```

这属于典型 Vite 风格 worker 导入。

它可能在部分支持 `?worker` 的 bundler 下也可运行，但从架构角度仍不是“真正去除 Vite 依赖”的终态。

---

## 目标架构

目标架构分为四层：

### 1. Core 计算层

位置：

- `packages/core`

职责：

- 参数归一化
- displacement / specular / magnifying 计算
- TS runtime
- shared worker runtime

要求：

- 不要求上层必须使用 Vite

### 2. Worker 装载层

职责：

- 负责 shared worker runtime 的跨 bundler 装载
- 不暴露 `?worker` 给最终用户心智

目标：

- 替换当前 Vite 风格 worker 装载语法

### 3. 框架适配层

位置：

- `packages/react`
- `packages/vue`
- `packages/svelte`

职责：

- 默认提供 runtime-first 组件体验
- 暴露 hook / composable / store
- 允许显式选择 static 或 runtime

### 4. 可选构建优化层

位置：

- `packages/vite`

职责：

- 构建期静态资源生成
- `virtual:` 模块
- 预生成和缓存

定位：

- optional optimization
- 不再是框架组件的必需前提

---

## 设计原则

1. 先去掉“强依赖”，再去掉“实现依赖”
2. 先稳定外部 API，再替换内部 worker 装载
3. 默认路径面向更广泛的 bundler 兼容性
4. static mode 作为显式优化选项，而不是默认前提
5. 任何迁移都不能破坏当前已存在的 runtime API

---

## 最终对外心智

目标对外模型应是：

- `@lollipopkit/liquid-glass`
  - 核心算法
  - runtime API
  - shared worker runtime

- `@lollipopkit/liquid-glass-react`
  - React 组件
  - React hook
  - 可直接工作，不要求 Vite

- `@lollipopkit/liquid-glass-vue`
  - Vue 组件
  - Vue composable
  - 可直接工作，不要求 Vite

- `@lollipopkit/liquid-glass-svelte`
  - Svelte 组件
  - Svelte store
  - 可直接工作，不要求 Vite

- `@lollipopkit/liquid-glass-vite`
  - 可选的构建期优化插件
  - 提供 `virtual:` 资源模块

---

## 分阶段计划

## Phase 0：基线与约束确认

### 目标

- 明确哪些地方是“用户可见的 Vite 依赖”
- 明确哪些地方是“内部实现的 Vite 依赖”

### 工作项

- 梳理所有 `virtual:liquidGlass*` 入口
- 梳理所有 `?worker` 导入
- 梳理所有 README 中 “for Vite projects” 或强依赖描述
- 梳理所有 `peerDependencies["@lollipopkit/liquid-glass-vite"]`
- 明确当前 demo 和 benchmark 哪些仍默认走静态路径

### 输出

- Vite 绑定点清单
- 外部 API 影响面

### 验收标准

- 可以明确区分“必须改”与“可延后改”的 Vite 耦合点

---

## Phase 1：去除框架包的 Vite 强依赖

### 目标

- 让 React / Vue / Svelte 包在包描述层不再依赖 Vite

### 工作项

- 从以下包中移除 `peerDependencies["@lollipopkit/liquid-glass-vite"]`
  - `packages/react/package.json`
  - `packages/vue/package.json`
  - `packages/svelte/package.json`
- 更新包描述：
  - 不再写 “for Vite projects”
  - 改成更准确的 runtime-first 描述
- 更新安装文档
  - 将 `@lollipopkit/liquid-glass-vite` 从必装改成可选

### 风险

- 用户可能仍以为 static mode 是默认前提

### 缓解

- 文档明确写出：
  - 默认可直接使用
  - Vite 插件仅用于静态资源优化

### 验收标准

- 三个框架包安装说明都不再要求同时安装 `@lollipopkit/liquid-glass-vite`

---

## Phase 2：组件策略从 static-first 转向 runtime-first

### 目标

- 组件默认在没有 Vite 插件时也能正常工作
- 保留 static mode，但改为显式选择

### 设计方向

当前组件模式：

- 默认 import `virtual:liquidGlassFilterAssets?...`
- 仅在 `runtime` 为真时切换 runtime

目标模式：

- 默认走 runtime
- 提供显式 static 配置
- 或者提供 `mode: "auto" | "static" | "runtime"`

### 推荐 API

建议统一引入：

```ts
type LiquidGlassAssetMode = "auto" | "static" | "runtime";
```

组件 props 示例：

```ts
type CommonLiquidGlassRuntimeProps = {
  mode?: LiquidGlassAssetMode;
  runtimeParams?: ...;
  runtimeOptions?: ...;
};
```

语义建议：

- `mode="auto"`
  - 若运行环境无法走 static 资源链，则使用 runtime
  - 若显式传入 assets 或 static 资源可用，则可走 static
- `mode="runtime"`
  - 强制 runtime
- `mode="static"`
  - 强制使用静态资源链

### 工作项

- 为五个组件设计统一 mode API
- 决定是否保留 `runtime: boolean` 作为兼容入口
- 若保留：
  - 标记为兼容层
  - 新文档主推 `mode`
- 组件内部改为：
  - 优先 runtime-first
  - static 作为显式选择

### 风险

- 改默认行为会影响现有使用者的首建性能

### 缓解

- 初期采用兼容模式：
  - 若检测到 static 资源已存在则仍可优先用 static
  - 新版本文档引导使用 `mode`
- 或作为 minor 版本引入，明确变更说明

### 验收标准

- 在没有 Vite 插件的示例工程里，五个组件可直接工作

---

## Phase 3：抽象 static provider，弱化 `virtual:` 直连

### 目标

- 不让组件源码直接把 `virtual:` 模块当成不可替代前提

### 设计方向

当前问题：

- 每个组件源码都直接 import `virtual:liquidGlassFilterAssets?...`

更合理的结构：

- static provider 单独收口
- runtime provider 单独收口
- 组件只依赖统一的“资产解析器”

示意：

```ts
type LiquidGlassResolvedAssets =
  | { mode: "static"; assets: LiquidGlassFilterAssets }
  | { mode: "runtime"; assets: LiquidGlassFilterAssets | null; pending: boolean };
```

### 工作项

- 新增组件侧 asset resolver
- 将 `virtual:` import 收口到单独文件
- 避免每个组件都直接耦合 Vite 虚拟模块

### 收益

- 后续可以更容易替换 static provider
- 组件实现更清晰

### 验收标准

- 组件层不再散落大量直接 `virtual:` import 逻辑

---

## Phase 4：重构 shared worker runtime 的装载方式

### 目标

- 让 worker runtime 真正脱离 Vite 专属导入语法

### 当前问题

`packages/core/src/runtime/worker.ts` 使用：

```ts
import LiquidGlassRuntimeWorker from "./liquidGlassRuntime.worker?worker";
```

这会导致：

- bundler 兼容性受限
- 包的“去 Vite 依赖”只完成了一半

### 候选方案

#### 方案 A：通过 `new URL(..., import.meta.url)` 装载 worker

示意：

```ts
new Worker(new URL("./liquidGlassRuntime.worker.js", import.meta.url), {
  type: "module",
});
```

优点：

- 在现代 bundler 中比 `?worker` 更通用

缺点：

- 仍依赖 bundler 能处理 worker 文件资源

#### 方案 B：单独导出 worker URL / factory

让构建产物显式包含 worker 文件，并在 runtime 中通过 URL 创建 Worker。

优点：

- 包结构更清晰

缺点：

- 打包配置更复杂

#### 方案 C：应用层注入 worker factory

core 只提供 worker 协议与逻辑，真正的 Worker 实例由宿主注入。

示意：

```ts
type LiquidGlassWorkerFactory = () => Worker;
```

优点：

- 最彻底的 bundler 解耦

缺点：

- 使用门槛更高
- 默认体验变差

### 推荐路线

先做方案 A，再评估是否需要方案 C。

原因：

- 方案 A 改造成本低
- 对外 API 变化小
- 能最快把“Vite 风格专有语法”换掉

### 工作项

- 将 `?worker` 替换为更通用的 worker URL 装载
- 确认 build 产物包含 worker 资源
- 在 React / Vue / Svelte / demo 中回归验证

### 验收标准

- shared worker runtime 不再依赖 `?worker`

---

## Phase 5：将 `@lollipopkit/liquid-glass-vite` 重新定位为可选优化

### 目标

- 明确 Vite 插件的产品边界

### 新定位

`@lollipopkit/liquid-glass-vite` 应只负责：

- `virtual:liquidGlass*` 模块
- 构建期资源生成
- 静态资源缓存
- Vite 特定的 DX 优化

不再负责：

- 组件是否可用
- 运行时是否可工作

### 工作项

- 更新 README
- 更新 demo 文案
- 更新包描述
- 更新示例代码

### 验收标准

- 文档中不再出现“UI 包必须依赖 Vite 插件”的表达

---

## Phase 6：无 Vite 宿主验证

### 目标

- 用真实宿主证明“去 Vite 强依赖”已完成

### 推荐验证宿主

- Next.js
- Webpack 最小示例
- Rspack 最小示例
- 纯 Vite 示例，验证兼容未退化

### 验收场景

#### 场景一：无 Vite 插件

- 安装 `@lollipopkit/liquid-glass-react`
- 不安装 `@lollipopkit/liquid-glass-vite`
- 使用 `LiquidSearchbox`
- 使用 `LiquidMagnifyingGlass`
- 使用 `runtimeOptions.backend="auto"`

预期：

- 组件可渲染
- runtime 可工作

#### 场景二：有 Vite 插件

- 安装 `@lollipopkit/liquid-glass-vite`
- 使用 static mode

预期：

- 现有 `virtual:` 方案仍可工作

#### 场景三：worker 可用环境

- `backend="worker"`

预期：

- shared worker runtime 正常运行

### 验收标准

- 至少一个非 Vite 宿主验证通过

---

## 兼容性策略

### 对现有用户的影响

潜在影响：

- 默认模式若发生变化，首建性能行为可能不同
- 以前必须装 Vite 插件的心智会变

### 兼容策略

建议：

1. 当前保留 `runtime` 布尔入口
2. 下一阶段新增 `mode`
3. static 路径继续存在
4. 文档标清：
   - 组件默认已可脱离 Vite
   - 若追求构建期预生成，可继续选择 Vite 插件

---

## 风险与应对

### 风险一：默认 runtime 带来首建成本

应对：

- 继续保留 worker prewarm
- 默认 `backend="auto"`
- 提供 `mode="static"` 明确覆盖

### 风险二：worker 装载改造导致跨 bundler 兼容问题

应对：

- 先做最小改动方案
- 保持 TS runtime 始终可回退

### 风险三：static 与 runtime 双路径增加维护成本

应对：

- 将 static provider / runtime provider 抽象统一
- 组件只消费解析后的 assets

### 风险四：文档与实现不同步

应对：

- 每个阶段结束都同步更新：
  - root README
  - `README.zh-CN.md`
  - framework README
  - core README

---

## 验收标准

当以下条件全部满足时，可认为“去除 Vite 强依赖”完成：

1. React / Vue / Svelte 包的 `peerDependencies` 中不再要求 `@lollipopkit/liquid-glass-vite`
2. 三个框架包在无 Vite 插件的宿主中可直接使用
3. shared worker runtime 不再使用 `?worker`
4. `@lollipopkit/liquid-glass-vite` 仍可作为 static 优化正常工作
5. 文档明确说明：
   - 默认不要求 Vite
   - Vite 插件是可选优化

---

## 建议执行顺序

建议按以下顺序落地：

1. 移除框架包 `peerDependencies["@lollipopkit/liquid-glass-vite"]`
2. 更新包说明与安装文档
3. 设计并接入统一 `mode`
4. 抽象 static provider，减少组件直连 `virtual:` 模块
5. 替换 `?worker` 装载方式
6. 做无 Vite 宿主验证
7. 最后再决定是否进一步弱化或拆分 `packages/vite`

---

## 一句话总结

目标不是“删除 Vite”，而是：

**让 Vite 从必需前提变成可选优化，让框架组件默认以 runtime-first 方式工作，同时把 shared worker runtime 从 Vite 风格装载语法中解耦出来。**
