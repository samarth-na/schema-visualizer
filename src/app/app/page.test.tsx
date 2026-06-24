import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AppPage from './page';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReactFlow: () => ({
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    fitView: vi.fn(),
    getNodes: vi.fn(() => []),
    getNode: vi.fn(),
    getEdges: vi.fn(() => []),
    screenToFlowPosition: vi.fn(),
    isNodeIntersecting: vi.fn(() => false),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
  }),
}));

vi.mock('@/components/SchemaGraphCanvas', () => ({
  SchemaGraphCanvas: ({ schema }: { schema: { tables: unknown[]; relationships: unknown[] } }) => (
    <div data-testid="canvas">
      <span data-testid="canvas-tables">{schema.tables.length}</span>
      <span data-testid="canvas-rels">{schema.relationships.length}</span>
    </div>
  ),
}));

describe('App page', () => {
  it('disables render button with empty input', () => {
    render(<AppPage />);
    const button = screen.getByRole('button', { name: /render graph/i });
    expect(button).toBeDisabled();
  });

  it('renders graph and shows success toast after pasting SQL', async () => {
    render(<AppPage />);
    const textarea = screen.getByPlaceholderText(/paste your create table/i);
    fireEvent.change(textarea, { target: { value: 'CREATE TABLE t (id INT PRIMARY KEY);' } });

    fireEvent.click(screen.getByRole('button', { name: /render graph/i }));

    await waitFor(() => {
      expect(screen.getByTestId('canvas-tables')).toHaveTextContent('1');
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('loads example schema into textarea and renders', async () => {
    render(<AppPage />);
    fireEvent.click(screen.getByRole('button', { name: /load example/i }));

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        /paste your create table/i
      ) as HTMLTextAreaElement;
      expect(textarea.value).toContain('CREATE TABLE app.authors');
      expect(screen.getByTestId('canvas-tables')).toHaveTextContent('5');
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('filters by selected schema', async () => {
    render(<AppPage />);
    const textarea = screen.getByPlaceholderText(/paste your create table/i);
    fireEvent.change(textarea, {
      target: {
        value: `
          CREATE TABLE public.users (id INT PRIMARY KEY);
          CREATE TABLE auth.accounts (id INT PRIMARY KEY);
          CREATE TABLE public.profiles (
            id INT PRIMARY KEY,
            user_id INT REFERENCES auth.accounts(id)
          );
        `,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /render graph/i }));

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'schema' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'schema' }), {
      target: { value: 'public' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('canvas-tables')).toHaveTextContent('2');
      expect(screen.getByTestId('canvas-rels')).toHaveTextContent('1');
    });
  });

  it('clears input, schema, and error on Clear', async () => {
    render(<AppPage />);
    const textarea = screen.getByPlaceholderText(/paste your create table/i);
    fireEvent.change(textarea, { target: { value: 'CREATE TABLE t (id INT PRIMARY KEY);' } });
    fireEvent.click(screen.getByRole('button', { name: /render graph/i }));

    await waitFor(() => {
      expect(screen.getByTestId('canvas-tables')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
      expect(screen.getByTestId('canvas-tables')).toHaveTextContent('0');
    });
  });
});
