import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const command = process.argv[2];
const extraArgs = process.argv.slice(3);
const rootDir = process.cwd();
const configPath = resolve(rootDir, "release.config.json");
const config = readJson(configPath);
const packageDirs = config.packages;
const packageEntries = packageDirs.map((packageDir) => {
  const manifestPath = resolve(rootDir, packageDir, "package.json");
  const manifest = readJson(manifestPath);

  return {
    packageDir,
    manifestPath,
    manifest,
  };
});

const workspacePackageNames = new Set(packageEntries.map(({ manifest }) => manifest.name));
const dryRun = extraArgs.includes("--dry-run");
const skipBuild = extraArgs.includes("--skip-build");

if (!["sync", "publish", "release"].includes(command)) {
  console.error("Usage: node ./scripts/publish-packages.mjs <sync|publish|release> [--dry-run] [--skip-build]");
  process.exit(1);
}

validateVersion(config.version);

const hasVersionChanges = syncVersions();

if (command === "sync") {
  const statusText = hasVersionChanges ? "Updated" : "Verified";
  console.log(`${statusText} workspace package versions at ${config.version}.`);
  process.exit(0);
}

validateGitTag();

if (!skipBuild) {
  run(rootDir, "npm", ["run", "prepublish:check"]);
}

publishPackages();

function syncVersions() {
  let didWrite = false;

  for (const entry of packageEntries) {
    const nextManifest = structuredClone(entry.manifest);
    let changed = false;

    if (nextManifest.version !== config.version) {
      nextManifest.version = config.version;
      changed = true;
    }

    for (const field of ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"]) {
      const section = nextManifest[field];
      if (!section) {
        continue;
      }

      for (const dependencyName of Object.keys(section)) {
        if (!workspacePackageNames.has(dependencyName)) {
          continue;
        }

        if (section[dependencyName] !== config.version) {
          section[dependencyName] = config.version;
          changed = true;
        }
      }
    }

    if (changed) {
      writeJson(entry.manifestPath, nextManifest);
      entry.manifest = nextManifest;
      didWrite = true;
      console.log(`Updated ${entry.manifest.name} to ${config.version}.`);
    }
  }

  if (!didWrite) {
    console.log(`All workspace package versions are already ${config.version}.`);
  }

  return didWrite;
}

function validateGitTag() {
  const gitRefType = process.env.GITHUB_REF_TYPE;
  const gitRefName = process.env.GITHUB_REF_NAME;

  if (gitRefType !== "tag" || !gitRefName) {
    return;
  }

  const expectedTag = `${config.tagPrefix}${config.version}`;
  if (gitRefName !== expectedTag) {
    console.error(`Release tag mismatch: expected ${expectedTag}, received ${gitRefName}.`);
    process.exit(1);
  }
}

function publishPackages() {
  const publishArgs = ["publish", "--access", config.access, "--tag", config.npmTag];
  if (dryRun) {
    publishArgs.push("--dry-run");
  }

  for (const { packageDir, manifest } of packageEntries) {
    console.log(`Publishing ${manifest.name}@${manifest.version}...`);
    run(resolve(rootDir, packageDir), "npm", publishArgs);
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function validateVersion(version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error(`Invalid release.config.json version: ${version}`);
    process.exit(1);
  }
}

function run(cwd, bin, args) {
  const result = spawnSync(bin, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
