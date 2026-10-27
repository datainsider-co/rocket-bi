import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { DiProvider } from '@/app/di/DiContext';
import { createContainer } from '@/core/di/Container';
import { RelationshipService } from '@/core/relationship/RelationshipService';
import { SchemaService } from '@/core/schema/SchemaService';
import { fixtureRelationshipService, fixtureSchemaService } from './relationship.fixtures';
import { RelationshipModal } from './RelationshipModal';

function renderModal(editable: boolean, relationships = fixtureRelationshipService()) {
  const container = createContainer([
    di => {
      di.bindValue(RelationshipService, relationships);
      di.bindValue(SchemaService, fixtureSchemaService());
    }
  ]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn<() => void>();
  render(
    <DiProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <AntApp>
          <RelationshipModal dashboardId={1} editable={editable} open onClose={onClose} />
        </AntApp>
      </QueryClientProvider>
    </DiProvider>
  );
  return { onClose };
}

describe('RelationshipModal', () => {
  it('draws every view with its key and joined columns', async () => {
    renderModal(true);

    expect(await screen.findByText('orders')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('regions')).toBeInTheDocument();
    expect(screen.getByText('sample_v2')).toBeInTheDocument();
    expect(screen.getAllByText('adhoc_analysis')).toHaveLength(2);
    // Collapsed: `order_date` is neither key-like nor joined.
    expect(screen.queryByText('order_date')).not.toBeInTheDocument();
  });

  it('expands a table from its menu', async () => {
    renderModal(true);

    // jsdom does not lay out, so React Flow keeps the nodes hidden as unmeasured: find the button by its label.
    await userEvent.click(await screen.findByLabelText('Actions of orders'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Expand' }));

    expect(await screen.findByText('order_date')).toBeInTheDocument();
  });

  it('offers Save and Discard Changes in edit mode, disabled until something changes', async () => {
    renderModal(true);
    await screen.findByText('orders');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard Changes' })).toBeDisabled();
  });

  it('has no Save in view mode', async () => {
    renderModal(false);
    await screen.findByText('orders');

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit content' })).toBeInTheDocument();
  });

  it('shows why the relationships could not load', async () => {
    const relationships = fixtureRelationshipService();
    relationships.getDashboardRelationship = vi.fn<RelationshipService['getDashboardRelationship']>(async () => {
      throw new Error('No permission');
    });
    renderModal(true, relationships);

    expect(await screen.findByText('No permission')).toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    const { onClose } = renderModal(false);
    await screen.findByText('orders');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
