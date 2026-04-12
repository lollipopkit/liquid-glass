# Changesets

Use Changesets to manage package versions and npm releases for this monorepo.

## Common commands

```bash
npm run changeset
npm run version-packages
npm run release
```

`npm run changeset` creates a release note file under `.changeset/`.

`npm run version-packages` updates package versions and internal dependency ranges from committed changesets.

`npm run release` builds all workspaces and publishes the versioned packages to npm.
