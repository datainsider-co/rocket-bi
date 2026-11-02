import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import { databaseSchemaFromJson, SchemaService } from '@/core/schema/SchemaService';
import { TableService } from '@/core/schema/TableService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeSchemaEditService } from '@/features/chart-builder/field-actions/testing';
import { fakeQueryService, fakeSchemaService } from '@/features/dashboard/testing';
import type { CodeEditorProps } from '@/shared/code-editor/CodeEditor';
import { fakeTableService } from '../testing';

// Monaco doesn't run in jsdom: a textarea stands in for the editor.
vi.mock('@/shared/code-editor/LazyCodeEditor', () => ({
  LazyCodeEditor: ({ value, onChange, ariaLabel }: CodeEditorProps) => <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
}));

const probe = databaseSchemaFromJson(fixture.databaseGetWithTables.response);
const bigQty = probe.tables.find(table => table.name === 'big_qty')!;
const RESULT = { class_name: 'json_table_response', headers: [{ key: '0', label: 'id', is_group_by: false, is_text_left: false }], records: [{ '0': '7' }], total: 1 };

function setup(path: string) {
  const tables = fakeTableService();
  const edits = fakeSchemaEditService({ updateTableQuery: vi.fn<SchemaEditService['updateTableQuery']>(async () => bigQty) });
  const router = renderAppAt(path, fakeAuthenticationService(), [
    di => {
      di.bindValue(SchemaService, fakeSchemaService({ listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'dw0_probe', displayName: 'dw0_probe' }]), getDatabase: vi.fn<SchemaService['getDatabase']>(async () => probe) }));
      di.bindValue(QueryService, fakeQueryService({ query: vi.fn<QueryService['query']>(async () => visualizationResponseFromJson(RESULT)) }));
      di.bindValue(TableService, tables);
      di.bindValue(SchemaEditService, edits);
    }
  ]);
  return { router, tables, edits, user: userEvent.setup() };
}

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('Query Editor tables', { timeout: 15_000 }, () => {
  it('creates a view of the query, with the parameter values in, refusing a name the database has', async () => {
    const { tables, user } = setup('/data-warehouse/query-editor?database=dw0_probe&table=products');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    await user.clear(editor);
    await user.type(editor, "select * from dw0_probe.products where name = '{{{{n}}';");
    await user.click(screen.getByRole('button', { name: /Actions/ }));
    await user.click(await screen.findByText('Create Table'));

    const name = await screen.findByRole('textbox', { name: 'Table Name' });
    await user.type(name, 'Products');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Table products already exists')).toBeInTheDocument();

    await user.clear(name);
    await user.type(name, 'Cheap Products');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(tables.createTableFromQuery).toHaveBeenCalled());
    expect(vi.mocked(tables.createTableFromQuery).mock.calls[0]![0]).toEqual({
      dbName: 'dw0_probe',
      name: 'cheap_products',
      displayName: 'Cheap Products',
      query: "select * from dw0_probe.products where name = ''''",
      tableType: 'view'
    });
  });

  it("updates the view of `?mode=update` with its edited query, then opens it on the Schema page", async () => {
    const { edits, router, user } = setup('/data-warehouse/query-editor?mode=update&database=dw0_probe&table=big_qty&tableDisplayName=big_qty&tableType=view');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    expect(editor).toHaveValue(bigQty.query);
    expect(screen.queryByRole('button', { name: /Add Chart/ })).not.toBeInTheDocument();
    await user.type(editor, ' and id > 0');

    await user.click(screen.getByRole('button', { name: 'Update Table' }));
    await user.click(await screen.findByRole('button', { name: 'Update' }));

    await waitFor(() => expect(edits.updateTableQuery).toHaveBeenCalled());
    expect(vi.mocked(edits.updateTableQuery).mock.calls[0]![1]).toBe(`${bigQty.query} and id > 0`);
    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/schema'));
    expect(router.state.location.search).toBe('?database=dw0_probe&table=big_qty');
  });
});
