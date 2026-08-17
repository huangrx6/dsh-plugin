import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    name: 'dsh-remote-access',
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2024',
    outDir: 'lib',
    clean: false,
    dts: false,
    external: ['yaml', 'fflate'],
  },
  {
    name: 'dsh-remote-access/client',
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
