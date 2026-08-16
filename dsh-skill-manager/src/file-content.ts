/**
 * On-demand preview reads for the skill detail view: classifies a file inside
 * a skill directory by extension (with a NUL-byte sniff for unknown
 * suffixes), returns a capped text payload or base64 for natively
 * renderable media, and rejects any path that escapes the skill directory.
 */
import { readFile, stat } from 'node:fs/promises'
import { basename, extname, resolve, sep } from 'node:path'
import type { SkillFileContent, SkillFilePreviewKind } from './contracts.ts'

/** Text previews stop here; longer files are cut with `truncated: true`. */
export const TEXT_PREVIEW_CAP_BYTES = 256 * 1024
/** Base64 previews (image / pdf / audio / video) refuse files beyond this. */
export const BINARY_PREVIEW_CAP_BYTES = 8 * 1024 * 1024

export class FileValidationError extends Error {}

/** Extension → shiki language id. Keys are lowercase, dotless. */
const TEXT_LANGUAGES: Readonly<Record<string, string>> = {
  md: 'markdown', markdown: 'markdown', mdx: 'markdown',
  txt: 'text', text: 'text', log: 'text',
  json: 'json', jsonc: 'json', json5: 'json', jsonl: 'json',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
  ini: 'ini', cfg: 'ini', conf: 'ini', env: 'ini', properties: 'ini', editorconfig: 'ini',
  gitignore: 'text', npmrc: 'ini', nvmrc: 'text', lock: 'text',
  py: 'python', pyi: 'python', pyw: 'python',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'tsx',
  sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash', command: 'bash',
  html: 'html', htm: 'html', vue: 'html', svelte: 'html',
  css: 'css', scss: 'css', sass: 'css', less: 'css',
  xml: 'xml', xsl: 'xml', xsd: 'xml', plist: 'xml',
  svg: 'xml',
  sql: 'sql',
  go: 'go', rs: 'rust', java: 'java', c: 'c', h: 'c', cpp: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp', cc: 'cpp',
  cs: 'java', kt: 'java', kts: 'java', rb: 'ruby', php: 'php', lua: 'lua', r: 'r', swift: 'swift',
  diff: 'diff', patch: 'diff',
  dockerfile: 'dockerfile', docker: 'dockerfile',
  mk: 'makefile', makefile: 'makefile',
  csv: 'csv', tsv: 'csv',
}

const IMAGE_MIME: Readonly<Record<string, string>> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif',
}

const AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'])
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v', 'mkv'])

interface Classification {
  readonly kind: SkillFilePreviewKind
  readonly language?: string | undefined
  readonly mime?: string | undefined
}

function classify(name: string): Classification | undefined {
  const lower = basename(name).toLowerCase()
  if (lower === 'dockerfile') return { kind: 'text', language: 'dockerfile' }
  if (lower === 'makefile') return { kind: 'text', language: 'makefile' }
  const ext = extname(lower).slice(1)
  if (ext === 'pdf') return { kind: 'pdf', mime: 'application/pdf' }
  if (ext === 'svg') return { kind: 'image', mime: 'image/svg+xml' }
  const imageMime = IMAGE_MIME[ext]
  if (imageMime !== undefined) return { kind: 'image', mime: imageMime }
  if (AUDIO_EXT.has(ext)) return { kind: 'audio', mime: `audio/${ext === 'm4a' ? 'mp4' : ext}` }
  if (VIDEO_EXT.has(ext)) return { kind: 'video', mime: `video/${ext === 'mov' ? 'quicktime' : ext === 'm4v' ? 'mp4' : ext}` }
  const language = TEXT_LANGUAGES[ext]
  if (language !== undefined) return { kind: 'text', language }
  return undefined
}

/**
 * Resolves `file` inside `root`, refusing traversal (`..`, absolute paths,
 * anything landing outside the root), then reads and classifies it. Unknown
 * extensions fall back to a NUL-byte sniff: files that look textual preview
 * as plain text, everything else reports itself as binary.
 */
export async function readSkillFile(root: string, file: string): Promise<SkillFileContent> {
  if (typeof file !== 'string' || file.trim() === '') throw new FileValidationError('缺少文件路径')
  if (file.startsWith('/') || file.includes('\\') || file.includes('\0')) {
    throw new FileValidationError('非法的文件路径')
  }
  const segments = file.split('/')
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new FileValidationError('非法的文件路径')
  }
  const rootResolved = resolve(root)
  const resolved = resolve(rootResolved, file)
  if (!resolved.startsWith(rootResolved + sep)) throw new FileValidationError('非法的文件路径')

  const info = await stat(resolved).catch(() => { throw new FileValidationError(`文件不存在：${file}`) })
  if (!info.isFile()) throw new FileValidationError(`不是文件：${file}`)

  const name = basename(file)
  let plan = classify(name)
  if (plan === undefined) {
    const head = await readFile(resolved).then(buffer => buffer.subarray(0, 1024))
    plan = head.includes(0) ? { kind: 'binary' } : { kind: 'text', language: 'text' }
  }

  if (plan.kind !== 'text') {
    if (info.size > BINARY_PREVIEW_CAP_BYTES) {
      throw new FileValidationError(`文件过大（超过 ${Math.floor(BINARY_PREVIEW_CAP_BYTES / 1024 / 1024)}MB），无法预览`)
    }
    const base64 = (await readFile(resolved)).toString('base64')
    return { file, name, kind: plan.kind, language: undefined, mime: plan.mime, size: info.size, text: undefined, base64, truncated: false }
  }

  const buffer = await readFile(resolved)
  const truncated = buffer.byteLength > TEXT_PREVIEW_CAP_BYTES
  const text = (truncated ? buffer.subarray(0, TEXT_PREVIEW_CAP_BYTES) : buffer).toString('utf8')
  return {
    file,
    name,
    kind: 'text',
    language: plan.language ?? 'text',
    mime: undefined,
    size: info.size,
    text,
    base64: undefined,
    truncated,
  }
}
