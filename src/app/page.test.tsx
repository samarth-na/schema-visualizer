import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/landing/AnnotatedGraph', () => ({
  AnnotatedGraph: () => <div data-testid="annotated-graph" />,
}));

import Home from './page';

describe('Marketing page', () => {
  it('renders the hero headline and CTA', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: /turn sql ddl into an interactive er diagram/i })
    ).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /visualize your schema/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/app');
  });

  it('renders feature and how-it-works sections', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: /everything you need to explore a schema/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
  });

  it('links to the app from the header and footer CTA', () => {
    render(<Home />);

    const appLinks = screen.getAllByRole('link', {
      name: /open app|launch the app|visualize your schema/i,
    });
    for (const link of appLinks) {
      expect(link).toHaveAttribute('href', '/app');
    }
  });
});
