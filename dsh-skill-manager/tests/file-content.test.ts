import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  FileValidationError,
  TEXT_PREVIEW_CAP_BYTES,
  readSkillFile,
} from '../src/file-content.ts'
import { parseCsv } from '../src/client/csv.ts'

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dshm-preview-'))
  await mkdir(join(root, 'scripts'), { recursive: true })
  await mkdir(join(root, 'assets'), { recursive: true })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('readSkillFile classification', () => {
  it('reads a python file as capped text with its shiki language', async () => {
    await writeFile(join(root, 'scripts', 'run.py'), 'print("hi")\n', 'utf8')
    const content = await readSkillFile(root, 'scripts/run.py')
    expect(content.kind).toBe('text')
    expect(content.language).toBe('python')
    expect(content.text).toBe('print("hi")\n')
    expect(content.base64).toBeUndefined()
    expect(content.name).toBe('run.py')
    expect(content.truncated).toBe(false)
  })

  it('returns base64 + mime for images', async () => {
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
    await writeFile(join(root, 'assets', 'logo.png'), png)
    const content = await readSkillFile(root, 'assets/logo.png')
    expect(content.kind).toBe('image')
    expect(content.mime).toBe('image/png')
    expect(content.base64).toBe(png.toString('base64'))
    expect(content.text).toBeUndefined()
  })

  it('classifies pdf by extension', async () => {
    await writeFile(join(root, 'doc.pdf'), Buffer.from('%PDF-1.4\n'))
    const content = await readSkillFile(root, 'doc.pdf')
    expect(content.kind).toBe('pdf')
    expect(content.mime).toBe('application/pdf')
  })

  it('sniffs unknown extensions: NUL bytes mean binary, otherwise plain text', async () => {
    await writeFile(join(root, 'blob.dat'), Buffer.from([0x01, 0x00, 0x02, 0x03]))
    await writeFile(join(root, 'weird.xyz'), 'just words')
    expect((await readSkillFile(root, 'blob.dat')).kind).toBe('binary')
    const textual = await readSkillFile(root, 'weird.xyz')
    expect(textual.kind).toBe('text')
    expect(textual.language).toBe('text')
  })

  it('maps svg to image although it is textual', async () => {
    await writeFile(join(root, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>', 'utf8')
    const content = await readSkillFile(root, 'icon.svg')
    expect(content.kind).toBe('image')
    expect(content.mime).toBe('image/svg+xml')
  })

  it('special-cases dockerfile / makefile basenames', async () => {
    await writeFile(join(root, 'Dockerfile'), 'FROM node:24\n', 'utf8')
    await writeFile(join(root, 'Makefile'), 'all:\n', 'utf8')
    expect((await readSkillFile(root, 'Dockerfile')).language).toBe('dockerfile')
    expect((await readSkillFile(root, 'Makefile')).language).toBe('makefile')
  })
})

describe('readSkillFile caps', () => {
  it('truncates oversized text files and flags it', async () => {
    await writeFile(join(root, 'big.log'), 'a'.repeat(TEXT_PREVIEW_CAP_BYTES + 1024), 'utf8')
    const content = await readSkillFile(root, 'big.log')
    expect(content.truncated).toBe(true)
    expect(Buffer.byteLength(content.text ?? '', 'utf8')).toBeLessThanOrEqual(TEXT_PREVIEW_CAP_BYTES + 4)
    expect(content.size).toBeGreaterThan(TEXT_PREVIEW_CAP_BYTES)
  })
})

describe('readSkillFile path guards', () => {
  it.each([
    '../outside.txt',
    'scripts/../../outside.txt',
    '/etc/passwd',
    'a//b',
    'a/./b',
    '',
    'a\\b',
  ])('rejects %s', async bad => {
    await writeFile(join(root, 'outside.txt'), 'nope', 'utf8')
    await expect(readSkillFile(root, bad)).rejects.toBeInstanceOf(FileValidationError)
  })

  it('rejects missing files and directories', async () => {
    await expect(readSkillFile(root, 'missing.py')).rejects.toBeInstanceOf(FileValidationError)
    await expect(readSkillFile(root, 'scripts')).rejects.toBeInstanceOf(FileValidationError)
  })
})

describe('parseCsv', () => {
  it('parses headers, rows, quotes and CRLF', () => {
    const csv = parseCsv('name,note\nalice,"she said ""hi"""\nbob,"two\nlines"')
    expect(csv?.headers).toEqual(['name', 'note'])
    expect(csv?.rows).toEqual([['alice', 'she said "hi"'], ['bob', 'two\nlines']])
  })

  it('supports tab delimiters and pads ragged rows', () => {
    const csv = parseCsv('a\tb\n1', '\t')
    expect(csv?.rows).toEqual([['1', '']])
  })

  it('returns undefined for empty input', () => {
    expect(parseCsv('')).toBeUndefined()
  })

  it('caps rows and reports truncation', () => {
    const text = Array.from({ length: 600 }, (_, i) => `r${i},v`).join('\n')
    const csv = parseCsv(text)
    expect(csv?.rows.length).toBeLessThanOrEqual(502)
    expect(csv?.truncated).toBe(true)
  })
})
