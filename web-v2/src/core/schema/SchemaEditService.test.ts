import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { expressionColumnToJson, HttpSchemaEditService, type ExpressionColumn } from './SchemaEditService';

type Reply = { status?: number; body?: unknown; text?: string };

/** Answers each request with the next reply; the last one repeats. */
function setup(...replies: Reply[]) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    const reply = replies[Math.min(requests.length - 1, replies.length - 1)] ?? {};
    if (reply.text !== undefined) return new Response(reply.text, { status: reply.status ?? 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return Response.json(reply.body ?? true, { status: reply.status ?? 200 });
  });
  const service = new HttpSchemaEditService(new HttpClientBuilder('http://api').withFetch(fetch).build());
  const body = (index = 0) => JSON.parse(requests[index]?.body || 'null') as unknown;
  return { service, requests, body };
}

const table = { dbName: 'sample_v2', name: 'cb8_tmp_view' };
const column: ExpressionColumn = { name: 'double_units', displayName: 'Double Units', type: 'int64', expression: 'Units_Sold * 2', description: 'Calculated field' };
// Trimmed reply of the local backend to `calc_column`.
const tableReply = {
  name: 'cb8_tmp_view',
  db_name: 'sample_v2',
  display_name: 'CB8 Tmp View',
  columns: [{ class_name: 'int32', name: 'Units_Sold', display_name: 'Units_Sold', is_nullable: true }],
  query: 'select Units_Sold from sample_v2.sales',
  table_type: 'view',
  expression_columns: [],
  calculated_columns: [
    {
      class_name: 'int64',
      name: 'double_units',
      display_name: 'Double Units',
      description: 'Calculated field',
      is_nullable: true,
      default_expression: { default_type: 'MATERIALIZED', expr: 'Units_Sold * 2' }
    }
  ]
};

describe('expressionColumnToJson', () => {
  it('writes a nullable column with a materialized expression, as the server stores it', () => {
    expect(expressionColumnToJson(column)).toEqual(tableReply.calculated_columns[0]);
  });

  it('leaves out a missing description', () => {
    expect(expressionColumnToJson({ ...column, description: undefined })).not.toHaveProperty('description');
  });
});

describe('HttpSchemaEditService', () => {
  it.each([
    ['calculated', 'expression'],
    ['measure', 'aggregate_expression']
  ] as const)('detects the type of a %s expression from its plain text reply', async (kind, path) => {
    const { service, requests, body } = setup({ text: 'int64' });

    await expect(service.detectExpressionType(table, kind, 'Units_Sold * 2')).resolves.toBe('int64');
    expect(requests[0]).toMatchObject({ method: 'POST', url: `http://api/databases/sample_v2/tables/cb8_tmp_view/${path}` });
    expect(body()).toEqual({ expression: 'Units_Sold * 2' });
  });

  it('fails with the database message when the expression is wrong', async () => {
    const { service } = setup({ status: 500, body: { code: 500, reason: 'db_execute_error', message: "Unknown column 'nope' in 'field list'" } });

    await expect(service.detectExpressionType(table, 'calculated', 'nope')).rejects.toThrow("Unknown column 'nope' in 'field list'");
  });

  it.each([
    ['calculated', 'calc_column'],
    ['measure', 'expr_column']
  ] as const)('creates and updates a %s column under %s', async (kind, path) => {
    const { service, requests, body } = setup({ body: tableReply });

    const created = await service.createColumn(table, kind, column);
    await service.updateColumn(table, kind, column);

    expect(requests.map(request => `${request.method} ${request.url}`)).toEqual([
      `POST http://api/databases/sample_v2/tables/cb8_tmp_view/${path}`,
      `PUT http://api/databases/sample_v2/tables/cb8_tmp_view/${path}`
    ]);
    expect(body(0)).toEqual({ column: expressionColumnToJson(column) });
    expect(body(1)).toEqual({ column: expressionColumnToJson(column) });
    expect(created.calculatedColumns).toEqual([{ name: 'double_units', displayName: 'Double Units', type: 'int64', expression: 'Units_Sold * 2', description: 'Calculated field' }]);
  });

  it.each([
    ['calculated', 'calc_column'],
    ['measure', 'expr_column']
  ] as const)('deletes a %s column by name', async (kind, path) => {
    const { service, requests } = setup({ body: true });

    await service.deleteColumn(table, kind, 'double_units');

    expect(requests[0]).toMatchObject({ method: 'DELETE', url: `http://api/databases/sample_v2/tables/cb8_tmp_view/${path}/double_units` });
  });

  it('overrides a view with its new query, keeping its display name and type', async () => {
    const { service, requests, body } = setup({ body: { ...tableReply, calculated_columns: [] } });

    const updated = await service.updateTableQuery({ ...table, displayName: 'CB8 Tmp View', tableType: 'view' }, 'select Region from sample_v2.sales');

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api/databases/sample_v2/tables/from_query' });
    expect(body()).toEqual({ tbl_name: 'cb8_tmp_view', display_name: 'CB8 Tmp View', query: 'select Region from sample_v2.sales', table_type: 'view', is_override: true });
    expect(updated.name).toBe('cb8_tmp_view');
  });

  it('falls back to the table name for a missing display name', async () => {
    const { service, body } = setup({ body: tableReply });

    await service.updateTableQuery(table, 'select 1');

    expect(body()).toEqual({ tbl_name: 'cb8_tmp_view', display_name: 'cb8_tmp_view', query: 'select 1', is_override: true });
  });

  it('drops a table', async () => {
    const { service, requests } = setup({ body: true });

    await service.dropTable(table);

    expect(requests[0]).toMatchObject({ method: 'DELETE', url: 'http://api/databases/sample_v2/tables/cb8_tmp_view' });
  });
});
