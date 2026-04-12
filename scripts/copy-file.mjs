import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [, , sourceArg, targetArg] = process.argv;

if (!sourceArg || !targetArg) {
  console.error("Usage: node copy-file.mjs <source> <target>");
  process.exit(1);
}

const source = resolve(process.cwd(), sourceArg);
const target = resolve(process.cwd(), targetArg);

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target);
