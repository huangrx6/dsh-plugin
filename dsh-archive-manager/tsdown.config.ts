import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    name: 'dsh-archive-manager',
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2024',
    outDir: 'lib',
    clean: false,
    dts: false,
  },
  {
    name: 'dsh-archive-manager/client',
    entry: ['src/client/index.ts'],
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