import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const [, , sourceArg, targetArg] = process.argv;

if (!sourceArg || !targetArg) {
  console.error("Usage: node flatten-dist-types.mjs <source-dir> <target-dir>");
  process.exit(1);
}

const source = resolve(process.cwd(), sourceArg);
const target = resolve(process.cwd(), targetArg);

mkdirSync(target, { recursive: true });

for (const entry of readdirSync(source)) {
  cpSync(resolve(source, entry), resolve(target, entry), { recursive: true });
}
