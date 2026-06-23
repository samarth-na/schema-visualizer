'use client';

import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Position,
  useReactFlow,
} from '@xyflow/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import type { EdgeData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSchemaGraphContext } from './SchemaGraphContext';

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
  const { isDownloading } = useSchemaGraphContext();
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
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(selected ? '!stroke-accent' : isDownloading ? '!stroke-ink' : '!stroke-fk')}
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
  );
};

export const DefaultEdge = memo(DefaultEdgeComponent);

const EdgeRelationInfo = ({
  data,
  source,
  target,
  labelX,
  labelY,
  targetX,
  sourceX,
}: {
  data: EdgeData;
  edgePath: string;
  source: string;
  target: string;
  labelX: number;
  labelY: number;
  sourceX: number;
  targetX: number;
}) => {
  const [show, setShow] = useState(false);
  const reactFlowInstance = useReactFlow();

  const checkIfShouldBeDisplayed = useCallback(
    (relationInfoElement: HTMLDivElement | null) => {
      if (!relationInfoElement) return;
      const sourceNode = reactFlowInstance.getNode(source);
      const targetNode = reactFlowInstance.getNode(target);
      if (!sourceNode || !targetNode) return;

      const relationInfoRect = relationInfoElement.getBoundingClientRect();
      const relationInfoOriginPositionInReactFlow = reactFlowInstance.screenToFlowPosition({
        x: relationInfoRect.x,
        y: relationInfoRect.y,
      });
      const relationInfoTargetPositionInReactFlow = reactFlowInstance.screenToFlowPosition({
        x: relationInfoRect.x + relationInfoRect.width,
        y: relationInfoRect.y + relationInfoRect.height,
      });
      const relationInfoReactFlowRect = {
        x: relationInfoOriginPositionInReactFlow.x,
        y: relationInfoOriginPositionInReactFlow.y,
        width: relationInfoTargetPositionInReactFlow.x - relationInfoOriginPositionInReactFlow.x,
        height: relationInfoTargetPositionInReactFlow.y - relationInfoOriginPositionInReactFlow.y,
      };
      const isNodeIntersectingWithSource = reactFlowInstance.isNodeIntersecting(
        sourceNode,
        relationInfoReactFlowRect
      );
      const isNodeIntersectingWithTarget = reactFlowInstance.isNodeIntersecting(
        targetNode,
        relationInfoReactFlowRect
      );
      setShow(!isNodeIntersectingWithSource && !isNodeIntersectingWithTarget);
    },
    [reactFlowInstance, source, target]
  );

  return (
    <EdgeLabelRenderer>
      <div
        ref={checkIfShouldBeDisplayed}
        className={cn(
          'z-tooltip pointer-events-auto absolute flex items-center gap-1 rounded-md border border-accent bg-surface-1 px-1.5 py-1 text-[10px] text-ink shadow-md transition-opacity duration-fast ease-out',
          show ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
      >
        {sourceX < targetX ? (
          <>
            <EdgeNodeData
              schema={data.sourceSchemaName}
              table={data.sourceName}
              column={data.sourceColumnName}
            />
            <ArrowRight size={12} className="text-accent" />
            <EdgeNodeData
              schema={data.targetSchemaName}
              table={data.targetName}
              column={data.targetColumnName}
            />
          </>
        ) : (
          <>
            <EdgeNodeData
              schema={data.targetSchemaName}
              table={data.targetName}
              column={data.targetColumnName}
            />
            <ArrowLeft size={12} className="text-accent" />
            <EdgeNodeData
              schema={data.sourceSchemaName}
              table={data.sourceName}
              column={data.sourceColumnName}
            />
          </>
        )}
      </div>
    </EdgeLabelRenderer>
  );
};

const EdgeNodeData = ({
  schema,
  table,
  column,
}: {
  schema: string;
  table: string;
  column: string;
}) => {
  return (
    <span className="whitespace-nowrap font-mono">
      <span className="text-ink-3">{schema}.</span>
      <span className="text-ink">{table}</span>
      <span className="text-accent">.{column}</span>
    </span>
  );
};
