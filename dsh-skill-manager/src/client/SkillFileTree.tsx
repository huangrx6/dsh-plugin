import { useMemo } from 'react'
import { InteractionMode, StaticTreeDataProvider, Tree, UncontrolledTreeEnvironment } from 'react-complex-tree'
import { IconFolderClose16, IconFolderOpen16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillFileStat } from '../contracts.ts'
import { buildTreeItems, formatSize } from './file-tree.ts'

export interface SkillFileTreeProps {
  readonly files: readonly SkillFileStat[]
  readonly label: string
  /** Currently previewed file row, so the tree can render it as selected. */
  readonly selectedFile?: string | undefined
  /** Fires when a file row (never a folder) is clicked. */
  readonly onSelectFile?: (path: string) => void
}

/** Collapsible, keyboard-accessible file tree for one skill directory. */
export function SkillFileTree({ files, label, selectedFile, onSelectFile }: SkillFileTreeProps) {
  const { items, rootChildren } = useMemo(() => buildTreeItems(files), [files])
  const dataProvider = useMemo(() => new StaticTreeDataProvider(items), [items])
  const defaultExpanded = useMemo(() => rootChildren.filter(child => items[child]?.isFolder === true), [rootChildren, items])
  return (
    <div className="dshm-filePanel">
      <div className="dshm-treeScroll">
        <UncontrolledTreeEnvironment
          dataProvider={dataProvider}
          viewState={{ 'skill-files': {
            expandedItems: defaultExpanded,
            selectedItems: selectedFile !== undefined && items[selectedFile] !== undefined ? [selectedFile] : [],
          } }}
          getItemTitle={item => item.data.name}
          defaultInteractionMode={InteractionMode.ClickItemToExpand}
          canDragAndDrop={false}
          canDropOnFolder={false}
          canDropOnNonFolder={false}
          canReorderItems={false}
          canRename={false}
          onSelectItems={selected => {
            if (onSelectFile === undefined) return
            const first = selected[0]
            if (first === undefined || first === 'root') return
            const node = items[String(first)]
            if (node !== undefined && node.isFolder !== true) onSelectFile(String(first))
          }}
          renderItem={({ item, depth, children, title, arrow, context }) => {
            const folder = item.isFolder === true
            return (
              <li
                {...context.itemContainerWithChildrenProps}
                className={`dshm-treeItem${context.isFocused ? ' dshm-treeItem-focused' : ''}${context.isSelected ? ' dshm-treeItem-selected' : ''}`}
              >
                <div
                  {...context.itemContainerWithoutChildrenProps}
                  className={`dshm-treeRow${folder ? ' dshm-treeRow-folder' : ' dshm-treeRow-file'}${context.isSelected ? ' is-selected' : ''}${context.isFocused ? ' is-focused' : ''}`}
                  style={{ paddingLeft: 6 + depth * 15 }}
                >
                  {arrow}
                  <span {...context.interactiveElementProps} className="dshm-treeMain">
                    <span className="dshm-treeIcon" aria-hidden="true">
                      {folder
                        ? (context.isExpanded ? <IconFolderOpen16 size={14} /> : <IconFolderClose16 size={14} />)
                        : <span className="dshm-fileDot" />}
                    </span>
                    <span className="dshm-treeName">{title}</span>
                  </span>
                  {!folder && item.data.size > 0 ? <span className="dshm-treeSize">{formatSize(item.data.size)}</span> : null}
                </div>
                {children}
              </li>
            )
          }}
        >
          <Tree treeId="skill-files" treeLabel={label} rootItem="root" />
        </UncontrolledTreeEnvironment>
      </div>
    </div>
  )
}
