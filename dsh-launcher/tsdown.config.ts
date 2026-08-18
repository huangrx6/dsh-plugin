import { defineConfig } from 'tsdown'

/**
 * Two-bundle build: the host ESM entry (no-op, this plugin is pure
 * client) and the client CJS bundle (the launcher panel + workspace
 * overlay + sidebar trigger + FAB).
 *
 * Earlier builds also shipped `./client/workspace` and `./client/market`
 * subpath bundles for cross-plugin consumption, but the platform's
 * ModuleLoader rejects cross-plugin value imports with
 * "missed the module table". dsh-skill-manager and dsh-mcp-manager now
 * vendor the marketplace source inside their own packages, so those
 * subpath bundles are gone — keeping them around would only invite
 * future regressions.
 */
export default defineConfig([
  {
    name: 'dsh-launcher',
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2024',
    outDir: 'lib',
    clean: false,
    dts: false,
  },
  {
    name: 'dsh-launcher/client',
    entry: ['src/client/index.tsx'],
    format: ['cjs'],
    target: 'es2022',
    platform: 'browser',
    outDir: 'lib',
    clean: false,
    dts: false,
    sourcemap: false,
    outputOptions: {
      entryFileNames: 'client.raw.js',
    },
  },
])