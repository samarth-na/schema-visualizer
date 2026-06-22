'use client'

import {
  BaseEdge,
  Edge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  Position,
  useReactFlow,
} from '@xyflow/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

import { cn } from '@/lib/utils'
import { useSchemaGraphContext } from './SchemaGraphContext'
import type { EdgeData } from '@/lib/types'

const DefaultEdgeComponent = ({
  id,
  data,
  source,
  sourceX,
  sourceY,
  sourceHandleId,
  sourcePosition = Position.Bottom,
  target,
  targetX,
  targetY,
  targetHandleId,
  targetPosition = Position.Top,
  selected,
  pathOptions,
  ...props
}: EdgeProps<Edge<EdgeData>>) => {
  const { isDownloading } = useSchemaGraphContext()
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: pathOptions?.borderRadius,
    offset: pathOptions?.offset,
    stepPosition: pathOptions?.stepPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(selected ? '!stroke-blue-600' : isDownloading ? '!stroke-black' : undefined)}
        stroke="#71717a"
        strokeWidth={selected ? 2.5 : 1.5}
        {...props}
      />
      {data && selected ? (
        <EdgeRelationInfo
          source={source}
          target={target}
          edgePath={edgePath}
          labelX={labelX}
          labelY={labelY}
          sourceX={sourceX}
          targetX={targetX}
          data={data}
        />
      ) : null}
    </>
  )
}

export const DefaultEdge = memo(DefaultEdgeComponent)

const EdgeRelationInfo = ({
  data,
  source,
  target,
  labelX,
  labelY,
  targetX,
  sourceX,
}: {
  data: EdgeData
  edgePath: string
  source: string
  target: string
  labelX: number
  labelY: number
  sourceX: number
  targetX: number
}) => {
  const [show, setShow] = useState(false)
  const reactFlowInstance = useReactFlow()

  const checkIfShouldBeDisplayed = useCallback(
    (relationInfoElement: HTMLDivElement | null) => {
      if (!relationInfoElement) return
      const sourceNode = reactFlowInstance.getNode(source)
      const targetNode = reactFlowInstance.getNode(target)
      if (!sourceNode || !targetNode) return

      const relationInfoRect = relationInfoElement.getBoundingClientRect()
      const relationInfoOriginPositionInReactFlow = reactFlowInstance.screenToFlowPosition({
        x: relationInfoRect.x,
        y: relationInfoRect.y,
      })
      const relationInfoTargetPositionInReactFlow = reactFlowInstance.screenToFlowPosition({
        x: relationInfoRect.x + relationInfoRect.width,
        y: relationInfoRect.y + relationInfoRect.height,
      })
      const relationInfoReactFlowRect = {
        x: relationInfoOriginPositionInReactFlow.x,
        y: relationInfoOriginPositionInReactFlow.y,
        width: relationInfoTargetPositionInReactFlow.x - relationInfoOriginPositionInReactFlow.x,
        height: relationInfoTargetPositionInReactFlow.y - relationInfoOriginPositionInReactFlow.y,
      }
      const isNodeIntersectingWithSource = reactFlowInstance.isNodeIntersecting(
        sourceNode,
        relationInfoReactFlowRect
      )
      const isNodeIntersectingWithTarget = reactFlowInstance.isNodeIntersecting(
        targetNode,
        relationInfoReactFlowRect
      )
      setShow(!isNodeIntersectingWithSource && !isNodeIntersectingWithTarget)
    },
    [reactFlowInstance, source, target]
  )

  return (
    <EdgeLabelRenderer>
      <div
        ref={checkIfShouldBeDisplayed}
        className={cn(
          'absolute pointer-events-auto z-50 flex items-center gap-1 rounded-md border border-blue-600 bg-white px-1.5 py-1 text-[10px] shadow-sm transition-opacity dark:bg-zinc-900',
          show ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
      >
        {sourceX < targetX ? (
          <>
            <EdgeNodeData schema={data.sourceSchemaName} table={data.sourceName} column={data.sourceColumnName} />
            <ArrowRight size={12} className="text-blue-600" />
            <EdgeNodeData schema={data.targetSchemaName} table={data.targetName} column={data.targetColumnName} />
          </>
        ) : (
          <>
            <EdgeNodeData schema={data.targetSchemaName} table={data.targetName} column={data.targetColumnName} />
            <ArrowLeft size={12} className="text-blue-600" />
            <EdgeNodeData schema={data.sourceSchemaName} table={data.sourceName} column={data.sourceColumnName} />
          </>
        )}
      </div>
    </EdgeLabelRenderer>
  )
}

const EdgeNodeData = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}) => {
  return (
    <span className="whitespace-nowrap font-mono">
      <span className="text-zinc-500">{schema}.</span>
      <span className="text-zinc-900 dark:text-zinc-100">{table}</span>
      <span className="text-blue-600">.{column}</span>
    </span>
  )
}
