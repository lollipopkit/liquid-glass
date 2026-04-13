import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npmCacheDir = "/tmp/liquid-glass-npm-cache";
const packageDirs = [
  "packages/core",
  "packages/vite",
  "packages/react",
  "packages/vue",
  "packages/svelte",
];

mkdirSync(npmCacheDir, {
  recursive: true,
});
const appChecks = [
  {
    cwd: "apps/liquid-glass-demo",
    label: "svelte demo",
    bin: "vite",
    args: ["build"],
  },
  {
    cwd: "apps/liquid-glass-react-demo",
    label: "react vite demo",
    bin: "vite",
    args: ["build"],
  },
  {
    cwd: "apps/liquid-glass-vue-demo",
    label: "vue vite demo",
    bin: "vite",
    args: ["build"],
  },
  {
    cwd: "apps/liquid-glass-next",
    label: "next fixture",
    bin: "next",
    args: ["build"],
  },
  {
    cwd: "apps/liquid-glass-webpack",
    label: "webpack fixture",
    bin: "webpack",
    args: ["--mode", "production"],
  },
];

run(rootDir, "npm", ["run", "build"], "workspace packages");

for (const appCheck of appChecks) {
  run(resolve(rootDir, appCheck.cwd), appCheck.bin, appCheck.args, appCheck.label);
}

for (const packageDir of packageDirs) {
  run(
    resolve(rootDir, packageDir),
    "npm",
    ["pack", "--dry-run"],
    `${packageDir} pack dry run`
  );
}

function run(cwd, bin, args, label) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(bin, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      npm_config_cache: npmCacheDir,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
