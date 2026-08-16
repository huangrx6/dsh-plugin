import { describe, expect, it } from 'vitest'
import { buildTreeItems } from '../src/client/file-tree.ts'

describe('buildTreeItems', () => {
  it('nests files under folders and sorts folders before files', () => {
    const { items, rootChildren } = buildTreeItems([
      { name: 'SKILL.md', size: 100, directory: false },
      { name: 'scripts', size: 0, directory: true },
      { name: 'scripts/office/helpers/util.py', size: 5, directory: false },
      { name: 'scripts/run.py', size: 9, directory: false },
      { name: 'LICENSE.txt', size: 1400, directory: false },
    ])
    expect(rootChildren).toEqual(['scripts', 'LICENSE.txt', 'SKILL.md'])
    expect(items['scripts']?.children).toEqual(['scripts/office', 'scripts/run.py'])
    expect(items['scripts/office/helpers/util.py']?.data).toEqual({ name: 'util.py', size: 5, directory: false })
    expect(items['scripts/office']?.isFolder).toBe(true)
  })

  it('creates missing ancestor folders from file paths', () => {
    const { items } = buildTreeItems([
      { name: 'a/b/c.txt', size: 1, directory: false },
    ])
    expect(items['a']?.isFolder).toBe(true)
    expect(items['a/b']?.isFolder).toBe(true)
    expect(items['a/b']?.children).toEqual(['a/b/c.txt'])
    expect(items['a/b/c.txt']?.data.name).toBe('c.txt')
  })

  it('deduplicates directory rows already created as ancestors', () => {
    const { items, rootChildren } = buildTreeItems([
      { name: 'assets', size: 0, directory: true },
      { name: 'assets/logo.png', size: 3, directory: false },
      { name: 'assets', size: 0, directory: true },
    ])
    expect(rootChildren).toEqual(['assets'])
    expect(items['assets']?.children).toEqual(['assets/logo.png'])
  })

  it('handles the empty list', () => {
    const { items, rootChildren } = buildTreeItems([])
    expect(rootChildren).toEqual([])
    expect(Object.keys(items)).toEqual(['root'])
  })
})
