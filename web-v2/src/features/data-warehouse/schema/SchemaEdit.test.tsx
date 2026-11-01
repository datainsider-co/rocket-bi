import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import { databaseSchemaFromJson, SchemaService } from '@/core/schema/SchemaService';
import { tableDefinitionFromJson } from '@/core/schema/TableDefinition';
import { TableService } from '@/core/schema/TableService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeSchemaEditService } from '@/features/chart-builder/field-actions/testing';
import { fakeSchemaService } from '@/features/dashboard/testing';
import { fakeTableService } from '../testing';

// Monaco doesn't run in jsdom: a textarea stands in for the formula editor.
vi.mock('@/features/chart-builder/field-actions/editor/LazyCodeEditor', () => ({
  LazyCodeEditor: ({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) => (
    <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
  )
}));

const probe = databaseSchemaFromJson(fixture.databaseGetWithTables.response);
const products = tableDefinitionFromJson(fixture.tableUpdate.response);
const measured = tableDefinitionFromJson({
  ...fixture.tableUpdate.response,
  expression_columns: [
    { class_name: 'int64', name: 'total_qty', display_name: 'Total Qty', is_nullable: true, default_expression: { default_type: 'MATERIALIZED', expr: 'sum(qty)' } }
  ]
});

function setup(path: string, tables = fakeTableService()) {
  const schema = fakeSchemaService({
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'dw0_probe', displayName: 'dw0_probe' }]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async () => probe)
  });
  const edits = fakeSchemaEditService();
  const router = renderAppAt(path, fakeAuthenticationService(), [
    di => {
      di.bindValue(SchemaService, schema);
      di.bindValue(TableService, tables);
      di.bindValue(SchemaEditService, edits);
    }
  ]);
  return { router, tables, edits, user: userEvent.setup() };
}

const option = (label: string) => screen.findByText(label, { selector: '.ant-select-item-option-content' });

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

// Typing into a whole table of inputs is slow in jsdom.
describe('Schema page edits', { timeout: 20_000 }, () => {
  it('saves edited columns after confirming a type change', async () => {
    const { tables, user } = setup('/data-warehouse/schema?database=dw0_probe&table=products');
    const table = await screen.findByRole('region', { name: 'Table products' });
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByRole('button', { name: /Edit/ }));
    const description = within(table).getByRole('textbox', { name: 'Description of row 3' });
    await user.type(description, 'unit price');
    await user.click(within(table).getByRole('combobox', { name: 'Type of row 1' }));
    await user.click(await option('Double'));
    await user.click(within(table).getByRole('button', { name: /Add column/ }));
    await user.type(within(table).getByRole('textbox', { name: 'Name of row 7' }), 'note');
    await user.click(within(table).getByRole('button', { name: /Save/ }));

    expect(await screen.findByText(/Your data could be lost/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(tables.updateTable).toHaveBeenCalled());
    const saved = vi.mocked(tables.updateTable).mock.calls[0]![0];
    expect(saved.columns.map(column => [column.name, column.type])).toEqual([
      ['id', 'double'],
      ['name', 'string'],
      ['price', 'string'],
      ['created_at', 'datetime'],
      ['active', 'bool'],
      ['qty', 'int32'],
      ['note', 'string']
    ]);
    expect(saved.columns[2]).toMatchObject({ description: 'unit price', json: products.columns[2]!.json });
    expect(await within(table).findByRole('button', { name: /Edit/ })).toBeInTheDocument();
  });

  it('keeps the form when the save fails', async () => {
    const tables = fakeTableService({ updateTable: vi.fn<TableService['updateTable']>(async () => Promise.reject(new Error('Unknown column type'))) });
    const { user } = setup('/data-warehouse/schema?database=dw0_probe&table=products', tables);
    const table = await screen.findByRole('region', { name: 'Table products' });
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByRole('button', { name: /Edit/ }));
    await user.type(within(table).getByRole('textbox', { name: 'Display name of row 1' }), ' key');
    await user.click(within(table).getByRole('button', { name: /Save/ }));

    expect(await within(table).findByText('Unknown column type')).toBeInTheDocument();
    expect(within(table).getByRole('textbox', { name: 'Display name of row 1' })).toHaveValue('Id key');
  });

  it('asks before leaving an edit with changes', async () => {
    const { router, user } = setup('/data-warehouse/schema?database=dw0_probe&table=products');
    const table = await screen.findByRole('region', { name: 'Table products' });
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByRole('button', { name: /Edit/ }));
    await user.type(within(table).getByRole('textbox', { name: 'Display name of row 1' }), '!');
    await user.click(within(table).getByRole('button', { name: 'dw0_probe' }));

    const leave = await screen.findByRole('button', { name: 'Leave' });
    expect(screen.getAllByText('It looks like you have been editing something').length).toBeGreaterThan(0);
    expect(router.state.location.search).toBe('?database=dw0_probe&table=products');
    await user.click(leave);
    await waitFor(() => expect(router.state.location.search).toBe('?database=dw0_probe'));
  });

  it('creates a table named in New table, then opens it', async () => {
    const { router, tables, user } = setup('/data-warehouse/schema?database=dw0_probe');
    const database = await screen.findByRole('region', { name: 'Database dw0_probe' });
    await within(database).findByText('products');

    await user.click(within(database).getByRole('button', { name: /New table/ }));
    await user.type(await screen.findByPlaceholderText('Input table name'), 'products');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Table products already exists')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Input table name'));
    await user.type(screen.getByPlaceholderText('Input table name'), 'Đơn hàng');
    expect(screen.getByText('don_hang')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const panel = await screen.findByRole('region', { name: 'New table Đơn hàng' });
    await user.click(within(panel).getByRole('button', { name: /Create/ }));
    expect(await within(panel).findByText('Column name is required')).toBeInTheDocument();
    await user.type(within(panel).getByRole('textbox', { name: 'Name of row 1' }), 'code');
    await user.click(within(panel).getByRole('button', { name: /Create/ }));

    await waitFor(() => expect(tables.createTable).toHaveBeenCalled());
    expect(vi.mocked(tables.createTable).mock.calls[0]![0]).toMatchObject({
      dbName: 'dw0_probe',
      name: 'don_hang',
      displayName: 'Đơn hàng',
      columns: [expect.objectContaining({ name: 'code', displayName: 'code', type: 'string', isNullable: true })]
    });
    await waitFor(() => expect(router.state.location.search).toBe('?database=dw0_probe&table=don_hang'));
  });

  it('lists the measures and edits one in the formula dialog', async () => {
    const tables = fakeTableService({ getTable: vi.fn<TableService['getTable']>(async () => measured) });
    const { edits, user } = setup('/data-warehouse/schema?database=dw0_probe&table=products', tables);
    const table = await screen.findByRole('region', { name: 'Table products' });
    await within(table).findByText('Column (6)');

    await user.click(within(table).getByText('Measure Schema'));
    expect(within(table).getByText('sum(qty)')).toBeInTheDocument();
    await user.click(within(table).getByRole('button', { name: 'Edit Total Qty' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit Measure' });
    expect(await within(dialog).findByLabelText('Formula')).toHaveValue('sum(qty)');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(edits.updateColumn).toHaveBeenCalledWith(expect.objectContaining({ name: 'products' }), 'measure', expect.objectContaining({ name: 'total_qty' })));
  });

  it("adds a calculated field from a table's menu in the tree", async () => {
    const { user } = setup('/data-warehouse/schema?database=dw0_probe');
    await user.click(await screen.findByRole('button', { name: 'Actions of products' }));
    await user.click(await screen.findByText('Add Calculated Field'));

    expect(await screen.findByRole('dialog', { name: 'Create Calculated Field' })).toBeInTheDocument();
  });
});
