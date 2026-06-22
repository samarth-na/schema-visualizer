import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DefaultEdge } from '../DefaultEdge'
import type { EdgeData } from '@/lib/types'

vi.mock('@xyflow/react', () => ({
  BaseEdge: ({ id }: { id: string }) => <div data-testid={`base-edge-${id}`} />,
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  getSmoothStepPath: () => ['path', 0, 0],
  Position: { Left: 'left', Right: 'right' },
  useReactFlow: () => ({
    getNode: vi.fn(() => ({ id: 'a', position: { x: 0, y: 0 } })),
    screenToFlowPosition: vi.fn(() => ({ x: 0, y: 0 })),
    isNodeIntersecting: vi.fn(() => false),
  }),
}))

vi.mock('../SchemaGraphContext', () => ({
  useSchemaGraphContext: () => ({ selectedEdge: undefined, isDownloading: false }),
}))

const data: EdgeData = {
  sourceName: 'posts',
  sourceSchemaName: 'public',
  sourceColumnName: 'user_id',
  targetName: 'users',
  targetSchemaName: 'public',
  targetColumnName: 'id',
}

describe('DefaultEdge', () => {
  it('renders the base edge when selected', () => {
    render(
      <DefaultEdge
        {...({
          id: 'edge1',
          source: 'a',
          target: 'b',
          sourceX: 0,
          sourceY: 0,
          targetX: 100,
          targetY: 0,
          sourcePosition: 'right',
          targetPosition: 'left',
          selected: true,
          data,
        } as any)}
      />
    )

    expect(screen.getByTestId('base-edge-edge1')).toBeInTheDocument()
  })
})
