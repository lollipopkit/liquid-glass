import type {
  LiquidGlassDisplacementAsset,
  LiquidGlassFilterAssets,
  LiquidGlassFilterParamInput,
  LiquidGlassFilterParams,
  LiquidGlassImageAsset,
} from "@lollipopkit/liquid-glass";
import {
  calculateDisplacementMap,
  calculateDisplacementMap2,
  calculateMagnifyingDisplacementMap,
  calculateRefractionSpecular,
  getLiquidGlassCacheKey,
  getLiquidGlassHash,
  getLiquidGlassSurfacePreset,
  normalizeLiquidGlassFilterParams,
} from "@lollipopkit/liquid-glass";
import type { Plugin } from "vite";

import { encodePng } from "./png";

type DisplacementCacheEntry = {
  buffer: Buffer;
  maxDisplacement: number;
  params: LiquidGlassFilterParams;
};

type ImageCacheEntry = {
  buffer: Buffer;
  params: LiquidGlassFilterParams;
};

function parseLiquidGlassParams(id: string): LiquidGlassFilterParamInput {
  const url = new URL(id);
  const bezelTypeParam = url.searchParams.get("bezelType");
  const bezelType =
    bezelTypeParam === "convex_circle" ||
    bezelTypeParam === "convex_squircle" ||
    bezelTypeParam === "concave" ||
    bezelTypeParam === "lip"
      ? bezelTypeParam
      : undefined;

  return {
    width: url.searchParams.has("width")
      ? parseInt(url.searchParams.get("width")!, 10)
      : undefined,
    height: url.searchParams.has("height")
      ? parseInt(url.searchParams.get("height")!, 10)
      : undefined,
    radius: url.searchParams.has("radius")
      ? parseInt(url.searchParams.get("radius")!, 10)
      : undefined,
    bezelWidth: url.searchParams.has("bezelWidth")
      ? parseInt(url.searchParams.get("bezelWidth")!, 10)
      : undefined,
    glassThickness: url.searchParams.has("glassThickness")
      ? parseInt(url.searchParams.get("glassThickness")!, 10)
      : undefined,
    refractiveIndex: url.searchParams.has("refractiveIndex")
      ? parseFloat(url.searchParams.get("refractiveIndex")!)
      : undefined,
    magnify: url.searchParams.get("magnify") === "true",
    bezelType,
  };
}

export function liquidGlassPlugin(): Plugin {
  const displacementCache = new Map<string, DisplacementCacheEntry>();
  const specularCache = new Map<string, ImageCacheEntry>();
  const magnifyingCache = new Map<string, ImageCacheEntry>();
  const hashToParams = new Map<string, LiquidGlassFilterParams>();

  function rememberParams(params: LiquidGlassFilterParams) {
    hashToParams.set(getLiquidGlassHash(params), params);
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

  function getDisplacementEntry(
    input: LiquidGlassFilterParamInput = {}
  ): DisplacementCacheEntry {
    const params = normalizeLiquidGlassFilterParams(input);
    const cacheKey = getLiquidGlassCacheKey(params);
    const existing = displacementCache.get(cacheKey);

    if (existing) {
      rememberParams(existing.params);
      return existing;
    }

    const surfacePreset = getLiquidGlassSurfacePreset(params.bezelType);
    const precomputedMap = calculateDisplacementMap(
      params.glassThickness,
      params.bezelWidth,
      surfacePreset.fn,
      params.refractiveIndex
    );
    const maxDisplacement = getMaxDisplacement(precomputedMap);
    const imageData = calculateDisplacementMap2(
      params.width,
      params.height,
      params.width,
      params.height,
      params.radius,
      params.bezelWidth,
      100,
      precomputedMap,
      2
    );
    const entry = {
      buffer: encodePng(imageData),
      maxDisplacement,
      params,
    };

    displacementCache.set(cacheKey, entry);
    rememberParams(params);
    return entry;
  }

  function getSpecularEntry(input: LiquidGlassFilterParamInput = {}): ImageCacheEntry {
    const params = normalizeLiquidGlassFilterParams(input);
    const cacheKey = getLiquidGlassCacheKey(params);
    const existing = specularCache.get(cacheKey);

    if (existing) {
      rememberParams(existing.params);
      return existing;
    }

    const imageData = calculateRefractionSpecular(
      params.width,
      params.height,
      params.radius,
      params.bezelWidth,
      undefined,
      2
    );
    const entry = {
      buffer: encodePng(imageData),
      params,
    };

    specularCache.set(cacheKey, entry);
    rememberParams(params);
    return entry;
  }

  function getMagnifyingEntry(
    input: LiquidGlassFilterParamInput = {}
  ): ImageCacheEntry {
    const params = normalizeLiquidGlassFilterParams(input);
    const cacheKey = getLiquidGlassCacheKey(params);
    const existing = magnifyingCache.get(cacheKey);

    if (existing) {
      rememberParams(existing.params);
      return existing;
    }

    const imageData = calculateMagnifyingDisplacementMap(params.width, params.height);
    const entry = {
      buffer: encodePng(imageData),
      params,
    };

    magnifyingCache.set(cacheKey, entry);
    rememberParams(params);
    return entry;
  }

  function getDisplacementFilename(params: LiquidGlassFilterParams) {
    return `liquid-glass-displacement-${getLiquidGlassHash(params)}.png`;
  }

  function getSpecularFilename(params: LiquidGlassFilterParams) {
    return `liquid-glass-specular-${getLiquidGlassHash(params)}.png`;
  }

  function getMagnifyingFilename(params: LiquidGlassFilterParams) {
    return `liquid-glass-magnifying-${getLiquidGlassHash(params)}.png`;
  }

  function createDisplacementModule(params: LiquidGlassFilterParams): string {
    const entry = getDisplacementEntry(params);
    const filename = getDisplacementFilename(entry.params);
    const data: LiquidGlassDisplacementAsset = {
      url: `/assets/${filename}`,
      width: entry.params.width,
      height: entry.params.height,
      maxDisplacement: entry.maxDisplacement,
      params: entry.params,
    };

    return `export const url = ${JSON.stringify(data.url)};
export const width = ${data.width};
export const height = ${data.height};
export const maxDisplacement = ${data.maxDisplacement};
export default ${JSON.stringify(data)};`;
  }

  function createImageModule(params: LiquidGlassFilterParams, kind: "specular" | "magnifying") {
    const entry = kind === "specular" ? getSpecularEntry(params) : getMagnifyingEntry(params);
    const filename =
      kind === "specular"
        ? getSpecularFilename(entry.params)
        : getMagnifyingFilename(entry.params);
    const data: LiquidGlassImageAsset = {
      url: `/assets/${filename}`,
      width: entry.params.width,
      height: entry.params.height,
      params: entry.params,
    };

    return `export const url = ${JSON.stringify(data.url)};
export const width = ${data.width};
export const height = ${data.height};
export default ${JSON.stringify(data)};`;
  }

  function createFilterAssetsModule(params: LiquidGlassFilterParams) {
    const displacement = getDisplacementEntry(params);
    const specular = getSpecularEntry(params);
    const magnifying = params.magnify ? getMagnifyingEntry(params) : undefined;
    const data: LiquidGlassFilterAssets = {
      displacementUrl: `/assets/${getDisplacementFilename(displacement.params)}`,
      specularUrl: `/assets/${getSpecularFilename(specular.params)}`,
      magnifyingUrl: magnifying
        ? `/assets/${getMagnifyingFilename(magnifying.params)}`
        : undefined,
      width: params.width,
      height: params.height,
      maxDisplacement: displacement.maxDisplacement,
      magnify: params.magnify,
      params,
    };

    return `export default ${JSON.stringify(data)};`;
  }

  return {
    name: "liquid-glass-vite-plugin",

    resolveId(id) {
      if (id.startsWith("virtual:liquidGlassDisplacementMap")) {
        return `\0${id}`;
      }

      if (id.startsWith("virtual:liquidGlassSpecularMap")) {
        return `\0${id}`;
      }

      if (id.startsWith("virtual:liquidGlassMagnifyingMap")) {
        return `\0${id}`;
      }

      if (id.startsWith("virtual:liquidGlassFilterAssets")) {
        return `\0${id}`;
      }
    },

    load(id) {
      if (id.startsWith("\0virtual:liquidGlassDisplacementMap")) {
        const params = normalizeLiquidGlassFilterParams(
          parseLiquidGlassParams(id.replace("\0", ""))
        );
        return createDisplacementModule(params);
      }

      if (id.startsWith("\0virtual:liquidGlassSpecularMap")) {
        const params = normalizeLiquidGlassFilterParams(
          parseLiquidGlassParams(id.replace("\0", ""))
        );
        return createImageModule(params, "specular");
      }

      if (id.startsWith("\0virtual:liquidGlassMagnifyingMap")) {
        const params = normalizeLiquidGlassFilterParams(
          parseLiquidGlassParams(id.replace("\0", ""))
        );
        return createImageModule(params, "magnifying");
      }

      if (id.startsWith("\0virtual:liquidGlassFilterAssets")) {
        const params = normalizeLiquidGlassFilterParams(
          parseLiquidGlassParams(id.replace("\0", ""))
        );
        return createFilterAssetsModule(params);
      }
    },

    generateBundle() {
      for (const entry of displacementCache.values()) {
        this.emitFile({
          type: "asset",
          fileName: `assets/${getDisplacementFilename(entry.params)}`,
          source: entry.buffer,
        });
      }

      for (const entry of specularCache.values()) {
        this.emitFile({
          type: "asset",
          fileName: `assets/${getSpecularFilename(entry.params)}`,
          source: entry.buffer,
        });
      }

      for (const entry of magnifyingCache.values()) {
        this.emitFile({
          type: "asset",
          fileName: `assets/${getMagnifyingFilename(entry.params)}`,
          source: entry.buffer,
        });
      }
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = req.url ?? "";
        const handlers = [
          {
            prefix: "/assets/liquid-glass-displacement-",
            getEntry: (params: LiquidGlassFilterParams) => getDisplacementEntry(params),
            getFilename: getDisplacementFilename,
          },
          {
            prefix: "/assets/liquid-glass-specular-",
            getEntry: (params: LiquidGlassFilterParams) => getSpecularEntry(params),
            getFilename: getSpecularFilename,
          },
          {
            prefix: "/assets/liquid-glass-magnifying-",
            getEntry: (params: LiquidGlassFilterParams) => getMagnifyingEntry(params),
            getFilename: getMagnifyingFilename,
          },
        ] as const;

        for (const handler of handlers) {
          if (!requestUrl.startsWith(handler.prefix)) {
            continue;
          }

          const hash = requestUrl
            .replace(handler.prefix, "")
            .replace(".png", "");
          const params = hashToParams.get(hash);

          if (!params) {
            break;
          }

          const entry = handler.getEntry(params);
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000",
          });
          res.end(entry.buffer);
          return;
        }

        next();
      });
    },
  };
}

export default liquidGlassPlugin;
