import { describe, expect, it } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { materialFromBase64, materialFromMarkdown, materialFromZip, isZipBuffer, resolveSourceUrl } from '../src/import-source.ts'

function zipOf(files: Record<string, string>): Uint8Array {
  const entries = Object.entries(files).map(([name, text]): [string, Uint8Array] => [name, strToU8(text)])
  return zipSync(Object.fromEntries(entries))
}

describe('resolveSourceUrl', () => {
  it('maps GitHub shapes onto raw markdown or codeload archives', () => {
    expect(resolveSourceUrl('https://raw.githubusercontent.com/u/r/main/skills/pdf/SKILL.md')).toEqual({ kind: 'markdown', url: 'https://raw.githubusercontent.com/u/r/main/skills/pdf/SKILL.md' })
    expect(resolveSourceUrl('https://github.com/u/r')).toEqual({ kind: 'zip', url: 'https://codeload.github.com/u/r/zip/HEAD' })
    expect(resolveSourceUrl('https://github.com/u/r/tree/main/skills/pdf')).toEqual({ kind: 'zip', url: 'https://codeload.github.com/u/r/zip/main', subpath: 'skills/pdf' })
    expect(resolveSourceUrl('https://github.com/u/r/blob/main/skills/pdf/SKILL.md')).toEqual({ kind: 'markdown', url: 'https://raw.githubusercontent.com/u/r/main/skills/pdf/SKILL.md' })
  })

  it('rejects unsupported protocols and shapes', () => {
    expect(() => resolveSourceUrl('ftp://example.com/x.zip')).toThrow(/http/)
    expect(() => resolveSourceUrl('https://github.com/u')).toThrow(/GitHub/)
    expect(() => resolveSourceUrl('https://github.com/u/r/blob/main/docs/guide.pdf')).toThrow(/tree/)
  })
})

describe('materialFromZip', () => {
  const skillMd = '---\nname: zipped-skill\ndescription: from zip\n---\n\n# hello'

  it('picks the shallowest skill root and keeps its resources', () => {
    const buffer = zipOf({
      'zipped-skill/SKILL.md': skillMd,
      'zipped-skill/assets/icon.svg': '<svg/>',
      'other/README.md': 'readme',
    })
    const material = materialFromZip(buffer)
    expect(material.skillMd).toBe(skillMd)
    expect(material.resources.map(resource => resource.name)).toEqual(['assets/icon.svg'])
  })

  it('honors the wrapper directory and subpath of GitHub archives', () => {
    const buffer = zipOf({
      'repo-main/docs/SKILL.md': '---\nname: wrong\ndescription: wrong\n---\nx',
      'repo-main/skills/pdf/SKILL.md': '---\nname: right\ndescription: right\n---\nx',
      'repo-main/skills/pdf/assets/a.txt': 'a',
    })
    const material = materialFromZip(buffer, 'skills/pdf')
    expect(material.skillMd).toContain('name: right')
    expect(material.resources.map(resource => resource.name)).toEqual(['assets/a.txt'])
  })

  it('fails on archives without SKILL.md and on ambiguous siblings', () => {
    expect(() => materialFromZip(zipOf({ 'a/README.md': 'r' }))).toThrow(/SKILL\.md/)
    expect(() => materialFromZip(zipOf({
      'one/SKILL.md': '---\nname: one\ndescription: d\n---\nx',
      'two/SKILL.md': '---\nname: two\ndescription: d\n---\nx',
    }))).toThrow(/2 个并列/)
  })
})

describe('materialFromBase64', () => {
  it('decides by extension then magic', () => {
    const zip = zipSync({ 's/SKILL.md': strToU8('---\nname: s\ndescription: d\n---\nx') })
    const md = btoa('---\nname: s\ndescription: d\n---\nx')
    const asBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')
    expect(materialFromBase64('skill.zip', asBase64(zip)).skillMd).toContain('name: s')
    expect(materialFromBase64('skill.md', md).skillMd).toContain('name: s')
    expect(materialFromBase64('mystery.bin', asBase64(zip)).skillMd).toContain('name: s')
    // markdown content is validated later, at write time; extension still gates the type
    expect(() => materialFromBase64('bad.txt', btoa('nope'))).toThrow()
  })
})

describe('isZipBuffer', () => {
  it('checks the PK magic', () => {
    expect(isZipBuffer(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]))).toBe(true)
    expect(isZipBuffer(new Uint8Array([0x50, 0x4b, 0x05, 0x06]))).toBe(false)
    expect(isZipBuffer(strToU8('---\nname: x\n'))).toBe(false)
  })
})

describe('materialFromMarkdown', () => {
  it('passes text through as the skill file', () => {
    expect(materialFromMarkdown('---\nname: x\ndescription: d\n---\nbody')).toEqual({ skillMd: '---\nname: x\ndescription: d\n---\nbody', resources: [], warnings: [] })
  })
})
