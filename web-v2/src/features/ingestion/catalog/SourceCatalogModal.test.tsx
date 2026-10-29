import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SourceCatalogModal } from './SourceCatalogModal';
import { SOURCE_CATALOG, type AvailableSourceEntry } from './sourceCatalog';

function renderModal() {
  const onSelect = vi.fn<(entry: AvailableSourceEntry) => void>();
  const onClose = vi.fn<() => void>();
  render(<SourceCatalogModal open onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

describe('SourceCatalogModal', () => {
  it('shows every source type', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Add Data Source' })).toBeInTheDocument();
    for (const entry of SOURCE_CATALOG) expect(screen.getByText(entry.title)).toBeInTheDocument();
  });

  it('offers only the available types as buttons', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'MySQL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CSV' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'MongoDB' })).not.toBeInTheDocument();
  });

  it('calls onSelect with the clicked available type', async () => {
    const { onSelect } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'PostgreSQL' }));
    expect(onSelect).toHaveBeenCalledWith(SOURCE_CATALOG.find(entry => entry.key === 'postgresql'));
  });

  it('ignores clicks on a coming-soon type and explains why on hover', async () => {
    const { onSelect } = renderModal();
    const mongo = screen.getByText('MongoDB');
    await userEvent.click(mongo);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.hover(mongo);
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Coming soon'));
  });

  it('calls onClose from the close button', async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
