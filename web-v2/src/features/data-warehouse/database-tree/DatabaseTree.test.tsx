import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '@/app/AppProviders';
import { createContainer } from '@/core/di/Container';
import { DatabaseService } from '@/core/schema/DatabaseService';
import { SchemaService, type DatabaseSchema } from '@/core/schema/SchemaService';
import { fakeSchemaService } from '@/features/dashboard/testing';
import { fakeDatabaseService } from '../testing';
import { DatabaseTree } from './DatabaseTree';
import type { TreeHandlers, TreeSelection } from './databaseTree.utils';

const shop: DatabaseSchema = {
  name: 'shop',
  tables: [
    { dbName: 'shop', name: 'orders', displayName: 'Orders', columns: [{ name: 'id', displayName: 'Id', type: 'int64' }] },
    {
      dbName: 'shop',
      name: 'products',
      columns: [{ name: 'price', displayName: 'Price', type: 'double' }],
      expressionColumns: [{ name: 'revenue', displayName: 'Revenue', type: 'double', expression: 'sum(price)' }]
    }
  ]
};

function setup(props: { selection?: TreeSelection; handlers?: TreeHandlers } = {}) {
  const schema = fakeSchemaService({
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [
      { name: 'hr', displayName: 'hr' },
      { name: 'shop', displayName: 'shop' }
    ]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async () => shop)
  });
  const databases = fakeDatabaseService();
  const container = createContainer([
    di => {
      di.bindValue(SchemaService, schema);
      di.bindValue(DatabaseService, databases);
    }
  ]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AppProviders queryClient={queryClient} container={container}>
      <DatabaseTree {...props} />
    </AppProviders>
  );
  return { schema, databases, user: userEvent.setup() };
}

describe('DatabaseTree', () => {
  it('lists the databases and loads one when it opens', async () => {
    const onSelectDatabase = vi.fn<NonNullable<TreeHandlers['onSelectDatabase']>>();
    const { schema, user } = setup({ handlers: { onSelectDatabase } });

    expect(await screen.findByText('Database (2)')).toBeInTheDocument();
    expect(schema.getDatabase).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'shop' }));

    expect(onSelectDatabase).toHaveBeenCalledWith('shop');
    const tables = await screen.findByRole('list', { name: 'Tables of shop' });
    const names = within(tables).getAllByRole('button', { name: /^(Orders|products)$/ });
    expect(names.map(item => item.textContent)).toEqual(['Orders', 'products']);
    expect(schema.getDatabase).toHaveBeenCalledWith('shop', expect.anything());
  });

  it('opens the selected database and highlights the selected table', async () => {
    setup({ selection: { dbName: 'shop', tableName: 'orders' } });

    expect(await screen.findByRole('button', { name: 'Orders' })).toHaveAttribute('aria-current', 'true');
  });

  it("opens a table on its columns and hands a column's click to the page", async () => {
    const onSelectColumn = vi.fn<NonNullable<TreeHandlers['onSelectColumn']>>();
    const { user } = setup({ selection: { dbName: 'shop' }, handlers: { onSelectColumn } });

    await user.click(await screen.findByRole('button', { name: 'Open products' }));
    const columns = screen.getByRole('list', { name: 'Columns of products' });
    expect(within(columns).getByText('Measure')).toBeInTheDocument();

    await user.click(within(columns).getByRole('button', { name: /Revenue/ }));
    expect(onSelectColumn).toHaveBeenCalledWith(expect.objectContaining({ name: 'products' }), expect.objectContaining({ name: 'revenue', role: 'measure' }));
  });

  it('opens a table from its name when the page does not select tables', async () => {
    const { user } = setup({ selection: { dbName: 'shop' } });

    await user.click(await screen.findByRole('button', { name: 'Orders' }));

    expect(screen.getByRole('list', { name: 'Columns of Orders' })).toBeInTheDocument();
  });

  it('gives tables the menu the page asks for', async () => {
    const onTableAction = vi.fn<NonNullable<TreeHandlers['onTableAction']>>();
    const { user } = setup({
      selection: { dbName: 'shop' },
      handlers: { tableActionsOf: () => [{ key: 'delete', label: 'Delete table', danger: true }], onTableAction }
    });

    await user.click(await screen.findByRole('button', { name: 'Actions of Orders' }));
    await user.click(await screen.findByText('Delete table'));

    expect(onTableAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'orders' }), 'delete');
  });

  it('searches the tables of loaded databases and opens their database', async () => {
    const { user } = setup({ selection: { dbName: 'shop' } });
    await screen.findByRole('button', { name: 'Orders' });
    await user.click(screen.getByRole('button', { name: 'shop' }));
    expect(screen.queryByRole('button', { name: 'Orders' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Search databases' }));
    await user.type(screen.getByRole('textbox', { name: 'Search databases and tables' }), 'ord');

    expect(await screen.findByRole('button', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'products' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'hr' })).not.toBeInTheDocument();
  });

  it('creates a database under its normalized name and selects it', async () => {
    const onSelectDatabase = vi.fn<NonNullable<TreeHandlers['onSelectDatabase']>>();
    const { databases, user } = setup({ handlers: { onSelectDatabase } });

    await user.click(await screen.findByRole('button', { name: 'Create database' }));
    await user.type(screen.getByRole('textbox', { name: 'Database name' }), 'Đơn hàng');
    expect(screen.getByText('don_hang')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSelectDatabase).toHaveBeenCalledWith('don_hang'));
    expect(databases.create).toHaveBeenCalledWith('don_hang', 'Đơn hàng');
  });

  it('refuses a database name that exists', async () => {
    const { databases, user } = setup();

    await user.click(await screen.findByRole('button', { name: 'Create database' }));
    await user.type(screen.getByRole('textbox', { name: 'Database name' }), 'Shop');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Database shop already exists')).toBeInTheDocument();
    expect(databases.create).not.toHaveBeenCalled();
  });
});
