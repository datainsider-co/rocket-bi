import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import { dialogTexts, knownTable, newOperatorBase, newTableConfig, notPreviewedText, operatorDialogOf, tableTitle } from './operators.utils';
import { previewTable } from './testing';

const graph = etlGraphFromLeaves(etlJobFromJson(fixture.etlGetV1.response).operators);
const operator = (name: string) => graph.operators.get(name)!;

describe('newTableConfig', () => {
  it('names a step after the chain it continues, unique in the ETL (v1 sales_1_3)', () => {
    expect(newTableConfig(graph, [operator('sales_1_2')])).toEqual({ tblName: 'sales_1_3', dbDisplayName: 'ETL Database', tblDisplayName: 'sales_1_3' });
  });

  it('keeps clear of a source added with it', () => {
    expect(newTableConfig(graph, [operator('sales_1_2')], ['sales_1_3']).tblName).toBe('sales_1_4');
  });

  it('names a join after its two tables', () => {
    expect(newTableConfig(graph, [operator('sales'), operator('sales_1')]).tblName).toBe('sales_join_sales_1');
  });
});

describe('newOperatorBase', () => {
  it('saves nowhere and has no JSON yet', () => {
    const destTable = { tblName: 'a', dbDisplayName: 'ETL Database', tblDisplayName: 'a' };
    expect(newOperatorBase('sql_query_operator', destTable)).toEqual({ className: 'sql_query_operator', destTable, persist: undefined, thirdPartyPersists: [], json: {} });
  });
});

describe('tableTitle', () => {
  it('prefers the display name', () => {
    expect(tableTitle({ name: 'a', displayName: 'A' })).toBe('A');
    expect(tableTitle({ name: 'a' })).toBe('a');
  });
});

describe('dialogTexts', () => {
  it.each([
    [{ mode: 'add', kind: 'sql', parent: 'a' } as const, { title: 'SQL Query', okText: 'Add' }],
    [{ mode: 'edit', kind: 'join', tblName: 'a' } as const, { title: 'Join Table', okText: 'Update' }],
    [{ mode: 'add', kind: 'manageFields', parent: 'a' } as const, { title: 'Manage Fields', okText: 'Add' }]
  ])('%j', (dialog, texts) => {
    expect(dialogTexts(dialog)).toEqual(texts);
  });
});

describe('notPreviewedText', () => {
  it('names the tables', () => {
    expect(notPreviewedText(['a', 'b'])).toBe('Preview table a, b has error');
  });
});

describe('operatorDialogOf', () => {
  it.each([
    ['join', 'join'],
    ['manageFields', 'manageFields'],
    ['sql', 'sql']
  ] as const)('adds a %s after a table', (key, kind) => {
    expect(operatorDialogOf({ type: 'table', tblName: 'sales' }, key, operator('sales'))).toEqual({ mode: 'add', kind, parent: 'sales' });
  });

  it("edits an operator with v2's dialog", () => {
    expect(operatorDialogOf({ type: 'operator', tblName: 'sales_1_1' }, 'edit', operator('sales_1_1'))).toEqual({ mode: 'edit', kind: 'sql', tblName: 'sales_1_1' });
    expect(operatorDialogOf({ type: 'operator', tblName: 'sales_join_sales_copy' }, 'edit', operator('sales_join_sales_copy'))).toMatchObject({ kind: 'join' });
  });

  it('opens nothing for the other items', () => {
    expect(operatorDialogOf({ type: 'table', tblName: 'sales' }, 'remove', operator('sales'))).toBeUndefined();
    expect(operatorDialogOf({ type: 'operator', tblName: 'sales_1_1' }, 'remove', operator('sales_1_1'))).toBeUndefined();
    expect(operatorDialogOf({ type: 'operator', tblName: 'gone' }, 'edit', undefined)).toBeUndefined();
    expect(operatorDialogOf({ type: 'persist', tblName: 'sales_1_1' }, 'sql', operator('sales_1_1'))).toBeUndefined();
  });
});

describe('knownTable', () => {
  it("reads the table's preview", () => {
    const table = previewTable('sales');
    expect(knownTable(new Map([['sales', { table }]]), operator('sales'), 'preview_etl_2')).toBe(table);
  });

  it('names the table without columns while it has no preview', () => {
    expect(knownTable(new Map(), operator('sales_1_1'), 'preview_etl_2')).toEqual({ dbName: 'preview_etl_2', name: 'sales_1_1', displayName: 'sales_1_1', columns: [] });
  });
});
