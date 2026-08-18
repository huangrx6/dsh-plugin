import { readFile, rename, rm, writeFile } from 'node:fs/promises'

/**
 * Wraps each raw CJS bundle into a `window.__ModuleLoader__.load(...)`
 * call so the platform's ModuleLoader can register it. Earlier we
 * shipped three bundles (client / client/workspace / client/market) so
 * cross-plugin consumers could `require('dsh-launcher/client/market')`,
 * but the platform's ModuleLoader rejects cross-plugin value imports
 * with "missed the module table". dsh-skill-manager and dsh-mcp-manager
 * now vendor the marketplace source inside their own packages, so the
 * workspace / market bundles are gone — only the main client bundle
 * needs wrapping.
 */
const targets = [
  {
    rawPath: new URL('../lib/client.raw.js', import.meta.url),
    outputPath: new URL('../lib/client.js', import.meta.url),
    id: 'dsh-launcher',
  },
]

for (const target of targets) {
  const body = (await readFile(target.rawPath, 'utf8')).replace(
    /\n?\/\/# sourceMappingURL=.*$/u,
    '',
  )
  const wrapped = `window.__ModuleLoader__.load({
  id: "${target.id}",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${indent(body, 4)}
    return module.exports;
  }
});
`
  const temporaryPath = new URL(
    `${target.outputPath.toString()}.tmp`,
    import.meta.url,
  )
  await writeFile(temporaryPath, wrapped)
  await rename(temporaryPath, target.outputPath)
  await rm(target.rawPath, { force: true })
}

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces)
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n')
}