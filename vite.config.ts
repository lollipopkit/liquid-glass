import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";

import { liquidGlassPlugin } from "./src/vitePlugin";

const external = [
  "motion",
  "motion/react",
  "node:zlib",
  "react",
  "react-dom",
  "react-icons/io5",
  "tailwind-merge",
  "vite",
];

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const srcDir = resolve(rootDir, "src");

export default defineConfig({
  plugins: [tailwindcss(), liquidGlassPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(srcDir, "index.ts"),
        components: resolve(srcDir, "components.ts"),
        vite: resolve(srcDir, "vite.ts"),
      },
      formats: ["es"],
      cssFileName: "styles",
    },
    rollupOptions: {
      external,
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "styles.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
