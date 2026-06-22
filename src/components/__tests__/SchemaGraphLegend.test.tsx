import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SchemaGraphLegend } from '../SchemaGraphLegend'

describe('SchemaGraphLegend', () => {
  it('renders legend labels', () => {
    render(<SchemaGraphLegend />)

    expect(screen.getByText('Primary key')).toBeInTheDocument()
    expect(screen.getByText('Identity')).toBeInTheDocument()
    expect(screen.getByText('Unique')).toBeInTheDocument()
    expect(screen.getByText('Nullable')).toBeInTheDocument()
    expect(screen.getByText('Non-Nullable')).toBeInTheDocument()
  })
})
