/**
 * Import sources: turn a URL (direct SKILL.md, GitHub repo / subdirectory,
 * or any zip archive) or an uploaded file (.md / .zip) into
 * {@link ImportMaterial} ready to be written into a managed root.
 */
import { unzipSync } from 'fflate'
import type { ImportMaterial } from './skill-files.ts'

const MAX_ZIP_BYTES = 64 * 1024 * 1024
const MAX_MARKDOWN_BYTES = 8 * 1024 * 1024
const FETCH_TIMEOUT_MS = 30_000

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

export function isZipBuffer(buffer: Uint8Array): boolean {
  return buffer.length >= 4 && ZIP_MAGIC.every((byte, index) => buffer[index] === byte)
}

/** Plain markdown: the whole file is the skill. */
export function materialFromMarkdown(text: string, warnings: string[] = []): ImportMaterial {
  return { skillMd: text, resources: [], warnings }
}

function normalizeZipPath(name: string): string | undefined {
  if (name === '' || name.endsWith('/') || name.includes('\0') || name.includes('\\')) return undefined
  if (name.startsWith('/')) return undefined
  const segments = name.split('/').filter(segment => segment !== '.' && segment !== '..')
  if (segments.length === 0 || segments.length !== name.split('/').length) return undefined
  return segments.join('/')
}

/**
 * Pick the skill root inside a zip: the shallowest directory holding a
 * SKILL.md. Multiple candidates at the same depth are ambiguous and fail
 * with the list, so the caller can point at a narrower archive.
 */
export function materialFromZip(buffer: Uint8Array, subpath?: string, warnings: string[] = []): ImportMaterial {
  const entries = unzipSync(buffer)
  const normalized = new Map<string, Uint8Array>()
  for (const [rawName, data] of Object.entries(entries)) {
    // Directory records (trailing slash, no payload) are structural noise.
    if (rawName.endsWith('/')) continue
    const name = normalizeZipPath(rawName)
    if (name === undefined) {
      warnings.push(`跳过不安全的压缩包条目：${rawName}`)
      continue
    }
    normalized.set(name, data)
  }
  const prefix = subpath === undefined || subpath === '' ? undefined : subpath.replace(/^\/+|\/+$/gu, '').split('/').filter(Boolean).join('/')
  const candidates: string[] = []
  for (const name of normalized.keys()) {
    if (!name.endsWith('/SKILL.md') && name !== 'SKILL.md') continue
    const dir = name === 'SKILL.md' ? '' : name.slice(0, -'/SKILL.md'.length)
    if (prefix !== undefined) {
      // Archives from a repo URL wrap everything in `<repo>-<ref>/`; honor the
      // subpath against the remainder after the wrapper directory.
      const firstSlash = dir.indexOf('/')
      const inner = firstSlash === -1 ? '' : dir.slice(firstSlash + 1)
      if (dir !== prefix && inner !== prefix && !inner.startsWith(`${prefix}/`)) continue
    }
    candidates.push(dir)
  }
  if (candidates.length === 0) throw new Error('压缩包中没有找到 SKILL.md')
  const depth = (dir: string): number => dir === '' ? 0 : dir.split('/').length
  const minDepth = Math.min(...candidates.map(depth))
  const shallowest = candidates.filter(dir => depth(dir) === minDepth)
  const chosen = shallowest[0]
  if (shallowest.length > 1) {
    throw new Error(`压缩包中有 ${shallowest.length} 个并列的 skill 目录：${shallowest.map(dir => dir === '' ? '(根目录)' : dir).join('、')}。请使用更精确的地址（例如仓库子目录链接）。`)
  }
  const decoder = new TextDecoder('utf-8')
  const skillMd = decoder.decode(normalized.get(chosen === '' ? 'SKILL.md' : `${chosen}/SKILL.md`) ?? new Uint8Array())
  const resources: { name: string; data: Uint8Array }[] = []
  const resourcePrefix = chosen === '' ? '' : `${chosen}/`
  for (const [name, data] of normalized) {
    if (!name.startsWith(resourcePrefix) || name === `${resourcePrefix}SKILL.md`) continue
    const relative = name.slice(resourcePrefix.length)
    if (relative.endsWith('/SKILL.md') || relative === 'SKILL.md') {
      warnings.push(`已忽略嵌套的 SKILL.md：${relative}`)
      continue
    }
    resources.push({ name: relative, data })
  }
  return { skillMd, resources, warnings }
}

interface ResolvedUrl {
  readonly kind: 'markdown' | 'zip'
  readonly url: string
  readonly subpath?: string | undefined
}

/** Recognize GitHub URLs and map them onto raw markdown or archive downloads. */
export function resolveSourceUrl(raw: string): ResolvedUrl {
  const url = new URL(raw)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('仅支持 http(s) 地址')
  const host = url.hostname
  if (host === 'raw.githubusercontent.com' || host === 'gist.githubusercontent.com') return { kind: 'markdown', url: url.toString() }
  if (host === 'codeload.github.com') {
    const subpath = extractCodeloadSubpath(url.pathname)
    return { kind: 'zip', url: url.toString(), subpath }
  }
  if (host === 'github.com' || host === 'www.github.com') {
    const segments = url.pathname.replace(/^\/+|\/+$/gu, '').split('/').filter(Boolean)
    const [owner, repo, kind, ref, ...rest] = segments
    if (owner === undefined || repo === undefined) throw new Error('无法解析 GitHub 地址')
    const cleanRepo = repo.replace(/\.git$/u, '')
    if (kind === 'blob' && ref !== undefined && rest.length > 0) {
      const path = rest.join('/')
      if (path.endsWith('.md')) return { kind: 'markdown', url: `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${ref}/${path}` }
      throw new Error('GitHub 文件地址仅支持 .md 文件；请使用目录（tree）链接导入整个 skill')
    }
    if (kind === 'tree' && ref !== undefined) {
      const subpath = rest.join('/')
      return { kind: 'zip', url: `https://codeload.github.com/${owner}/${cleanRepo}/zip/${ref}`, subpath }
    }
    if (kind !== undefined) throw new Error('无法解析 GitHub 地址；支持仓库、tree 子目录与 .md 文件链接')
    return { kind: 'zip', url: `https://codeload.github.com/${owner}/${cleanRepo}/zip/HEAD` }
  }
  return { kind: 'zip', url: url.toString() }
}

function extractCodeloadSubpath(pathname: string): string | undefined {
  // /{owner}/{repo}/zip/{ref} carries no subpath; only our own generated URLs do.
  void pathname
  return undefined
}

async function fetchBuffer(url: string, maxBytes: number): Promise<Uint8Array> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
    headers: { 'user-agent': 'dsh-skill-manager/0.1 (+https://github.com/deepseek-ai)' },
  })
  if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}`)
  const declared = response.headers.get('content-length')
  if (declared !== null && Number(declared) > maxBytes) throw new Error('文件超过大小限制（64MB）')
  const buffer = new Uint8Array(await response.arrayBuffer())
  if (buffer.byteLength > maxBytes) throw new Error('文件超过大小限制（64MB）')
  return buffer
}

/** Fetch a URL and turn it into import material. */
export async function materialFromUrl(raw: string): Promise<ImportMaterial> {
  const resolved = resolveSourceUrl(raw)
  if (resolved.kind === 'markdown') {
    const buffer = await fetchBuffer(resolved.url, MAX_MARKDOWN_BYTES)
    return materialFromMarkdown(new TextDecoder('utf-8').decode(buffer))
  }
  const buffer = await fetchBuffer(resolved.url, MAX_ZIP_BYTES)
  if (!isZipBuffer(buffer)) throw new Error('地址未返回 zip 压缩包；若这是单个 SKILL.md，请使用文件直链')
  return materialFromZip(buffer, resolved.subpath)
}

/** Turn an uploaded file (base64) into import material. */
export function materialFromBase64(filename: string, base64: string): ImportMaterial {
  const buffer = Uint8Array.from(Buffer.from(base64, 'base64'))
  if (filename.toLowerCase().endsWith('.zip')) {
    if (!isZipBuffer(buffer)) throw new Error('文件不是有效的 zip 压缩包')
    return materialFromZip(buffer)
  }
  if (filename.toLowerCase().endsWith('.md') || filename.toLowerCase().endsWith('.markdown')) {
    return materialFromMarkdown(new TextDecoder('utf-8').decode(buffer))
  }
  if (isZipBuffer(buffer)) return materialFromZip(buffer)
  throw new Error('仅支持 .md 与 .zip 文件')
}
