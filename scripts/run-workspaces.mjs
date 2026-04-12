import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = process.argv[2];
const rootDir = process.cwd();
const packageDirs = [
  "packages/core",
  "packages/vite",
  "packages/react",
  "packages/vue",
  "packages/svelte",
];

if (!script) {
  console.error("Missing script name.");
  process.exit(1);
}

const userAgent = process.env.npm_config_user_agent ?? "";
const bin = userAgent.startsWith("bun") ? "bun" : "npm";
const args = bin === "bun" ? ["run", script] : ["run", script];

for (const packageDir of packageDirs) {
  const cwd = resolve(rootDir, packageDir);
  const result = spawnSync(bin, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
