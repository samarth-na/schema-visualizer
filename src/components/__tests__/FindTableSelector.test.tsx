import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FindTableSelector } from '../FindTableSelector'
import type { ParsedTable } from '@/lib/types'

const tables: ParsedTable[] = [
  { schema: 'public', name: 'users', comment: null, columns: [] },
  { schema: 'public', name: 'posts', comment: null, columns: [] },
  { schema: 'auth', name: 'accounts', comment: null, columns: [] },
]

describe('FindTableSelector', () => {
  it('filters tables by name', async () => {
    render(<FindTableSelector tables={tables} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /find table/i }))
    fireEvent.change(screen.getByPlaceholderText(/filter tables/i), {
      target: { value: 'post' },
    })

    await waitFor(() => {
      expect(screen.getByText('public.posts')).toBeInTheDocument()
      expect(screen.queryByText('public.users')).not.toBeInTheDocument()
    })
  })

  it('calls onSelect with schema-qualified table name', async () => {
    const onSelect = vi.fn()
    render(<FindTableSelector tables={tables} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /find table/i }))
    fireEvent.click(screen.getByText('auth.accounts'))

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('auth.accounts')
    })
  })
})
