import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "dsh-launcher",
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "es2024",
    outDir: "lib",
    clean: false,
    dts: false,
  },
  {
    name: "dsh-launcher/client",
    entry: ["src/client/index.tsx"],
    format: ["cjs"],
    target: "es2022",
    platform: "browser",
    outDir: "lib",
    clean: false,
    dts: false,
    sourcemap: false,
    outputOptions: {
      entryFileNames: "client.raw.js",
    },
  },
  {
    name: "dsh-launcher/client/workspace",
    entry: ["src/client/workspace.ts"],
    format: ["cjs"],
    target: "es2022",
    platform: "browser",
    outDir: "lib/client",
    clean: false,
    dts: false,
    sourcemap: false,
    outputOptions: {
      entryFileNames: "workspace.raw.js",
    },
  },
  {
    name: "dsh-launcher/client/market",
    entry: ["src/client/market.ts"],
    format: ["cjs"],
    target: "es2022",
    platform: "browser",
    outDir: "lib/client",
    clean: false,
    dts: false,
    sourcemap: false,
    outputOptions: {
      entryFileNames: "market.raw.js",
    },
  },
]);
