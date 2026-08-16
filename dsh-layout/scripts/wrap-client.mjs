import { readFile, rename, rm, writeFile } from 'node:fs/promises'

const rawPath = new URL('../lib/client.raw.js', import.meta.url)
const outputPath = new URL('../lib/client.js', import.meta.url)
const temporaryPath = new URL('../lib/.client.js.tmp', import.meta.url)
const body = (await readFile(rawPath, 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/u, '')
const wrapped = `window.__ModuleLoader__.load({
  id: "dsh-layout",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${indent(body, 4)}
    return module.exports;
  }
});
`

await writeFile(temporaryPath, wrapped)
await rename(temporaryPath, outputPath)
await rm(rawPath, { force: true })

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces)
  return value.split('\n').map(line => `${prefix}${line}`).join('\n')
}
