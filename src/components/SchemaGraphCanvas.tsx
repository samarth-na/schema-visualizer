'use client';

import type { Edge, Node } from '@xyflow/react';
import { Background, BackgroundVariant, MiniMap, ReactFlow, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import '@xyflow/react/dist/style.css';

import { getGraphDataFromTables, getLayoutedElementsViaDagre } from '@/lib/graph';
import type { ParsedSchema, TableNodeData } from '@/lib/types';
import { copyToClipboard, getSchemaAsMarkdown, tablesToSQL } from '@/lib/utils';
import { DefaultEdge } from './DefaultEdge';
import { SchemaGraphContextProvider } from './SchemaGraphContext';
import { SchemaGraphLegend } from './SchemaGraphLegend';
import { TableNode } from './TableNode';
import { Toolbar } from './Toolbar';
import { useExportSchemaToImage } from './useExportSchemaToImage';

export type SchemaGraphCanvasProps = {
  schema: ParsedSchema;
  selectedSchemaName: string;
  showToolbar?: boolean;
  showLegend?: boolean;
};

export function SchemaGraphCanvas({
  schema,
  selectedSchemaName,
  showToolbar = true,
  showLegend = true,
}: SchemaGraphCanvasProps) {
  const { tables, relationships } = schema;
  const reactFlowInstance = useReactFlow();
  const [selectedEdge, setSelectedEdge] = useState<Edge | undefined>(undefined);
  const { isDownloading, exportSchemaToImage } = useExportSchemaToImage();

  const nodeTypes = useMemo(
    () => ({
      table: TableNode,
    }),
    []
  );
  const edgeTypes = useMemo(
    () => ({
      default: DefaultEdge,
    }),
    []
  );

  useEffect(() => {
    if (tables.length === 0) {
      reactFlowInstance.setNodes([]);
      reactFlowInstance.setEdges([]);
      return;
    }

    const { nodes, edges } = getGraphDataFromTables(selectedSchemaName, tables, relationships);
    reactFlowInstance.setNodes(nodes);
    reactFlowInstance.setEdges(edges);
    requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    });
  }, [tables, relationships, selectedSchemaName, reactFlowInstance]);

  const handleSelectionChange = useCallback(
    ({ edges }: { edges: Edge[] }) => {
      setSelectedEdge(edges.length === 1 ? edges[0] : undefined);

      const selectedNodeIds = new Set<string>();
      reactFlowInstance.getNodes().forEach((n) => {
        if (n.selected) selectedNodeIds.add(n.id);
      });

      const currentEdges = reactFlowInstance.getEdges();
      let hasChanges = false;
      const nextEdges = currentEdges.map((edge) => {
        const shouldAnimate =
          selectedNodeIds.size > 0 &&
          (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target));
        if (edge.animated === shouldAnimate) return edge;
        hasChanges = true;
        return { ...edge, animated: shouldAnimate };
      });
      if (hasChanges) reactFlowInstance.setEdges(nextEdges);
    },
    [reactFlowInstance]
  );

  const resetLayout = useCallback(() => {
    const nodes = reactFlowInstance.getNodes() as Node<TableNodeData>[];
    const edges = reactFlowInstance.getEdges();
    getLayoutedElementsViaDagre(nodes, edges);
    reactFlowInstance.setNodes([...nodes]);
    reactFlowInstance.setEdges([...edges]);
    requestAnimationFrame(() => reactFlowInstance.fitView({ padding: 0.2 }));
  }, [reactFlowInstance]);

  const findTable = useCallback(
    (tableName: string) => {
      if (reactFlowInstance.getNode(tableName)) {
        reactFlowInstance.fitView({
          nodes: [{ id: tableName }],
          duration: 300,
          maxZoom: 1.5,
          padding: 0.3,
        });
      }
    },
    [reactFlowInstance]
  );

  const copyAsSQL = useCallback(() => {
    copyToClipboard(tablesToSQL(tables), () => toast.success('Schema SQL copied to clipboard'));
  }, [tables]);

  const copyAsMarkdown = useCallback(() => {
    const nodes = reactFlowInstance.getNodes().map((n) => n.data as TableNodeData);
    copyToClipboard(getSchemaAsMarkdown(selectedSchemaName, nodes), () =>
      toast.success('Schema Markdown copied to clipboard')
    );
  }, [reactFlowInstance, selectedSchemaName]);

  const downloadImage = useCallback(
    (format: 'png' | 'svg') => {
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (!viewport) return;
      const { x, y, zoom } = reactFlowInstance.getViewport();
      exportSchemaToImage({
        element: viewport,
        fileName: `schema.${format}`,
        x,
        y,
        zoom,
        format,
      });
    },
    [reactFlowInstance, exportSchemaToImage]
  );

  useEffect(() => {
    const onResize = () => reactFlowInstance.fitView({ padding: 0.2 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [reactFlowInstance]);

  const hasTables = tables.length > 0;

  return (
    <SchemaGraphContextProvider value={{ isDownloading, selectedEdge }}>
      <div className="relative flex h-full w-full flex-col">
        {showToolbar && (
          <Toolbar
            tables={tables}
            disabled={!hasTables}
            onResetLayout={resetLayout}
            onFindTable={findTable}
            onCopySQL={copyAsSQL}
            onCopyMarkdown={copyAsMarkdown}
            onDownloadPng={() => downloadImage('png')}
            onDownloadSvg={() => downloadImage('svg')}
            isDownloading={isDownloading}
          />
        )}

        <div className="flex-1">
          {hasTables ? (
            <ReactFlow
              defaultNodes={[]}
              defaultEdges={[]}
              defaultEdgeOptions={{
                type: 'default',
                animated: false,
                deletable: false,
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2}
              onlyRenderVisibleElements
              onSelectionChange={handleSelectionChange}
            >
              <Background gap={20} size={1} variant={BackgroundVariant.Dots} />
              <MiniMap
                pannable
                zoomable
                nodeColor="var(--color-accent)"
                maskColor="oklch(0 0 0 / 0.20)"
                className="!rounded-md !border !border-border-strong !bg-surface-1 !shadow-md"
              />
              {showLegend && <SchemaGraphLegend />}
            </ReactFlow>
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <div className="max-w-sm text-center">
                <p className="font-mono text-xs text-ink-3">no tables</p>
                <p className="mt-2 text-sm text-ink-2">
                  Paste your DDL on the left and click{' '}
                  <span className="text-ink">Render graph</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SchemaGraphContextProvider>
  );
}
