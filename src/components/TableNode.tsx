'use client';

import { Handle, type Node, type NodeProps } from '@xyflow/react';
import { Copy, DiamondIcon, Fingerprint, Hash, Key, Table2 } from 'lucide-react';
import { memo } from 'react';
import { TABLE_NODE_WIDTH } from '@/lib/constants';
import type { TableNodeData } from '@/lib/types';
import { cn, copyToClipboard } from '@/lib/utils';
import { useSchemaGraphContext } from './SchemaGraphContext';

type TableNodeOwnProps = NodeProps<Node<TableNodeData>>;

const TableNodeComponent = ({ id, data, targetPosition, sourcePosition }: TableNodeOwnProps) => {
  const hiddenNodeConnector = 'h-px! w-px! min-w-0! min-h-0! cursor-grab! border-0! opacity-0!';
  const { selectedEdge, isDownloading } = useSchemaGraphContext();

  const hasEdgesSelected = selectedEdge?.source === id || selectedEdge?.target === id;

  if (data.isForeign) {
    return (
      <header
        className={cn(
          'flex items-center gap-1 rounded border border-border-strong bg-surface-2 px-2 py-1 text-[0.55rem] text-ink-2 shadow-sm',
          hasEdgesSelected && 'outline outline-1 outline-accent'
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
    );
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-md border border-border-strong bg-surface-1 text-xs text-ink shadow-sm',
        hasEdgesSelected && 'outline outline-1 outline-accent'
      )}
      style={{ width: TABLE_NODE_WIDTH / 2 }}
    >
      <header className="flex h-[22px] items-center justify-between gap-2 bg-surface-2 pl-2 pr-1">
        <div className="flex min-w-0 shrink items-center gap-1">
          <Table2 strokeWidth={1.5} size={12} className="shrink-0 text-ink-3" />
          <span
            className="truncate whitespace-nowrap text-[0.55rem] font-semibold text-ink"
            title={data.name}
          >
            {data.name}
          </span>
        </div>
        {!isDownloading && (
          <button
            type="button"
            onClick={() => copyToClipboard(data.name)}
            className="shrink-0 rounded p-0.5 text-ink-3 transition-colors duration-fast ease-out hover:bg-surface-3 hover:text-ink"
            title="Copy table name"
            aria-label={`Copy table name ${data.name}`}
          >
            <Copy size={10} strokeWidth={1.5} />
          </button>
        )}
      </header>

      {data.columns.map((column) => {
        const isHighlighted =
          selectedEdge?.sourceHandle === column.id || selectedEdge?.targetHandle === column.id;
        return (
          <div
            key={column.id}
            data-testid={`${data.name}/${column.name}`}
            className={cn(
              'group relative flex h-[22px] flex-row items-center justify-items-start border-t border-border-subtle bg-surface-1 pr-1 transition-colors duration-fast ease-out hover:bg-surface-2',
              isHighlighted ? 'text-accent' : 'text-ink-2'
            )}
          >
            <div
              className={cn(
                'mx-2 flex items-center justify-start gap-[0.24rem]',
                column.isPrimary && 'basis-1/5'
              )}
            >
              {column.isPrimary && <Key size={8} strokeWidth={1.5} className="shrink-0 text-pk" />}
              {column.isNullable ? (
                <DiamondIcon size={8} strokeWidth={1.5} className="shrink-0 text-null" />
              ) : (
                <DiamondIcon
                  size={8}
                  strokeWidth={1.5}
                  fill="currentColor"
                  className="shrink-0 text-null"
                />
              )}
              {column.isUnique && (
                <Fingerprint size={8} strokeWidth={1.5} className="shrink-0 text-uq" />
              )}
              {column.isIdentity && (
                <Hash size={8} strokeWidth={1.5} className="shrink-0 text-id" />
              )}
            </div>

            <div className="flex min-w-0 w-full justify-between">
              <span
                className="max-w-[80%] truncate whitespace-nowrap text-[10px]"
                title={column.name}
              >
                {column.name}
              </span>
              <span className="inline-flex shrink-0 justify-end pl-2 pr-1 font-mono text-[8px] text-ink-3 group-hover:hidden">
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
              className="absolute right-0 top-1/2 mr-1 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded text-ink-3 opacity-0 transition-opacity duration-fast ease-out hover:bg-surface-3 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
              title="Copy column name"
              aria-label={`Copy column name ${column.name}`}
            >
              <Copy size={10} strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </article>
  );
};

export const TableNode = memo(
  TableNodeComponent,
  (prev, next) =>
    prev.id === next.id &&
    prev.data === next.data &&
    prev.targetPosition === next.targetPosition &&
    prev.sourcePosition === next.sourcePosition
);
