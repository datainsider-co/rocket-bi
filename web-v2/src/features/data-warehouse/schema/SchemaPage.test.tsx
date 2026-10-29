import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import { databaseSchemaFromJson, SchemaService } from '@/core/schema/SchemaService';
import { tableDefinitionFromJson } from '@/core/schema/TableDefinition';
import { TableService } from '@/core/schema/TableService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeSchemaEditService } from '@/features/chart-builder/field-actions/testing';
import { fakeQueryService, fakeSchemaService } from '@/features/dashboard/testing';
import { fakeTableService } from '../testing';

const probe = databaseSchemaFromJson(fixture.databaseGetWithTables.response);

function setup(path: string) {
  const schema = fakeSchemaService({
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [
      { name: 'dw0_probe', displayName: 'dw0_probe' },
      { name: 'sample_v2', displayName: 'sample_v2' }
    ]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async () => probe)
  });
  const tables = fakeTableService();
  const queries = fakeQueryService({
    query: vi.fn<QueryService['query']>(async () => visualizationResponseFromJson(fixture.tablePreview.response))
  });
  const edits = fakeSchemaEditService();
  const router = renderAppAt(path, fakeAuthenticationService(), [
    di => {
      di.bindValue(SchemaService, schema);
      di.bindValue(TableService, tables);
      di.bindValue(QueryService, queries);
      di.bindValue(SchemaEditService, edits);
    }
  ]);
  return { router, tables, queries, edits, user: userEvent.setup() };
}

const panel = (name: string) => screen.findByRole('region', { name });

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('SchemaPage', () => {
  it('opens the first database without one in the URL and lists its tables', async () => {
    setup('/data-warehouse/schema');

    const database = await panel('Database dw0_probe');
    expect(await within(database).findByText('big_qty')).toBeInTheDocument();
    // Type and Columns show from `sm`, which jsdom's `matchMedia` never matches.
    expect(within(database).getByText('products')).toBeInTheDocument();
  });

  it('opens a table from the database view, keeping it in the URL', async () => {
    const { router, tables, user } = setup('/data-warehouse/schema?database=dw0_probe');

    await user.click(await within(await panel('Database dw0_probe')).findByText('products'));

    await waitFor(() => expect(router.state.location.search).toBe('?database=dw0_probe&table=products'));
    const table = await panel('Table products');
    expect(await within(table).findByText('Column (6)')).toBeInTheDocument();
    expect(within(table).getByText('Name edited')).toBeInTheDocument();
    expect(tables.getTable).toHaveBeenCalledWith({ dbName: 'dw0_probe', name: 'products' }, expect.anything());
  });

  it('searches the columns', async () => {
    const { user } = setup('/data-warehouse/schema?database=dw0_probe&table=products');
    const table = await panel('Table products');
    await within(table).findByText('Column (6)');

    await user.type(within(table).getByRole('textbox', { name: 'Search columns' }), 'qty');

    expect(within(table).queryByText('Name edited')).not.toBeInTheDocument();
    expect(within(table).getByText('Qty')).toBeInTheDocument();
  });

  it('pages the rows of Table Data and sorts them on the server', async () => {
    const { queries, user } = setup('/data-warehouse/schema?database=dw0_probe&table=products');
    const table = await panel('Table products');
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByText('Table Data'));

    expect(await within(table).findByText('Bánh mì')).toBeInTheDocument();
    expect(queries.query).toHaveBeenLastCalledWith(expect.objectContaining({ from: 0, size: 20 }), expect.anything());
    await user.click(within(table).getByRole('columnheader', { name: /Qty/ }));
    await waitFor(() =>
      expect(queries.query).toHaveBeenLastCalledWith(
        expect.objectContaining({ query_setting: expect.objectContaining({ sorts: [expect.objectContaining({ order: 'ASC' })] }) }),
        expect.anything()
      )
    );
  });

  it('opens the Query Editor on the table', async () => {
    const { router, user } = setup('/data-warehouse/schema?database=dw0_probe&table=products');
    const table = await panel('Table products');
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByRole('button', { name: /Action/ }));
    await user.click(await screen.findByText('Query table'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/query-editor'));
    expect(router.state.location.search).toBe('?database=dw0_probe&table=products');
  });

  it('deletes the table after the confirm and goes back to its database', async () => {
    const { router, edits, user } = setup('/data-warehouse/schema?database=dw0_probe&table=products');
    const table = await panel('Table products');
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByRole('button', { name: /Action/ }));
    await user.click(await screen.findByText('Delete table'));
    expect(await screen.findByText("Are you sure to permanently delete table 'products'?")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(edits.dropTable).toHaveBeenCalledWith(expect.objectContaining({ dbName: 'dw0_probe', name: 'products' })));
    await waitFor(() => expect(router.state.location.search).toBe('?database=dw0_probe'));
  });

  it('offers Update schema by query on a view only', async () => {
    const { tables, user } = setup('/data-warehouse/schema?database=dw0_probe&table=big_qty');
    vi.mocked(tables.getTable).mockResolvedValue(tableDefinitionFromJson(fixture.fromQueryView.response));
    const table = await panel('Table big_qty');
    await within(table).findByText('Column (3)');

    await user.click(within(table).getByRole('button', { name: /Action/ }));

    expect(await screen.findByText('Update schema by query')).toBeInTheDocument();
  });
});
