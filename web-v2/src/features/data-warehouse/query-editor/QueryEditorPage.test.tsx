import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JsonObject } from '@/core/json/json';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { databaseSchemaFromJson, SchemaService } from '@/core/schema/SchemaService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeQueryService, fakeSchemaService } from '@/features/dashboard/testing';
import type { CodeEditorProps } from '@/shared/code-editor/CodeEditor';

// Monaco doesn't run in jsdom: a textarea stands in for the editor, adding inserted text at its end.
vi.mock('@/shared/code-editor/LazyCodeEditor', async () => {
  const { useImperativeHandle } = await import('react');
  return {
    LazyCodeEditor: ({ value, onChange, ariaLabel, handleRef }: CodeEditorProps) => {
      useImperativeHandle(handleRef, () => ({ insertText: text => onChange(value + text), selectedText: () => '' }), [value, onChange]);
      return <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />;
    }
  };
});

const probe = databaseSchemaFromJson(fixture.databaseGetWithTables.response);
const RESULT = {
  class_name: 'json_table_response',
  headers: [
    { key: '0', label: 'id', is_group_by: false, is_text_left: false },
    { key: '1', label: 'name', is_group_by: false, is_text_left: true }
  ],
  records: [
    { '0': '1', '1': 'Bánh mì' },
    { '0': '2', '1': 'Phở' }
  ],
  total: 5
};

function setup(path: string, query = vi.fn<QueryService['query']>(async () => visualizationResponseFromJson(RESULT))) {
  const queries = fakeQueryService({ query });
  const schema = fakeSchemaService({
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'dw0_probe', displayName: 'dw0_probe' }]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async () => probe)
  });
  renderAppAt(path, fakeAuthenticationService(), [
    di => {
      di.bindValue(QueryService, queries);
      di.bindValue(SchemaService, schema);
    }
  ]);
  return { queries, user: userEvent.setup() };
}

const sent = (queries: QueryService, call = 0) => vi.mocked(queries.query).mock.calls[call]![0];
const sqlOf = (request: JsonObject) => (request['query_setting'] as JsonObject)['sql'];

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('Query Editor page', { timeout: 15_000 }, () => {
  it('starts on the table of the URL and runs it on Execute', async () => {
    const { queries, user } = setup('/data-warehouse/query-editor?database=dw0_probe&table=products');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    expect(editor).toHaveValue('select * from dw0_probe.products');
    expect(screen.getByText(/Write your SQL query above/)).toBeInTheDocument();
    expect(queries.query).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Execute/ }));

    expect(await screen.findByText('Phở')).toBeInTheDocument();
    expect(screen.getByText('Total: 5')).toBeInTheDocument();
    expect(sent(queries)).toMatchObject({ from: 0, size: 20, query_setting: { class_name: 'raw_query_setting', sql: 'select * from dw0_probe.products' } });
  });

  it('runs SQL with a limit whole and counts the rows it got', async () => {
    const { queries, user } = setup('/data-warehouse/query-editor');
    await user.type(await screen.findByRole('textbox', { name: 'SQL query' }), 'select id from t limit 2;');
    await user.click(screen.getByRole('button', { name: /Execute/ }));

    expect(await screen.findByText('2 rows')).toBeInTheDocument();
    expect(sent(queries)).toMatchObject({ from: -1, size: -1 });
    expect(sqlOf(sent(queries))).toBe('select id from t limit 2');
  });

  it('shows the server’s message when the query fails', async () => {
    const { user } = setup('/data-warehouse/query-editor', vi.fn<QueryService['query']>(async () => Promise.reject(new Error("Table 'dw0_probe.nope' doesn't exist"))));
    await user.type(await screen.findByRole('textbox', { name: 'SQL query' }), 'select * from nope');
    await user.click(screen.getByRole('button', { name: /Execute/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Table 'dw0_probe.nope' doesn't exist");
  });

  it('finds parameters in the SQL and runs again when a value changes', async () => {
    const { queries, user } = setup('/data-warehouse/query-editor');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    await user.type(editor, "select * from t where name = {{{{name}}");
    const chip = await screen.findByTestId('parameter-name');

    await user.type(within(chip).getByRole('textbox', { name: 'Value of name' }), "O'Brien{Enter}");

    await waitFor(() => expect(queries.query).toHaveBeenCalledTimes(1));
    expect(sent(queries)).toMatchObject({ parameters: { name: "'O''Brien'" }, query_setting: { sql: 'select * from t where name = {{name}}' } });
  });

  it('adds a parameter at the cursor and deletes it from the SQL', async () => {
    const { user } = setup('/data-warehouse/query-editor');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    await user.type(editor, 'select 1');
    await user.click(screen.getByRole('button', { name: /Add Param/ }));

    expect(editor).toHaveValue('select 1 {{ untitled_param_0 }}');
    await user.click(within(await screen.findByTestId('parameter-untitled_param_0')).getByRole('button', { name: 'Configure untitled_param_0' }));
    await user.click(await screen.findByText('Delete'));
    await user.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(editor).toHaveValue('select 1 '));
    expect(screen.queryByTestId('parameter-untitled_param_0')).not.toBeInTheDocument();
  });

  it('renames a parameter in the SQL from its modal', async () => {
    const { user } = setup('/data-warehouse/query-editor');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    await user.type(editor, 'select {{{{a}} + {{{{ a }}');
    await user.click(within(await screen.findByTestId('parameter-a')).getByRole('button', { name: 'Configure a' }));
    await user.click(await screen.findByText('Edit'));
    const name = await screen.findByRole('textbox', { name: 'Parameter' });
    await user.clear(name);
    await user.type(name, 'min qty');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Use only letters, digits and _')).toBeInTheDocument();

    await user.clear(name);
    await user.type(name, 'min_qty');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(editor).toHaveValue('select {{ min_qty }} + {{ min_qty }}'));
    expect(screen.getByTestId('parameter-min_qty')).toBeInTheDocument();
  });

  it('puts a table clicked in the tree into the SQL', async () => {
    const { user } = setup('/data-warehouse/query-editor?database=dw0_probe');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    await user.type(editor, 'select * from ');
    await user.click(await screen.findByText('products'));

    expect(editor).toHaveValue('select * from dw0_probe.products');
  });

  it('downloads every row of the last run', async () => {
    const { queries, user } = setup('/data-warehouse/query-editor?database=dw0_probe&table=products');
    URL.createObjectURL = vi.fn<typeof URL.createObjectURL>(() => 'blob:result');
    URL.revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();
    await user.click(await screen.findByRole('button', { name: /Execute/ }));
    await screen.findByText('Phở');

    await user.click(screen.getByRole('button', { name: /Actions/ }));
    await user.click(await screen.findByText('Download CSV'));

    await waitFor(() => expect(queries.export).toHaveBeenCalled());
    expect(vi.mocked(queries.export).mock.calls[0]).toEqual([expect.objectContaining({ from: -1, size: -1 }), 'csv']);
  });
});
