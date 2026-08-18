import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    name: 'dsh-skill-manager',
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2024',
    outDir: 'lib',
    clean: false,
    dts: false,
    external: ['yaml', 'fflate'],
  },
  {
    name: 'dsh-skill-manager/client',
    entry: ['src/client/index.ts'],
    format: ['cjs'],
    target: 'es2022',
    platform: 'browser',
    outDir: 'lib',
    clean: false,
    dts: false,
    sourcemap: false,
    // Bundle dsh-launcher's market UI into this client bundle instead of
    // emitting `require('dsh-launcher/client/market')`. The platform's
    // ModuleLoader has no entry for cross-plugin subpaths, so a runtime
    // require would fail with "missed the module table"; inlining keeps
    // the source-of-truth in dsh-launcher while satisfying the loader.
    deps: {
      alwaysBundle: ['dsh-launcher'],
    },
    outputOptions: {
      entryFileNames: 'client.raw.js',
    },
  },
])
