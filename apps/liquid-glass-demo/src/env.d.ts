/// <reference types="vite/client" />

declare module "*.css?inline" {
  const css: string;
  export default css;
}

declare module "virtual:liquidGlassFilterAssets*" {
  import type { LiquidGlassFilterAssets } from "@lollipopkit/liquid-glass";

  const data: LiquidGlassFilterAssets;
  export default data;
}
