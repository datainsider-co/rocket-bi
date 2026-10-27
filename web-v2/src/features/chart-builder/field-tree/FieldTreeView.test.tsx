import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { FieldDndProvider } from '@/shared/field-dnd/FieldDndProvider';
import { tableNodesOf, type TreeTables } from './fieldTree.utils';
import { FieldTreeView, type FieldTreeViewProps } from './FieldTreeView';

const nodes = tableNodesOf([
  { dbName: 'sample_v2', name: 'sales', columns: [{ name: 'region', displayName: 'region', type: 'string' }] },
  { dbName: 'sample_v2', name: 'orders', columns: [{ name: 'id', displayName: 'id', type: 'int64' }] }
]);

const tables = (overrides: Partial<TreeTables> = {}): TreeTables => ({ nodes, expanded: new Set(['sales']), onToggle: vi.fn<(key: string) => void>(), status: 'ready', error: 'Loading failed', ...overrides });

const controls: ChartControl[] = [{ id: 7, title: 'Region tab', chartType: 'tab_filter', infoType: 'Normal', data: {} }];

function renderTree(props: Partial<FieldTreeViewProps> = {}) {
  const search = { keyword: '', onChange: vi.fn<(keyword: string) => void>() };
  const databases = { options: [{ name: 'sample_v2', displayName: 'sample_v2' }], value: 'sample_v2', onChange: vi.fn<(dbName: string) => void>() };
  render(
    <FieldDndProvider zones={{}} onDrop={() => {}} renderOverlay={() => null}>
      <FieldTreeView databases={databases} search={search} tables={tables()} {...props} />
    </FieldDndProvider>
  );
  return { search, databases };
}

describe('FieldTreeView', () => {
  it('lists the tables and the columns of the open ones', () => {
    renderTree();
    expect(screen.getByRole('button', { name: 'sales' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'orders' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('region')).toBeInTheDocument();
    expect(screen.queryByText('id')).not.toBeInTheDocument();
  });

  it('opens and closes a table', async () => {
    const onToggle = vi.fn<(key: string) => void>();
    renderTree({ tables: tables({ onToggle }) });
    await userEvent.click(screen.getByRole('button', { name: 'orders' }));
    expect(onToggle).toHaveBeenCalledWith('orders');
  });

  it('swaps the database dropdown for a search box', async () => {
    const { search } = renderTree();
    expect(screen.queryByPlaceholderText('Search tables & columns...')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Search tables and columns' }));
    const input = screen.getByPlaceholderText('Search tables & columns...');
    expect(input).toHaveFocus();
    await userEvent.type(input, 'r');
    expect(search.onChange).toHaveBeenCalledWith('r');
  });

  it('only searches on an ad hoc table, without a dropdown', () => {
    renderTree({ databases: undefined });
    expect(screen.getByPlaceholderText('Search tables & columns...')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows the chart controls in their own tab', async () => {
    renderTree({ controls });
    await userEvent.click(screen.getByText('Chart Control'));
    expect(screen.getByText('Region tab')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search chart controls...')).toBeInTheDocument();
    expect(screen.queryByText('sales')).not.toBeInTheDocument();
  });

  it('says when the schema fails to load or is empty', () => {
    renderTree({ tables: tables({ status: 'error' }) });
    expect(screen.getByText('Loading failed')).toBeInTheDocument();
  });

  it('says when there is nothing to list', () => {
    renderTree({ tables: tables({ nodes: [] }) });
    expect(screen.getByText('No fields available')).toBeInTheDocument();
  });
});
