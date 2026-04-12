import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { resolve } from "node:path";

import { encodePng } from "../packages/vite/src/png.ts";
import type {
  LiquidGlassFilterParamInput,
  LiquidGlassFilterParams,
} from "../packages/core/src/filter.ts";

type CoreModule = typeof import("../packages/core/dist/index.js");

type BenchCase = {
  name: string;
  params: LiquidGlassFilterParamInput;
  dprs: number[];
};

type BenchStats = {
  averageMs: number;
  iterations: number;
  maxMs: number;
  minMs: number;
  opsPerSecond: number;
  p95Ms: number;
  totalMs: number;
};

type BenchStageResult = {
  stage: string;
  stats: BenchStats;
};

type BenchSuiteResult = {
  caseName: string;
  dpr: number;
  height: number;
  magnify: boolean;
  stages: BenchStageResult[];
  width: number;
};

type BenchConfig = {
  build: boolean;
  json: boolean;
  maxIterations: number;
  minIterations: number;
  targetMs: number;
  warmupIterations: number;
};

const DEFAULT_CONFIG: BenchConfig = {
  build: !process.argv.includes("--no-build"),
  json: process.argv.includes("--json"),
  maxIterations: 25,
  minIterations: 5,
  targetMs: 250,
  warmupIterations: 3,
};

const benchCases: BenchCase[] = [
  {
    name: "hero-small",
    params: {
      width: 150,
      height: 150,
      radius: 75,
      bezelWidth: 40,
      glassThickness: 120,
      refractiveIndex: 1.5,
      magnify: false,
      bezelType: "convex_squircle",
    },
    dprs: [1, 2, 3],
  },
  {
    name: "searchbox-medium",
    params: {
      width: 420,
      height: 56,
      radius: 28,
      bezelWidth: 27,
      glassThickness: 70,
      refractiveIndex: 1.5,
      magnify: false,
      bezelType: "convex_squircle",
    },
    dprs: [1, 2, 3],
  },
  {
    name: "magnifier-medium",
    params: {
      width: 210,
      height: 150,
      radius: 75,
      bezelWidth: 25,
      glassThickness: 110,
      refractiveIndex: 1.5,
      magnify: true,
      bezelType: "convex_squircle",
    },
    dprs: [1, 2, 3],
  },
  {
    name: "panel-large",
    params: {
      width: 600,
      height: 240,
      radius: 64,
      bezelWidth: 28,
      glassThickness: 120,
      refractiveIndex: 1.5,
      magnify: false,
      bezelType: "lip",
    },
    dprs: [1, 2],
  },
];

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function summarize(samples: number[]): BenchStats {
  const sorted = [...samples].sort((left, right) => left - right);
  const totalMs = sorted.reduce((sum, sample) => sum + sample, 0);
  const averageMs = totalMs / sorted.length;
  const p95Index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
  );

  return {
    averageMs,
    iterations: sorted.length,
    maxMs: sorted.at(-1) ?? 0,
    minMs: sorted[0] ?? 0,
    opsPerSecond: averageMs === 0 ? Number.POSITIVE_INFINITY : 1000 / averageMs,
    p95Ms: sorted[p95Index] ?? 0,
    totalMs,
  };
}

function benchTask(task: () => number, config: BenchConfig): BenchStats {
  let sink = 0;

  for (let index = 0; index < config.warmupIterations; index++) {
    sink += task();
  }

  const samples: number[] = [];
  let totalMs = 0;

  while (
    samples.length < config.maxIterations &&
    (samples.length < config.minIterations || totalMs < config.targetMs)
  ) {
    const start = performance.now();
    sink += task();
    const duration = performance.now() - start;

    samples.push(duration);
    totalMs += duration;
  }

  if (!Number.isFinite(sink)) {
    throw new Error("Benchmark sink became non-finite.");
  }

  return summarize(samples);
}

function getMaxDisplacement(values: number[]): number {
  let maxDisplacement = 0;

  for (const value of values) {
    const absolute = Math.abs(value);
    if (absolute > maxDisplacement) {
      maxDisplacement = absolute;
    }
  }

  return maxDisplacement;
}

function markerFromBytes(bytes: Uint8Array): number {
  const lastIndex = bytes.length - 1;
  return bytes[0] + bytes[lastIndex] + bytes[(lastIndex / 2) | 0];
}

function ensureCoreBuild(config: BenchConfig) {
  if (!config.build) {
    return;
  }

  const buildResult = spawnSync(
    "npm",
    ["run", "build", "--workspace", "@lollipopkit/liquid-glass"],
    {
      cwd: resolve(import.meta.dirname, ".."),
      shell: process.platform === "win32",
      stdio: "inherit",
    }
  );

  if (buildResult.status === 0) {
    return;
  }

  throw new Error("Failed to build @lollipopkit/liquid-glass for benchmark.");
}

async function loadCoreModule(): Promise<CoreModule> {
  const distEntry = resolve(import.meta.dirname, "../packages/core/dist/index.js");
  return import(distEntry);
}

function buildSuite(
  core: CoreModule,
  caseName: string,
  input: LiquidGlassFilterParamInput,
  dpr: number,
  config: BenchConfig
): BenchSuiteResult {
  const params = core.normalizeLiquidGlassFilterParams(input);
  const surfacePreset = core.getLiquidGlassSurfacePreset(params.bezelType);
  const precomputedDisplacementMap = core.calculateDisplacementMap(
    params.glassThickness,
    params.bezelWidth,
    surfacePreset.fn,
    params.refractiveIndex
  );
  const maxDisplacement = getMaxDisplacement(precomputedDisplacementMap);

  const displacementImageData = core.calculateDisplacementMap2(
    params.width,
    params.height,
    params.width,
    params.height,
    params.radius,
    params.bezelWidth,
    100,
    precomputedDisplacementMap,
    dpr
  );
  const specularImageData = core.calculateRefractionSpecular(
    params.width,
    params.height,
    params.radius,
    params.bezelWidth,
    undefined,
    dpr
  );
  const magnifyingImageData = params.magnify
    ? core.calculateMagnifyingDisplacementMap(params.width, params.height, dpr)
    : undefined;

  const stages: BenchStageResult[] = [
    {
      stage: "displacement curve",
      stats: benchTask(() => {
        const map = core.calculateDisplacementMap(
          params.glassThickness,
          params.bezelWidth,
          surfacePreset.fn,
          params.refractiveIndex
        );
        return map[0] ?? 0;
      }, config),
    },
    {
      stage: "displacement image",
      stats: benchTask(() => {
        const imageData = core.calculateDisplacementMap2(
          params.width,
          params.height,
          params.width,
          params.height,
          params.radius,
          params.bezelWidth,
          100,
          precomputedDisplacementMap,
          dpr
        );
        return markerFromBytes(imageData.data);
      }, config),
    },
    {
      stage: "specular image",
      stats: benchTask(() => {
        const imageData = core.calculateRefractionSpecular(
          params.width,
          params.height,
          params.radius,
          params.bezelWidth,
          undefined,
          dpr
        );
        return markerFromBytes(imageData.data);
      }, config),
    },
    {
      stage: "png encode",
      stats: benchTask(() => {
        const displacementPng = encodePng(displacementImageData);
        const specularPng = encodePng(specularImageData);
        let marker = displacementPng[0] + specularPng[0];

        if (magnifyingImageData) {
          const magnifyingPng = encodePng(magnifyingImageData);
          marker += magnifyingPng[0];
        }

        return marker;
      }, config),
    },
    {
      stage: "full static pipeline",
      stats: benchTask(() => {
        const displacementMap = core.calculateDisplacementMap(
          params.glassThickness,
          params.bezelWidth,
          surfacePreset.fn,
          params.refractiveIndex
        );
        const imageData = core.calculateDisplacementMap2(
          params.width,
          params.height,
          params.width,
          params.height,
          params.radius,
          params.bezelWidth,
          100,
          displacementMap,
          dpr
        );
        const specular = core.calculateRefractionSpecular(
          params.width,
          params.height,
          params.radius,
          params.bezelWidth,
          undefined,
          dpr
        );
        const displacementPng = encodePng(imageData);
        const specularPng = encodePng(specular);
        let marker = displacementPng[0] + specularPng[0] + maxDisplacement;

        if (params.magnify) {
          const magnifying = core.calculateMagnifyingDisplacementMap(
            params.width,
            params.height,
            dpr
          );
          const magnifyingPng = encodePng(magnifying);
          marker += magnifyingPng[0];
        }

        return marker;
      }, config),
    },
  ];

  return {
    caseName,
    dpr,
    height: params.height,
    magnify: params.magnify,
    stages,
    width: params.width,
  };
}

function renderTable(results: BenchSuiteResult[]): string {
  const lines: string[] = [];

  lines.push("liquid-glass benchmark baseline");
  lines.push(`Node ${process.version}`);
  lines.push("");
  lines.push("说明：");
  lines.push("- `png encode` 只测位图到 PNG Buffer 的编码成本。");
  lines.push("- `full static pipeline` 模拟当前静态资源链路：计算位移图/高光图并编码为 PNG。");
  lines.push("");

  for (const suite of results) {
    lines.push(
      `Case: ${suite.caseName} (${suite.width}x${suite.height}, dpr=${suite.dpr}, magnify=${suite.magnify})`
    );
    lines.push("| Stage | Avg ms | P95 ms | Min ms | Max ms | Iter | ops/s |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");

    for (const { stage, stats } of suite.stages) {
      lines.push(
        `| ${stage} | ${round(stats.averageMs)} | ${round(stats.p95Ms)} | ${round(stats.minMs)} | ${round(stats.maxMs)} | ${stats.iterations} | ${round(stats.opsPerSecond)} |`
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  ensureCoreBuild(DEFAULT_CONFIG);
  const core = await loadCoreModule();
  const results: BenchSuiteResult[] = [];

  for (const testCase of benchCases) {
    for (const dpr of testCase.dprs) {
      results.push(
        buildSuite(core, testCase.name, testCase.params, dpr, DEFAULT_CONFIG)
      );
    }
  }

  if (DEFAULT_CONFIG.json) {
    const payload = {
      generatedAt: new Date().toISOString(),
      nodeVersion: process.version,
      results: results.map((suite) => ({
        ...suite,
        stages: suite.stages.map(({ stage, stats }) => ({
          stage,
          stats: {
            averageMs: round(stats.averageMs, 4),
            iterations: stats.iterations,
            maxMs: round(stats.maxMs, 4),
            minMs: round(stats.minMs, 4),
            opsPerSecond: round(stats.opsPerSecond, 4),
            p95Ms: round(stats.p95Ms, 4),
            totalMs: round(stats.totalMs, 4),
          },
        })),
      })),
    };

    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderTable(results)}\n`);
}

await main();
