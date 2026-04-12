import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { liquidGlassPlugin } from "@lollipopkit/liquid-glass-vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  cacheDir: resolve(rootDir, "../../node_modules/.vite/liquid-glass-demo"),
  resolve: {
    alias: [
      {
        find: "@lollipopkit/liquid-glass-svelte",
        replacement: resolve(rootDir, "../../packages/svelte/src/index.ts"),
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
  plugins: [tailwindcss(), svelte(), liquidGlassPlugin()],
});
