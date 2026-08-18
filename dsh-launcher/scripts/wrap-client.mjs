import { readFile, rename, rm, writeFile } from 'node:fs/promises'

const targets = [
  { rawPath: new URL('../lib/client.raw.js', import.meta.url), outputPath: new URL('../lib/client.js', import.meta.url), id: 'dsh-launcher' },
  { rawPath: new URL('../lib/client/workspace.raw.js', import.meta.url), outputPath: new URL('../lib/client/workspace.js', import.meta.url), id: 'dsh-launcher/workspace' },
  { rawPath: new URL('../lib/client/market.raw.js', import.meta.url), outputPath: new URL('../lib/client/market.js', import.meta.url), id: 'dsh-launcher/market' },
]

for (const target of targets) {
  const body = (await readFile(target.rawPath, 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/u, '')
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
  const temporaryPath = new URL(`${target.outputPath.toString()}.tmp`, import.meta.url)
  await writeFile(temporaryPath, wrapped)
  await rename(temporaryPath, target.outputPath)
  await rm(target.rawPath, { force: true })
}

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces)
  return value.split('\n').map(line => `${prefix}${line}`).join('\n')
}
