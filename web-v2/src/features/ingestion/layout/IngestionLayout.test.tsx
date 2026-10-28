import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { IngestionLayout } from './IngestionLayout';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/data-ingestion',
        element: <IngestionLayout />,
        children: [{ path: '*', element: <p>page</p> }]
      }
    ],
    { initialEntries: [path] }
  );
  render(<RouterProvider router={router} />);
}

describe('IngestionLayout', () => {
  it('links every section and renders the page', () => {
    renderAt('/data-ingestion/job');

    const nav = screen.getByRole('navigation', { name: 'Data Ingestion' });
    expect(within(nav).getByRole('link', { name: 'Data Sources' })).toHaveAttribute('href', '/data-ingestion/data-source');
    expect(within(nav).getByRole('link', { name: 'Jobs History' })).toHaveAttribute('href', '/data-ingestion/job-history');
    expect(within(nav).queryByRole('link', { name: 'Streaming' })).not.toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
  });
});
