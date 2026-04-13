import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { liquidGlassPlugin } from "../../packages/vite/src";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  cacheDir: resolve(rootDir, "../../node_modules/.vite/liquid-glass-vue-demo"),
  resolve: {
    alias: [
      {
        find: "@lollipopkit/liquid-glass-vue",
        replacement: resolve(rootDir, "../../packages/vue/src/index.ts"),
      },
      {
        find: "@lollipopkit/liquid-glass-vite",
        replacement: resolve(rootDir, "../../packages/vite/src/index.ts"),
      },
      {
        find: "@lollipopkit/liquid-glass",
        replacement: resolve(rootDir, "../../packages/core/src/index.ts"),
      },
    ],
  },
  plugins: [liquidGlassPlugin()],
});
