import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { etlOperatorToJson, type JoinOperator } from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import {
  conditionSign,
  EMPTY_CONDITION,
  joinConditions,
  joinFormError,
  joinFormOf,
  newJoinOperator,
  sourceAsPreviewTable,
  updatedJoin
} from './join.utils';
import { previewTable } from './testing';

const graph = etlGraphFromLeaves(etlJobFromJson(fixture.etlGetV1.response).operators);
const join = graph.operators.get('sales_join_sales_copy') as JoinOperator;
const left = previewTable('sales', [['order_id', 'int64'], ['region', 'string']]);
const right = previewTable('sales_copy', [['order_id', 'int64']]);

describe('joinFormOf', () => {
  it('reads the columns and type of the first join', () => {
    expect(joinFormOf(join)).toEqual({ conditions: [{ type: 'equal_field', left: 'order_id', right: 'order_id' }], joinType: 'inner' });
  });

  it('reads a join without configs as an empty left join', () => {
    expect(joinFormOf({ ...join, joins: [] })).toEqual({ conditions: [], joinType: 'left' });
  });
});

describe('joinFormError', () => {
  it.each([
    [[], 'Missing join clause'],
    [[EMPTY_CONDITION], 'Join clause is invalid'],
    [[{ ...EMPTY_CONDITION, left: 'a' }], 'Join clause is invalid'],
    [[{ ...EMPTY_CONDITION, left: 'a', right: 'b' }], undefined]
  ])('%j', (conditions, error) => {
    expect(joinFormError({ conditions, joinType: 'left' })).toBe(error);
  });
});

describe('conditionSign', () => {
  it('shows each kind of condition', () => {
    expect(conditionSign('equal_field')).toBe('=');
    expect(conditionSign('greater_or_equal_field')).toBe('>=');
  });
});

describe('joinConditions', () => {
  it('builds the fields the server stores, on the preview database', () => {
    const conditions = joinConditions({ conditions: [{ ...EMPTY_CONDITION, left: 'order_id', right: 'order_id' }], joinType: 'inner' }, left, right);

    expect(conditions).toEqual(join.joins[0]!.conditions);
  });

  it('keeps a saved field whose column the preview lacks', () => {
    const before = join.joins[0]!.conditions;
    const noColumns = previewTable('sales', []);

    expect(joinConditions(joinFormOf(join), noColumns, noColumns, before)).toEqual(before);
  });

  it('leaves a field out when its column is gone and it was not saved', () => {
    const [condition] = joinConditions({ conditions: [{ ...EMPTY_CONDITION, left: 'gone', right: 'order_id' }], joinType: 'left' }, left, right);

    expect(condition?.leftField).toBeUndefined();
    expect(condition?.rightField).toBeDefined();
  });
});

describe('newJoinOperator', () => {
  it('writes the JSON of the join v1 made (DC0)', () => {
    const operator = newJoinOperator(graph.operators.get('sales')!, graph.operators.get('sales_copy')!, join.destTable, 'inner', join.joins[0]!.conditions);

    expect(etlOperatorToJson(operator)).toEqual(etlOperatorToJson(join));
  });
});

describe('updatedJoin', () => {
  it('changes the first join config only', () => {
    const updated = updatedJoin(join, 'left', []);

    expect(updated.joins[0]).toMatchObject({ joinType: 'left', conditions: [], left: join.joins[0]!.left });
    expect(join.joins[0]?.joinType).toBe('inner');
  });

  it('leaves a join without configs alone', () => {
    const empty = { ...join, joins: [] };
    expect(updatedJoin(empty, 'left', [])).toBe(empty);
  });
});

describe('sourceAsPreviewTable', () => {
  it('reads a warehouse table under its name in the preview database', () => {
    const source = { dbName: 'sample', name: 'orders', displayName: 'Orders', columns: [{ name: 'id', displayName: 'Id', type: 'int64' }] };

    expect(sourceAsPreviewTable(source, 'preview_etl_2', 'orders_1', 'orders_1')).toEqual({ ...source, dbName: 'preview_etl_2', name: 'orders_1', displayName: 'orders_1' });
  });
});
