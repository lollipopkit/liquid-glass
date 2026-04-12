import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const script = process.argv[2];
const forwardedArgs = process.argv.slice(3);
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const userAgent = process.env.npm_config_user_agent ?? "";
const isBun = userAgent.startsWith("bun");

if (!script) {
  console.error("Missing demo script name.");
  process.exit(1);
}

const bin = isBun ? "bun" : "npm";
const args = isBun
  ? ["run", "--filter", "liquid-glass-demo", script, ...forwardedArgs]
  : ["run", script, "--workspace", "liquid-glass-demo", ...forwardedArgs];

const result = spawnSync(bin, args, {
  cwd: rootDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
