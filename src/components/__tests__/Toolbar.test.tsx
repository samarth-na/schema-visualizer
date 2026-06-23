import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ParsedTable } from '@/lib/types';
import { Toolbar } from '../Toolbar';

const tables: ParsedTable[] = [{ schema: 'public', name: 'users', comment: null, columns: [] }];

describe('Toolbar', () => {
  it('disables buttons when no tables', () => {
    render(
      <Toolbar
        tables={[]}
        disabled
        onResetLayout={vi.fn()}
        onFindTable={vi.fn()}
        onCopySQL={vi.fn()}
        onCopyMarkdown={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.every((b) => b.hasAttribute('disabled'))).toBe(true);
  });

  it('calls onCopySQL when Copy SQL is clicked', () => {
    const onCopySQL = vi.fn();
    render(
      <Toolbar
        tables={tables}
        disabled={false}
        onResetLayout={vi.fn()}
        onFindTable={vi.fn()}
        onCopySQL={onCopySQL}
        onCopyMarkdown={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /copy sql/i }));
    expect(onCopySQL).toHaveBeenCalled();
  });

  it('calls onCopyMarkdown when Copy Markdown is clicked', () => {
    const onCopyMarkdown = vi.fn();
    render(
      <Toolbar
        tables={tables}
        disabled={false}
        onResetLayout={vi.fn()}
        onFindTable={vi.fn()}
        onCopySQL={vi.fn()}
        onCopyMarkdown={onCopyMarkdown}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /copy markdown/i }));
    expect(onCopyMarkdown).toHaveBeenCalled();
  });
});
