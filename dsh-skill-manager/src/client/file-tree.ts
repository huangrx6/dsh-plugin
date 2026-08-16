/** Pure path→tree projection for the skill file tree (no React imports). */
import type { TreeItem } from 'react-complex-tree'
import type { SkillFileStat } from '../contracts.ts'

export interface FileNodeData {
  readonly name: string
  readonly size: number
  readonly directory: boolean
}

export type FileTreeItems = Record<string, TreeItem<FileNodeData>>

/** 1.2 KB / 3.4 MB style size label shared by the tree rows and the preview. */
export function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/** Flat relative-path rows → IDE-style tree items (folders first, then files). */
export function buildTreeItems(files: readonly SkillFileStat[]): { items: FileTreeItems; rootChildren: string[] } {
  const items: FileTreeItems = { root: { index: 'root', isFolder: true, children: [], data: { name: '', size: 0, directory: true } } }
  const appendChild = (parentPath: string, child: string): void => {
    const parent = items[parentPath] ?? items['root']
    if (parent !== undefined) (parent.children as string[]).push(child)
  }
  const ensureFolder = (path: string, name: string): string => {
    if (items[path] === undefined) {
      items[path] = { index: path, isFolder: true, children: [], canMove: false, canRename: false, data: { name, size: 0, directory: true } }
      const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : 'root'
      appendChild(parentPath, path)
    }
    return path
  }
  for (const file of files) {
    const segments = file.name.split('/')
    const name = segments.pop() ?? file.name
    let parent = 'root'
    for (let depth = 1; depth <= segments.length; depth += 1) {
      parent = ensureFolder(segments.slice(0, depth).join('/'), segments[depth - 1] ?? '')
    }
    if (file.directory) {
      ensureFolder(file.name, name)
      continue
    }
    if (items[file.name] === undefined) {
      items[file.name] = { index: file.name, canMove: false, canRename: false, data: { name, size: file.size, directory: false } }
      appendChild(parent, file.name)
    }
  }
  const nameOf = (index: unknown): string => {
    const item = items[String(index)]
    return item !== undefined ? item.data.name : ''
  }
  const isFolderAt = (index: unknown): boolean => items[String(index)]?.isFolder === true
  for (const item of Object.values(items)) {
    ;(item.children ?? []).sort((a, b) => {
      const aFolder = isFolderAt(a)
      const bFolder = isFolderAt(b)
      if (aFolder !== bFolder) return aFolder ? -1 : 1
      return nameOf(a).localeCompare(nameOf(b))
    })
  }
  return { items, rootChildren: (items['root']?.children as string[] | undefined) ?? [] }
}
