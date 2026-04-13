import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { liquidGlassPlugin } from "../vite/src";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), liquidGlassPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(rootDir, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [
        "@lollipopkit/liquid-glass",
        "react",
        "react/jsx-runtime",
        "react-dom",
        "tailwind-merge",
      ],
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "styles.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
