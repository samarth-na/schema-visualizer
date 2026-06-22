'use client'

import type { Edge, Node } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  ColorMode,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import '@xyflow/react/dist/style.css'

import { copyToClipboard, getSchemaAsMarkdown } from '@/lib/utils'
import { getGraphDataFromTables, getLayoutedElementsViaDagre } from '@/lib/graph'
import { SchemaGraphContextProvider } from './SchemaGraphContext'
import { DefaultEdge } from './DefaultEdge'
import { SchemaGraphLegend } from './SchemaGraphLegend'
import { TableNode } from './TableNode'
import { Toolbar } from './Toolbar'
import { useExportSchemaToImage } from './useExportSchemaToImage'
import type { ParsedSchema, TableNodeData } from '@/lib/types'

export type SchemaGraphCanvasProps = {
  schema: ParsedSchema
  selectedSchemaName: string
}

export function SchemaGraphCanvas({ schema, selectedSchemaName }: SchemaGraphCanvasProps) {
  const { tables, relationships } = schema
  const reactFlowInstance = useReactFlow()
  const selectedEdgeRef = useRef<Edge | undefined>(undefined)
  const { isDownloading, exportSchemaToImage } = useExportSchemaToImage()

  const nodeTypes = useMemo(
    () => ({
      table: TableNode,
    }),
    []
  )
  const edgeTypes = useMemo(
    () => ({
      default: DefaultEdge,
    }),
    []
  )

  // Build / rebuild graph whenever schema changes
  useEffect(() => {
    if (tables.length === 0) {
      reactFlowInstance.setNodes([])
      reactFlowInstance.setEdges([])
      return
    }

    const { nodes, edges } = getGraphDataFromTables(selectedSchemaName, tables, relationships)
    reactFlowInstance.setNodes(nodes)
    reactFlowInstance.setEdges(edges)
    requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.2 })
    })
  }, [tables, relationships, selectedSchemaName, reactFlowInstance])

  const handleSelectionChange = useCallback(
    ({ edges }: { edges: Edge[] }) => {
      selectedEdgeRef.current = edges.length === 1 ? edges[0] : undefined

      const selectedNodeIds = new Set<string>()
      reactFlowInstance.getNodes().forEach((n) => {
        if (n.selected) selectedNodeIds.add(n.id)
      })

      const currentEdges = reactFlowInstance.getEdges()
      let hasChanges = false
      const nextEdges = currentEdges.map((edge) => {
        const shouldAnimate =
          selectedNodeIds.size > 0 &&
          (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target))
        if (edge.animated === shouldAnimate) return edge
        hasChanges = true
        return { ...edge, animated: shouldAnimate }
      })
      if (hasChanges) reactFlowInstance.setEdges(nextEdges)
    },
    [reactFlowInstance]
  )

  const resetLayout = useCallback(() => {
    const nodes = reactFlowInstance.getNodes() as Node<TableNodeData>[]
    const edges = reactFlowInstance.getEdges()
    getLayoutedElementsViaDagre(nodes, edges)
    reactFlowInstance.setNodes([...nodes])
    reactFlowInstance.setEdges([...edges])
    requestAnimationFrame(() => reactFlowInstance.fitView({ padding: 0.2 }))
  }, [reactFlowInstance])

  const findTable = useCallback(
    (tableName: string) => {
      if (reactFlowInstance.getNode(tableName)) {
        reactFlowInstance.fitView({
          nodes: [{ id: tableName }],
          duration: 300,
          maxZoom: 1.5,
          padding: 0.3,
        })
      }
    },
    [reactFlowInstance]
  )

  const copyAsSQL = useCallback(() => {
    const text = tables
      .map((t) => {
        const cols = t.columns
          .map(
            (c) =>
              `  ${c.name} ${c.dataType}${c.isPrimaryKey ? ' PRIMARY KEY' : ''}${c.isNullable ? '' : ' NOT NULL'}${c.isUnique ? ' UNIQUE' : ''}`
          )
          .join(',\n')
        return `CREATE TABLE ${t.schema}.${t.name} (\n${cols}\n);`
      })
      .join('\n\n')
    copyToClipboard(text, () => toast.success('Schema SQL copied to clipboard'))
  }, [tables])

  const copyAsMarkdown = useCallback(() => {
    const nodes = reactFlowInstance.getNodes().map((n) => n.data as TableNodeData)
    copyToClipboard(getSchemaAsMarkdown(selectedSchemaName, nodes), () =>
      toast.success('Schema Markdown copied to clipboard')
    )
  }, [reactFlowInstance, selectedSchemaName])

  const downloadImage = useCallback(
    (format: 'png' | 'svg') => {
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
      if (!viewport) return
      const { x, y, zoom } = reactFlowInstance.getViewport()
      exportSchemaToImage({
        element: viewport,
        fileName: `schema.${format}`,
        x,
        y,
        zoom,
        format,
      })
    },
    [reactFlowInstance, exportSchemaToImage]
  )

  useEffect(() => {
    const onResize = () => reactFlowInstance.fitView({ padding: 0.2 })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [reactFlowInstance])

  const hasTables = tables.length > 0

  return (
    <SchemaGraphContextProvider value={{ isDownloading, selectedEdge: selectedEdgeRef.current }}>
      <div className="relative flex h-full w-full flex-col">
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

        <div className="flex-1">
          {hasTables ? (
            <ReactFlow
              colorMode={'' as unknown as ColorMode}
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
              proOptions={{ hideAttribution: true }}
              onSelectionChange={handleSelectionChange}
            >
              <Background
                gap={16}
                className="opacity-25 [&>*]:stroke-zinc-300 dark:[&>*]:stroke-zinc-700"
                variant={BackgroundVariant.Dots}
                color="inherit"
              />
              <MiniMap
                pannable
                zoomable
                nodeColor="#3b82f6"
                maskColor="rgba(0,0,0,0.15)"
                className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <SchemaGraphLegend />
            </ReactFlow>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Paste SQL on the left and click Render to see the schema graph.
            </div>
          )}
        </div>
      </div>
    </SchemaGraphContextProvider>
  )
}
