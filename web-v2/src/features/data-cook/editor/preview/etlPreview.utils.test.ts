import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlOperatorFromJson, type EtlOperator } from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves, operatorTree, type EtlGraph } from '@/core/data-cook/etlGraph';
import type { EtlPreview } from '@/core/data-cook/EtlPreviewService';
import {
  hashText,
  ownSettings,
  previewBlocker,
  previewRoots,
  previewSignatures,
  previewTableNames,
  previewTabLabel,
  previewTabs,
  previousErrorText,
  shownTable,
  signatureChanges,
  stableJson,
  tableResult,
  treeOperators
} from './etlPreview.utils';

const dest = (tblName: string) => ({ tbl_name: tblName, db_display_name: 'ETL Database', tbl_display_name: tblName });
const source = (tblName: string) => ({
  class_name: 'get_data_operator',
  dest_table_config: { tbl_name: tblName, db_display_name: 'sample', tbl_display_name: tblName },
  table_schema: { name: tblName, db_name: 'sample', columns: [] }
});
const sql = (tblName: string, parent: object, query = 'select 1') => ({ class_name: 'sql_query_operator', operator: parent, query, dest_table_configuration: dest(tblName) });
const python = (tblName: string, parent: object) => ({ class_name: 'python_operator', operator: parent, code: '', dest_table_configuration: dest(tblName) });
const join = (tblName: string, left: object, right: object) => ({
  class_name: 'join_operator',
  join_configs: [{ left_operator: left, right_operator: right, conditions: [], join_type: 'left' }],
  dest_table_configuration: dest(tblName)
});
const email = (parents: object[]) => ({ class_name: 'send_to_group_email_operator', operators: parents, receivers: [], subject: 'Hi', dest_table_configuration: dest('mail') });

const graphOf = (...leaves: object[]): EtlGraph => etlGraphFromLeaves(leaves.map(etlOperatorFromJson));
const tree = (graph: EtlGraph, name: string): EtlOperator => operatorTree(graph, name)!;
const preview = (tables: string[], errors: { tblName: string; message: string }[] = []): EtlPreview => ({
  status: errors.length > 0 ? 'Error' : 'Done',
  tables: tables.map(name => ({ dbName: 'preview_etl_1', name, columns: [] })),
  errors
});

const a = source('a');
const b = sql('b', a);
const c = sql('c', b);

describe('previewTableNames', () => {
  it('lists every table, leaving out Send To Email', () => {
    expect(previewTableNames(graphOf(email([b]), c))).toEqual(['a', 'b', 'c']);
  });

  it('is empty without operators', () => {
    expect(previewTableNames(graphOf())).toEqual([]);
  });
});

describe('previewBlocker', () => {
  const graph = graphOf(sql('after', python('py', a)), b);

  it('blocks a Python Query', () => {
    expect(previewBlocker(graph, 'py')).toBe("Python Query can't be previewed");
  });

  it('blocks what reads from it', () => {
    expect(previewBlocker(graph, 'after')).toBe("It reads from py (Python Query), which can't be previewed");
  });

  it('lets the other tables be', () => {
    expect(previewBlocker(graph, 'a')).toBeUndefined();
    expect(previewBlocker(graph, 'b')).toBeUndefined();
  });

  it('blocks an operator v2 does not know', () => {
    expect(previewBlocker(graphOf({ class_name: 'x', dest_table_configuration: dest('x') }), 'x')).toBe("Unsupported can't be previewed");
  });

  it('ignores a table the graph lacks', () => {
    expect(previewBlocker(graph, 'gone')).toBeUndefined();
  });
});

describe('ownSettings', () => {
  it('leaves out parents, destinations and display names', () => {
    const operator = etlOperatorFromJson({ ...sql('b', a, 'select 2'), is_persistent: true, persist_configuration: { db_name: 'x', tbl_name: 'y', type: 'Update' } });

    expect(ownSettings(operator)).toEqual({ class_name: 'sql_query_operator', query: 'select 2', tbl_name: 'b' });
  });

  it("leaves out a join's inputs but keeps its conditions", () => {
    const settings = ownSettings(etlOperatorFromJson(join('j', a, source('z'))));

    expect(settings['join_configs']).toEqual([{ conditions: [], join_type: 'left' }]);
  });

  it('does not change the operator', () => {
    const operator = etlOperatorFromJson(b);
    const before = JSON.stringify(operator);
    ownSettings(operator);
    expect(JSON.stringify(operator)).toBe(before);
  });
});

describe('hashText', () => {
  it('is stable and tells texts apart', () => {
    expect(hashText('abc')).toBe(hashText('abc'));
    expect(hashText('abc')).not.toBe(hashText('abd'));
    expect(hashText('')).toMatch(/^[0-9a-z]+$/);
  });
});

describe('stableJson', () => {
  it('sorts the keys of every object, keeping the order of arrays', () => {
    expect(stableJson({ b: 1, a: [{ d: 1, c: 2 }, 3] })).toBe('{"a":[{"c":2,"d":1},3],"b":1}');
    expect(stableJson({ b: 1, a: 2 })).toBe(stableJson({ a: 2, b: 1 }));
  });

  it('writes values as JSON does', () => {
    expect(stableJson(null)).toBe('null');
    expect(stableJson('x')).toBe('"x"');
    expect(stableJson(undefined)).toBe('');
  });
});

describe('previewSignatures', () => {
  it("doesn't change with the order of an operator's keys", () => {
    const reordered = { dest_table_configuration: dest('b'), query: 'select 1', operator: a, class_name: 'sql_query_operator' };

    expect(previewSignatures(graphOf(reordered)).get('b')).toBe(previewSignatures(graphOf(b)).get('b'));
  });

  it('changes for an edited operator and the tables after it, not before', () => {
    const before = previewSignatures(graphOf(c));
    const after = previewSignatures(graphOf(sql('c', sql('b', a, 'select 2'))));

    expect(after.get('a')).toBe(before.get('a'));
    expect(after.get('b')).not.toBe(before.get('b'));
    expect(after.get('c')).not.toBe(before.get('c'));
  });

  it('stays the same on a rename', () => {
    const renamed = { ...c, dest_table_configuration: { ...dest('c'), tbl_display_name: 'Renamed' } };

    expect(previewSignatures(graphOf(renamed)).get('c')).toBe(previewSignatures(graphOf(c)).get('c'));
  });

  it('signs every table, the real ETL included', () => {
    const graph = etlGraphFromLeaves(fixture.etlGetV1.response.operators.map(etlOperatorFromJson));

    expect([...previewSignatures(graph).keys()].sort()).toEqual([...graph.operators.keys()].sort());
  });
});

describe('treeOperators', () => {
  it('lists the table and what it reads from, once each', () => {
    const graph = graphOf(join('j', b, sql('d', a)));

    expect([...treeOperators(tree(graph, 'j')).keys()]).toEqual(['j', 'b', 'a', 'd']);
  });
});

describe('previewRoots', () => {
  it('drops a tree another one holds', () => {
    const graph = graphOf(c, sql('d', a));

    expect(previewRoots([tree(graph, 'b'), tree(graph, 'c'), tree(graph, 'd')]).map(root => root.destTable.tblName)).toEqual(['c', 'd']);
  });

  it('sends a table asked for twice once', () => {
    const graph = graphOf(c);

    expect(previewRoots([tree(graph, 'c'), tree(graph, 'c')])).toHaveLength(1);
  });

  it('is empty for nothing', () => {
    expect(previewRoots([])).toEqual([]);
  });
});

describe('tableResult', () => {
  const graph = graphOf(c);

  it('reads a built table', () => {
    expect(tableResult(tree(graph, 'b'), preview(['a', 'b']))).toEqual({ kind: 'ready', table: { dbName: 'preview_etl_1', name: 'b', columns: [] } });
  });

  it("reads the table's own error", () => {
    expect(tableResult(tree(graph, 'b'), preview(['a'], [{ tblName: 'b', message: 'Unknown column' }]))).toEqual({ kind: 'error', message: 'Unknown column' });
  });

  it('says an empty error failed', () => {
    expect(tableResult(tree(graph, 'b'), preview(['a'], [{ tblName: 'b', message: '' }]))).toEqual({ kind: 'error', message: 'Preview failed' });
  });

  it('puts the error of a table before it on a table after it', () => {
    expect(tableResult(tree(graph, 'c'), preview(['a'], [{ tblName: 'b', message: 'Unknown column' }]))).toEqual({
      kind: 'error',
      message: 'Cannot preview: there are errors at a previous step, SQL Query of b'
    });
  });

  it('ignores the error of another branch', () => {
    expect(tableResult(tree(graph, 'c'), preview(['a', 'b'], [{ tblName: 'other', message: 'x' }]))).toEqual({ kind: 'error', message: 'The table was not built' });
  });
});

describe('previousErrorText', () => {
  it('names the failed step by its display name', () => {
    const operator = etlOperatorFromJson({ ...b, dest_table_configuration: { ...dest('b'), tbl_display_name: 'Totals' } });

    expect(previousErrorText(operator)).toBe('Cannot preview: there are errors at a previous step, SQL Query of Totals');
  });
});

describe('previewTabLabel', () => {
  it('puts the database before a source', () => {
    expect(previewTabLabel(etlOperatorFromJson(a))).toBe('sample.a');
  });

  it('names another table by its display name', () => {
    expect(previewTabLabel(etlOperatorFromJson({ ...b, dest_table_configuration: { ...dest('b'), tbl_display_name: 'Totals' } }))).toBe('Totals');
  });
});

describe('shownTable', () => {
  it.each([
    [['a', 'b'], 'b', 'b'],
    [['a', 'b'], 'gone', 'a'],
    [['a', 'b'], undefined, 'a'],
    [[], 'a', undefined]
  ])('in %j with %s picked shows %s', (names, picked, shown) => {
    expect(shownTable(names, picked)).toBe(shown);
  });
});

describe('previewTabs', () => {
  it('labels a tab per table, in the order given', () => {
    const graph = graphOf(c);
    const statuses = new Map([
      ['c', { status: 'error' as const }],
      ['a', { status: 'ready' as const }]
    ]);

    expect(previewTabs(graph, statuses)).toEqual([
      { tblName: 'c', label: 'c', status: 'error' },
      { tblName: 'a', label: 'sample.a', status: 'ready' }
    ]);
  });

  it('skips a table the graph no longer has', () => {
    expect(previewTabs(graphOf(), new Map([['a', { status: 'ready' as const }]]))).toEqual([]);
  });
});

describe('signatureChanges', () => {
  it('pairs the signatures of the tables that changed, and only those', () => {
    const before = graphOf(c, sql('d', a));
    const after = graphOf(sql('c', sql('b', a, 'select 2')), sql('d', a), sql('new', a));
    const signatures = { before: previewSignatures(before), after: previewSignatures(after) };

    expect(signatureChanges(before, after)).toEqual([
      { tblName: 'b', from: signatures.before.get('b'), to: signatures.after.get('b') },
      { tblName: 'c', from: signatures.before.get('c'), to: signatures.after.get('c') }
    ]);
  });

  it('is empty when nothing changed', () => {
    expect(signatureChanges(graphOf(c), graphOf(c))).toEqual([]);
  });
});
