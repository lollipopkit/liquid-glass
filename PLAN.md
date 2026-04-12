# liquid-glass Runtime / Wasm Evolution Plan

## 背景

当前项目的核心形态是：

- `packages/core` 负责生成 displacement / specular / magnifying 三类位图数据
- `packages/vite` 在构建期或 dev server 请求期生成并缓存 PNG 资源
- React / Vue / Svelte 组件在运行时通过 SVG filter 消费这些资源

这意味着当前方案本质上是：

- 预计算贴图
- 运行时使用 `feImage` + `feDisplacementMap` + `feBlend`
- 面向组件库分发，而不是面向实时图形引擎

现阶段已明确接受以下前提：

1. 需要暴露运行时可调参数，而不是只提供预设组件
2. 调参时允许并需要解决可感知卡顿
3. 动态更新将成为核心卖点，而不是偶发交互
4. 可以接受 API 和渲染架构升级成本

因此，项目应该从“纯预生成资源”演进为“双模式架构”：

- `static mode`: 保留现有 Vite 预生成路径
- `runtime mode`: 新增浏览器运行时动态生成路径

## 结论

### 结论一：应该迁移到运行时动态生成

原因：

- 需求已明确要求运行时调参
- 当前 `virtual:` 资源模式不适合高频参数更新
- 现有数值内核是纯计算逻辑，适合被抽成运行时可调用模块

### 结论二：应该为 Wasm 预留路线，但不应一开始就全量 Wasm 化

原因：

- 现有重计算集中在像素级双重循环和大量 `sqrt` / 折射计算
- 这部分非常适合 Wasm
- 但先用 TS 完成 runtime API 和组件接入，能更快验证产品模型与性能瓶颈
- 未确认瓶颈前直接引入 Rust/Wasm，会增加调试、构建和发布复杂度

### 结论三：当前不应直接迁移到 WebGL / WebGPU

原因：

- 当前渲染链路依赖 SVG filter 和组件库形态
- GPU 化不是替换一个计算函数，而是重写渲染器
- 当前首要问题是“动态生成贴图”，不是“重建整条实时图形管线”
- 只有当 SVG filter 本身成为主要运行时瓶颈时，才值得进入 WebGL 方案

### 结论四：WebGPU 不是当前阶段的主路线

原因：

- 浏览器覆盖、工程复杂度、调试成本都高于 WebGL
- 当前效果模型仍是 2D 位移/高光驱动，不需要过早引入更重的 GPU 抽象

## 目标

### 产品目标

- 支持运行时动态修改液态玻璃参数
- 支持连续交互更新，包括拖动、动画、参数面板
- 保留当前跨 React / Vue / Svelte 的消费形态
- 保留现有静态资源模式，避免破坏现有用户

### 技术目标

- 将计算内核从 Vite 绑定中解耦
- 提供统一的 runtime asset 生成 API
- 为后续 Wasm 内核替换预留稳定接口
- 建立性能基线、压测方法和回归标准

### 非目标

- 当前阶段不做 WebGPU 主渲染器
- 当前阶段不删除 SVG filter 路线
- 当前阶段不强制所有用户迁移到 runtime mode
- 当前阶段不同时重构三套框架组件的视觉 API

## 当前架构判断

### 当前优势

- 工程简单，资源可缓存
- 组件消费方式统一
- 对使用者透明，集成成本低
- PNG 资源无损且适合作为 `feImage` 输入

### 当前限制

- 参数主要在构建时确定
- 高频动态更新不自然
- 无法高效支持实时调参
- 浏览器运行时无法直接复用 `virtual:` 资源模块流程

### 当前最重的计算模块

- `packages/core/src/lib/displacementMap.ts`
- `packages/core/src/lib/specular.ts`
- `packages/core/src/lib/magnifyingDisplacement.ts`

这些模块都是纯计算逻辑，适合抽象为 runtime engine 的 CPU 或 Wasm 后端。

## 演进原则

1. 先稳定接口，再替换实现
2. 先做 runtime TS 版，后做 Wasm 版
3. 保持 `static` 与 `runtime` 双模式并存
4. 保持框架组件层尽量薄，重逻辑集中在 `core`
5. 不在尚未确认瓶颈前重写 GPU 渲染器

## 目标架构

目标架构分为四层：

### 1. 参数与类型层

位置：

- `packages/core`

职责：

- 参数规范化
- surface preset
- runtime/static 共用类型
- 运行模式和后端能力声明

### 2. 计算引擎层

位置：

- `packages/core`
- 后续可新增 `packages/core-wasm` 或 `packages/wasm`

职责：

- displacement/specular/magnifying 的原始位图生成
- CPU TS 实现
- 可替换的 Wasm 实现
- 统一输入输出协议

### 3. 资源适配层

位置：

- `packages/core` 或新增 runtime asset 模块
- `packages/vite`

职责：

- `ImageData` / `Uint8Array` 到 URL / Blob / PNG 的转换
- static mode 的 Vite asset emit
- runtime mode 的浏览器资源生命周期管理

### 4. 组件消费层

位置：

- `packages/react`
- `packages/vue`
- `packages/svelte`

职责：

- 接收 `static assets` 或 `runtime assets`
- 维护 SVG filter 结构
- 在需要时驱动 runtime 生成与更新

## 分阶段计划

## Phase 0: Baseline 与准备

### 目标

- 固定当前行为
- 建立性能基线
- 明确改造边界

### 工作项

- 为 `core` 计算函数建立基准测试脚本
- 记录典型尺寸下的耗时：
  - 小尺寸：150x150
  - 中尺寸：420x56
  - 大尺寸：600x240
  - 高 DPR 场景：`dpr=2` / `dpr=3`
- 统计以下阶段耗时：
  - displacement 计算
  - specular 计算
  - magnifying 计算
  - PNG 编码
- 在 demo 中增加性能观察页

### 输出

- 基准结果文档
- 参数规模与耗时对照表
- 第一版 runtime 预算

### 验收标准

- 能明确知道当前瓶颈是计算、编码还是 SVG 渲染

## Phase 1: Runtime API 设计与 TS 实现

### 目标

- 在不引入 Wasm 的前提下提供浏览器运行时生成能力
- 保持现有 static mode 不变

### 工作项

- 在 `packages/core` 中新增 runtime API
- 将当前计算逻辑从 Vite 绑定中进一步解耦
- 定义统一 asset 结构，区分：
  - `StaticLiquidGlassFilterAssets`
  - `RuntimeLiquidGlassFilterAssets`
  - 或统一成一套可同时容纳 URL / object URL / canvas source 的结构
- 新增类似以下 API：

```ts
type LiquidGlassRuntimeBackend = "ts" | "wasm";

type CreateRuntimeAssetsOptions = {
  backend?: LiquidGlassRuntimeBackend;
  dpr?: number;
  signal?: AbortSignal;
};

type RuntimeLiquidGlassAssets = {
  displacementUrl: string;
  specularUrl: string;
  magnifyingUrl?: string;
  width: number;
  height: number;
  maxDisplacement: number;
  dispose(): void;
  update(params: LiquidGlassFilterParams): Promise<void>;
};

declare function createLiquidGlassRuntimeAssets(
  params: LiquidGlassFilterParams,
  options?: CreateRuntimeAssetsOptions
): Promise<RuntimeLiquidGlassAssets>;
```

- 明确资源生命周期：
  - object URL 何时创建
  - object URL 何时释放
  - 连续更新时如何避免泄漏

### 架构要求

- 浏览器 runtime 不依赖 Vite plugin
- Vite plugin 继续使用现有静态资源生成方式
- runtime API 可以直接被 React/Vue/Svelte 使用

### 验收标准

- 在浏览器中无需 `virtual:` 模块即可生成可用 assets
- 连续调参不会发生明显资源泄漏
- 组件层能消费 runtime assets

## Phase 2: 组件层双模式支持

### 目标

- 让现有组件同时支持 static mode 与 runtime mode
- 不破坏现有用户代码

### 工作项

- 为 React / Vue / Svelte 组件补充新的资产输入模式
- 组件支持三类来源：
  - 预生成 `virtual:` assets
  - 外部传入 runtime assets
  - 内部根据 `params` 自动生成 runtime assets

- 设计建议 API：

```ts
type LiquidGlassRendererMode = "static" | "runtime";

type SharedLiquidGlassProps = {
  mode?: LiquidGlassRendererMode;
  params?: Partial<LiquidGlassFilterParams>;
  assets?: LiquidGlassFilterAssets | RuntimeLiquidGlassAssets;
  runtimeBackend?: "ts" | "wasm";
};
```

- 组件内需要解决：
  - 参数变化时去抖或节流
  - 过期任务取消
  - 更新期间的视觉切换策略
  - 组件卸载时资源释放

### 交互策略

- 默认先做“响应式更新”
- 若频繁拖动导致抖动，可引入：
  - `requestAnimationFrame` 批处理
  - 参数更新节流
  - 拖动中低精度、停止后高精度重算

### 验收标准

- Demo 中可实时调整核心参数
- 现有 static mode 示例不受影响
- 框架间 API 保持语义一致

## Phase 3: 性能优化与 Worker 化

### 目标

- 在引入 Wasm 之前，尽可能挖掘 TS 路线性能

### 工作项

- 优化 `core` 算法：
  - 用 `TypedArray` 替换不必要的普通数组
  - 减少临时对象分配
  - 减少重复 `sqrt`
  - 单次遍历完成更多统计，例如 `maxDisplacement`
- 优化 runtime 资源生成：
  - 避免重复编码无变化资源
  - 引入参数缓存
  - 对相近参数做可选量化缓存
- 引入 Web Worker：
  - 将位图生成移到 worker
  - 主线程只负责组件更新和资源替换
  - 评估 transferable object 的收益

### 关键判断点

满足以下任一条件时，进入 Phase 4 Wasm：

- 中高尺寸下交互更新仍明显卡顿
- Worker + TS 优化后仍无法达到目标帧率
- 主要瓶颈明确在数值计算内核而非编码或 SVG filter

### 验收标准

- 主线程长任务显著减少
- 参数拖动流畅度明显提升
- 形成是否进入 Wasm 的数据依据

## Phase 4: Wasm 内核落地

### 目标

- 将最重的数值计算迁移到 Wasm
- 保持 JS/TS API 稳定

### 技术决策

- 优先使用 Rust -> Wasm
- 不将 AssemblyScript 作为主实现路线

原因：

- Rust 的数值计算能力、生态成熟度和可预测性更强
- 对 TypedArray / linear memory 控制更清晰
- 更适合长期维护高性能计算内核

### 迁移范围

优先迁移：

- `calculateDisplacementMap`
- `calculateDisplacementMap2`
- `calculateRefractionSpecular`
- `calculateMagnifyingDisplacementMap`

暂不迁移：

- 参数解析
- 组件层逻辑
- Vite plugin 的模块解析逻辑

### 边界设计

- JS 层负责：
  - 参数校验和规范化
  - 资源生命周期
  - 组件集成
  - fallback 选择

- Wasm 层负责：
  - 纯数值计算
  - 向预分配 buffer 写入 RGBA 数据
  - 返回必要统计信息，如 `maxDisplacement`

### 关键约束

- 减少 JS / Wasm 边界调用次数
- 使用批量 buffer 读写
- 避免逐像素跨边界交互

### 交付方式

可选方案 A：

- 新增 `packages/liquid-glass-wasm`

可选方案 B：

- 在 `packages/core` 中提供可选异步加载的 Wasm backend

建议优先方案 A，原因：

- 构建边界更清晰
- 便于消费者按需安装
- 不强制所有用户引入 Wasm 产物

### 验收标准

- 中高尺寸 runtime 更新耗时显著下降
- JS API 基本不变
- 不支持 Wasm 的环境可自动 fallback 到 TS

## Phase 5: WebGL 评估门槛

### 只有满足以下条件时才进入 WebGL 方案

- Wasm 已经落地
- 计算生成不再是主要瓶颈
- 运行时瓶颈明确落在 SVG filter 渲染本身
- 同屏实例数较多
- 动画是连续逐帧且持续存在

### WebGL 目标

- 新增独立 GPU renderer
- 不替换现有 static/runtime SVG filter renderer
- 作为高性能模式存在

### 明确不在当前阶段处理

- WebGPU 主路线
- 全库改为 canvas-only 渲染
- 删除 DOM / SVG 组件接口

## API 设计原则

### 保持向后兼容

- 现有 `virtual:` 模块继续可用
- 现有组件默认仍可使用静态模式
- 新增能力应尽量通过可选 props / 新 API 引入

### 统一能力声明

建议新增以下概念：

```ts
type LiquidGlassCapability = {
  staticAssets: boolean;
  runtimeAssets: boolean;
  wasmBackend: boolean;
  workerBackend: boolean;
  webglRenderer: boolean;
};
```

用于：

- demo 能力展示
- debug 输出
- 环境选择策略

### 显式资源释放

runtime mode 下必须提供 `dispose()`，避免 object URL 和临时 buffer 泄漏。

## 建议的目录演进

仅为方向建议，不要求一次完成：

```text
packages/
  core/
    src/
      runtime/
        assets.ts
        cache.ts
        workerClient.ts
      lib/
        displacementMap.ts
        specular.ts
        magnifyingDisplacement.ts
  vite/
  react/
  vue/
  svelte/
  wasm/                # 可选，Phase 4 引入
```

## 性能预算

以下是建议目标，不是当前已达成状态：

### 单次更新预算

- 小尺寸：应接近即时，无明显卡顿
- 中尺寸：拖动过程中可接受，停止后迅速收敛
- 大尺寸：允许采用“拖动时低精度，停止后高精度”

### 主线程预算

- 主线程不应被长时间同步阻塞
- 高频调参应优先走 worker 或异步后端

### 内存预算

- 连续拖动不应无限增长 object URL
- 需要可观测的缓存上限与清理策略

## 测试计划

### 单元测试

- 参数规范化
- surface preset 输出稳定性
- 位图通道值范围正确性
- `maxDisplacement` 计算稳定性

### 回归测试

- static mode 输出不变或变化可解释
- runtime mode 与 static mode 在同参数下视觉足够接近

### 性能测试

- Node 侧计算 benchmark
- 浏览器 runtime benchmark
- Worker 与主线程对比
- TS backend 与 Wasm backend 对比

### 视觉测试

- demo 截图对比
- 关键组件在 React / Vue / Svelte 中表现一致

## 风险

### 风险一：运行时资源生命周期复杂

表现：

- object URL 泄漏
- 参数快速变化导致旧任务覆盖新任务

应对：

- 显式 `dispose`
- 版本号或任务序列控制
- `AbortController`

### 风险二：Wasm 引入后工程复杂度上升

表现：

- 构建流程复杂
- 调试门槛提高
- 包分发策略更复杂

应对：

- 保持 TS backend 为默认 fallback
- 将 Wasm 作为可选 backend
- 独立 package 管理构建和发布

### 风险三：真正瓶颈可能在 SVG filter

表现：

- 计算更快了，但页面仍不流畅

应对：

- 在 Phase 0 和 Phase 3 就建立准确 profiling
- 不把 Wasm 当成万能解
- 只有在证据充分时才进入 WebGL

### 风险四：跨框架 API 发散

表现：

- React / Vue / Svelte 在 runtime mode 下行为不一致

应对：

- 共享 runtime 资产层
- 共享参数与类型定义
- 组件层只做最薄的适配

## 里程碑

### Milestone A

- 完成性能基线
- 形成 runtime API 设计文档

### Milestone B

- TS runtime assets 可用
- demo 可实时调参

### Milestone C

- 三套框架组件支持 runtime mode
- 引入 worker，主线程负担下降

### Milestone D

- Wasm backend 上线
- 形成 TS / Wasm 自动选择策略

### Milestone E

- 明确是否需要 WebGL renderer

## 优先级

### P0

- 建立 runtime API
- 支持 demo 实时调参
- 资源生命周期管理

### P1

- Worker 化
- TS 内核优化
- 组件双模式稳定

### P2

- Rust/Wasm backend
- 对比基准与回归验证

### P3

- WebGL 可行性验证

## 推荐执行顺序

1. 完成 Phase 0 基线测试
2. 完成 Phase 1 runtime API
3. 完成 Phase 2 组件双模式接入
4. 完成 Phase 3 TS 优化和 Worker 化
5. 根据数据决定 Phase 4 Wasm
6. 根据数据决定是否进入 Phase 5 WebGL

## 最终建议

当前项目的正确方向不是“立刻 GPU 化”，而是：

1. 从静态资源库演进为支持 runtime mode 的组件库
2. 先以 TS 打通运行时链路
3. 再将最重的计算内核迁到 Rust/Wasm
4. 只有在 SVG filter 成为明确瓶颈时才进入 WebGL

简化表述如下：

- 现在该做：runtime + worker + TS 优化
- 接下来可能做：Rust/Wasm
- 暂时不做：WebGPU 主路线
- 未来视瓶颈决定：WebGL renderer
