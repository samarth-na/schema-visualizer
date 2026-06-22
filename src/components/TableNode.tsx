'use client'

import { Handle, Node, NodeProps, Position } from '@xyflow/react'
import { Copy, DiamondIcon, Fingerprint, Hash, Key, Table2 } from 'lucide-react'
import { memo } from 'react'

import { cn, copyToClipboard } from '@/lib/utils'
import { useSchemaGraphContext } from './SchemaGraphContext'
import type { TableNodeData } from '@/lib/types'

// ReactFlow is scaling everything by a factor of 2
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40

type TableNodeOwnProps = NodeProps<Node<TableNodeData>>

const TableNodeComponent = ({
  id,
  data,
  targetPosition,
  sourcePosition,
}: TableNodeOwnProps) => {
  const hiddenNodeConnector =
    'h-px! w-px! min-w-0! min-h-0! cursor-grab! border-0! opacity-0!'
  const { selectedEdge, isDownloading } = useSchemaGraphContext()

  const hasEdgesSelected =
    selectedEdge?.source === id || selectedEdge?.target === id

  if (data.isForeign) {
    return (
      <header
        className={cn(
          'flex items-center gap-1 rounded border bg-zinc-100 px-2 py-1 text-[0.55rem] text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
          hasEdgesSelected ? 'outline outline-1 outline-blue-600' : undefined
        )}
      >
        {data.name}
        {targetPosition && (
          <Handle
            type="target"
            id={data.name}
            position={targetPosition}
            className={cn(hiddenNodeConnector)}
          />
        )}
      </header>
    )
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded border bg-white text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900',
        hasEdgesSelected ? 'outline outline-1 outline-blue-600' : undefined
      )}
      style={{ width: TABLE_NODE_WIDTH / 2 }}
    >
      <header className="flex h-[22px] items-center justify-between gap-2 bg-zinc-100 pl-2 pr-1 dark:bg-zinc-800">
        <div className="flex min-w-0 shrink items-center gap-1">
          <Table2 strokeWidth={1} size={12} className="shrink-0 text-zinc-500" />
          <span className="truncate whitespace-nowrap text-[0.55rem] font-medium text-zinc-900 dark:text-zinc-100" title={data.name}>
            {data.name}
          </span>
        </div>
        {!isDownloading && (
          <button
            type="button"
            onClick={() => copyToClipboard(data.name)}
            className="shrink-0 rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            title="Copy table name"
          >
            <Copy size={10} />
          </button>
        )}
      </header>

      {data.columns.map((column) => (
        <div
          key={column.id}
          data-testid={`${data.name}/${column.name}`}
          className={cn(
            'group relative flex h-[22px] flex-row items-center justify-items-start border-t border-zinc-100 bg-white pr-1 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800',
            selectedEdge?.sourceHandle === column.id || selectedEdge?.targetHandle === column.id
              ? 'text-blue-600'
              : 'text-zinc-700 dark:text-zinc-300'
          )}
        >
          <div
            className={cn(
              'mx-2 flex items-center justify-start gap-[0.24rem]',
              column.isPrimary && 'basis-1/5'
            )}
          >
            {column.isPrimary && (
              <Key size={8} strokeWidth={1} className="shrink-0 text-zinc-500" />
            )}
            {column.isNullable ? (
              <DiamondIcon size={8} strokeWidth={1} className="shrink-0 text-zinc-500" />
            ) : (
              <DiamondIcon
                size={8}
                strokeWidth={1}
                fill="currentColor"
                className="shrink-0 text-zinc-500"
              />
            )}
            {column.isUnique && (
              <Fingerprint size={8} strokeWidth={1} className="shrink-0 text-zinc-500" />
            )}
            {column.isIdentity && (
              <Hash size={8} strokeWidth={1} className="shrink-0 text-zinc-500" />
            )}
          </div>

          <div className="flex min-w-0 w-full justify-between">
            <span
              className="max-w-[80%] truncate whitespace-nowrap text-[10px]"
              title={column.name}
            >
              {column.name}
            </span>
            <span className="inline-flex shrink-0 justify-end pl-2 pr-1 font-mono text-[8px] text-zinc-400 group-hover:hidden">
              {column.format}
            </span>
          </div>

          {targetPosition && (
            <Handle
              type="target"
              id={column.id}
              position={targetPosition}
              className={cn(hiddenNodeConnector)}
            />
          )}
          {sourcePosition && (
            <Handle
              type="source"
              id={column.id}
              position={sourcePosition}
              className={cn(hiddenNodeConnector)}
            />
          )}

          <button
            type="button"
            onClick={() => copyToClipboard(column.name)}
            className="absolute right-0 top-1/2 mr-1 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded text-zinc-500 opacity-0 hover:bg-zinc-200 hover:text-zinc-900 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            title="Copy column name"
          >
            <Copy size={10} />
          </button>
        </div>
      ))}
    </article>
  )
}

export const TableNode = memo(
  TableNodeComponent,
  (prev, next) =>
    prev.id === next.id &&
    prev.data === next.data &&
    prev.targetPosition === next.targetPosition &&
    prev.sourcePosition === next.sourcePosition
)
